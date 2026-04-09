from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import UserProfile
from app.services.school_recommendation import RECOMMENDATION_FIELDS
from app.utils.decorators import login_required

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')
profile_bp.strict_slashes = False


@profile_bp.route('/', methods=['GET'])
@login_required
def get_profile():
    profile = g.user.profile
    if not profile:
        # 老用户兼容：自动创建 profile
        profile = UserProfile(user_id=g.user.id)
        db.session.add(profile)
        db.session.commit()
    return jsonify(profile.to_dict())


@profile_bp.route('/', methods=['PUT'])
@login_required
def update_profile():
    profile = g.user.profile
    if not profile:
        # 老用户兼容：自动创建 profile
        profile = UserProfile(user_id=g.user.id)
        db.session.add(profile)

    data = request.get_json(silent=True) or {}
    allowed_fields = [
        'name', 'home_institution', 'institution_tier', 'current_major',
        'gpa', 'gpa_scale', 'language_scores', 'target_countries',
        'target_majors', 'degree_type',
    ]
    for field in allowed_fields:
        if field in data:
            setattr(profile, field, data[field])

    if RECOMMENDATION_FIELDS & data.keys():
        profile.recommendation_cache = None
        profile.recommendation_hash = None

    profile.completion_rate = profile.calculate_completion_rate()
    from datetime import datetime
    profile.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(profile.to_dict())


@profile_bp.route('/completion', methods=['GET'])
@login_required
def get_completion():
    profile = g.user.profile
    if not profile:
        return jsonify({'completion_rate': 0})
    rate = profile.calculate_completion_rate()
    return jsonify({'completion_rate': rate})


@profile_bp.route('/onboarding', methods=['POST'])
@login_required
def sync_onboarding():
    """
    将 Onboarding 采集的数据合并写入用户 profile。
    合并规则：DB 为空则写入；DB 有值且与传入不同则更新；相同则跳过。
    """
    data = request.get_json(silent=True) or {}

    profile = g.user.profile
    if not profile:
        profile = UserProfile(user_id=g.user.id)
        db.session.add(profile)

    # ── 字段映射 ─────────────────────────────────────────────
    # university → home_institution
    university = (data.get('university') or '').strip()
    if university and (not profile.home_institution or profile.home_institution != university):
        profile.home_institution = university

    # major → current_major
    major = (data.get('major') or '').strip()
    if major and (not profile.current_major or profile.current_major != major):
        profile.current_major = major

    # gpa + gpaMax → gpa（换算到4.0制）、gpa_scale
    raw_gpa = data.get('gpa', '')
    gpa_max = data.get('gpaMax', '4.0')
    if raw_gpa:
        try:
            gpa_val = float(raw_gpa)
            scale = float(gpa_max)
            gpa_4 = round(min(gpa_val / scale * 4.0, 4.0), 2) if scale != 4.0 else round(min(gpa_val, 4.0), 2)
            if profile.gpa is None or abs(float(profile.gpa) - gpa_4) > 0.001:
                profile.gpa = gpa_4
            if profile.gpa_scale is None or float(profile.gpa_scale) != scale:
                profile.gpa_scale = scale
        except (ValueError, ZeroDivisionError):
            pass

    # direction → target_majors（按逗号/顿号拆分）
    direction = (data.get('direction') or '').strip()
    if direction:
        import re
        majors = [m.strip() for m in re.split(r'[，,、；;]', direction) if m.strip()]
        if majors and (not profile.target_majors or profile.target_majors != majors):
            profile.target_majors = majors

    # programs → target_countries
    programs = data.get('programs') or []
    _PROG_TO_COUNTRIES = {
        '美国硕士':  ['美国'],
        '英国硕士':  ['英国'],
        '港新硕士':  ['中国香港', '新加坡'],
        '还没决定':  [],
    }
    countries = []
    for p in programs:
        countries.extend(_PROG_TO_COUNTRIES.get(p, []))
    countries = list(dict.fromkeys(countries))  # 去重保序
    if countries and (not profile.target_countries or set(profile.target_countries) != set(countries)):
        profile.target_countries = countries

    # goals → onboarding_goals
    goals = data.get('goals') or []
    if goals and (not profile.onboarding_goals or profile.onboarding_goals != goals):
        profile.onboarding_goals = goals

    # stage → onboarding_stage
    stage = (data.get('stage') or '').strip()
    if stage and (not profile.onboarding_stage or profile.onboarding_stage != stage):
        profile.onboarding_stage = stage

    # ── 重算 completion_rate ────────────────────────────────
    profile.completion_rate = profile.calculate_completion_rate()

    # ── 若推荐关键字段变更，作废旧缓存 ─────────────────────
    from app.services.school_recommendation import RECOMMENDATION_FIELDS, build_recommendation_hash
    if profile.recommendation_cache:
        new_hash = build_recommendation_hash(profile)
        if new_hash != profile.recommendation_hash:
            profile.recommendation_hash = None  # 标记 stale，不删缓存

    from datetime import datetime
    profile.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'ok': True, 'profile': profile.to_dict()})
