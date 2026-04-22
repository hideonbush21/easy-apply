from typing import TypedDict, Optional


class SopAgentState(TypedDict):
    # ── 输入 ─────────────────────────────────
    user_profile: dict
    experiences: list
    school_name: str
    program_name: str
    school_description: str
    degree_type: str
    task_id: Optional[str]

    # ── 中间状态 ─────────────────────────────
    current_draft: str
    critique: dict
    iteration: int
    critique_history: list
    best_draft: Optional[str]       # v1.2: 历史最佳稿
    best_score: Optional[float]     # v1.2: 历史最高分

    # ── 输出 ─────────────────────────────────
    final_sop: Optional[str]
    score: Optional[float]
    error: Optional[str]
