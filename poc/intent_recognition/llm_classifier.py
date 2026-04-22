"""
LLM 意图识别模块

调用 Kimi API 分析邮件内容，输出结构化的意图识别结果。
调用模式完全复用 poc/receive_email/processor.py 的 Kimi 调用范式。
"""

import json
import logging
import os

from openai import OpenAI

logger = logging.getLogger(__name__)

_KIMI_MODEL = "moonshot-v1-8k"
_MAX_CONTENT_CHARS = 4000

# 合法 intent 值
VALID_INTENTS = {
    "admitted",
    "rejected",
    "interview_invite",
    "waitlisted",
    "waitlist_converted",
    "submission_confirmed",
    "irrelevant",
}


def _get_client() -> OpenAI:
    api_key = os.environ.get("KIMI_API_KEY", "")
    if not api_key:
        raise ValueError("KIMI_API_KEY 未设置，请在 .env 文件中配置")
    return OpenAI(
        api_key=api_key,
        base_url="https://api.moonshot.cn/v1",
    )


def _call_kimi(prompt: str) -> str:
    client = _get_client()
    resp = client.chat.completions.create(
        model=_KIMI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    return resp.choices[0].message.content.strip()


def _clean_json(raw: str) -> str:
    """去掉 Kimi 有时在 JSON 外面包的 ```json ... ``` 包裹。"""
    clean = raw.strip()
    if clean.startswith("```"):
        parts = clean.split("```")
        if len(parts) >= 3:
            clean = parts[1]
            if clean.startswith("json"):
                clean = clean[4:]
    return clean.strip()


def classify_email(email_content: str) -> dict:
    """
    分析邮件内容，返回结构化识别结果。

    Args:
        email_content: 邮件原文（Subject + Body）

    Returns:
        {
            "intent": str,           # admitted|rejected|interview_invite|waitlisted|
                                     # waitlist_converted|submission_confirmed|irrelevant
            "confidence": float,     # 0.0 - 1.0
            "school_name": str|None,
            "program_name": str|None,
            "event_title": str,      # 建议的 Event 标题
            "event_date": str|None,  # YYYY-MM-DD（如面试日期）
            "event_category": str,   # interview/decision/milestone/submission/custom
            "summary": str,          # 一句话中文摘要
        }
    """
    content_preview = email_content[:_MAX_CONTENT_CHARS]

    prompt = f"""你是一个留学申请邮件分析助手。请分析以下邮件内容，判断其意图类别，并以 JSON 格式返回结果。

意图分类说明（从以下选项选一个）：
- admitted: 录取通知（正式 offer）
- rejected: 拒绝通知
- interview_invite: 面试邀请
- waitlisted: 候补名单通知
- waitlist_converted: 候补转录取（waitlist 转为正式 offer）
- submission_confirmed: 申请提交确认
- irrelevant: 与申请状态无关的邮件

置信度说明：
- 0.90-1.00：邮件非常明确，如"We are pleased to offer you admission"
- 0.70-0.89：邮件内容较明确，但有一定模糊性
- 0.50-0.69：邮件内容模糊，难以判断
- 0.00-0.49：几乎无法判断

JSON 字段：
- intent: 意图类别（从上面选项选一个）
- confidence: 置信度（0.0-1.0，保留两位小数）
- school_name: 涉及的学校名称（如 MIT，无则 null）
- program_name: 涉及的专业/项目（如 Computer Science MSc，无则 null）
- event_title: 建议的日历事件标题（中文，如 "MIT CS 录取通知"）
- event_date: 关键日期（如面试日期，格式 YYYY-MM-DD，无则 null）
- event_category: 事件分类（interview/decision/milestone/submission/custom 选一）
- summary: 一句话中文摘要

只返回 JSON，不要任何额外说明。

邮件内容：
{content_preview}"""

    last_error = None
    for attempt in range(3):
        try:
            raw = _call_kimi(prompt)
            clean = _clean_json(raw)
            result = json.loads(clean)

            # 校验 intent 合法性
            if result.get("intent") not in VALID_INTENTS:
                logger.warning(f"LLM 返回非法 intent: {result.get('intent')}，回退为 irrelevant")
                result["intent"] = "irrelevant"

            # 确保 confidence 在合法范围
            conf = result.get("confidence", 0.5)
            result["confidence"] = max(0.0, min(1.0, float(conf)))

            # 确保必填字段存在
            result.setdefault("event_title", "未知邮件事件")
            result.setdefault("summary", "邮件内容已分析")
            result.setdefault("event_category", "custom")

            logger.info(f"LLM 分析成功（第 {attempt + 1} 次）: intent={result['intent']}, confidence={result['confidence']}")
            return result

        except (json.JSONDecodeError, KeyError, ValueError) as e:
            last_error = e
            logger.warning(f"第 {attempt + 1} 次解析失败: {e}")
            if attempt < 2:
                logger.info("重试中...")

    # 三次重试均失败
    logger.error(f"LLM 解析最终失败: {last_error}")
    return {
        "intent": "irrelevant",
        "confidence": 0.0,
        "school_name": None,
        "program_name": None,
        "event_title": "邮件解析失败",
        "event_date": None,
        "event_category": "custom",
        "summary": f"LLM 解析失败，请手动处理。错误：{last_error}",
        "_parse_error": True,
    }
