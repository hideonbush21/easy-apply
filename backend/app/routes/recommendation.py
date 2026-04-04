from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.recommendation import RecommendationLetter
from app.models.application import Application
from app.models.experience import Experience
from app.models.school import School
from app.services.ai_service import generate_recommendation
from app.utils.decorators import login_required

recommendation_bp = Blueprint('recommendation', __name__, url_prefix='/api/recommendations')
recommendation_bp.strict_slashes = False


@recommendation_bp.route('/generate', methods=['POST'])
@login_required
def generate():
    data = request.get_json(silent=True) or {}
    application_id = data.get('application_id', '')
    if not application_id:
        return jsonify({'error': 'application_id is required'}), 400

    app_obj = Application.query.filter_by(id=application_id, user_id=g.user.id).first()
    if not app_obj:
        return jsonify({'error': 'Application not found'}), 404

    school = School.query.get(app_obj.school_id)
    if not school:
        return jsonify({'error': 'School not found'}), 404

    profile = g.user.profile
    profile_dict = profile.to_dict() if profile else {}

    experiences = Experience.query.filter_by(user_id=g.user.id).all()
    experiences_list = [e.to_dict() for e in experiences]

    try:
        content = generate_recommendation(
            user_profile=profile_dict,
            experiences=experiences_list,
            school_name=school.name_cn or school.name,
            major=app_obj.major or '',
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'AI service error: {str(e)}'}), 502

    letter = RecommendationLetter(
        user_id=g.user.id,
        application_id=application_id,
        content=content,
    )
    db.session.add(letter)
    db.session.commit()
    return jsonify(letter.to_dict()), 201


@recommendation_bp.route('/<application_id>', methods=['GET'])
@login_required
def get_recommendation(application_id):
    letter = (
        RecommendationLetter.query
        .filter_by(application_id=application_id, user_id=g.user.id)
        .order_by(RecommendationLetter.created_at.desc())
        .first()
    )
    if not letter:
        return jsonify({'error': 'Recommendation letter not found'}), 404
    return jsonify(letter.to_dict())


@recommendation_bp.route('/<letter_id>/export', methods=['GET'])
@login_required
def export_recommendation(letter_id):
    letter = RecommendationLetter.query.filter_by(id=letter_id, user_id=g.user.id).first()
    if not letter:
        return jsonify({'error': 'Recommendation letter not found'}), 404
    return jsonify({'content': letter.content, 'id': str(letter.id)})
