from flask import Flask
import os
import threading
import logging
from app.config import Config
from app.extensions import db, cors

logger = logging.getLogger(__name__)


def _warmup_embeddings(app):
    """
    启动时异步预热所有 programs 的向量缓存。
    只编码 Redis 中尚未存在的 program，已缓存的直接跳过。
    后台执行，不阻塞 gunicorn 启动和正常请求。
    """
    with app.app_context():
        try:
            from app.services.embedding_service import (
                _build_program_text, _get_program_redis_key, _MATRIX_TTL, encode,
            )
            from app.models.program import Program
            from app.services.redis_client import get_redis_binary

            r = get_redis_binary()
            programs = Program.query.all()

            to_encode_ids, to_encode_texts = [], []
            for p in programs:
                text = _build_program_text(p)
                if not text.strip():
                    continue
                if not r.exists(_get_program_redis_key(p.id)):
                    to_encode_ids.append(p.id)
                    to_encode_texts.append(text)

            if not to_encode_ids:
                logger.info('[warmup] Programs 向量缓存已全部就绪，跳过预热')
                return

            logger.info(f'[warmup] 开始预热 {len(to_encode_ids)} 条 programs 向量...')
            batch_size = 100
            for i in range(0, len(to_encode_ids), batch_size):
                batch_ids = to_encode_ids[i:i + batch_size]
                batch_texts = to_encode_texts[i:i + batch_size]
                vectors = encode(batch_texts)
                for j, pid in enumerate(batch_ids):
                    r.setex(_get_program_redis_key(pid), _MATRIX_TTL, vectors[j].tobytes())
                logger.info(f'[warmup] 已完成 {min(i + batch_size, len(to_encode_ids))}/{len(to_encode_ids)}')

            logger.info('[warmup] Programs 向量缓存预热完成')
        except Exception as e:
            logger.warning(f'[warmup] Programs 向量缓存预热失败（不影响服务正常运行）: {e}')


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    # Initialize extensions
    db.init_app(app)

    # ALLOWED_ORIGINS 支持逗号分隔多个域名，或 * 通配
    raw_origins = os.getenv('ALLOWED_ORIGINS', '*')
    if raw_origins == '*':
        origins = '*'
    else:
        origins = [o.strip() for o in raw_origins.split(',') if o.strip()]
    cors.init_app(app, resources={r"/api/*": {"origins": origins}})

    # Register routes
    from app.routes import register_routes
    register_routes(app)

    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            print(f'[Warning] db.create_all() skipped: {e}')

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    # 异步预热 programs 向量缓存
    threading.Thread(target=_warmup_embeddings, args=(app,), daemon=True).start()

    return app
