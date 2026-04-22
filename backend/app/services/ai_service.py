import re
import requests
import os


_CJK_PATTERN = re.compile(r'[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef]')


def _has_cjk(text: str) -> bool:
    return bool(_CJK_PATTERN.search(text))


# ── Few-shot examples for SoP generation ──
# Selected for structural quality: compelling hook, specific experiences, clear school-fit argument
_SOP_EXAMPLES = [
    # Example 1: CS applicant with research hook
    """\
The first time I saw a neural network hallucinate — confidently generating a medical diagnosis from a blurry X-ray that even a first-year radiology resident would have flagged — I realized that the gap between impressive demos and trustworthy AI systems was not just a research problem, but an urgent engineering one.

That moment occurred during my junior year at Peking University, where I was working in Professor Li's Medical AI Lab. Our team had built a chest X-ray classifier achieving 94% accuracy on benchmark datasets, yet it failed catastrophically on out-of-distribution samples from rural hospitals. I spent three months redesigning the data pipeline, introducing domain-adversarial training and uncertainty calibration. The revised model's accuracy on rural hospital data improved from 61% to 83% — still imperfect, but the system now flagged its own uncertainty rather than producing silent failures.

This experience crystallized my research direction: building AI systems that know what they don't know. During my internship at Microsoft Research Asia, I extended this interest to natural language understanding, developing a confidence-calibrated question answering module that reduced false-positive answers by 27% on our internal benchmark.

MIT's Computer Science program, and specifically the Reliable ML group led by Professor Madry, represents the ideal environment to pursue this work. The group's focus on robustness certification and adversarial training aligns precisely with my goal of building verifiably reliable AI systems. I am particularly drawn to the cross-disciplinary collaboration with MIT's clinical partners, which would allow me to test robustness methods on real medical deployment scenarios — closing the loop that I first encountered in Professor Li's lab.

Beyond research, my experience as president of PKU's AI Society taught me that technical leadership requires clear communication across expertise boundaries. I organized a workshop series that brought together clinicians and ML researchers — an experience that reinforced my belief that impactful AI research must be grounded in real-world constraints.

After completing my graduate studies, I plan to join an industrial research lab focused on AI safety and reliability, working on the certification frameworks that will be required before AI systems can be trusted in safety-critical applications. MIT's combination of theoretical depth and practical orientation makes it the ideal launchpad for this career.""",

    # Example 2: Finance applicant with quantitative hook
    """\
When China's P2P lending market collapsed in 2022, wiping out over $100 billion in retail investor savings, I was not reading about it in a textbook — I was watching it unfold through the data feeds at my internship at CICC's risk management desk. The models we relied on had been calibrated during a period of sustained growth and were fundamentally unable to capture the tail-risk correlations that emerged during the crisis.

That summer changed my understanding of quantitative finance. I had entered Fudan University's School of Economics thinking that financial engineering was primarily about optimization and pricing. I left that internship convinced that the most important unsolved problems lie at the intersection of risk modeling, behavioral economics, and regulatory design.

During my senior thesis, supervised by Professor Wang, I investigated how peer-to-peer lending platforms systematically underpriced credit risk by ignoring social network clustering effects. Using a novel graph-based model applied to anonymized transaction data from a major platform, I demonstrated that borrowers connected to defaulting nodes were 3.2 times more likely to default themselves — a correlation entirely invisible to traditional credit scoring. This work was accepted for presentation at the China Finance Review International conference.

Columbia's Master of Financial Engineering program offers the precise combination of rigorous quantitative training and market-relevant application that I seek. Professor Kou's research on financial technology risk and Professor Glasserman's work on Monte Carlo methods for risk measurement directly address the methodological gaps I encountered at CICC. The program's partnership with major Wall Street firms would provide the real-world testing ground essential for validating theoretical risk models.

My goal is to build the next generation of financial risk systems — models that are robust to regime changes, transparent in their assumptions, and calibrated against the behavioral dynamics that drive market crises.""",

    # Example 3: Environmental science applicant with fieldwork hook
    """\
Standing knee-deep in the Yangtze River delta, holding a water sample that my portable spectrometer identified as containing mercury levels six times above WHO guidelines, I understood why my professor always said that environmental science is not an abstract discipline — it is an argument for the people who cannot argue for themselves.

I spent the summer of 2024 conducting field sampling across twelve industrial discharge points as part of Professor Chen's Heavy Metal Remediation Project at Zhejiang University. What struck me was not the pollution itself — the data confirmed what satellite imagery had suggested — but the gap between detection and action. Local environmental agencies had the regulatory authority to intervene but lacked the predictive modeling capacity to prioritize which sites posed the greatest public health risk.

This gap became the focus of my senior project. I developed a spatial-temporal risk prediction model combining satellite-derived water quality indices with demographic data to generate a prioritized remediation queue. The model correctly predicted 8 of the top 10 sites subsequently flagged by provincial inspectors — achieved by integrating freely available remote sensing data that required no additional sampling infrastructure.

Stanford's Earth Systems Science program, particularly the Environmental Fluid Mechanics and Hydrology group, offers an unmatched combination of computational modeling expertise and policy engagement. Professor Fendorf's work on contaminant cycling in groundwater systems addresses the subsurface transport questions my risk model currently treats as a black box. The program's connection to Stanford's Woods Institute for the Environment would allow me to extend my work into the policy translation space — ensuring that predictive models actually reach the decision-makers who need them.

I intend to pursue a career bridging environmental data science and public health policy, developing the operational forecasting tools that transform environmental monitoring from reactive reporting into proactive protection.""",
]

_SOP_FEW_SHOT_BLOCK = "\n\n---\n\n".join(
    f"[EXAMPLE {i+1}]\n{ex}" for i, ex in enumerate(_SOP_EXAMPLES)
)


# ── Few-shot examples extracted from real successful recommendation letters ──
# Selected for structural quality: specific incident + strong narrative arc
_RL_EXAMPLES = [
    # Example 1: Academic professor with very specific story (student read optional papers proactively)
    """\
To whom it may concern,

As a professor and the Dean of School of Mathematics and Statistics, I am writing with pleasure to recommend this excellent student for admission to your respected program.

I have known him since he attended the course Probability Theory under my instruction. He is one of the excellent students I have taught, smart, creative and modest. As the most active one in the class, he always can bring new ideas for discussion. He has been keeping as the top 10% of the class throughout all quizzes and projects.

Of all his strengths, the one impressed me most is that he is a serious learner. At the beginning of the class, I distributed a list of optional papers for reading which could expand students' knowledge in this subject. I did not expect any one would start to read them before the midterm exam. However, only one week later, he brought a list of questions about the papers — he had already finished half of them. Some of the readings which contain advanced concepts and models are really hard for undergraduates to understand, but he still devoted quite a lot of time to figure them out. He told me he would like to learn more and not just be limited to the textbook.

I firmly believe that he has the qualities to be an excellent graduate student. I therefore strongly recommend him to pursue your esteemed program. If further information is required, please do not hesitate to contact me.

Yours sincerely,
Professor, School of Mathematics
[University Name]""",

    # Example 2: Industry supervisor with specific incident (employee submitted improvement report after crisis)
    """\
To Whom It May Concern,

It is my great pleasure to recommend my colleague, who just graduated from university as an honored student. When I interviewed her in June, I was impressed with her academic achievement and strong communication skills. Though I knew she would apply for advanced study and would not stay long, I was happy to offer her a position because of her serious working attitude and strong willingness to learn.

Under my supervision, she grasped her daily work quickly. Whenever I gave her an assignment, she would turn in a satisfactory report on time. There were several occasions which required overtime work; she accepted these without any complaints. Most impressively, when our computer system broke down, she had to confirm all transactions one by one by calling customers. The very next day, she submitted a three-page report outlining how to effectively improve working efficiency if the computer system failed again. That level of initiative — turning a crisis into a process improvement — is rare even among experienced staff.

She was an excellent employee with a good personality and strong communication skills. Though only working for four months, she became one of the favorite persons in our group.

Based on my observation, I believe she would be an excellent student in your program. I would strongly recommend her without any reservation.

Sincerely,
[Name], Associate Director
[Institution]""",

    # Example 3: Academic professor with research achievement (student published in national journal)
    """\
To whom it may concern,

I am a professor at the School of Management. It is my great pleasure to recommend this student for your esteemed graduate program. Her natural talent for engaging in management research is obvious for all to see.

I made acquaintance with her in my course of Micro Economics. From the very beginning, she impressed me with her earnest study attitude. In my opinion, field investigation is an indispensable part of management education. With an interest in exploring the relation between traditional culture and modern economy, she took a historic hall as a real case for seeking connections among traditional art, old urban districts, and modern economic development. I had not expected that she could fulfill that research, but after a whole summer vacation's field investigation — fully analyzing statistics collected from her survey — she accomplished the research and published her paper in a national-level periodical. This kind of academic achievement was rare among students at her age.

Although she ranked first among more than 100 students in her department, she did not cease moving forward. She participated in diversified campus activities and, leading a team in a major management competition, demonstrated outstanding leadership and analytical ability, winning second place in the preliminary round.

I firmly believe she is academically qualified for your graduate programme and well-prepared for professional education. I recommend her without hesitation.

Sincerely yours,
Associate Professor, School of Management
[University Name]""",
]

_RL_FEW_SHOT_BLOCK = "\n\n---\n\n".join(
    f"[EXAMPLE {i+1}]\n{ex}" for i, ex in enumerate(_RL_EXAMPLES)
)


def generate_recommendation(user_profile: dict, experiences: list, school_name: str, major: str,
                            recommender_context: dict | None = None) -> str:
    """Call Kimi API to generate an English recommendation letter.

    Uses few-shot prompting with real successful recommendation letters to produce
    structurally authentic output with concrete anecdotes rather than generic praise.

    recommender_context (optional):
        recommender_type:     e.g. "学术导师" / "实习主管"
        relationship_context: e.g. "大三上学期的计量经济学课程"
        key_incident:         e.g. "期末项目中独立发现数据集错误并重新建模"
        quantified_outcome:   e.g. "最终获得A+，全班最高分"
    """
    ctx = recommender_context or {}
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

    # Build recommender context block — only include filled fields
    recommender_lines = []
    if ctx.get('recommender_type'):
        recommender_lines.append(f"- Recommender type: {ctx['recommender_type']}")
    if ctx.get('relationship_context'):
        recommender_lines.append(f"- How recommender knows the student: {ctx['relationship_context']}")
    if ctx.get('key_incident'):
        recommender_lines.append(f"- Key incident the recommender witnessed (USE THIS AS THE CORE OF PARAGRAPH 2): {ctx['key_incident']}")
    if ctx.get('quantified_outcome'):
        recommender_lines.append(f"- Quantified outcome / achievement: {ctx['quantified_outcome']}")

    recommender_block = ''
    if recommender_lines:
        recommender_block = (
            "\nRecommender-Provided Context (HIGH PRIORITY — weave these details into the letter naturally):\n"
            + '\n'.join(recommender_lines)
            + '\n'
        )

    prompt = f"""You are a senior study abroad application consultant. Your task is to write a highly personalized recommendation letter.

First, study these {len(_RL_EXAMPLES)} real recommendation letters that were used in successful study abroad applications. Learn their structure, tone, and — most importantly — their use of specific incidents rather than generic praise:

{_RL_FEW_SHOT_BLOCK}

---

Now write a NEW recommendation letter for the student below applying to {major} at {school_name}.
{recommender_block}
STRUCTURAL RULES (derived from the examples above):
1. Paragraph 1 — Recommender self-introduction + how/when they know the student (use the recommender context above if provided)
2. Paragraph 2 — Academic or professional performance with AT LEAST ONE specific, concrete incident or story. If a key incident is provided above, build paragraph 2 around it. Do NOT just say "she performed well" — show a scene.
3. Paragraph 3 — Character and soft skills (work ethic, initiative, communication), grounded in observable behavior
4. Paragraph 4 — Strong closing recommendation, express confidence, offer to be contacted

LANGUAGE RULES:
- Write entirely in English — no Chinese characters permitted
- Use varied sentence lengths: mix short punchy sentences with longer complex ones
- Avoid AI clichés: "It is worth noting", "Furthermore", "In conclusion", "Needless to say"
- Use active voice for specific incidents; the recommender should sound like they genuinely remember this student
- Length: 450–650 words

Student Background:
- Name: {user_profile.get('name', 'the applicant')}
- Undergraduate Institution: {user_profile.get('home_institution', '')} ({user_profile.get('institution_tier', '')})
- Undergraduate Major: {user_profile.get('current_major', '')}
- GPA: {user_profile.get('gpa', '')}/{user_profile.get('gpa_scale', 4.0)}
- Language Scores: {user_profile.get('language_scores', {})}
- Key Experiences (use these as supplementary detail):
{experiences_str}

Write the full recommendation letter now. Do not include any preamble or explanation — output the letter only."""

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

First, study these {len(_SOP_EXAMPLES)} real Statements of Purpose from successful applications. Learn their structure, tone, and — most importantly — their use of specific incidents and concrete evidence rather than generic statements:

{_SOP_FEW_SHOT_BLOCK}

---

Now write a NEW Statement of Purpose for the student below applying to the {degree_type or 'graduate'} program in {major} at {school_name}.{school_info}

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


def humanize_text(content: str) -> str:
    """对 AI 生成的文书进行二次改写，降低 AI 味，使其读起来更像真人所写。
    自动检测输入语言，强制要求输出与输入语言一致。
    """
    api_key = os.getenv('KIMI_API_KEY', '')
    if not api_key:
        raise ValueError('KIMI_API_KEY is not configured')

    is_chinese = _has_cjk(content)
    if is_chinese:
        lang_instruction = '输出语言：必须使用中文，禁止出现任何英文句子。'
        lang_check_msg = '你的上一次回复中出现了非中文内容，请重新改写，全文必须使用中文。'
    else:
        lang_instruction = 'Output language: English only. Do not include any Chinese or non-Latin characters.'
        lang_check_msg = (
            'Your previous response contained non-English characters. '
            'Please rewrite entirely in English only.'
        )

    prompt = f"""你是一位专业的文书润色专家。请将以下 AI 生成的文书段落进行改写，使其读起来更像真人所写，而不是 AI。

改写要求：
1. 打破过于对称的排比句式（"首先…其次…最后"等），制造自然的节奏变化
2. 将抽象概括替换为具体场景、数字或细节
3. 适当使用短句，避免每句都是复合长句
4. 去除"值得注意的是"、"此外"、"总而言之"等 AI 惯用连接词
5. 保留原文的核心内容和观点，不改变事实
6. 保持与原文大致相同的长度
7. {lang_instruction}

只返回改写后的文本，不要任何解释说明。

原文：
{content}"""

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

    # 语言校验：输入中文则输出必须有中文，输入英文则输出不能有中文
    language_violated = (is_chinese and not _has_cjk(result)) or (not is_chinese and _has_cjk(result))
    if language_violated:
        messages.append({'role': 'assistant', 'content': result})
        messages.append({'role': 'user', 'content': lang_check_msg})
        result = _call_api(messages)

    return result
