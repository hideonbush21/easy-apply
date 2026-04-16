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


# ── Kimi API caller ──────────────────────────────────────────────────────────

def _call_kimi(prompt: str) -> str:
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
            'model': 'moonshot-v1-8k',
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']


def _extract_json(text: str) -> str:
    """Extract the first JSON object from LLM output."""
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        return match.group()
    raise ValueError(f'No JSON found in response: {text[:200]}')


# ── Graph nodes ──────────────────────────────────────────────────────────────

def draft_node(state: SopAgentState) -> dict:
    task_id = state.get('task_id')

    if state['iteration'] == 0:
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
    else:
        _publish(task_id, 'revising', f'正在优化（第 {state["iteration"]} 轮）…')
        issues = state['critique']['issues']
        issues_formatted = '\n'.join(
            f'{i+1}. [{iss["dimension"]}] {iss["problem"]} → 建议：{iss["suggestion"]}'
            for i, iss in enumerate(issues)
        )
        sop = _call_kimi(
            REVISE_PROMPT.format(
                issues_formatted=issues_formatted,
                current_draft=state['current_draft'],
            )
        )
        _trace(task_id, 'draft', 'revision', {
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
            raw = _call_kimi(prompt)
            critique = json.loads(_extract_json(raw))
            if 'pass' not in critique:
                critique['pass'] = critique.get('total_score', 0) >= 7.0
            history = list(state.get('critique_history') or [])
            history.append(critique)

            _trace(task_id, 'critique', 'evaluation', {
                'iteration': state.get('iteration', 0),
                'scores': critique.get('scores'),
                'total_score': critique.get('total_score'),
                'passed': critique.get('pass'),
                'issues': critique.get('issues', []),
                'strengths': critique.get('strengths', []),
                'parse_attempts': attempt + 1,
            })

            return {'critique': critique, 'critique_history': history}
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            logger.warning(f'[sop_agent] critique JSON parse failed (attempt {attempt+1}): {e}')
            _trace(task_id, 'critique', 'parse_error', {
                'iteration': state.get('iteration', 0),
                'attempt': attempt + 1,
                'error': str(e),
            })

    raise ValueError(f'critique JSON parse failed after 3 attempts: {last_error}')


def output_node(state: SopAgentState) -> dict:
    task_id = state.get('task_id')
    score = state['critique'].get('total_score')
    passed = state['critique'].get('pass', False)
    _publish(
        task_id, 'finalizing',
        f'评审完成，得分 {score}（{"达标" if passed else "已达最大迭代次数"}）',
    )

    _trace(task_id, 'output', 'final', {
        'total_iterations': state.get('iteration', 0),
        'final_score': score,
        'passed': passed,
        'word_count': len(state['current_draft'].split()),
    })

    return {
        'final_sop': state['current_draft'],
        'score': score,
    }


def should_continue(state: SopAgentState) -> str:
    critique = state.get('critique', {})
    iteration = state.get('iteration', 0)

    decision = 'output' if (critique.get('pass') or iteration >= MAX_ITERATIONS) else 'draft'
    _trace(state.get('task_id'), 'router', 'decision', {
        'iteration': iteration,
        'score': critique.get('total_score'),
        'passed': critique.get('pass'),
        'decision': decision,
    })

    return decision
