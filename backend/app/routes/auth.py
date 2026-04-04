import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.user import User, UserProfile

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def _generate_tokens(user_id: str, secret: str) -> dict:
    now = datetime.utcnow()
    access_payload = {
        'user_id': user_id,
        'exp': now + timedelta(hours=2),
        'type': 'access',
    }
    refresh_payload = {
        'user_id': user_id,
        'exp': now + timedelta(days=7),
        'type': 'refresh',
    }
    access_token = jwt.encode(access_payload, secret, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, secret, algorithm='HS256')
    return {'access_token': access_token, 'refresh_token': refresh_token}


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    nickname = (data.get('nickname') or '').strip()
    password = data.get('password', '')

    if not nickname or not password:
        return jsonify({'error': 'nickname and password are required'}), 400
    if len(nickname) > 50:
        return jsonify({'error': 'nickname too long'}), 400
    if len(password) < 6:
        return jsonify({'error': 'password must be at least 6 characters'}), 400

    if User.query.filter_by(nickname=nickname).first():
        return jsonify({'error': 'nickname already taken'}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user = User(nickname=nickname, password_hash=password_hash)
    db.session.add(user)
    db.session.flush()

    profile = UserProfile(user_id=user.id)
    db.session.add(profile)
    db.session.commit()

    secret = current_app.config['JWT_SECRET_KEY']
    tokens = _generate_tokens(str(user.id), secret)
    return jsonify({
        'user': user.to_dict(),
        **tokens,
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    nickname = (data.get('nickname') or '').strip()
    password = data.get('password', '')

    if not nickname or not password:
        return jsonify({'error': 'nickname and password are required'}), 400

    user = User.query.filter_by(nickname=nickname).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({'error': 'Invalid credentials'}), 401

    secret = current_app.config['JWT_SECRET_KEY']
    tokens = _generate_tokens(str(user.id), secret)
    return jsonify({
        'user': user.to_dict(),
        **tokens,
    })


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data = request.get_json(silent=True) or {}
    refresh_token = data.get('refresh_token', '')
    if not refresh_token:
        return jsonify({'error': 'refresh_token is required'}), 400

    secret = current_app.config['JWT_SECRET_KEY']
    try:
        payload = jwt.decode(refresh_token, secret, algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid token type'}), 401
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Refresh token expired'}), 401
    except Exception:
        return jsonify({'error': 'Invalid token'}), 401

    user = User.query.get(payload['user_id'])
    if not user:
        return jsonify({'error': 'User not found'}), 401

    tokens = _generate_tokens(str(user.id), secret)
    return jsonify({'access_token': tokens['access_token']})
