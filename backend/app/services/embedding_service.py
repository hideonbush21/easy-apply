"""
向量化服务：使用 OpenAI text-embedding-3-large API。

缓存策略：
  按 program_id 缓存单条向量到 Redis（TTL=30天）。
  warmup.py 在 gunicorn 启动前同步预热全量 programs。

推荐时流程：
  1. 从 DB 轻量查询候选学校的 program IDs（不取文本）
  2. Redis pipeline 批量加载向量（单次 RTT）
  3. 仅对 Redis 未命中（TTL 过期）的 program 调 OpenAI 编码
  4. 对 query_text 调 1 次 OpenAI 编码
"""

import os
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_MODEL_TAG = "te3l"       # text-embedding-3-large 缩写，换模型时修改此处
_MATRIX_TTL = 2592000     # Redis TTL：30 天


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

    流程：
      1. DB 轻量查询：只取候选学校的 program ID + school_id
      2. Redis pipeline 批量加载向量（单次网络 RTT）
      3. 仅对未命中（TTL 过期兜底）的 program 重新编码并回写 Redis
      4. 对 query_text 调 1 次 OpenAI 编码（正常路径唯一的 AI 调用）
    """
    from collections import defaultdict
    from app.models.program import Program

    school_id_strs = {str(sid) for sid in school_id_set}

    # Step 1: 轻量查询，只取 id 和 school_id（不拉文本字段）
    rows = (
        Program.query
        .filter(Program.school_id.in_(school_id_set))
        .with_entities(Program.id, Program.school_id)
        .all()
    )
    if not rows:
        return []

    ids = [r[0] for r in rows]
    sids = [str(r[1]) for r in rows]

    # Step 2: Redis pipeline 批量 GET
    r = None
    vecs: list[Optional[np.ndarray]] = [None] * len(ids)
    try:
        from app.services.redis_client import get_redis_binary
        r = get_redis_binary()
        pipe = r.pipeline(transaction=False)
        for pid in ids:
            pipe.get(_get_program_redis_key(pid))
        raw_list = pipe.execute()
        for i, raw in enumerate(raw_list):
            if raw:
                vecs[i] = np.frombuffer(raw, dtype=np.float32).copy()
    except Exception as e:
        logger.warning(f"Redis 批量读取失败: {e}")
        r = None

    # Step 3: 编码 Redis 未命中的 programs（TTL 过期兜底）
    miss_idx = [i for i, v in enumerate(vecs) if v is None]
    if miss_idx:
        logger.warning(f"[embedding] {len(miss_idx)} 条 program 向量未命中 Redis，重新编码")
        miss_pids = [ids[i] for i in miss_idx]
        miss_programs = Program.query.filter(Program.id.in_(miss_pids)).all()
        pid_to_text = {p.id: _build_program_text(p) for p in miss_programs}

        valid_miss = [(i, pid_to_text.get(ids[i], '')) for i in miss_idx]
        valid_miss = [(i, t) for i, t in valid_miss if t.strip()]

        if valid_miss:
            valid_idx = [x[0] for x in valid_miss]
            valid_texts = [x[1] for x in valid_miss]
            encoded = encode(valid_texts)
            for j, i in enumerate(valid_idx):
                vecs[i] = encoded[j]

            if r is not None:
                try:
                    pipe = r.pipeline(transaction=False)
                    for j, i in enumerate(valid_idx):
                        pipe.setex(_get_program_redis_key(ids[i]), _MATRIX_TTL, vecs[i].tobytes())
                    pipe.execute()
                except Exception as e:
                    logger.warning(f"Redis 回写失败: {e}")

    # Step 4: 编码 query（唯一的正常路径 OpenAI 调用）
    query_vec = encode([query_text])[0]

    # 过滤掉向量仍为 None 的（文本为空的 program）
    valid = [(ids[i], sids[i], vecs[i]) for i in range(len(ids)) if vecs[i] is not None]
    if not valid:
        return []

    matrix = np.stack([v for _, _, v in valid])
    scores: np.ndarray = matrix @ query_vec

    school_best: dict[str, list] = defaultdict(list)
    for i, (pid, sid, _) in enumerate(valid):
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
