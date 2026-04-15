"""
申请匹配模块 — 分层匹配策略

架构师建议的分层方案：
  Layer 1: Levenshtein 编辑距离（字符级，处理 MIT vs M.I.T. 这类差异）
  Layer 2: Jaccard 集合重合度（词级，处理词序不同）
  Layer 3: Embedding 余弦相似度（语义级，可选，需要 API）

最终输出 match_confidence（0.0-1.0），影响下游状态机的置信度计算：
  final_confidence = llm_confidence * match_confidence_weight
"""

import os
import math
import logging

logger = logging.getLogger(__name__)


# ── Layer 1: Levenshtein 编辑距离 ─────────────────────────────────────────

def levenshtein_distance(s1: str, s2: str) -> int:
    """标准 Levenshtein 编辑距离（插入/删除/替换各代价1）。"""
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2:
        return 0
    if not s1:
        return len(s2)
    if not s2:
        return len(s1)

    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1, 1):
        curr = [i]
        for j, c2 in enumerate(s2, 1):
            curr.append(min(
                prev[j] + 1,        # 删除
                curr[j - 1] + 1,    # 插入
                prev[j - 1] + (0 if c1 == c2 else 1),  # 替换
            ))
        prev = curr
    return prev[-1]


def levenshtein_similarity(s1: str, s2: str) -> float:
    """将编辑距离归一化为 0.0-1.0 相似度。"""
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    dist = levenshtein_distance(s1, s2)
    max_len = max(len(s1), len(s2))
    return 1.0 - dist / max_len


# ── Layer 2: Jaccard 词级相似度 ───────────────────────────────────────────

def jaccard_similarity(s1: str, s2: str) -> float:
    """
    词集合 Jaccard 相似度：交集/并集。
    处理词序不同的情况，如：
      "Computer Science MSc" vs "MSc Computer Science"
    """
    if not s1 and not s2:
        return 1.0
    if not s1 or not s2:
        return 0.0
    words1 = set(s1.lower().split())
    words2 = set(s2.lower().split())
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union) if union else 0.0


# ── Layer 3: Embedding 余弦相似度（可选）─────────────────────────────────

def _cosine_similarity(v1: list[float], v2: list[float]) -> float:
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a ** 2 for a in v1))
    norm2 = math.sqrt(sum(b ** 2 for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def embedding_similarity(s1: str, s2: str) -> float | None:
    """
    使用 Kimi embedding API 计算语义相似度。
    若 API 不可用或调用失败，返回 None（上层降级处理）。
    """
    api_key = os.environ.get("KIMI_API_KEY", "")
    if not api_key:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.moonshot.cn/v1",
        )
        resp = client.embeddings.create(
            model="moonshot-embedding-v1",
            input=[s1, s2],
            encoding_format="float",
        )
        v1 = resp.data[0].embedding
        v2 = resp.data[1].embedding
        sim = _cosine_similarity(v1, v2)
        logger.debug(f"Embedding 相似度 [{s1!r} vs {s2!r}]: {sim:.3f}")
        return sim
    except Exception as e:
        logger.warning(f"Embedding API 调用失败，降级到字符串匹配: {e}")
        return None


# ── 综合匹配打分 ──────────────────────────────────────────────────────────

def _compute_field_score(query: str, candidate: str, use_embedding: bool = True) -> dict:
    """
    对单个字段计算分层匹配分数。

    Returns:
        {
            "levenshtein": float,
            "jaccard": float,
            "embedding": float | None,
            "final_score": float,
            "method": str,   # 实际使用的最高层方法
        }
    """
    if not query or not candidate:
        return {
            "levenshtein": 0.0, "jaccard": 0.0,
            "embedding": None, "final_score": 0.0, "method": "empty"
        }

    lev = levenshtein_similarity(query, candidate)
    jac = jaccard_similarity(query, candidate)

    # Layer 1+2 综合基础分（取较高值）
    base_score = max(lev, jac)

    # Layer 3：尝试 embedding
    emb = None
    if use_embedding and base_score < 0.95:   # 完全匹配就不必调 API
        emb = embedding_similarity(query, candidate)

    if emb is not None:
        # embedding 权重更高，但不完全忽略字符级分数
        final = 0.3 * base_score + 0.7 * emb
        method = "embedding"
    else:
        final = base_score
        method = "levenshtein+jaccard"

    return {
        "levenshtein": round(lev, 3),
        "jaccard": round(jac, 3),
        "embedding": round(emb, 3) if emb is not None else None,
        "final_score": round(final, 3),
        "method": method,
    }


def match_applications(
    school_name: str | None,
    program_name: str | None,
    applications: list[dict],
    use_embedding: bool = True,
) -> list[dict]:
    """
    对候选申请列表打分排序，返回匹配结果（从高到低）。

    Args:
        school_name:   LLM 从邮件里提取的学校名
        program_name:  LLM 从邮件里提取的项目名
        applications:  Mock 或真实申请列表
        use_embedding: 是否尝试调用 Embedding API（False 则只用字符串方法）

    Returns:
        每个申请附加 match_detail 字段，按 match_confidence 降序排列
    """
    if not school_name:
        # 无学校名，无法匹配，全部返回低分
        return [
            {**app, "match_confidence": 0.0, "match_detail": {"reason": "no school name from LLM"}}
            for app in applications
        ]

    results = []
    for app in applications:
        # 学校名匹配（主要依据）
        school_score = _compute_field_score(
            school_name, app.get("school", ""), use_embedding
        )

        # 项目名匹配（辅助，可选）
        if program_name and app.get("program"):
            prog_score = _compute_field_score(
                program_name, app.get("program", ""), use_embedding=False  # 项目名不调 Embedding 节省 API
            )
            # 学校名权重 0.7，项目名权重 0.3
            match_confidence = 0.7 * school_score["final_score"] + 0.3 * prog_score["final_score"]
        else:
            prog_score = None
            match_confidence = school_score["final_score"]

        results.append({
            **app,
            "match_confidence": round(match_confidence, 3),
            "match_detail": {
                "school": school_score,
                "program": prog_score,
                "method": school_score["method"],
            }
        })

    results.sort(key=lambda x: x["match_confidence"], reverse=True)
    return results


def find_best_match(
    school_name: str | None,
    program_name: str | None,
    applications: list[dict],
    threshold: float = 0.6,
    use_embedding: bool = True,
) -> dict | None:
    """
    返回最佳匹配申请（match_confidence >= threshold），否则返回 None。

    threshold 默认 0.6：
      - 精确匹配（MIT vs MIT）≈ 1.0
      - 缩写匹配（MIT vs Massachusetts Institute of Technology）Embedding ≈ 0.85
      - 无关学校 ≈ 0.1-0.3
    """
    ranked = match_applications(school_name, program_name, applications, use_embedding)
    if ranked and ranked[0]["match_confidence"] >= threshold:
        return ranked[0]
    return None
