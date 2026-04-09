import logging
from concurrent.futures import ThreadPoolExecutor

from flask import Blueprint, request, jsonify, g, current_app

from app.extensions import db
from app.models.school import School
from app.models.user import UserProfile
from app.services.school_recommendation import get_recommendations, build_recommendation_hash
from app.utils.decorators import login_required

school_bp = Blueprint('school', __name__, url_prefix='/api/schools')
school_bp.strict_slashes = False

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=2)


def _background_recommend(app, user_id: str):
    """后台线程：执行选校推荐并写入 DB"""
    with app.app_context():
        try:
            profile = UserProfile.query.filter_by(user_id=user_id).first()
            if not profile:
                return
            current_hash = build_recommendation_hash(profile)
            result = get_recommendations(profile)
            profile.recommendation_cache = result
            profile.recommendation_hash = current_hash
            profile.recommendation_status = 'done'
            db.session.commit()
            logger.info('Recommendation done for user %s', user_id)
        except Exception as exc:
            logger.error('Recommendation failed for user %s: %s', user_id, exc)
            try:
                profile = UserProfile.query.filter_by(user_id=user_id).first()
                if profile:
                    profile.recommendation_status = 'failed'
                    db.session.commit()
            except Exception:
                pass


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


@school_bp.route('/trigger-recommendation', methods=['POST'])
@login_required
def trigger_recommendation():
    """触发后台选校推荐任务，立即返回，不阻塞请求"""
    profile = g.user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    if profile.recommendation_status == 'pending':
        return jsonify({'status': 'pending', 'message': '推荐正在生成中，请稍候'})

    profile.recommendation_status = 'pending'
    db.session.commit()

    app = current_app._get_current_object()
    _executor.submit(_background_recommend, app, str(g.user.id))

    return jsonify({'status': 'pending', 'message': '推荐已开始生成，可继续使用其他功能'})


@school_bp.route('/recommendation-status', methods=['GET'])
@login_required
def get_recommendation_status():
    """查询选校推荐任务状态（前端轮询用）"""
    profile = g.user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    status = profile.recommendation_status  # None | 'pending' | 'done' | 'failed'

    if status is None:
        return jsonify({'status': 'none'})

    if status == 'done':
        current_hash = build_recommendation_hash(profile)
        if profile.recommendation_hash != current_hash:
            return jsonify({'status': 'stale'})

    return jsonify({'status': status})


@school_bp.route('/recommendations', methods=['GET'])
@login_required
def get_recommendations_route():
    """返回已缓存的选校推荐结果（需先通过 trigger-recommendation 生成）"""
    profile = g.user.profile
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404

    if not profile.recommendation_cache:
        return jsonify({'error': '尚未生成推荐，请先点击生成'}), 404

    return jsonify(profile.recommendation_cache)


@school_bp.route('/<school_id>', methods=['GET'])
@login_required
def get_school(school_id):
    school = School.query.get(school_id)
    if not school:
        return jsonify({'error': 'School not found'}), 404
    return jsonify(school.to_dict())
