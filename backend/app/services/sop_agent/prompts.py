CRITIQUE_PROMPT = """\
你是顶级留学文书顾问，请评审以下 SoP 草稿。

评审维度（每项 0-2 分，合计 0-10 分）：
1. 具体性：是否有具体事件、数字、成果？（忌空泛描述）
2. 逻辑性：研究动机 → 经历支撑 → 目标项目 是否顺畅？
3. 差异化：是否体现申请人独特性，避免模板感？
4. 针对性：是否提到目标学校/项目的具体特色？
5. 语言质量：是否自然流畅，无明显 AI 味道？

输出格式（仅输出 JSON，不要有其他文字）：
{{
  "scores": {{"concreteness": int, "logic": int, "differentiation": int, "specificity": int, "language": int}},
  "total_score": float,
  "issues": [
    {{"dimension": "维度名", "problem": "问题描述", "suggestion": "修改建议"}}
  ],
  "strengths": ["亮点1"],
  "pass": bool
}}

注意：
- issues 最多列 3 条最关键的问题
- strengths 最多 2 条
- pass = true 当且仅当 total_score >= 7.5 且所有单项分数 >= 1.0

申请人背景：{user_context}
目标学校：{school_name} {program_name}

草稿内容：
{current_draft}"""


REVISE_PROMPT = """\
以下是一篇 SoP 草稿，以及评审者指出的具体问题。
请在保持原有优点的基础上，针对以下问题逐一改进：

问题清单：
{issues_formatted}

改写要求：
- 只修改有问题的部分，不要大面积重写
- 每个改动必须对应上述某条问题
- 保持原文长度（600-900 字）
- 只返回改写后的完整正文，不需要解释
- 全文必须使用英文，不得包含中文字符

原稿：
{current_draft}"""
