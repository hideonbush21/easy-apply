import os
import redis


def get_redis() -> redis.Redis:
    url = os.environ.get('REDIS_URL')
    if not url:
        raise RuntimeError('REDIS_URL environment variable is not set')
    # 不缓存全局单例，避免 gunicorn pre-fork 后子进程共享 socket
    # ssl_cert_reqs=None：Upstash rediss:// 需要跳过证书链校验
    return redis.from_url(url, decode_responses=True, ssl_cert_reqs=None)
