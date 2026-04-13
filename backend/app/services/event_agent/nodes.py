"""
Event Agent 节点函数 - Phase 2 填充实现。
当前为骨架，每个节点仅透传状态，Phase 2 接入 Kimi API 和邮件解析逻辑。
"""
from app.services.event_agent.state import EventProcessingState


def parse_email_content(state: EventProcessingState) -> EventProcessingState:
    """Node 1: 解析邮件原文，提取结构化字段。
    Phase 2 实现：复用 poc/receive_email/email_parser.py 逻辑。
    """
    # TODO: 接入 email_parser 和 Kimi API
    return {**state, 'extracted_fields': {}, 'error': 'Phase 2 not implemented'}


def classify_event(state: EventProcessingState) -> EventProcessingState:
    """Node 2: 对提取的内容进行事件分类（category + subcategory）。
    Phase 2 实现：Kimi API prompt，输出 category 和置信度。
    """
    # TODO: Kimi API 分类
    return {**state, 'classification': 'custom'}


def match_application(state: EventProcessingState) -> EventProcessingState:
    """Node 3: 根据学校/项目名称模糊匹配已有 Application。
    Phase 2 实现：SQLAlchemy 查询 + 相似度排序。
    """
    # TODO: 数据库查询匹配
    return {**state, 'application_match': {}}


def suggest_status_change(state: EventProcessingState) -> EventProcessingState:
    """Node 4: 根据分类和匹配结果，建议 Application 状态变更。
    Phase 2 实现：规则引擎（category → status 映射）+ 置信度计算。
    """
    # TODO: 状态变更建议
    return {**state, 'status_change': {}}


def create_event_record(state: EventProcessingState) -> EventProcessingState:
    """Node 5: 写入 Event 记录，触发状态变更。
    Phase 2 实现：调用 event 路由的创建逻辑。
    """
    # TODO: 数据库写入
    return {**state, 'event_created': False, 'created_event_id': None}


def should_continue(state: EventProcessingState) -> str:
    """条件边：置信度不足时走 'low_confidence'，否则走 'create'。"""
    change = state.get('status_change', {})
    confidence = change.get('confidence', 0)
    if confidence < 0.7:
        return 'low_confidence'
    return 'create'
