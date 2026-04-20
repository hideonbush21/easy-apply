from langgraph.graph import StateGraph, END
from app.services.sop_agent.state import SopAgentState
from app.services.sop_agent.nodes import (
    draft_node,
    critique_node,
    revise_node,
    output_node,
    should_continue,
)


def build_sop_graph():
    workflow = StateGraph(SopAgentState)

    workflow.add_node('draft', draft_node)
    workflow.add_node('critique', critique_node)
    workflow.add_node('revise', revise_node)      # v1.1：独立节点
    workflow.add_node('output', output_node)

    workflow.set_entry_point('draft')
    workflow.add_edge('draft', 'critique')
    workflow.add_conditional_edges(
        'critique',
        should_continue,
        {
            'revise': 'revise',  # v1.1：跳到 revise 而非 draft
            'output': 'output',
        },
    )
    workflow.add_edge('revise', 'critique')  # v1.1：revise 完成后重新评审
    workflow.add_edge('output', END)

    return workflow.compile()


sop_graph = build_sop_graph()
