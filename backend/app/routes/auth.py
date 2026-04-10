import uuid
import re
import random
import string
from datetime import datetime, timedelta
import bcrypt
import jwt
from flask import Blueprint, request, jsonify, current_app
from app.extensions import db
from app.models.user import User, UserProfile, UserLoginLog
from app.services.redis_client import get_redis
from app.services.email_service import send_otp_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

_SHA256_RE = re.compile(r'^[0-9a-f]{64}$')
_V2_PREFIX = 'v2:'


def _hash_v2(sha256_hex: str) -> str:
    """bcrypt(sha256) — new scheme, stored with 'v2:' prefix."""
    return _V2_PREFIX + bcrypt.hashpw(sha256_hex.encode(), bcrypt.gensalt()).decode()


def _check_v2(sha256_hex: str, stored: str) -> bool:
    return bcrypt.checkpw(sha256_hex.encode(), stored[len(_V2_PREFIX):].encode())


def _is_v2(stored: str) -> bool:
    return stored.startswith(_V2_PREFIX)


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
    if not _SHA256_RE.match(password):
        return jsonify({'error': 'invalid password format'}), 400

    if User.query.filter_by(nickname=nickname).first():
        return jsonify({'error': 'nickname already taken'}), 409

    user = User(nickname=nickname, password_hash=_hash_v2(password))
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
    if not _SHA256_RE.match(password):
        return jsonify({'error': 'invalid password format'}), 400

    user = User.query.filter_by(nickname=nickname).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Legacy v1 account (bcrypt(plaintext)) — ask frontend to retry with plaintext
    if not _is_v2(user.password_hash):
        return jsonify({'error': 'legacy account', 'code': 'LEGACY_ACCOUNT'}), 401

    if not _check_v2(password, user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    return _issue_tokens_and_log(user)


@auth_bp.route('/legacy-login', methods=['POST'])
def legacy_login():
    """Accepts plaintext password for v1 accounts, migrates to v2 on success."""
    data = request.get_json(silent=True) or {}
    nickname = (data.get('nickname') or '').strip()
    plaintext = data.get('password', '')

    if not nickname or not plaintext:
        return jsonify({'error': 'nickname and password are required'}), 400

    user = User.query.filter_by(nickname=nickname).first()
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Only allow this endpoint for v1 accounts
    if _is_v2(user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    if not bcrypt.checkpw(plaintext.encode(), user.password_hash.encode()):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Migrate: re-hash as v2 using sha256 of the plaintext
    import hashlib
    sha256_hex = hashlib.sha256(plaintext.encode()).hexdigest()
    user.password_hash = _hash_v2(sha256_hex)
    db.session.commit()

    return _issue_tokens_and_log(user)


def _issue_tokens_and_log(user: User):
    secret = current_app.config['JWT_SECRET_KEY']
    tokens = _generate_tokens(str(user.id), secret)
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()
    db.session.add(UserLoginLog(user_id=user.id, ip_address=ip or None))
    db.session.commit()
    return jsonify({'user': user.to_dict(), **tokens})


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


_EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
_OTP_TTL = 300        # 5 分钟
_OTP_COOLDOWN = 60    # 发送冷却 60 秒
_OTP_MAX_ATTEMPTS = 3


def _otp_key(email: str) -> str:
    return f'otp:{email}'


def _attempts_key(email: str) -> str:
    return f'otp_attempts:{email}'


def _cooldown_key(email: str) -> str:
    return f'otp_cooldown:{email}'


@auth_bp.route('/send-code', methods=['POST'])
def send_code():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()

    if not email or not _EMAIL_RE.match(email):
        return jsonify({'error': '请输入有效的邮箱地址'}), 400

    r = get_redis()

    if r.exists(_cooldown_key(email)):
        ttl = r.ttl(_cooldown_key(email))
        return jsonify({'error': f'发送太频繁，请 {ttl} 秒后再试'}), 429

    code = ''.join(random.choices(string.digits, k=6))
    r.setex(_otp_key(email), _OTP_TTL, code)
    r.delete(_attempts_key(email))
    r.setex(_cooldown_key(email), _OTP_COOLDOWN, '1')

    try:
        send_otp_email(email, code)
    except Exception as exc:
        current_app.logger.error('send_otp_email failed for %s: %s', email, exc)
        return jsonify({'error': '邮件发送失败，请稍后重试'}), 500

    return jsonify({'message': '验证码已发送，请查收邮件'})


@auth_bp.route('/email-login', methods=['POST'])
def email_login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    code = (data.get('code') or '').strip()

    if not email or not _EMAIL_RE.match(email):
        return jsonify({'error': '请输入有效的邮箱地址'}), 400
    if not code or len(code) != 6 or not code.isdigit():
        return jsonify({'error': '请输入6位数字验证码'}), 400

    r = get_redis()

    stored_code = r.get(_otp_key(email))
    if not stored_code:
        return jsonify({'error': '验证码已过期，请重新发送'}), 400

    attempts = int(r.get(_attempts_key(email)) or 0)
    if attempts >= _OTP_MAX_ATTEMPTS:
        r.delete(_otp_key(email))
        r.delete(_attempts_key(email))
        return jsonify({'error': '验证码已失效，请重新发送'}), 400

    if code != stored_code:
        r.incr(_attempts_key(email))
        r.expire(_attempts_key(email), _OTP_TTL)
        remaining = _OTP_MAX_ATTEMPTS - attempts - 1
        return jsonify({'error': f'验证码错误，还可尝试 {remaining} 次'}), 400

    # 验证通过，删除 Redis key
    r.delete(_otp_key(email))
    r.delete(_attempts_key(email))

    # 查找或创建账号
    user = User.query.filter_by(email=email).first()
    is_new = False
    if not user:
        # 自动注册：邮箱前缀 + 随机4位数
        prefix = email.split('@')[0][:20]
        suffix = ''.join(random.choices(string.digits, k=4))
        nickname = f'{prefix}_{suffix}'
        # 防止昵称冲突（极小概率）
        while User.query.filter_by(nickname=nickname).first():
            suffix = ''.join(random.choices(string.digits, k=4))
            nickname = f'{prefix}_{suffix}'

        user = User(
            nickname=nickname,
            email=email,
            password_hash='',   # 纯邮箱账号无密码
        )
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.id))
        db.session.commit()
        is_new = True
    elif not user.email:
        # 已有账号但未绑定邮箱（通过昵称密码注册的老用户）
        user.email = email
        db.session.commit()

    secret = current_app.config['JWT_SECRET_KEY']
    tokens = _generate_tokens(str(user.id), secret)
    ip = request.headers.get('X-Forwarded-For', request.remote_addr or '').split(',')[0].strip()
    db.session.add(UserLoginLog(user_id=user.id, ip_address=ip or None))
    db.session.commit()

    return jsonify({
        'user': user.to_dict(),
        'is_new': is_new,
        **tokens,
    }), 201 if is_new else 200

