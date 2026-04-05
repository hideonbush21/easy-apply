import re
import requests
import os


_CJK_PATTERN = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]')


def _has_cjk(text: str) -> bool:
    return bool(_CJK_PATTERN.search(text))


def generate_recommendation(user_profile: dict, experiences: list, school_name: str, major: str) -> str:
    """Call Kimi API to generate an English recommendation letter."""
    experience_text = []
    for exp in experiences:
        parts = [f"[{exp.get('type', '')}] {exp.get('title', '')}"]
        if exp.get('organization'):
            parts.append(f"Organization: {exp['organization']}")
        if exp.get('role'):
            parts.append(f"Role: {exp['role']}")
        if exp.get('description'):
            parts.append(f"Description: {exp['description']}")
        if exp.get('achievements'):
            parts.append(f"Achievements: {', '.join(exp['achievements'])}")
        experience_text.append(' | '.join(parts))

    experiences_str = '\n'.join(experience_text) if experience_text else 'No experience provided'

    prompt = f"""You are a senior study abroad application consultant. Based on the student's background below, write a personalized recommendation letter for their application to {major} at {school_name}.

IMPORTANT: The entire letter MUST be written in English only. Do not include any Chinese or other non-English characters.

Student Background:
- Name: {user_profile.get('name', 'Applicant')}
- Undergraduate Institution: {user_profile.get('home_institution', '')} ({user_profile.get('institution_tier', '')})
- Major: {user_profile.get('current_major', '')}
- GPA: {user_profile.get('gpa', '')}/{user_profile.get('gpa_scale', 4.0)}
- Language Scores: {user_profile.get('language_scores', {})}
- Key Experiences:
{experiences_str}

Requirements:
1. Use formal academic recommendation letter format
2. Highlight the student's academic abilities and professional potential
3. Reference specific experiences and achievements
4. Explain why the student is a strong fit for this program and institution
5. Length: 500-800 words
6. Write entirely in English — no Chinese characters permitted"""

    api_key = os.getenv('KIMI_API_KEY', '')
    if not api_key:
        raise ValueError('KIMI_API_KEY is not configured')

    def _call_api(messages):
        response = requests.post(
            'https://api.moonshot.cn/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'moonshot-v1-8k',
                'messages': messages,
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

    messages = [{'role': 'user', 'content': prompt}]
    result = _call_api(messages)

    if _has_cjk(result):
        messages.append({'role': 'assistant', 'content': result})
        messages.append({
            'role': 'user',
            'content': (
                'Your previous response contained non-English characters. '
                'Please rewrite the entire recommendation letter in English only. '
                'Do not include any Chinese or other non-Latin characters.'
            ),
        })
        result = _call_api(messages)

    return result


def generate_sop(user_profile: dict, experiences: list, school_name: str, major: str,
                 school_description: str = '', degree_type: str = '') -> str:
    """Call Kimi API to generate an English Statement of Purpose (application letter)."""
    experience_text = []
    for exp in experiences:
        parts = [f"[{exp.get('type', '')}] {exp.get('title', '')}"]
        if exp.get('organization'):
            parts.append(f"Organization: {exp['organization']}")
        if exp.get('role'):
            parts.append(f"Role: {exp['role']}")
        if exp.get('description'):
            parts.append(f"Description: {exp['description']}")
        if exp.get('achievements'):
            parts.append(f"Achievements: {', '.join(exp['achievements'])}")
        experience_text.append(' | '.join(parts))

    experiences_str = '\n'.join(experience_text) if experience_text else 'No experience provided'

    school_info = ''
    if school_description:
        school_info = f'\nAbout the School/Program: {school_description}'

    prompt = f"""You are an experienced study abroad application consultant specializing in writing compelling Statements of Purpose (SoP).

Write a personalized Statement of Purpose for a student applying to the {degree_type or 'graduate'} program in {major} at {school_name}.{school_info}

IMPORTANT: The entire SoP MUST be written in English only. Do not include any Chinese or other non-English characters.

Student Background:
- Name: {user_profile.get('name', 'Applicant')}
- Undergraduate Institution: {user_profile.get('home_institution', '')} ({user_profile.get('institution_tier', '')})
- Major: {user_profile.get('current_major', '')}
- GPA: {user_profile.get('gpa', '')}/{user_profile.get('gpa_scale', 4.0)}
- Language Scores: {user_profile.get('language_scores', {})}
- Target Countries: {', '.join(user_profile.get('target_countries') or [])}
- Key Experiences:
{experiences_str}

SoP Requirements:
1. Open with a compelling hook that reflects the student's motivation
2. Describe academic background and relevant coursework
3. Highlight key experiences (research, internships, projects) and their impact
4. Explain why this specific program and institution is the right fit
5. Articulate clear career goals and how this degree advances them
6. Use a confident, authentic first-person voice — avoid clichés
7. Length: 600–900 words
8. Write entirely in English — no Chinese characters permitted"""

    api_key = os.getenv('KIMI_API_KEY', '')
    if not api_key:
        raise ValueError('KIMI_API_KEY is not configured')

    def _call_api(messages):
        response = requests.post(
            'https://api.moonshot.cn/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            },
            json={
                'model': 'moonshot-v1-8k',
                'messages': messages,
            },
            timeout=60,
        )
        response.raise_for_status()
        return response.json()['choices'][0]['message']['content']

    messages = [{'role': 'user', 'content': prompt}]
    result = _call_api(messages)

    if _has_cjk(result):
        messages.append({'role': 'assistant', 'content': result})
        messages.append({
            'role': 'user',
            'content': (
                'Your previous response contained non-English characters. '
                'Please rewrite the entire Statement of Purpose in English only. '
                'Do not include any Chinese or other non-Latin characters.'
            ),
        })
        result = _call_api(messages)

    return result
