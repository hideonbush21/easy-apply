"""
Event Agent Graph - Phase 2 激活。
Phase 1 仅建立骨架，图结构已定义但未注入生产逻辑。
"""
from langgraph.graph import StateGraph, END
from app.services.event_agent.state import EventProcessingState
from app.services.event_agent.nodes import (
    parse_email_content,
    classify_event,
    match_application,
    suggest_status_change,
    create_event_record,
    should_continue,
)


def build_event_graph():
    """构建并编译 Event 处理工作流图。"""
    workflow = StateGraph(EventProcessingState)

    workflow.add_node('parse', parse_email_content)
    workflow.add_node('classify', classify_event)
    workflow.add_node('match_app', match_application)
    workflow.add_node('suggest_status', suggest_status_change)
    workflow.add_node('create', create_event_record)

    workflow.set_entry_point('parse')
    workflow.add_edge('parse', 'classify')
    workflow.add_edge('classify', 'match_app')
    workflow.add_edge('match_app', 'suggest_status')
    workflow.add_conditional_edges(
        'suggest_status',
        should_continue,
        {
            'create': 'create',
            'low_confidence': END,  # Phase 2: 低置信度时放入"待确认"队列
        }
    )
    workflow.add_edge('create', END)

    return workflow.compile()


# 模块级单例，Phase 2 激活后取消注释：
# event_graph = build_event_graph()
