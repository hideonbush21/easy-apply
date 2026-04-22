import json
import logging
import os
import re
import time

import redis as redis_lib
import requests

from app.services.ai_service import generate_sop
from app.services.sop_agent.prompts import CRITIQUE_PROMPT, REVISE_PROMPT
from app.services.sop_agent.state import SopAgentState
from app.utils.redis_utils import get_redis_url

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 3
TRACE_TTL = 86400  # 24h

# ── Redis helpers ────────────────────────────────────────────────────────────

_redis_client = None


def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis_lib.from_url(get_redis_url(), ssl_cert_reqs=None)
    return _redis_client


def _publish(task_id: str | None, stage: str, message: str, **extra):
    if not task_id:
        return
    data = {'stage': stage, 'message': message, **extra}
    try:
        _get_redis().publish(
            f'sop:progress:{task_id}',
            json.dumps(data, ensure_ascii=False),
        )
    except Exception as e:
        logger.warning(f'[sop_agent] Redis publish failed: {e}')


def _trace(task_id: str | None, node: str, event_type: str, data: dict):
    """Store a structured debug trace event in Redis for the debug panel."""
    if not task_id:
        return
    entry = {
        'ts': time.time(),
        'node': node,
        'type': event_type,
        **data,
    }
    try:
        r = _get_redis()
        key = f'sop:trace:{task_id}'
        r.rpush(key, json.dumps(entry, ensure_ascii=False, default=str))
        r.expire(key, TRACE_TTL)
        # Register task in sorted set for listing
        r.zadd('sop:tasks', {task_id: time.time()})
        r.expire('sop:tasks', TRACE_TTL)
    except Exception as e:
        logger.warning(f'[sop_agent] trace write failed: {e}')


# ── Kimi API caller (draft / revise) ─────────────────────────────────────────

def _call_kimi(prompt: str, temperature: float = 0.7, model: str = 'moonshot-v1-8k') -> str:
    api_key = os.getenv('KIMI_API_KEY', '')
    if not api_key:
        raise ValueError('KIMI_API_KEY is not configured')
    response = requests.post(
        'https://api.moonshot.cn/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': model,
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']


# ── OpenAI API caller (critique) ─────────────────────────────────────────────

def _call_openai(prompt: str, temperature: float = 0.1) -> str:
    """调用 OpenAI GPT-4 进行评审，与生成模型分离，防止自评虚高。"""
    api_key = os.getenv('OPENAI_API_KEY', '')
    if not api_key:
        raise ValueError('OPENAI_API_KEY is not configured')
    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': os.getenv('SOP_CRITIQUE_MODEL', 'gpt-4'),
            'messages': [{'role': 'user', 'content': prompt}],
            'temperature': temperature,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']


# ── Critique caller (GPT-4 优先，Kimi 降级) ──────────────────────────────────

def _call_critique(prompt: str) -> str:
    """评审调用：有 OPENAI_API_KEY 则用 GPT-4，超时/失败自动降级到 Kimi 128k。"""
    if os.getenv('OPENAI_API_KEY', ''):
        try:
            logger.info('[sop_agent] critique using OpenAI GPT-4')
            return _call_openai(prompt, temperature=0.1)
        except Exception as e:
            logger.warning(f'[sop_agent] OpenAI critique failed ({e}), falling back to Kimi 128k')
    logger.info('[sop_agent] critique using Kimi 128k')
    return _call_kimi(prompt, temperature=0.1, model='moonshot-v1-128k')


def _extract_json(text: str) -> str:
    """Extract the first JSON object from LLM output."""
    # 优先尝试全文解析
    stripped = text.strip()
    # 去掉 ```json ... ``` 包裹
    if stripped.startswith('```'):
        parts = stripped.split('```')
        if len(parts) >= 3:
            candidate = parts[1]
            if candidate.startswith('json'):
                candidate = candidate[4:]
            stripped = candidate.strip()
    try:
        json.loads(stripped)
        return stripped
    except json.JSONDecodeError:
        pass
    # 降级：非贪婪正则提取第一个完整 JSON 对象
    match = re.search(r'\{[\s\S]*?\}(?=[^}]*$)', text)
    if not match:
        # 再试贪婪匹配
        match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return match.group()
    raise ValueError(f'No JSON found in response: {text[:200]}')


# ── Graph nodes ──────────────────────────────────────────────────────────────

def draft_node(state: SopAgentState) -> dict:
    """Node 1: 生成初稿（仅第一轮调用）。"""
    task_id = state.get('task_id')

    _publish(task_id, 'drafting', '正在生成初稿…')
    # Trace: record input context
    _trace(task_id, 'input', 'user_context', {
        'user_profile': {
            'name': state['user_profile'].get('name'),
            'gpa': state['user_profile'].get('gpa'),
            'home_institution': state['user_profile'].get('home_institution'),
            'current_major': state['user_profile'].get('current_major'),
        },
        'school_name': state['school_name'],
        'program_name': state['program_name'],
        'degree_type': state['degree_type'],
        'experience_count': len(state.get('experiences') or []),
    })

    sop = generate_sop(
        user_profile=state['user_profile'],
        experiences=state['experiences'],
        school_name=state['school_name'],
        major=state['program_name'],
        school_description=state['school_description'],
        degree_type=state['degree_type'],
    )
    _trace(task_id, 'draft', 'initial_draft', {
        'iteration': 1,
        'word_count': len(sop.split()),
        'preview': sop[:500],
        'full_content': sop,
    })

    return {
        'current_draft': sop,
        'iteration': 1,
    }


def revise_node(state: SopAgentState) -> dict:
    """Node 3 (v1.1): 根据 critique 定向修改草稿。独立节点，不再藏在 draft 内部。"""
    task_id = state.get('task_id')
    _publish(task_id, 'revising', f'正在优化（第 {state["iteration"]} 轮）…')

    issues = state['critique']['issues']
    issues_formatted = '\n'.join(
        f'{i+1}. [{iss["dimension"]}] {iss["problem"]} → 建议：{iss["suggestion"]}'
        for i, iss in enumerate(issues)
    )

    try:
        sop = _call_kimi(
            REVISE_PROMPT.format(
                issues_formatted=issues_formatted,
                current_draft=state['current_draft'],
            ),
            temperature=0.7,
        )
    except Exception as e:
        # v1.2: revise 失败时保留当前稿，不崩溃
        logger.error(f'[sop_agent] revise failed, keeping current draft: {e}')
        _trace(task_id, 'revise', 'error', {
            'iteration': state['iteration'],
            'error': str(e),
        })
        return {'iteration': state['iteration'] + 1}

    _trace(task_id, 'revise', 'revision', {
        'iteration': state['iteration'] + 1,
        'issues_addressed': [iss['dimension'] for iss in issues],
        'word_count': len(sop.split()),
        'preview': sop[:500],
        'full_content': sop,
    })

    return {
        'current_draft': sop,
        'iteration': state['iteration'] + 1,
    }


def critique_node(state: SopAgentState) -> dict:
    task_id = state.get('task_id')
    _publish(task_id, 'critiquing', '正在质量评审…')

    user_context = (
        f"GPA: {state['user_profile'].get('gpa', 'N/A')}, "
        f"院校: {state['user_profile'].get('home_institution', 'N/A')}, "
        f"专业: {state['user_profile'].get('current_major', 'N/A')}"
    )

    prompt = CRITIQUE_PROMPT.format(
        user_context=user_context,
        school_name=state['school_name'],
        program_name=state['program_name'],
        current_draft=state['current_draft'],
    )

    last_error = None
    for attempt in range(3):
        try:
            raw = _call_critique(prompt)
            critique = json.loads(_extract_json(raw))
            # v1.1: pass = total_score >= 7.5 且所有单项 >= 1.0
            scores = critique.get('scores', {})
            total = critique.get('total_score', 0)
            all_above_min = all(v >= 1 for v in scores.values()) if scores else False
            critique['pass'] = total >= 7.5 and all_above_min
            history = list(state.get('critique_history') or [])
            history.append(critique)

            # v1.2: 追踪历史最佳稿
            best_draft = state.get('best_draft')
            best_score = state.get('best_score') or 0
            if total > best_score:
                best_draft = state['current_draft']
                best_score = total

            _trace(task_id, 'critique', 'evaluation', {
                'iteration': state.get('iteration', 0),
                'scores': critique.get('scores'),
                'total_score': critique.get('total_score'),
                'passed': critique.get('pass'),
                'issues': critique.get('issues', []),
                'strengths': critique.get('strengths', []),
                'parse_attempts': attempt + 1,
                'best_score_so_far': best_score,
            })

            return {
                'critique': critique,
                'critique_history': history,
                'best_draft': best_draft,
                'best_score': best_score,
            }
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            logger.warning(f'[sop_agent] critique JSON parse failed (attempt {attempt+1}): {e}')
            _trace(task_id, 'critique', 'parse_error', {
                'iteration': state.get('iteration', 0),
                'attempt': attempt + 1,
                'error': str(e),
            })

    # v1.2: 3次解析失败不崩溃，构造保守 critique 让 pipeline 继续
    logger.error(f'[sop_agent] critique JSON parse failed after 3 attempts, using fallback critique')
    fallback_critique = {
        'scores': {'concreteness': 1, 'logic': 1, 'differentiation': 1, 'specificity': 1, 'language': 1},
        'total_score': 5.0,
        'issues': [{'dimension': '解析失败', 'problem': f'评审模型返回格式异常: {last_error}', 'suggestion': '重新生成'}],
        'strengths': [],
        'pass': False,
        '_fallback': True,
    }
    history = list(state.get('critique_history') or [])
    history.append(fallback_critique)

    _trace(task_id, 'critique', 'fallback', {
        'iteration': state.get('iteration', 0),
        'error': str(last_error),
    })

    return {
        'critique': fallback_critique,
        'critique_history': history,
        'best_draft': state.get('best_draft'),
        'best_score': state.get('best_score'),
    }


def output_node(state: SopAgentState) -> dict:
    task_id = state.get('task_id')
    score = state['critique'].get('total_score')
    passed = state['critique'].get('pass', False)

    # v1.2: 输出历史最佳稿而非当前稿（防止过度修改导致分数下降）
    best_draft = state.get('best_draft') or state['current_draft']
    best_score = state.get('best_score') or score
    use_best = best_score is not None and score is not None and best_score > score

    final_draft = best_draft if use_best else state['current_draft']
    final_score = best_score if use_best else score

    if use_best:
        logger.info(f'[sop_agent] using best historical draft (score {best_score}) over current (score {score})')

    _publish(
        task_id, 'finalizing',
        f'评审完成，得分 {final_score}（{"达标" if passed else "已达最大迭代次数"}）',
    )

    _trace(task_id, 'output', 'final', {
        'total_iterations': state.get('iteration', 0),
        'final_score': final_score,
        'current_score': score,
        'used_best_historical': use_best,
        'passed': passed,
        'word_count': len(final_draft.split()),
    })

    return {
        'final_sop': final_draft,
        'score': final_score,
    }


def should_continue(state: SopAgentState) -> str:
    critique = state.get('critique', {})
    iteration = state.get('iteration', 0)

    decision = 'output' if (critique.get('pass') or iteration >= MAX_ITERATIONS) else 'revise'
    _trace(state.get('task_id'), 'router', 'decision', {
        'iteration': iteration,
        'score': critique.get('total_score'),
        'passed': critique.get('pass'),
        'decision': decision,
    })

    return decision
