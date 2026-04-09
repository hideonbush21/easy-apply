"""
基于历史案例的学校推荐接口。

POST /api/school-recommendation/case-based     - 手动传参
POST /api/school-recommendation/profile-based  - 读取当前用户 profile 自动推荐
"""

from flask import Blueprint, request, jsonify, g
from app.utils.decorators import login_required

school_rec_bp = Blueprint('school_recommendation', __name__, url_prefix='/api/school-recommendation')
school_rec_bp.strict_slashes = False

VALID_TIERS = {"985", "211", "双非", "C9", "海外院校"}
VALID_COUNTRIES = {"英国", "美国", "澳大利亚", "中国香港", "新加坡"}


@school_rec_bp.route('/case-based', methods=['POST'])
@login_required
def case_based_recommendation():
    """
    手动传参的学校推荐。

    请求体（JSON）：
    {
      "undergrad_tier":  "985" | "211" | "双非" | "C9" | "海外院校",  必填
      "gpa":             3.5,                                         必填（4.0制）
      "undergrad_major": "金融学",                                     必填
      "countries":       ["英国", "澳大利亚"],                         可选，空则不限
      "target_majors":   ["金融科技", "FinTech"],                      可选
      "top_schools":     5,                                           可选，默认5
      "top_programs":    3,                                           可选，默认3
    }
    """
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
    基于当前登录用户的 profile 自动推荐。
    从 profile 读取：institution_tier / gpa / current_major / target_countries / target_majors

    请求体（JSON，均为可选覆盖项）：
    {
      "top_schools":  5,
      "top_programs": 3
    }
    """
    profile = g.user.profile
    if not profile:
        return jsonify({"error": "请先完善个人档案"}), 400

    # 必填项校验
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
    top_schools = min(int(data.get("top_schools") or 5), 20)
    top_programs = min(int(data.get("top_programs") or 3), 5)

    countries = _parse_countries(profile.target_countries)
    target_majors = _parse_list(profile.target_majors)

    # institution_tier 归一化：profile 中可能是英文标识
    tier = _normalize_tier(profile.institution_tier)
    if not tier:
        return jsonify({"error": f"无法识别的院校层次：{profile.institution_tier}"}), 400

    return _run_recommendation(
        undergrad_tier=tier,
        gpa=gpa,
        undergrad_major=profile.current_major,
        countries=countries,
        target_majors=target_majors,
        top_schools=top_schools,
        top_programs=top_programs,
    )


# ── 内部工具函数 ────────────────────────────────────────────────────

def _run_recommendation(undergrad_tier, gpa, undergrad_major, countries,
                        target_majors, top_schools, top_programs):
    from app.services.case_recommendation import get_case_based_recommendations
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
        return jsonify({"error": f"推荐服务异常: {str(e)}"}), 500
    return jsonify(result), 200


def _parse_countries(raw) -> list[str]:
    """解析国家列表，过滤不支持的国家"""
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


# institution_tier 从 profile 英文标识映射到 admission_cases 中文标识
_TIER_MAP = {
    "c9": "C9",
    "985": "985",
    "211": "211",
    "double_non": "双非",
    "双非": "双非",
    "overseas": "海外院校",
    "海外院校": "海外院校",
    "other": "双非",  # 其他归入双非档
}

def _normalize_tier(tier: str) -> str | None:
    if not tier:
        return None
    return _TIER_MAP.get(tier.lower()) or _TIER_MAP.get(tier)
