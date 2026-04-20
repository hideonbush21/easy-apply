import logging

from app.services.sop_agent.graph import sop_graph

logger = logging.getLogger(__name__)


def run_sop_agent(
    *,
    user_profile: dict,
    experiences: list,
    school_name: str,
    program_name: str,
    school_description: str = '',
    degree_type: str = '',
    task_id: str | None = None,
) -> dict:
    """Run the SoP writing agent and return the result dict."""
    initial_state = {
        'user_profile': user_profile,
        'experiences': experiences,
        'school_name': school_name,
        'program_name': program_name,
        'school_description': school_description,
        'degree_type': degree_type,
        'task_id': task_id,
        'current_draft': '',
        'critique': {},
        'iteration': 0,
        'critique_history': [],
        'best_draft': None,
        'best_score': None,
        'final_sop': None,
        'score': None,
        'error': None,
    }

    try:
        result = sop_graph.invoke(initial_state)
        return {
            'final_sop': result['final_sop'],
            'score': result.get('score'),
            'iterations': result.get('iteration', 0),
            'critique_history': result.get('critique_history', []),
        }
    except Exception as e:
        logger.error(f'[sop_agent] pipeline error: {e}', exc_info=True)
        # Degrade: return whatever draft we have
        if initial_state.get('current_draft'):
            return {
                'final_sop': initial_state['current_draft'],
                'score': None,
                'iterations': initial_state.get('iteration', 0),
                'critique_history': initial_state.get('critique_history', []),
                'degraded': True,
                'error': str(e),
            }
        raise
