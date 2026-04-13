"""
Programs 向量缓存预热脚本（独立入口，当前未被 startCommand 使用）。

保留此文件供手动触发或未来 CI 预热场景使用。
当前架构：warmup 在 gunicorn 启动后由后台线程自动执行（见 app/__init__.py）。
"""

import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(message)s')
logger = logging.getLogger(__name__)


def run():
    import os
    missing = [k for k in ('OPENAI_API_KEY', 'REDIS_URL') if not os.environ.get(k)]
    if missing:
        logger.warning(f'[warmup] 缺少环境变量 {missing}，跳过')
        return

    try:
        from app import create_app
        from app.services.embedding_service import warmup_program_vectors

        app = create_app()
        with app.app_context():
            warmup_program_vectors(batch_sleep=0.0)
    except Exception as e:
        logger.warning(f'[warmup] 预热过程异常: {e}')


if __name__ == '__main__':
    run()
