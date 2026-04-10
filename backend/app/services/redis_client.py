import os
import redis


def get_redis() -> redis.Redis:
    url = os.environ.get('REDIS_URL')
    if not url:
        raise RuntimeError('REDIS_URL environment variable is not set')
    # 不缓存全局单例，避免 gunicorn pre-fork 后子进程共享 socket
    # redis-py 内部维护 ConnectionPool，每次 from_url 开销极小
    return redis.from_url(url, decode_responses=True)
