import json
import logging
import uuid

import redis as redis_lib

from app.celery_app import celery
from app.utils.redis_utils import get_redis_url

logger = logging.getLogger(__name__)

RESULT_TTL = 3600  # 1h


def _redis():
    return redis_lib.from_url(get_redis_url(), ssl_cert_reqs=None)


def _publish_and_cache(task_id: str, event: dict):
    """Publish SSE event AND cache the final result so SSE can replay it on late connections."""
    payload = json.dumps(event, ensure_ascii=False, default=str)
    try:
        r = _redis()
        r.publish(f'sop:progress:{task_id}', payload)
        if event.get('stage') in ('complete', 'error'):
            r.setex(f'sop:result:{task_id}', RESULT_TTL, payload)
        r.close()
    except Exception as e:
        logger.warning(f'[sop_task] Redis publish failed: {e}')


@celery.task(bind=True)
def generate_sop_task(self, state_input: dict, application_id: str, user_id: str):
    """Celery task: run SoP agent, write result to DB, publish completion via Redis pub/sub."""
    task_id = self.request.id

    from app import create_app
    app = create_app()

    with app.app_context():
        try:
            from app.services.sop_agent import run_sop_agent
            result = run_sop_agent(**state_input, task_id=task_id)

            from app.extensions import db
            from app.models.sop import SopLetter

            letter = SopLetter(
                user_id=uuid.UUID(user_id),
                application_id=uuid.UUID(application_id),
                content=result['final_sop'],
            )
            db.session.add(letter)
            db.session.commit()

            _publish_and_cache(task_id, {
                'stage': 'complete',
                'message': '文书生成完成',
                'letter': letter.to_dict(),
                'score': result.get('score'),
                'iterations': result.get('iterations'),
                'critique_history': result.get('critique_history'),
            })

        except Exception as e:
            logger.error(f'[sop_task] failed: {e}', exc_info=True)
            _publish_and_cache(task_id, {'stage': 'error', 'message': str(e)})
            raise
