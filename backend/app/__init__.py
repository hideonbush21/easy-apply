from flask import Flask
import os
import time
import threading
import logging
from app.config import Config
from app.extensions import db, cors

logger = logging.getLogger(__name__)


def _warmup_embeddings(app):
    """gunicorn 启动后在后台线程异步预热 programs 向量缓存，不阻塞健康检查。"""
    with app.app_context():
        try:
            from app.services.embedding_service import warmup_program_vectors
            warmup_program_vectors(batch_sleep=1.0)
        except Exception as e:
            logger.warning(f'[warmup] 预热异常（不影响服务）: {e}')


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    db.init_app(app)

    raw_origins = os.getenv('ALLOWED_ORIGINS', '*')
    if raw_origins == '*':
        origins = '*'
    else:
        origins = [o.strip() for o in raw_origins.split(',') if o.strip()]
    cors.init_app(app, resources={r"/api/*": {"origins": origins}})

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

    threading.Thread(target=_warmup_embeddings, args=(app,), daemon=True).start()

    return app
