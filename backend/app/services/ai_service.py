import requests
import os


def generate_recommendation(user_profile: dict, experiences: list, school_name: str, major: str) -> str:
    """Call Kimi API to generate a recommendation letter."""
    experience_text = []
    for exp in experiences:
        parts = [f"[{exp.get('type', '')}] {exp.get('title', '')}"]
        if exp.get('organization'):
            parts.append(f"单位：{exp['organization']}")
        if exp.get('role'):
            parts.append(f"职位：{exp['role']}")
        if exp.get('description'):
            parts.append(f"描述：{exp['description']}")
        if exp.get('achievements'):
            parts.append(f"成就：{', '.join(exp['achievements'])}")
        experience_text.append(' | '.join(parts))

    experiences_str = '\n'.join(experience_text) if experience_text else '暂无经历信息'

    prompt = f"""你是一位资深留学申请顾问，请根据以下学生背景信息，为申请 {school_name} 的 {major} 专业撰写一封个性化推荐信。

学生背景：
- 姓名：{user_profile.get('name', '申请人')}
- 本科学校：{user_profile.get('home_institution', '')} ({user_profile.get('institution_tier', '')})
- 专业：{user_profile.get('current_major', '')}
- GPA：{user_profile.get('gpa', '')}/{user_profile.get('gpa_scale', 4.0)}
- 语言成绩：{user_profile.get('language_scores', {})}
- 主要经历：
{experiences_str}

推荐信要求：
1. 采用正式学术推荐信格式
2. 突出学生的学术能力和专业潜力
3. 结合具体经历事例
4. 说明为什么适合该学校和专业
5. 字数控制在 500-800 字"""

    api_key = os.getenv('KIMI_API_KEY', '')
    if not api_key:
        raise ValueError('KIMI_API_KEY is not configured')

    response = requests.post(
        'https://api.moonshot.cn/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'moonshot-v1-8k',
            'messages': [{'role': 'user', 'content': prompt}],
        },
        timeout=60,
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']
