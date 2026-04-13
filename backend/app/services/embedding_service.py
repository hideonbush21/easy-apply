"""
向量化服务：使用 OpenAI text-embedding-3-large API。

缓存策略：
  按 program_id 缓存单条向量到 Redis（TTL=24h）。
  推荐时只对候选学校的 programs 编码，避免全量矩阵导致的超时和内存溢出。
"""

import os
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_MODEL_TAG = "te3l"          # text-embedding-3-large 缩写，换模型时修改此处
_MATRIX_TTL = 86400          # Redis TTL：24h


def _get_client():
    from openai import OpenAI
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])


def encode(texts: list[str]) -> np.ndarray:
    """将文本列表编码为向量矩阵，shape=(n, dim)，自动分批处理，结果已归一化。"""
    client = _get_client()
    batch_size = 512
    all_vectors = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        response = client.embeddings.create(
            model="text-embedding-3-large",
            input=batch,
        )
        all_vectors.extend([item.embedding for item in response.data])

    vectors = np.array(all_vectors, dtype=np.float32)
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


def _get_program_redis_key(program_id) -> str:
    return f"prog:emb:{_MODEL_TAG}:{program_id}"


def find_similar_programs(
    query_text: str,
    school_id_set: set,
    top_k_per_school: int = 3,
) -> list[dict]:
    """
    在指定学校范围内，找和 query_text 最相似的 top_k_per_school 个 program。

    只对候选学校的 programs 编码（而非全表），避免全量矩阵导致的超时和内存溢出。
    单个 program 向量按 program_id 缓存在 Redis（TTL=24h），避免重复调用 OpenAI。
    """
    from collections import defaultdict
    from app.models.program import Program

    school_id_strs = {str(sid) for sid in school_id_set}

    # 只查候选学校的 programs
    programs = Program.query.filter(Program.school_id.in_(school_id_set)).all()
    if not programs:
        return []

    ids, sids, texts = [], [], []
    for p in programs:
        text = _build_program_text(p)
        if not text.strip():
            logger.warning(f"Program id={p.id} 文本为空，跳过向量化")
            continue
        ids.append(p.id)
        sids.append(str(p.school_id))
        texts.append(text)

    if not ids:
        return []

    # 从 Redis 批量加载已缓存的向量
    vecs: list[Optional[np.ndarray]] = [None] * len(ids)
    r = None
    try:
        from app.services.redis_client import get_redis_binary
        r = get_redis_binary()
        for i, pid in enumerate(ids):
            raw = r.get(_get_program_redis_key(pid))
            if raw:
                vecs[i] = np.frombuffer(raw, dtype=np.float32).copy()
    except Exception as e:
        logger.warning(f"Redis 读取 program 向量失败，降级为全量编码: {e}")
        r = None

    # 批量编码未命中的 programs
    miss_idx = [i for i, v in enumerate(vecs) if v is None]
    if miss_idx:
        miss_texts = [texts[i] for i in miss_idx]
        encoded = encode(miss_texts)
        for j, i in enumerate(miss_idx):
            vecs[i] = encoded[j]
        if r is not None:
            try:
                for j, i in enumerate(miss_idx):
                    r.setex(_get_program_redis_key(ids[i]), _MATRIX_TTL, vecs[i].tobytes())
            except Exception as e:
                logger.warning(f"Redis 写入 program 向量失败: {e}")

    # 编码 query
    query_vec = encode([query_text])[0]

    # 矩阵乘法计算相似度
    matrix = np.stack(vecs)  # shape (n, dim)
    scores: np.ndarray = matrix @ query_vec

    school_best: dict[str, list] = defaultdict(list)
    for i, (pid, sid) in enumerate(zip(ids, sids)):
        if sid not in school_id_strs:
            continue
        school_best[sid].append((float(scores[i]), pid))

    results = []
    for sid, items in school_best.items():
        items.sort(reverse=True)
        for score, pid in items[:top_k_per_school]:
            results.append({"program_id": pid, "school_id": sid, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return results
