from app.utils.redis_utils import get_redis_url
from celery import Celery

redis_url = get_redis_url()

celery = Celery(
    'easy_apply',
    broker=redis_url,
    include=['app.tasks.sop_task'],
)

celery.conf.update(
    task_serializer='json',
    accept_content=['json'],
    timezone='Asia/Shanghai',
    task_ignore_result=True,
    broker_transport_options={
        'visibility_timeout': 3600,
        'socket_timeout': 10,
        'socket_connect_timeout': 10,
        'retry_on_timeout': True,
    },
    # TLS for rediss:// brokers
    broker_use_ssl={
        'ssl_cert_reqs': None,
    } if redis_url.startswith('rediss://') else None,
)
