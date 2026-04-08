import hashlib
import json

from app.models.school import School
from app.models.user import UserProfile


RECOMMENDATION_FIELDS = {'gpa', 'institution_tier', 'target_countries', 'target_majors'}


def build_recommendation_hash(profile: UserProfile) -> str:
    payload = json.dumps({
        'gpa': float(profile.gpa) if profile.gpa is not None else None,
        'institution_tier': profile.institution_tier,
        'target_countries': sorted(profile.target_countries or []),
        'target_majors': sorted(profile.target_majors or []),
    }, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def _majors_match(target_majors: list, school_majors: list) -> bool:
    if not target_majors or not school_majors:
        return False
    for tm in target_majors:
        for sm in school_majors:
            if tm == sm or tm in sm or sm in tm:
                return True
    return False


def _tier_max_ranking(institution_tier: str) -> int:
    tier = (institution_tier or '').lower()
    if tier in ('c9', '985'):
        return 200
    if tier == '211':
        return 400
    return 9999


def classify_school(profile: UserProfile, school: School):
    """
    分档逻辑（容灾版）:
    - 国家过滤：profile 填了目标国家时才过滤，未填则不过滤
    - 专业过滤：school.majors 有值时才做匹配过滤；school 未录入专业数据则跳过专业过滤
    - GPA 分档：school.gpa_requirement 有值时按 GPA 分档；无值则按排名粗分
    """
    # ── 1. 国家过滤（仅 profile 填了目标国家时生效）──────────
    target_countries = profile.target_countries or []
    if target_countries and school.country not in target_countries:
        return None

    # ── 2. 专业过滤（仅 school 有专业数据时才过滤）──────────
    target_majors = list(profile.target_majors or [])
    school_majors = list(school.majors or [])
    if school_majors and target_majors:
        # 双方都有数据才做匹配过滤
        if not _majors_match(target_majors, school_majors):
            return None

    # ── 3. GPA / 排名 分档 ───────────────────────────────────
    user_gpa = float(profile.gpa) if profile.gpa is not None else None
    req = school.gpa_requirement or {}
    school_min = float(req['min']) if req.get('min') is not None else None
    school_preferred = float(req['preferred']) if req.get('preferred') is not None else None

    ranking = school.ranking or 9999
    tier_limit = _tier_max_ranking(profile.institution_tier)

    # school 有 GPA 要求时按 GPA 分档
    if school_min is not None and school_preferred is not None and user_gpa is not None:
        if user_gpa < school_min - 0.5:
            return None  # 差距过大，不推荐
        if user_gpa >= school_preferred and ranking <= tier_limit:
            return 'safety'
        if user_gpa >= school_preferred and ranking > tier_limit:
            return 'match'
        if user_gpa >= school_min:
            return 'match'
        return 'reach'

    # school 无 GPA 数据，或 profile 无 GPA，按排名粗分
    if ranking <= 50:
        return 'reach'
    if ranking <= 200:
        return 'match'
    return 'safety'


def get_recommendations(profile: UserProfile) -> dict:
    schools = School.query.order_by(School.ranking.asc().nullslast()).all()

    reach, match, safety = [], [], []

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

    return {'reach': reach, 'match': match, 'safety': safety}
