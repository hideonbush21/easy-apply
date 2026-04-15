"""
申请状态机 CLI 测试台

使用方式：
    cd poc/intent_recognition
    cp .env.example .env   # 填入 KIMI_API_KEY
    pip install -r requirements.txt
    python demo.py

功能：
    [1] 模拟手动操作 — 选择申请 → 选择目标状态 → 查看状态机决策
    [2] 模拟邮件识别 — 选择模板或粘贴原文 → LLM 分析 → 选择关联申请 → 查看状态机决策
    [r] 重置所有申请状态
    [q] 退出
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

from mock_data import (
    MOCK_APPLICATIONS,
    MOCK_EMAIL_TEMPLATES,
    reset_applications,
    update_application_status,
)
from state_machine import (
    ALL_STATUSES,
    TERMINAL_STATES,
    get_manual_transitions,
    evaluate_transition,
)
from llm_classifier import classify_email
from matcher import find_best_match, match_applications


# ── 展示工具 ──────────────────────────────────────────────────────────────

SEP = "━" * 50


def _print_sep():
    print(SEP)


def _print_header(title: str):
    print(f"\n{SEP}")
    print(f"  {title}")
    print(SEP)


def _print_applications(apps: list[dict]):
    print()
    for i, app in enumerate(apps, 1):
        status = app["status"]
        waitlist_flag = " [候补监控中]" if app.get("waitlist_mode") else ""
        terminal_flag = " 🔒" if status in TERMINAL_STATES else ""
        print(f"  [{i}] {app['school']} {app['program']} — {status}{terminal_flag}{waitlist_flag}")


def _format_action_result(result: dict) -> str:
    action = result["action"]
    frm = result["from_status"]
    to = result["to_status"]
    reason = result["reason"]

    if action == "auto_execute":
        lines = [f"✅ 状态变更：{frm} → {to}"]
        lines.append(f"   {reason}")
        if result.get("is_memorial_event"):
            lines.append(f"🎉 触发纪念 Event 生成")
    elif action == "needs_confirmation":
        lines = [f"⚠️  待确认：{frm} → {to}"]
        lines.append(f"   {reason}")
        lines.append("   → 首页顶部推送「待确认卡片」，用户点击确认后执行")
    elif action == "event_only":
        lines = [f"📅 仅建日历 Event（不改状态）"]
        lines.append(f"   当前状态保持：{frm}")
        lines.append(f"   {reason}")
    else:  # blocked
        lines = [f"🚫 操作被拦截"]
        if to:
            lines.append(f"   {frm} → {to}")
        lines.append(f"   原因：{reason}")

    return "\n".join(lines)


# ── 模式1：手动操作模拟 ────────────────────────────────────────────────────

def run_manual_mode():
    _print_header("模式1：模拟手动操作")
    _print_applications(MOCK_APPLICATIONS)

    choice = input("\n选择申请 (输入编号) > ").strip()
    try:
        idx = int(choice) - 1
        app = MOCK_APPLICATIONS[idx]
    except (ValueError, IndexError):
        print("❌ 无效选择")
        return

    current = app["status"]
    print(f"\n当前状态：「{current}」")

    if current in TERMINAL_STATES:
        print(f"🔒 「{current}」为终态，手动操作受限（仅允许强制人工确认流程，本原型不模拟）")
        return

    available = get_manual_transitions(current)
    if not available:
        print("当前状态无可用手动跳转")
        return

    print("可用手动操作：")
    for i, to in enumerate(available, 1):
        print(f"  [{i}] → {to}")

    choice2 = input("\n选择目标状态 (输入编号) > ").strip()
    try:
        target = available[int(choice2) - 1]
    except (ValueError, IndexError):
        print("❌ 无效选择")
        return

    confirm = input(f"\n确认：将「{app['school']} {app['program']}」从「{current}」改为「{target}」？[y/n] > ").strip().lower()
    if confirm != 'y':
        print("已取消")
        return

    result = evaluate_transition(app, trigger_type='manual', target_status=target)

    _print_sep()
    print(_format_action_result(result))
    _print_sep()

    if result["action"] == "auto_execute":
        update_application_status(app["id"], target)
        print(f"\n✔ Mock 数据已更新：{app['school']} {app['program']} → {target}")


# ── 模式2：邮件识别模拟 ────────────────────────────────────────────────────

def _select_email_content() -> str | None:
    """让用户选择邮件来源，返回邮件原文。"""
    print("\n邮件来源：")
    print("  [1] 使用预置模板")
    print("  [2] 粘贴邮件原文")
    choice = input("选择 > ").strip()

    if choice == '1':
        print("\n可用模板：")
        for i, tpl in enumerate(MOCK_EMAIL_TEMPLATES, 1):
            print(f"  [{i}] {tpl['name']}（预期意图：{tpl['expected_intent']}）")
        t_choice = input("\n选择模板 (输入编号) > ").strip()
        try:
            tpl = MOCK_EMAIL_TEMPLATES[int(t_choice) - 1]
            print(f"\n已选择：{tpl['name']}")
            return tpl["content"]
        except (ValueError, IndexError):
            print("❌ 无效选择")
            return None

    elif choice == '2':
        print("\n请粘贴邮件原文（输入完成后按两次 Enter）：")
        lines = []
        while True:
            line = input()
            if line == '' and lines and lines[-1] == '':
                break
            lines.append(line)
        return "\n".join(lines[:-1])  # 去掉最后一个空行

    else:
        print("❌ 无效选择")
        return None


def _auto_match_application(school_name: str | None, program_name: str | None) -> dict | None:
    """
    分层匹配：Levenshtein → Jaccard → Embedding（可选）。
    返回 match_confidence 最高且超过阈值的申请，附带 match_detail。
    """
    return find_best_match(
        school_name=school_name,
        program_name=program_name,
        applications=MOCK_APPLICATIONS,
        threshold=0.6,
        use_embedding=True,
    )


def _print_match_detail(match: dict):
    """展示匹配分数明细。"""
    detail = match.get("match_detail", {})
    conf = match.get("match_confidence", 0.0)
    method = detail.get("method", "unknown")

    print(f"\n  匹配置信度：{conf:.3f}（方法：{method}）")

    school = detail.get("school")
    if school:
        print(f"  学校匹配：  Levenshtein={school['levenshtein']:.3f}  "
              f"Jaccard={school['jaccard']:.3f}  "
              f"Embedding={school['embedding'] if school['embedding'] is not None else 'N/A'}")

    prog = detail.get("program")
    if prog:
        print(f"  项目匹配：  Levenshtein={prog['levenshtein']:.3f}  "
              f"Jaccard={prog['jaccard']:.3f}")


def _compute_final_confidence(llm_confidence: float, match_confidence: float) -> float:
    """
    综合 LLM 置信度和匹配置信度，计算最终置信度。

    公式：final = llm_confidence × (0.6 + 0.4 × match_confidence)
    意义：
      - 匹配完美（1.0）→ 系数=1.0，不衰减 LLM 置信度
      - 匹配中等（0.7）→ 系数=0.88，轻微衰减
      - 匹配勉强（0.6）→ 系数=0.84，适度衰减
      - 手动选择（无 match_confidence）→ 传入 1.0，不衰减
    """
    weight = 0.6 + 0.4 * match_confidence
    return round(llm_confidence * weight, 3)


def run_email_mode():
    _print_header("模式2：模拟邮件识别")

    content = _select_email_content()
    if not content:
        return

    print("\n🔍 LLM 分析中（调用 Kimi API）...")
    try:
        result = classify_email(content)
    except ValueError as e:
        print(f"❌ {e}")
        return
    except Exception as e:
        print(f"❌ LLM 调用失败：{e}")
        return

    _print_sep()
    print("识别结果")
    _print_sep()
    print(f"  意图：      {result['intent']}")
    print(f"  LLM置信度： {result['confidence']:.2f}")
    print(f"  学校：      {result.get('school_name') or '未识别'}")
    print(f"  项目：      {result.get('program_name') or '未识别'}")
    print(f"  事件标题：  {result['event_title']}")
    print(f"  事件日期：  {result.get('event_date') or '未识别'}")
    print(f"  事件分类：  {result['event_category']}")
    print(f"  摘要：      {result['summary']}")

    if result.get("_parse_error"):
        print("\n⚠️  LLM 解析失败，建议手动处理")
        return

    # ── 分层匹配申请 ─────────────────────────────────────────
    _print_sep()
    print("申请匹配（分层策略：Levenshtein → Jaccard → Embedding）")
    _print_sep()

    auto_match = _auto_match_application(result.get("school_name"), result.get("program_name"))
    match_confidence = 1.0   # 手动选择时默认不衰减
    selected_app = None

    if auto_match:
        match_confidence = auto_match.get("match_confidence", 1.0)
        print(f"\n自动匹配：{auto_match['school']} {auto_match['program']} — {auto_match['status']}")
        _print_match_detail(auto_match)
        use_auto = input("\n使用此申请？[y/n] > ").strip().lower()
        if use_auto == 'y':
            selected_app = auto_match
        else:
            # 展示全部匹配排名供用户参考
            all_ranked = match_applications(
                result.get("school_name"), result.get("program_name"), MOCK_APPLICATIONS
            )
            print("\n全部申请匹配分数：")
            for i, app in enumerate(all_ranked, 1):
                print(f"  [{i}] {app['school']} {app['program']} — {app['status']} "
                      f"(match={app['match_confidence']:.3f})")
    else:
        print("\n未能自动匹配（分数低于阈值 0.6）")
        all_ranked = match_applications(
            result.get("school_name"), result.get("program_name"), MOCK_APPLICATIONS
        )
        print("全部申请匹配分数：")
        for i, app in enumerate(all_ranked, 1):
            print(f"  [{i}] {app['school']} {app['program']} — {app['status']} "
                  f"(match={app['match_confidence']:.3f})")

    if not selected_app:
        _print_applications(MOCK_APPLICATIONS)
        print("  [0] 不关联任何申请（仅建日历 Event）")
        choice = input("\n选择 > ").strip()
        if choice == '0':
            print("\n📅 仅创建日历 Event，不关联申请，不触发状态变更")
            return
        try:
            idx = int(choice) - 1
            selected_app = MOCK_APPLICATIONS[idx]
            # 手动选择：从 match_applications 结果里取对应分数
            all_ranked = match_applications(
                result.get("school_name"), result.get("program_name"), MOCK_APPLICATIONS
            )
            matched = next((a for a in all_ranked if a["id"] == selected_app["id"]), None)
            match_confidence = matched["match_confidence"] if matched else 1.0
        except (ValueError, IndexError):
            print("❌ 无效选择")
            return

    # ── 综合置信度计算 ───────────────────────────────────────
    final_confidence = _compute_final_confidence(result['confidence'], match_confidence)

    _print_sep()
    print("状态机决策")
    _print_sep()
    print(f"\n  LLM 置信度：    {result['confidence']:.3f}")
    print(f"  匹配置信度：    {match_confidence:.3f}")
    print(f"  综合置信度：    {final_confidence:.3f}  ← 实际用于状态机判断")

    sm_result = evaluate_transition(
        selected_app,
        trigger_type='email',
        intent=result['intent'],
        confidence=final_confidence,   # 使用综合置信度
    )

    print()
    print(_format_action_result(sm_result))
    _print_sep()

    # ── 执行或确认 ──────────────────────────────────────────
    action = sm_result["action"]

    if action == "auto_execute" and sm_result["to_status"]:
        update_application_status(selected_app["id"], sm_result["to_status"])
        print(f"\n✔ Mock 数据已更新：{selected_app['school']} {selected_app['program']} → {sm_result['to_status']}")
        if sm_result.get("is_memorial_event"):
            print(f"🎉 纪念 Event：{result['event_title']}")

    elif action == "needs_confirmation":
        confirm = input("\n用户确认执行状态变更？[y/n] > ").strip().lower()
        if confirm == 'y':
            update_application_status(selected_app["id"], sm_result["to_status"])
            print(f"\n✔ 已确认执行：{selected_app['school']} {selected_app['program']} → {sm_result['to_status']}")
            if sm_result.get("is_memorial_event"):
                print(f"🎉 纪念 Event：{result['event_title']}")
        else:
            print("已取消，状态未变更")

    elif action == "event_only":
        print(f"\n📅 日历 Event 已创建：{result['event_title']}")

    # blocked 已在 _format_action_result 里展示，无需额外操作


# ── 主循环 ────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 50)
    print("  申请状态机测试台")
    print("  poc/intent_recognition/demo.py")
    print("=" * 50)

    while True:
        print("\n主菜单：")
        print("  [1] 模拟手动操作")
        print("  [2] 模拟邮件识别（调用 Kimi API）")
        print("  [r] 重置所有申请状态")
        print("  [s] 查看当前申请状态")
        print("  [q] 退出")

        choice = input("\n选择 > ").strip().lower()

        if choice == '1':
            run_manual_mode()
        elif choice == '2':
            run_email_mode()
        elif choice == 'r':
            reset_applications()
            print("✔ 所有申请状态已重置")
        elif choice == 's':
            _print_header("当前申请状态")
            _print_applications(MOCK_APPLICATIONS)
        elif choice == 'q':
            print("再见！")
            sys.exit(0)
        else:
            print("❌ 无效选项")


if __name__ == "__main__":
    main()
