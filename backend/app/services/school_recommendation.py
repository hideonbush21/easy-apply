from app.models.school import School
from app.models.user import UserProfile


def _tier_max_ranking(institution_tier: str) -> int:
    """
    每个层次学生「合理申请」的最高排名上限，超过此排名视为冲刺。
    c9/985 → 可申 Top 200；211 → Top 400；其余 → 全部
    """
    tier = (institution_tier or '').lower()
    if tier in ('c9', '985'):
        return 200
    if tier == '211':
        return 400
    return 9999


def classify_school(profile: UserProfile, school: School):
    """
    分档逻辑：
    1. 国家过滤：不在目标国家 → 跳过
    2. 专业过滤：目标专业与学校开设专业无交集 → 跳过
    3. GPA 过滤：用户 GPA < 学校最低要求 - 0.5 → 跳过（差距太大）
    4. 分档规则（以 GPA 为主轴）：
       - 保底：GPA ≥ preferred，且排名在层次合理范围内
       - 匹配：GPA ≥ min（但 < preferred），或 GPA ≥ preferred 但排名超出层次舒适区
       - 冲刺：GPA ≥ min - 0.5（差距在容忍范围内）

    返回 'safety' | 'match' | 'reach' | None
    """
    # ── 1. 国家过滤 ──────────────────────────────────────────
    target_countries = profile.target_countries or []
    if not target_countries or school.country not in target_countries:
        return None

    # ── 2. 专业过滤 ──────────────────────────────────────────
    target_majors = set(profile.target_majors or [])
    school_majors = set(school.majors or [])
    if not target_majors or not (target_majors & school_majors):
        return None

    # ── 3. GPA 基础过滤 ──────────────────────────────────────
    user_gpa = float(profile.gpa) if profile.gpa is not None else None
    req = school.gpa_requirement or {}
    school_min = float(req.get('min', 2.5))
    school_preferred = float(req.get('preferred', school_min + 0.3))

    if user_gpa is None:
        # GPA 未填写，全部归入冲刺（提示用户完善档案）
        return 'reach'

    if user_gpa < school_min - 0.5:
        return None  # 差距过大，不推荐

    # ── 4. 分档 ──────────────────────────────────────────────
    ranking = school.ranking or 9999
    tier_limit = _tier_max_ranking(profile.institution_tier)

    if user_gpa >= school_preferred and ranking <= tier_limit:
        # GPA 超过 preferred，且排名在本层次合理范围 → 保底
        return 'safety'

    if user_gpa >= school_preferred and ranking > tier_limit:
        # GPA 够但学校排名超出本层次舒适区 → 匹配（有压力）
        return 'match'

    if user_gpa >= school_min:
        # GPA 满足最低要求但低于 preferred → 匹配
        return 'match'

    # user_gpa >= school_min - 0.5（前面已过滤 < -0.5 的情况）→ 冲刺
    return 'reach'


def get_recommendations(profile: UserProfile) -> dict:
    """
    返回按国家+专业过滤后、以 GPA 为主轴分档的学校列表。
    每档内部按排名升序（越靠前越好）。
    """
    schools = School.query.order_by(School.ranking.asc().nullslast()).all()

    reach = []
    match = []
    safety = []

    for school in schools:
        tier = classify_school(profile, school)
        if tier is None:
            continue

        req = school.gpa_requirement or {}
        entry = {
            **school.to_dict(),
            'gpa_min': req.get('min'),
            'gpa_preferred': req.get('preferred'),
        }

        if tier == 'safety':
            safety.append(entry)
        elif tier == 'match':
            match.append(entry)
        else:
            reach.append(entry)

    return {
        'reach': reach,    # 冲刺
        'match': match,    # 匹配
        'safety': safety,  # 保底
    }
