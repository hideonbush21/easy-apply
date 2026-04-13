"""
Programs 向量缓存预热脚本。

在 gunicorn 启动之前同步执行，确保所有 program 向量已写入 Redis。
只对 Redis 中尚未缓存的 program 调用 OpenAI API，已缓存的直接跳过。

用法（见 Dockerfile）：
    python warmup.py && gunicorn run:app ...
"""

import logging
import sys

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')
logger = logging.getLogger(__name__)


def run():
    from app import create_app
    from app.services.embedding_service import (
        _build_program_text, _get_program_redis_key, _MATRIX_TTL, encode,
    )
    from app.models.program import Program
    from app.services.redis_client import get_redis_binary

    app = create_app()
    with app.app_context():
        try:
            r = get_redis_binary()
            programs = Program.query.all()
            logger.info(f'[warmup] 共 {len(programs)} 条 programs')

            to_encode_ids, to_encode_texts = [], []
            for p in programs:
                text = _build_program_text(p)
                if not text.strip():
                    continue
                if not r.exists(_get_program_redis_key(p.id)):
                    to_encode_ids.append(p.id)
                    to_encode_texts.append(text)

            if not to_encode_ids:
                logger.info('[warmup] 向量缓存已全部就绪，跳过')
                return

            logger.info(f'[warmup] 开始编码 {len(to_encode_ids)} 条未缓存 programs...')
            batch_size = 100
            for i in range(0, len(to_encode_ids), batch_size):
                batch_ids = to_encode_ids[i:i + batch_size]
                batch_texts = to_encode_texts[i:i + batch_size]
                vectors = encode(batch_texts)
                for j, pid in enumerate(batch_ids):
                    r.setex(_get_program_redis_key(pid), _MATRIX_TTL, vectors[j].tobytes())
                logger.info(f'[warmup] {min(i + batch_size, len(to_encode_ids))}/{len(to_encode_ids)} 完成')

            logger.info('[warmup] 预热完成，启动 gunicorn')

        except Exception as e:
            logger.error(f'[warmup] 预热失败: {e}')
            sys.exit(1)


if __name__ == '__main__':
    run()
