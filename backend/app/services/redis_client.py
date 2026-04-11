import os
import urllib.parse
import redis


def _parse_redis_kwargs() -> dict:
    url = os.environ.get('REDIS_URL')
    if not url:
        raise RuntimeError('REDIS_URL environment variable is not set')
    parsed = urllib.parse.urlparse(url)
    return dict(
        host=parsed.hostname,
        port=parsed.port or 6379,
        username=parsed.username,
        password=parsed.password,
        ssl=True,
    )


def get_redis() -> redis.Redis:
    return redis.Redis(**_parse_redis_kwargs(), decode_responses=True)


def get_redis_binary() -> redis.Redis:
    """返回不解码响应的连接，用于存储 numpy 二进制等字节数据。"""
    return redis.Redis(**_parse_redis_kwargs(), decode_responses=False)
