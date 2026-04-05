from flask import Blueprint, request, jsonify, g
from app.models.school import School
from app.models.user import UserProfile
from app.services.school_recommendation import get_recommendations, build_recommendation_hash
from app.utils.decorators import login_required
from app.extensions import db

school_bp = Blueprint('school', __name__, url_prefix='/api/schools')
school_bp.strict_slashes = False


@school_bp.route('/', methods=['GET'])
@login_required
def list_schools():
    country = request.args.get('country')
    major = request.args.get('major')
    ranking_max = request.args.get('ranking_max', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    query = School.query
    if country:
        query = query.filter(School.country == country)
    if ranking_max:
        query = query.filter(School.ranking <= ranking_max)
    if major:
        query = query.filter(School.majors.contains([major]))

    query = query.order_by(School.ranking.asc().nullslast())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'schools': [s.to_dict() for s in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    })


@school_bp.route('/recommendations', methods=['GET'])
@login_required
def get_recommendations_route():
    profile = g.user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    current_hash = build_recommendation_hash(profile)

    if profile.recommendation_hash == current_hash and profile.recommendation_cache:
        return jsonify(profile.recommendation_cache)

    result = get_recommendations(profile)
    profile.recommendation_cache = result
    profile.recommendation_hash = current_hash
    db.session.commit()
    return jsonify(result)


@school_bp.route('/<school_id>', methods=['GET'])
@login_required
def get_school(school_id):
    school = School.query.get(school_id)
    if not school:
        return jsonify({'error': 'School not found'}), 404
    return jsonify(school.to_dict())
