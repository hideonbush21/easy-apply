"""
向量化服务：使用 OpenAI text-embedding-3-large API。

模型调用通过 API，无需本地加载模型文件。
programs 表的向量在首次请求时全量计算并缓存在内存中。
"""

import os
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_programs_cache: Optional[dict] = None


def _get_client():
    from openai import OpenAI
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def encode(texts: list[str]) -> np.ndarray:
    """将文本列表编码为向量矩阵，shape=(n, dim)"""
    client = _get_client()
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=texts,
    )
    vectors = np.array([item.embedding for item in response.data], dtype=np.float32)
    # 归一化，与 cosine_similarity_batch 保持一致
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return vectors / np.maximum(norms, 1e-10)


def cosine_similarity_batch(query_vec: np.ndarray, matrix: np.ndarray) -> np.ndarray:
    """
    query_vec: shape (dim,)
    matrix:    shape (n, dim)，已归一化
    返回: shape (n,) 相似度分数
    """
    return matrix @ query_vec


def _build_program_text(program) -> str:
    """拼接 program 的语义文本，用于向量化"""
    parts = []
    if program.name_cn:
        parts.append(program.name_cn)
    if program.name_en:
        parts.append(program.name_en)
    if program.major_category:
        parts.append(program.major_category)
    if program.department:
        parts.append(program.department)
    return " | ".join(parts)


def get_programs_cache() -> dict:
    """
    返回全量 programs 的向量缓存，首次调用时计算并缓存。
    缓存结构：{"vectors": np.ndarray, "ids": list[UUID], "texts": list[str]}
    """
    global _programs_cache
    if _programs_cache is not None:
        return _programs_cache

    from app.models.program import Program

    logger.info("构建 programs 向量缓存（OpenAI API）...")
    programs = Program.query.all()

    ids, texts = [], []
    for p in programs:
        ids.append(p.id)
        texts.append(_build_program_text(p))

    vectors = encode(texts)
    _programs_cache = {"vectors": vectors, "ids": ids, "texts": texts}
    logger.info(f"programs 向量缓存完成，共 {len(ids)} 条")
    return _programs_cache


def clear_programs_cache():
    """程序数据更新后调用，清除缓存"""
    global _programs_cache
    _programs_cache = None


def find_similar_programs(
    query_text: str,
    school_id_set: set,
    top_k_per_school: int = 3,
) -> list[dict]:
    """
    在指定学校范围内，找和 query_text 最相似的 top_k_per_school 个 program。
    """
    cache = get_programs_cache()
    all_vectors = cache["vectors"]
    all_ids = cache["ids"]

    query_vec = encode([query_text])[0]

    mask = [i for i, pid in enumerate(all_ids)
            if _get_program_school_id(pid) in school_id_set]

    if not mask:
        return []

    sub_vectors = all_vectors[mask]
    sub_ids = [all_ids[i] for i in mask]
    scores = cosine_similarity_batch(query_vec, sub_vectors)

    from collections import defaultdict
    school_best: dict[str, list] = defaultdict(list)
    for pid, score in zip(sub_ids, scores):
        school_id = str(_get_program_school_id(pid))
        school_best[school_id].append((float(score), pid))

    results = []
    for school_id, items in school_best.items():
        items.sort(reverse=True)
        for score, pid in items[:top_k_per_school]:
            results.append({"program_id": pid, "school_id": school_id, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return results


_pid_to_sid: dict = {}

def _get_program_school_id(program_id):
    if program_id not in _pid_to_sid:
        from app.models.program import Program
        p = Program.query.get(program_id)
        _pid_to_sid[program_id] = p.school_id if p else None
    return _pid_to_sid[program_id]
