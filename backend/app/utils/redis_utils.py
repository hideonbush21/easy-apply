"""Shared Redis utilities."""
import os


def get_redis_url() -> str:
    """
    Return a TLS-safe Redis URL.
    Upstash (and other managed providers) require rediss:// (TLS).
    If REDIS_URL uses redis:// but points to a non-localhost host, upgrade to rediss://.
    """
    url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    if url.startswith('redis://') and 'localhost' not in url and '127.0.0.1' not in url:
        url = 'rediss://' + url[len('redis://'):]
    return url
