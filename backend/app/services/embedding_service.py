"""
向量化服务：使用 OpenAI text-embedding-3-large API。

缓存策略：
  L1 进程内存：同一 worker 内重复调用直接命中，无任何 IO。
  L2 Redis：多 worker 共享同一份矩阵，进程重启后无需重新调用 OpenAI。

缓存 key 格式：programs:matrix:te3l:v{max_updated_at 按分钟取整}
  当 programs 表有内容更新（updated_at 变化）时，key 自动变为新版本，
  旧 key 由 TTL=24h 自然淘汰，无需主动 DEL。
"""

import os
import json
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_MODEL_TAG = "te3l"          # text-embedding-3-large 缩写，换模型时修改此处
_MATRIX_TTL = 86400          # Redis TTL：24h

_programs_cache: Optional[dict] = None  # L1 进程内存缓存


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


def _get_matrix_cache_key() -> str:
    """根据 programs 表最新 updated_at 生成版本化 key，精确到分钟。"""
    from app.models.program import Program
    from sqlalchemy import func
    from app.extensions import db
    ts = db.session.query(func.max(Program.updated_at)).scalar()
    if ts is None:
        return f"programs:matrix:{_MODEL_TAG}:v0"
    minute_ts = int(ts.timestamp() // 60)
    return f"programs:matrix:{_MODEL_TAG}:v{minute_ts}"


def _load_from_redis(key: str) -> Optional[dict]:
    """从 Redis 读取矩阵缓存，失败时返回 None（静默降级）。"""
    try:
        from app.services.redis_client import get_redis_binary
        r = get_redis_binary()
        data = r.hgetall(key)
        if not data or b"vectors" not in data:
            return None
        shape = tuple(map(int, data[b"shape"].split(b",")))
        vectors = np.frombuffer(data[b"vectors"], dtype=np.float32).reshape(shape).copy()
        ids = json.loads(data[b"ids"])
        school_ids = json.loads(data[b"school_ids"])
        texts = json.loads(data[b"texts"])
        logger.info(f"从 Redis 加载 programs 向量矩阵，共 {len(ids)} 条")
        return {"vectors": vectors, "ids": ids, "school_ids": school_ids, "texts": texts}
    except Exception as e:
        logger.warning(f"Redis 读取 programs 矩阵失败，降级重建: {e}")
        return None


def _save_to_redis(key: str, cache: dict) -> None:
    """将矩阵缓存写入 Redis，失败时静默忽略。"""
    try:
        from app.services.redis_client import get_redis_binary
        r = get_redis_binary()
        vectors: np.ndarray = cache["vectors"]
        r.hset(key, mapping={
            b"vectors": vectors.tobytes(),
            b"ids": json.dumps([str(i) for i in cache["ids"]]).encode(),
            b"school_ids": json.dumps(cache["school_ids"]).encode(),
            b"texts": json.dumps(cache["texts"]).encode(),
            b"shape": f"{vectors.shape[0]},{vectors.shape[1]}".encode(),
        })
        r.expire(key, _MATRIX_TTL)
        logger.info(f"programs 向量矩阵已写入 Redis key={key}，共 {len(cache['ids'])} 条")
    except Exception as e:
        logger.warning(f"Redis 写入 programs 矩阵失败: {e}")


def get_programs_cache() -> dict:
    """
    返回全量 programs 的向量缓存。

    查找顺序：L1 进程内存 → L2 Redis → OpenAI 重建。
    缓存结构：{"vectors": np.ndarray, "ids": list, "school_ids": list[str], "texts": list[str]}
    """
    global _programs_cache
    if _programs_cache is not None:
        return _programs_cache

    key = _get_matrix_cache_key()

    cached = _load_from_redis(key)
    if cached is not None:
        _programs_cache = cached
        return _programs_cache

    from app.models.program import Program
    logger.info("构建 programs 向量缓存（OpenAI API）...")
    programs = Program.query.all()

    ids, school_ids, texts = [], [], []
    for p in programs:
        text = _build_program_text(p)
        if not text.strip():
            logger.warning(f"Program id={p.id} 文本为空，跳过向量化")
            continue
        ids.append(p.id)
        school_ids.append(str(p.school_id))
        texts.append(text)

    vectors = encode(texts)
    _programs_cache = {"vectors": vectors, "ids": ids, "school_ids": school_ids, "texts": texts}
    logger.info(f"programs 向量缓存构建完成，共 {len(ids)} 条")

    _save_to_redis(key, _programs_cache)
    return _programs_cache


def clear_programs_cache():
    """programs 数据更新后调用，清除 L1 进程缓存（Redis key 由 updated_at 版本自动切换）。"""
    global _programs_cache
    _programs_cache = None


def find_similar_programs(
    query_text: str,
    school_id_set: set,
    top_k_per_school: int = 3,
) -> list[dict]:
    """
    在指定学校范围内，找和 query_text 最相似的 top_k_per_school 个 program。

    优化点：programs 矩阵从缓存取（L1/L2），每次推荐只调用一次 OpenAI（query 向量化）。
    """
    cache = get_programs_cache()
    query_vec = encode([query_text])[0]  # 唯一的 OpenAI 调用

    school_id_strs = {str(sid) for sid in school_id_set}

    # 一次 numpy 矩阵乘法计算全部相似度，避免 Python 层面循环
    all_scores: np.ndarray = cache["vectors"] @ query_vec  # shape (n,)

    from collections import defaultdict
    school_best: dict[str, list] = defaultdict(list)

    for i, (pid, sid) in enumerate(zip(cache["ids"], cache["school_ids"])):
        if sid not in school_id_strs:
            continue
        school_best[sid].append((float(all_scores[i]), pid))

    results = []
    for sid, items in school_best.items():
        items.sort(reverse=True)
        for score, pid in items[:top_k_per_school]:
            results.append({"program_id": pid, "school_id": sid, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return results
