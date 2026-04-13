from flask import Flask
import os
import threading
import logging
from app.config import Config
from app.extensions import db, cors

logger = logging.getLogger(__name__)


def _warmup_embeddings(app):
    """
    gunicorn 启动后在后台线程异步预热所有 programs 向量缓存。
    用 pipeline 批量检查 Redis（1次 RTT），只编码未缓存的 programs。
    批次间 sleep(1) 避免与推荐请求竞争 OpenAI 额度。
    """
    with app.app_context():
        try:
            from app.services.embedding_service import (
                _build_program_text, _get_program_redis_key, _ttl_with_jitter, encode,
            )
            from app.models.program import Program
            from app.services.redis_client import get_redis_binary
            import time

            r = get_redis_binary()
            programs = Program.query.all()
            logger.info(f'[warmup] 共 {len(programs)} 条 programs')

            # pipeline 批量检查，1次网络 RTT 替代 N 次 exists 调用
            keys = [_get_program_redis_key(p.id) for p in programs]
            pipe = r.pipeline(transaction=False)
            for k in keys:
                pipe.exists(k)
            exists_flags = pipe.execute()

            to_encode_ids, to_encode_texts = [], []
            for p, exists in zip(programs, exists_flags):
                if exists:
                    continue
                text = _build_program_text(p)
                if not text.strip():
                    continue
                to_encode_ids.append(p.id)
                to_encode_texts.append(text)

            if not to_encode_ids:
                logger.info('[warmup] 向量缓存已全部就绪，跳过')
                return

            logger.info(f'[warmup] 开始编码 {len(to_encode_ids)} 条未缓存 programs...')
            batch_size = 500
            for i in range(0, len(to_encode_ids), batch_size):
                batch_ids = to_encode_ids[i:i + batch_size]
                batch_texts = to_encode_texts[i:i + batch_size]
                vectors = encode(batch_texts)
                pipe = r.pipeline(transaction=False)
                for j, pid in enumerate(batch_ids):
                    pipe.setex(_get_program_redis_key(pid), _ttl_with_jitter(), vectors[j].tobytes())
                pipe.execute()
                logger.info(f'[warmup] {min(i + batch_size, len(to_encode_ids))}/{len(to_encode_ids)} 完成')
                time.sleep(1)  # 避免与推荐请求竞争 OpenAI 额度

            logger.info('[warmup] 预热完成')

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

    # gunicorn 启动后异步预热，不阻塞健康检查
    threading.Thread(target=_warmup_embeddings, args=(app,), daemon=True).start()

    return app
