import os
import urllib.parse
import redis


def get_redis() -> redis.Redis:
    url = os.environ.get('REDIS_URL')
    if not url:
        raise RuntimeError('REDIS_URL environment variable is not set')
    # from_url 不支持 ssl= 参数，改为手动解析 URL 并显式传 ssl=True
    parsed = urllib.parse.urlparse(url)
    return redis.Redis(
        host=parsed.hostname,
        port=parsed.port or 6379,
        username=parsed.username,
        password=parsed.password,
        ssl=True,
        decode_responses=True,
    )
