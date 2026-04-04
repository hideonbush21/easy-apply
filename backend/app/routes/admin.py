import bcrypt
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.application import Application
from app.utils.decorators import admin_required

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
admin_bp.strict_slashes = False


@admin_bp.route('/login', methods=['POST'])
def admin_login():
    import jwt
    from flask import current_app
    data = request.get_json(silent=True) or {}
    nickname = (data.get('nickname') or '').strip()
    password = data.get('password', '')

    if not nickname or not password:
        return jsonify({'error': 'nickname and password are required'}), 400

    user = User.query.filter_by(nickname=nickname, is_admin=True).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({'error': 'Invalid credentials'}), 401

    now = datetime.utcnow()
    from datetime import timedelta
    secret = current_app.config['JWT_SECRET_KEY']
    access_token = jwt.encode(
        {'user_id': str(user.id), 'exp': now + timedelta(hours=2), 'type': 'access'},
        secret, algorithm='HS256'
    )
    refresh_token = jwt.encode(
        {'user_id': str(user.id), 'exp': now + timedelta(days=7), 'type': 'refresh'},
        secret, algorithm='HS256'
    )
    return jsonify({'user': user.to_dict(), 'access_token': access_token, 'refresh_token': refresh_token})


@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    search = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)

    query = User.query
    if search:
        query = query.filter(User.nickname.ilike(f'%{search}%'))
    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'items': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages,
    })


@admin_bp.route('/users/<user_id>', methods=['GET'])
@admin_required
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = user.to_dict()
    data['profile'] = user.profile.to_dict() if user.profile else None
    data['applications'] = [a.to_dict(include_school=True) for a in user.applications]
    return jsonify(data)


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json(silent=True) or {}
    if 'nickname' in data:
        nickname = data['nickname'].strip()
        existing = User.query.filter_by(nickname=nickname).first()
        if existing and str(existing.id) != user_id:
            return jsonify({'error': 'nickname already taken'}), 409
        user.nickname = nickname
    if 'is_admin' in data:
        user.is_admin = bool(data['is_admin'])
    user.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(user.to_dict())


@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    if str(g.user.id) == user_id:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'deleted'})


@admin_bp.route('/users/<user_id>/reset-password', methods=['POST'])
@admin_required
def reset_password(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    data = request.get_json(silent=True) or {}
    new_password = data.get('new_password', '')
    if len(new_password) < 6:
        return jsonify({'error': 'password must be at least 6 characters'}), 400
    user.password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    user.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'message': 'password reset successfully'})


@admin_bp.route('/stats', methods=['GET'])
@admin_required
def get_stats():
    total_users = User.query.filter_by(is_admin=False).count()
    total_applications = Application.query.count()
    status_counts = db.session.query(
        Application.status, db.func.count(Application.id)
    ).group_by(Application.status).all()
    status_distribution = {status: count for status, count in status_counts}

    from app.models.school import School
    total_schools = School.query.count()

    return jsonify({
        'total_users': total_users,
        'total_applications': total_applications,
        'total_schools': total_schools,
        'application_status_distribution': status_distribution,
    })
