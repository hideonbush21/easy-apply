"""
Webhook 接口：供外部系统（Supabase Database Webhook）调用，触发缓存失效。

认证方式：X-Webhook-Secret Header，值与环境变量 WEBHOOK_SECRET 比对。
使用 hmac.compare_digest 防止时序攻击。
"""
import os
import hmac
import logging

from flask import Blueprint, request, jsonify

webhook_bp = Blueprint('webhook', __name__, url_prefix='/api/webhooks')
webhook_bp.strict_slashes = False

logger = logging.getLogger(__name__)


def _verify_secret(provided: str) -> bool:
    secret = os.environ.get('WEBHOOK_SECRET', '')
    if not secret:
        logger.error('WEBHOOK_SECRET 未配置，拒绝所有 webhook 请求')
        return False
    return hmac.compare_digest(secret, provided)


@webhook_bp.route('/invalidate-schools', methods=['POST'])
def invalidate_schools_cache():
    """
    Supabase Database Webhook 调用此接口，使学校/专业缓存失效。

    配置方式（Supabase 控制台）：
      Database → Webhooks → New Webhook
      表：schools、programs
      事件：INSERT / UPDATE / DELETE
      URL：https://<your-app>/api/webhooks/invalidate-schools
      Header：X-Webhook-Secret: <WEBHOOK_SECRET 的值>
    """
    provided = request.headers.get('X-Webhook-Secret', '')
    if not _verify_secret(provided):
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        from app.services.redis_client import get_redis, bump_schools_version
        r = get_redis()
        new_ver = bump_schools_version(r)
        logger.info(f'Webhook 触发学校缓存失效，新版本号：{new_ver}')
        return jsonify({'ok': True, 'version': new_ver})
    except Exception as e:
        logger.error(f'Webhook 缓存失效失败：{e}')
        return jsonify({'error': str(e)}), 500
