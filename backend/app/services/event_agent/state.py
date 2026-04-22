from typing import TypedDict, Optional


class EventProcessingState(TypedDict):
    """LangGraph 状态定义：贯穿整个 Event 提取工作流。"""
    # 输入
    raw_content: str          # 邮件原文 / 飞书对话文本
    source_type: str          # 'email' | 'chat'
    email_fingerprint: Optional[str]

    # 中间状态
    extracted_fields: dict    # LLM 抽取的 Event 字段（title, date, category 等）
    classification: str       # 事件 category
    application_match: dict   # 匹配到的 Application（id, name, current_status）

    # 建议的状态变更
    status_change: dict       # {from, to, confidence}

    # 输出
    event_created: bool
    created_event_id: Optional[str]
    error: Optional[str]
