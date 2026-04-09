"""
基于历史案例的学校推荐接口。

POST /api/school-recommendation/case-based     - 手动传参
POST /api/school-recommendation/profile-based  - 读取当前用户 profile 自动推荐，结果写入 DB
GET  /api/school-recommendation/my-result      - 读取缓存结果（none/fresh/stale）
"""

from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.utils.decorators import login_required

school_rec_bp = Blueprint('school_recommendation', __name__, url_prefix='/api/school-recommendation')
school_rec_bp.strict_slashes = False

VALID_TIERS = {"985", "211", "双非", "C9", "海外院校"}
VALID_COUNTRIES = {"英国", "美国", "澳大利亚", "中国香港", "新加坡"}


@school_rec_bp.route('/case-based', methods=['POST'])
@login_required
def case_based_recommendation():
    data = request.get_json(silent=True) or {}

    undergrad_tier = (data.get("undergrad_tier") or "").strip()
    if undergrad_tier not in VALID_TIERS:
        return jsonify({"error": f"undergrad_tier 必须是 {VALID_TIERS} 之一"}), 400

    gpa = data.get("gpa")
    if gpa is None:
        return jsonify({"error": "gpa 是必填项"}), 400
    try:
        gpa = float(gpa)
        if not (0.0 <= gpa <= 4.0):
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "gpa 必须是 0~4.0 之间的数值"}), 400

    undergrad_major = (data.get("undergrad_major") or "").strip()
    if not undergrad_major:
        return jsonify({"error": "undergrad_major 是必填项"}), 400

    countries = _parse_countries(data.get("countries"))
    target_majors = _parse_list(data.get("target_majors"))
    top_schools = min(int(data.get("top_schools") or 5), 20)
    top_programs = min(int(data.get("top_programs") or 3), 5)

    return _run_recommendation(
        profile=None,
        undergrad_tier=undergrad_tier,
        gpa=gpa,
        undergrad_major=undergrad_major,
        countries=countries,
        target_majors=target_majors,
        top_schools=top_schools,
        top_programs=top_programs,
    )


@school_rec_bp.route('/profile-based', methods=['POST'])
@login_required
def profile_based_recommendation():
    """
    基于当前登录用户的 profile 自动推荐，生成成功后将结果写入 DB。
    """
    profile = g.user.profile
    if not profile:
        return jsonify({"error": "请先完善个人档案"}), 400

    missing = []
    if not profile.institution_tier:
        missing.append("本科院校层次（institution_tier）")
    if profile.gpa is None:
        missing.append("GPA")
    if not profile.current_major:
        missing.append("本科专业（current_major）")
    if missing:
        return jsonify({"error": f"档案缺少必填项：{'、'.join(missing)}"}), 400

    gpa = float(profile.gpa)
    if not (0.0 <= gpa <= 4.0):
        return jsonify({"error": "档案中的 GPA 不在 0~4.0 范围内，请检查"}), 400

    data = request.get_json(silent=True) or {}
    top_schools = min(int(data.get("top_schools") or 8), 20)
    top_programs = min(int(data.get("top_programs") or 3), 5)

    countries = _parse_countries(profile.target_countries)
    target_majors = _parse_list(profile.target_majors)

    tier = _normalize_tier(profile.institution_tier)
    if not tier:
        return jsonify({"error": f"无法识别的院校层次：{profile.institution_tier}"}), 400

    return _run_recommendation(
        profile=profile,
        undergrad_tier=tier,
        gpa=gpa,
        undergrad_major=profile.current_major,
        countries=countries,
        target_majors=target_majors,
        top_schools=top_schools,
        top_programs=top_programs,
    )


@school_rec_bp.route('/my-result', methods=['GET'])
@login_required
def my_result():
    """
    读取当前用户的推荐缓存。
    返回：
      {status: 'none'}                        — 从未生成
      {status: 'fresh', data: {...}}           — 结果存在且 profile 未变
      {status: 'stale', data: {...}}           — 结果存在但 profile 已改
    """
    from app.services.school_recommendation import build_recommendation_hash

    profile = g.user.profile
    if not profile or not profile.recommendation_cache:
        return jsonify({"status": "none"})

    current_hash = build_recommendation_hash(profile)
    is_fresh = profile.recommendation_hash == current_hash

    return jsonify({
        "status": "fresh" if is_fresh else "stale",
        "data": profile.recommendation_cache,
    })


# ── 内部工具函数 ────────────────────────────────────────────────────

def _run_recommendation(profile, undergrad_tier, gpa, undergrad_major,
                        countries, target_majors, top_schools, top_programs):
    from app.services.case_recommendation import get_case_based_recommendations
    from app.services.school_recommendation import build_recommendation_hash

    try:
        result = get_case_based_recommendations(
            undergrad_tier=undergrad_tier,
            gpa=gpa,
            undergrad_major=undergrad_major,
            countries=countries or None,
            top_schools=top_schools,
            top_programs_per_school=top_programs,
            target_majors=target_majors or None,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        # profile-based 失败时标记 status
        if profile:
            profile.recommendation_status = 'failed'
            db.session.commit()
        return jsonify({"error": f"推荐服务异常: {str(e)}"}), 500

    # profile-based：将结果和快照写入 DB
    if profile:
        profile.recommendation_cache = result
        profile.recommendation_hash = build_recommendation_hash(profile)
        profile.recommendation_status = 'done'
        db.session.commit()

    return jsonify(result), 200


def _parse_countries(raw) -> list[str]:
    if not raw:
        return []
    if isinstance(raw, str):
        raw = [raw]
    return [c for c in raw if c in VALID_COUNTRIES]


def _parse_list(raw) -> list[str]:
    if not raw:
        return []
    if isinstance(raw, str):
        return [raw] if raw.strip() else []
    return [str(x).strip() for x in raw if str(x).strip()]


_TIER_MAP = {
    "c9": "C9",
    "985": "985",
    "211": "211",
    "double_non": "双非",
    "双非": "双非",
    "overseas": "海外院校",
    "海外院校": "海外院校",
    "other": "双非",
}

def _normalize_tier(tier: str) -> str | None:
    if not tier:
        return None
    return _TIER_MAP.get(tier.lower()) or _TIER_MAP.get(tier)
