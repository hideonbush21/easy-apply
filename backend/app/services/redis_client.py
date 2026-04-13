import os
import urllib.parse
import redis

_SCHOOLS_VER_KEY = "schools:ver"
_SCHOOLS_TTL = 86400  # 24h


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


def get_schools_version(r: redis.Redis) -> str:
    """获取当前学校缓存版本号，不存在时返回 '0'。"""
    v = r.get(_SCHOOLS_VER_KEY)
    return v if v else "0"


def bump_schools_version(r: redis.Redis) -> int:
    """学校/专业数据变更后调用，递增版本号使所有旧缓存失效。返回新版本号。"""
    return r.incr(_SCHOOLS_VER_KEY)

