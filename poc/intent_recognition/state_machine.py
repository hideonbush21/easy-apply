"""
状态机规则引擎

实现申请状态机的完整跳转逻辑：
- 跳转白名单（7状态，不含"等待结果"）
- 终态保护（已录取/已拒绝不得自动跳出）
- 触发方式校验（手动/邮件/仅手动/仅邮件）
- 逆向跳转检测
- 置信度三档决策（≥0.90 自动 / 0.70-0.89 待确认 / <0.70 仅建Event）
- 候补转正特殊阈值（0.85）
"""

# 状态链顺序（用于逆向检测）
STATUS_ORDER = [
    '待申请',
    '材料准备中',
    '已提交',
    '面试邀请',
    '面试完成',
    '候补名单',   # 候补是侧路，单独处理
    '已录取',
    '已拒绝',
]

# 终态
TERMINAL_STATES = {'已录取', '已拒绝'}

# 全部合法状态
ALL_STATUSES = {
    '待申请', '材料准备中', '已提交',
    '面试邀请', '面试完成', '候补名单',
    '已录取', '已拒绝',
}

# 跳转白名单：(from_status, to_status) → trigger_type
# trigger_type:
#   'manual'          手动触发（也可邮件触发）
#   'manual_only'     只能手动，邮件不能触发
#   'email_only'      只能邮件触发，手动不能触发
#   'manual_or_email' 手动或邮件均可触发
VALID_TRANSITIONS: dict[tuple[str, str], str] = {
    ('待申请',    '材料准备中'): 'manual',
    ('材料准备中', '已提交'):    'manual_or_email',   # intent: submission_confirmed
    ('已提交',    '面试邀请'):   'email_only',         # intent: interview_invite
    ('已提交',    '已录取'):     'email_only',         # intent: admitted
    ('已提交',    '已拒绝'):     'email_only',         # intent: rejected
    ('已提交',    '候补名单'):   'email_only',         # intent: waitlisted
    ('面试邀请',  '面试完成'):   'manual_only',        # 唯一纯手动跳转
    ('面试完成',  '已录取'):     'email_only',         # intent: admitted
    ('面试完成',  '已拒绝'):     'email_only',         # intent: rejected
    ('面试完成',  '候补名单'):   'email_only',         # intent: waitlisted
    ('候补名单',  '已录取'):     'email_only',         # intent: waitlist_converted，阈值0.85
    ('候补名单',  '已拒绝'):     'manual_or_email',    # intent: rejected
}

# intent → 目标状态
INTENT_TO_STATUS: dict[str, str | None] = {
    'submission_confirmed': '已提交',
    'interview_invite':     '面试邀请',
    'admitted':             '已录取',
    'rejected':             '已拒绝',
    'waitlisted':           '候补名单',
    'waitlist_converted':   '已录取',
    'irrelevant':           None,
}

# 置信度阈值
CONFIDENCE_AUTO = 0.90          # 自动执行
CONFIDENCE_CONFIRM = 0.70       # 需要确认（低于此为 event_only）
CONFIDENCE_WAITLIST_AUTO = 0.85 # 候补转正自动执行阈值（特殊）


def get_manual_transitions(from_status: str) -> list[str]:
    """返回当前状态下允许手动触发的目标状态列表（供 CLI 展示）。"""
    if from_status in TERMINAL_STATES:
        return []
    results = []
    for (frm, to), trigger in VALID_TRANSITIONS.items():
        if frm == from_status and trigger in ('manual', 'manual_only', 'manual_or_email'):
            results.append(to)
    return results


def evaluate_transition(
    application: dict,
    trigger_type: str,        # 'manual' | 'email'
    intent: str | None = None,
    confidence: float | None = None,
    target_status: str | None = None,
) -> dict:
    """
    评估一次状态跳转请求。

    Args:
        application:   Mock 申请对象，必须包含 'status' 字段
        trigger_type:  'manual' 或 'email'
        intent:        邮件意图（email 触发时必填）
        confidence:    LLM 置信度（email 触发时必填）
        target_status: 手动触发时指定目标状态；邮件触发时由 intent 推导

    Returns:
        {
            "allowed": bool,
            "action":  "auto_execute" | "needs_confirmation" | "blocked" | "event_only",
            "from_status": str,
            "to_status": str | None,
            "reason": str,
            "is_memorial_event": bool,  # 是否触发纪念 Event（录取/拒绝/候补转正）
        }
    """
    from_status = application['status']

    def _blocked(reason: str, to: str | None = None) -> dict:
        return {
            "allowed": False,
            "action": "blocked",
            "from_status": from_status,
            "to_status": to,
            "reason": reason,
            "is_memorial_event": False,
        }

    # ── 推导目标状态 ─────────────────────────────────────────
    if trigger_type == 'email':
        if not intent:
            return _blocked("邮件触发必须提供 intent")
        to_status = INTENT_TO_STATUS.get(intent)
        if to_status is None:
            return {
                "allowed": False,
                "action": "event_only",
                "from_status": from_status,
                "to_status": None,
                "reason": f"意图为 '{intent}'，与申请状态无关，仅建日历 Event",
                "is_memorial_event": False,
            }
    else:
        # 手动触发
        to_status = target_status
        if not to_status:
            return _blocked("手动触发必须提供 target_status")

    # ── 规则1：终态保护 ─────────────────────────────────────
    if from_status in TERMINAL_STATES:
        return _blocked(
            f"当前状态「{from_status}」为终态，任何自动跳转均被拦截，必须强制人工确认",
            to_status,
        )

    # ── 规则2：白名单校验 ───────────────────────────────────
    key = (from_status, to_status)
    if key not in VALID_TRANSITIONS:
        return _blocked(
            f"「{from_status}」→「{to_status}」不在合法跳转列表中",
            to_status,
        )

    allowed_trigger = VALID_TRANSITIONS[key]

    # ── 规则3：触发方式校验 ─────────────────────────────────
    if trigger_type == 'manual' and allowed_trigger == 'email_only':
        return _blocked(
            f"「{from_status}」→「{to_status}」只能由邮件触发，不允许手动操作",
            to_status,
        )
    if trigger_type == 'email' and allowed_trigger == 'manual_only':
        return _blocked(
            f"「{from_status}」→「{to_status}」只能手动触发（如：面试邀请→面试完成需用户主动标记）",
            to_status,
        )

    # ── 手动触发：直接执行，无置信度判断 ───────────────────
    if trigger_type == 'manual':
        is_memorial = to_status in ('已录取', '已拒绝', '候补名单')
        return {
            "allowed": True,
            "action": "auto_execute",
            "from_status": from_status,
            "to_status": to_status,
            "reason": "手动操作，直接执行状态变更",
            "is_memorial_event": is_memorial,
        }

    # ── 以下为邮件触发，需要置信度判断 ─────────────────────
    if confidence is None:
        return _blocked("邮件触发必须提供 confidence")

    # ── 规则4：逆向跳转检测（仅主干路径，候补是侧路跳过） ──
    if from_status not in ('候补名单',) and to_status not in ('候补名单',):
        try:
            from_idx = STATUS_ORDER.index(from_status)
            to_idx = STATUS_ORDER.index(to_status)
            if to_idx < from_idx:
                return _blocked(
                    f"「{from_status}」→「{to_status}」为逆向跳转，无论置信度多高，强制人工确认",
                    to_status,
                )
        except ValueError:
            pass  # 状态不在顺序列表中，跳过逆向检测

    # ── 规则5：候补转正特殊阈值 ─────────────────────────────
    if from_status == '候补名单' and to_status == '已录取':
        auto_threshold = CONFIDENCE_WAITLIST_AUTO
        threshold_label = f"{CONFIDENCE_WAITLIST_AUTO}（候补转正专属阈值）"
    else:
        auto_threshold = CONFIDENCE_AUTO
        threshold_label = f"{CONFIDENCE_AUTO}"

    # ── 规则6：置信度三档决策 ───────────────────────────────
    is_memorial = to_status in ('已录取', '已拒绝', '候补名单')

    if confidence >= auto_threshold:
        return {
            "allowed": True,
            "action": "auto_execute",
            "from_status": from_status,
            "to_status": to_status,
            "reason": f"置信度 {confidence:.2f} ≥ {threshold_label}，自动执行状态变更",
            "is_memorial_event": is_memorial,
        }
    elif confidence >= CONFIDENCE_CONFIRM:
        return {
            "allowed": True,
            "action": "needs_confirmation",
            "from_status": from_status,
            "to_status": to_status,
            "reason": f"置信度 {confidence:.2f} 在 {CONFIDENCE_CONFIRM}~{auto_threshold} 之间，需用户确认后执行",
            "is_memorial_event": is_memorial,
        }
    else:
        return {
            "allowed": False,
            "action": "event_only",
            "from_status": from_status,
            "to_status": to_status,
            "reason": f"置信度 {confidence:.2f} < {CONFIDENCE_CONFIRM}，仅创建日历 Event，不改变申请状态",
            "is_memorial_event": False,
        }
