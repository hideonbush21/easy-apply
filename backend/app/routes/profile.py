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
