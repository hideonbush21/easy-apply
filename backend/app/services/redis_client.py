import os
import redis

_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        url = os.environ.get('REDIS_URL')
        if not url:
            raise RuntimeError('REDIS_URL environment variable is not set')
        _client = redis.from_url(url, decode_responses=True)
    return _client
