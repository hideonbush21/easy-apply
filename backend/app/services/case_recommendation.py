"""
基于历史录取案例的学校推荐服务。

流程：
  Step 1  用户本科专业 → 专业大类（映射表）
  Step 2  admission_cases 相似人群检索（tier精确 + GPA范围 + 同大类）
          GPA 降级策略：<20条 → 扩±0.5；<10条 → 扩±0.8；<5条 → 补充同排名学校
  Step 3  统计相似人群申请的学校频率 → Top N 学校
  Step 4  在 programs 表中按语义向量找最匹配专业，每校返回 top_k 个
"""

from __future__ import annotations
import logging
from collections import Counter, defaultdict
from typing import Optional

from sqlalchemy import and_, or_
from app.extensions import db
from app.models.admission_case import AdmissionCase
from app.models.school import School
from app.models.program import Program
from app.services.major_category_map import get_category

logger = logging.getLogger(__name__)

# GPA 窗口档位（层层扩大）
GPA_WINDOWS = [0.3, 0.5, 0.8]
MIN_CASES_THRESHOLD = [20, 10, 5]  # 对应窗口扩大时的触发阈值

_PRIORITY_ORDER = ['冲刺', '匹配', '保底']


def _compute_priority(user_gpa: float, avg_gpa: Optional[float], ranking: Optional[int]) -> str:
    """
    基于 GPA delta 和学校排名计算申请优先级。

    主信号 — 用户 GPA vs 历史录取均 GPA 的差值：
      delta >= +0.2  → 保底（用户背景强于录取均值）
      -0.2 ~ +0.2   → 匹配（与录取均值相当）
      <= -0.2       → 冲刺（用户背景弱于录取均值）

    二次修正 — 学校排名：
      排名 <= 50   → 向难度方向偏移一级（→ 冲刺）
      排名 >= 150  → 向保底方向偏移一级（→ 保底）
    """
    if avg_gpa is not None:
        delta = user_gpa - avg_gpa
        if delta >= 0.2:
            base = '保底'
        elif delta <= -0.2:
            base = '冲刺'
        else:
            base = '匹配'
    else:
        # 无案例均 GPA，纯用排名估算
        if ranking and ranking <= 50:
            base = '冲刺'
        elif ranking and ranking >= 150:
            base = '保底'
        else:
            base = '匹配'

    # 排名修正
    if ranking:
        idx = _PRIORITY_ORDER.index(base)
        if ranking <= 50:
            idx = max(0, idx - 1)   # 向冲刺方向
        elif ranking >= 150:
            idx = min(2, idx + 1)   # 向保底方向
        base = _PRIORITY_ORDER[idx]

    return base


def _query_cases(
    undergrad_tier: str,
    gpa: float,
    gpa_window: float,
    category: Optional[str],
    countries: Optional[list[str]] = None,
) -> list[AdmissionCase]:
    """
    在 admission_cases 中查找相似人群。
    category 为 None 时忽略专业大类过滤。
    countries 为列表时用 IN 过滤，为 None 时不过滤国家。
    """
    filters = [
        AdmissionCase.undergrad_tier == undergrad_tier,
        AdmissionCase.gpa >= gpa - gpa_window,
        AdmissionCase.gpa <= gpa + gpa_window,
        AdmissionCase.result == "录取",
    ]

    if countries:
        filters.append(AdmissionCase.country.in_(countries))

    cases = AdmissionCase.query.filter(and_(*filters)).all()

    if category:
        cases = [c for c in cases if get_category(c.undergrad_major or "") == category]

    return cases


def _get_similar_cases(
    undergrad_tier: str,
    gpa: float,
    undergrad_major: str,
    countries: Optional[list[str]] = None,
) -> tuple[list[AdmissionCase], str]:
    """
    降级策略查找相似案例，返回 (cases, match_level)。
    match_level: 'exact' | 'widened_0.5' | 'widened_0.8' | 'no_major'
    """
    category = get_category(undergrad_major)

    # 标准窗口 ±0.3
    cases = _query_cases(undergrad_tier, gpa, GPA_WINDOWS[0], category, countries)
    if len(cases) >= MIN_CASES_THRESHOLD[0]:
        return cases, "exact"

    # 扩大 ±0.5
    cases = _query_cases(undergrad_tier, gpa, GPA_WINDOWS[1], category, countries)
    if len(cases) >= MIN_CASES_THRESHOLD[1]:
        return cases, "widened_0.5"

    # 扩大 ±0.8
    cases = _query_cases(undergrad_tier, gpa, GPA_WINDOWS[2], category, countries)
    if len(cases) >= MIN_CASES_THRESHOLD[2]:
        return cases, "widened_0.8"

    # 忽略专业大类，只用 tier + GPA ±0.8
    cases = _query_cases(undergrad_tier, gpa, GPA_WINDOWS[2], None, countries)
    return cases, "no_major"


def _get_top_schools(cases: list[AdmissionCase], top_n: int) -> list[dict]:
    """
    统计案例中的学校频率，返回 Top N。
    每项包含：school_name_en, school_name_cn, count, avg_gpa, school_db（School ORM 对象或 None）
    """
    counter: Counter = Counter()
    gpa_sum: dict[str, float] = defaultdict(float)
    gpa_cnt: dict[str, int] = defaultdict(int)

    for c in cases:
        key = c.school_name_en or c.school_name_cn or c.school_name_raw or "未知"
        counter[key] += 1
        if c.gpa is not None:
            gpa_sum[key] += float(c.gpa)
            gpa_cnt[key] += 1

    # 查 schools 表匹配：精确匹配 + 去掉"The "前缀 + 去掉括号内容的模糊匹配
    import re

    def _normalize(name: str) -> str:
        name = name.lower().strip()
        name = re.sub(r'\s*\([^)]*\)', '', name)  # 去括号内容
        name = re.sub(r',.*$', '', name)           # 去逗号后内容
        name = re.sub(r'^the\s+', '', name)        # 去开头 The
        return name.strip()

    school_db_map: dict[str, School] = {}
    school_objs = School.query.all()
    for s in school_objs:
        school_db_map[s.name] = s
        school_db_map[_normalize(s.name)] = s
        if s.name_cn:
            school_db_map[s.name_cn] = s

    results = []
    for name, count in counter.most_common(top_n):
        school_obj = school_db_map.get(name) or school_db_map.get(_normalize(name))
        results.append({
            "school_name_en": name,
            "school_name_cn": school_obj.name_cn if school_obj else None,
            "count": count,
            "avg_gpa": round(gpa_sum[name] / gpa_cnt[name], 2) if gpa_cnt[name] else None,
            "school_obj": school_obj,
        })

    return results


def _build_query_text(undergrad_major: str, target_majors: Optional[list[str]] = None) -> str:
    """
    构建用于向量搜索的查询文本。
    融合本科专业 + 用户目标专业（target_majors）+ 大类。
    """
    parts = [undergrad_major]
    if target_majors:
        parts.extend(target_majors)
    category = get_category(undergrad_major)
    if category:
        parts.append(category)
    return " ".join(parts)


def get_case_based_recommendations(
    undergrad_tier: str,
    gpa: float,
    undergrad_major: str,
    countries: Optional[list[str]] = None,
    top_schools: int = 5,
    top_programs_per_school: int = 3,
    target_majors: Optional[list[str]] = None,
) -> dict:
    """
    主入口：基于历史案例的学校 + 专业推荐。

    参数:
        undergrad_tier:          本科学校层次（985/211/双非/C9/海外院校）
        gpa:                     GPA（4.0 制）
        undergrad_major:         本科专业
        countries:               目标国家列表（如 ["英国", "澳大利亚"]），None 则不限国家
        top_schools:             返回学校数量（默认 5）
        top_programs_per_school: 每所学校返回 program 数（默认 3）
        target_majors:           用户期望的研究方向列表（用于向量搜索增强）

    返回:
        {
          "schools": [...],
          "match_level": "exact" | "widened_0.5" | "widened_0.8" | "no_major",
          "total_cases_found": int,
          "category": str | None,
        }
    """
    # Step 1 & 2: 找相似人群
    cases, match_level = _get_similar_cases(undergrad_tier, gpa, undergrad_major, countries)
    logger.info(f"找到 {len(cases)} 条相似案例，匹配层级: {match_level}")

    # Step 3: 统计 Top 学校
    top_school_list = _get_top_schools(cases, top_n=top_schools)

    # 补充：若案例太少（<5），用同排名段学校兜底
    if len(cases) < MIN_CASES_THRESHOLD[2] and len(top_school_list) < top_schools:
        fallback_schools = _get_ranking_fallback_schools(
            cases, needed=top_schools - len(top_school_list)
        )
        top_school_list.extend(fallback_schools)

    # Step 4: programs 语义匹配
    from app.services.embedding_service import find_similar_programs

    school_id_set = set()
    for entry in top_school_list:
        s = entry.get("school_obj")
        if s:
            school_id_set.add(s.id)

    query_text = _build_query_text(undergrad_major, target_majors)
    similar_programs = find_similar_programs(
        query_text=query_text,
        school_id_set=school_id_set,
        top_k_per_school=top_programs_per_school,
    )

    # 按学校归组
    programs_by_school: dict[str, list] = defaultdict(list)
    for item in similar_programs:
        programs_by_school[item["school_id"]].append(item)

    # 批量预取所有涉及的 Program，消除循环内 N+1 查询
    all_program_ids = [item["program_id"] for item in similar_programs]
    if all_program_ids:
        program_objs = Program.query.filter(Program.id.in_(all_program_ids)).all()
        program_map = {str(p.id): p for p in program_objs}
    else:
        program_map = {}

    # 组装结果
    results = []
    for entry in top_school_list:
        s = entry.get("school_obj")
        school_id_str = str(s.id) if s else None

        program_list = []
        if school_id_str and school_id_str in programs_by_school:
            # 计算该学校的优先级（基于 GPA delta + 排名）
            school_priority = _compute_priority(
                user_gpa=gpa,
                avg_gpa=entry["avg_gpa"],
                ranking=s.ranking if s else None,
            )
            for item in programs_by_school[school_id_str]:
                p = program_map.get(item["program_id"])
                if p:
                    program_list.append({
                        "id": str(p.id),
                        "name_cn": p.name_cn,
                        "name_en": p.name_en,
                        "major_category": p.major_category,
                        "department": p.department,
                        "duration": p.duration,
                        "tuition": p.tuition,
                        "tuition_cny": p.tuition_cny,
                        "ielts_requirement": p.ielts_requirement,
                        "toefl_requirement": p.toefl_requirement,
                        "pte_requirement": p.pte_requirement,
                        "deadline_26fall": p.deadline_26fall.isoformat() if p.deadline_26fall else None,
                        "deadline_25fall": p.deadline_25fall.isoformat() if p.deadline_25fall else None,
                        "program_url": p.program_url,
                        "similarity_score": round(item["score"], 4),
                        "priority_suggestion": school_priority,
                    })

        results.append({
            "school_name_en": entry["school_name_en"],
            "school_name_cn": entry.get("school_name_cn") or (s.name_cn if s else None),
            "ranking": s.ranking if s else None,
            "case_count": entry["count"],
            "avg_gpa": entry["avg_gpa"],
            "programs": program_list,
        })

    return {
        "schools": results,
        "match_level": match_level,
        "total_cases_found": len(cases),
        "category": get_category(undergrad_major),
    }


def _get_ranking_fallback_schools(cases: list[AdmissionCase], needed: int) -> list[dict]:
    """
    当案例数量极少时，找 QS 排名相近的学校作为兜底推荐。
    """
    if not cases:
        return []

    # 找已有案例学校的排名均值
    school_db_map = {s.name: s for s in School.query.all()}
    rankings = []
    for c in cases:
        s = school_db_map.get(c.school_name_en or "")
        if s and s.ranking:
            rankings.append(s.ranking)

    if not rankings:
        return []

    avg_ranking = sum(rankings) / len(rankings)
    existing_names = {c.school_name_en for c in cases}

    fallback = (
        School.query
        .filter(
            School.ranking.isnot(None),
            School.ranking.between(max(1, int(avg_ranking) - 50), int(avg_ranking) + 50),
            ~School.name.in_(existing_names),
        )
        .order_by(School.ranking.asc())
        .limit(needed)
        .all()
    )

    return [
        {
            "school_name_en": s.name,
            "school_name_cn": s.name_cn,
            "count": 0,
            "avg_gpa": None,
            "school_obj": s,
        }
        for s in fallback
    ]
