"""
QQ邮箱 IMAP 收件 POC — 入口

启动方式:
    1. cp .env.example .env  # 填入账号、授权码、Kimi API Key
    2. pip install -r requirements.txt
    3. python main.py

功能:
    - APScheduler BlockingScheduler 每 60 秒轮询一次（可配置）
    - 启动后立即执行一次，无需等待第一个周期
    - 已处理的 UID 持久化到 processed_uids.json，重启不重复处理
    - 单封邮件处理失败不影响其他邮件，下一轮自动重试
"""

import json
import logging
import os
import signal
import sys
from datetime import datetime, timezone

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import Config
import imap_client
from email_parser import parse_email
from processor import analyze_email_with_llm, extract_attachment_text

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# UID 持久化（file-based for POC）
# ---------------------------------------------------------------------------

def _load_processed_uids() -> set:
    """从 JSON 文件加载已处理的 UID 集合。"""
    path = Config.UID_FILE_PATH
    if not os.path.exists(path):
        return set()
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return set(data.get("uids", []))
    except Exception as e:
        logger.warning(f"加载 processed_uids 失败: {e}，从空集合开始")
        return set()


def _save_processed_uid(uid: str) -> None:
    """追加一个 UID 到 JSON 文件。"""
    path = Config.UID_FILE_PATH
    uids = _load_processed_uids()
    uids.add(uid)
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(
                {"uids": list(uids), "last_updated": datetime.now(timezone.utc).isoformat()},
                f,
                ensure_ascii=False,
                indent=2,
            )
    except Exception as e:
        logger.error(f"保存 UID {uid} 失败: {e}")


# ---------------------------------------------------------------------------
# 主轮询任务
# ---------------------------------------------------------------------------

def poll_and_process() -> None:
    """
    单次轮询：连接 IMAP → 拉取新邮件 → 解析 → 处理 → 记录 UID。
    单封邮件失败不影响整体，下轮重试。
    """
    logger.info("===== 开始轮询 =====")
    processed_uids = _load_processed_uids()
    conn = None

    try:
        conn = imap_client.connect(Config)
        new_uids = imap_client.fetch_new_uids(conn, Config.IMAP_FOLDER, processed_uids)

        if not new_uids:
            logger.info("本轮无新邮件")
            return

        for uid in new_uids:
            logger.info(f"处理 UID: {uid}")
            try:
                # 1. 下载原始邮件
                raw = imap_client.fetch_raw_email(conn, uid)

                # 2. 解析邮件
                parsed = parse_email(uid, raw)

                # 3. 提取附件文本
                attachment_texts = {}
                for att in parsed.attachments:
                    logger.info(f"  提取附件: {att.filename} ({att.content_type})")
                    attachment_texts[att.filename] = extract_attachment_text(att)

                # 4. LLM 分析
                result = analyze_email_with_llm(parsed, attachment_texts, Config.KIMI_API_KEY)

                # 5. 输出结果（生产环境替换为写库）
                logger.info(
                    f"  [分析结果] 分类={result.get('category')} | "
                    f"摘要={result.get('summary')} | "
                    f"需要操作={result.get('action_required')}"
                )

                # 6. 标记已处理
                _save_processed_uid(uid)
                imap_client.mark_as_seen(conn, uid)

            except Exception as e:
                # 单封邮件失败：记录错误，不标记 UID，下轮重试
                logger.error(f"UID {uid} 处理失败: {e}", exc_info=True)

    except Exception as e:
        logger.error(f"轮询异常（IMAP 连接/拉取层）: {e}", exc_info=True)
    finally:
        if conn:
            imap_client.disconnect(conn)
        logger.info("===== 轮询结束 =====")


# ---------------------------------------------------------------------------
# 入口
# ---------------------------------------------------------------------------

def main() -> None:
    # 校验必填配置
    try:
        Config.validate()
    except ValueError as e:
        logger.error(f"配置校验失败: {e}")
        sys.exit(1)

    logger.info(
        f"启动 QQ邮箱 IMAP 轮询 | 账号: {Config.IMAP_USER} | "
        f"间隔: {Config.POLL_INTERVAL_SECONDS}s"
    )

    # 优雅关闭
    def _shutdown(signum, frame):
        logger.info("收到退出信号，正在关闭调度器...")
        scheduler.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    scheduler = BlockingScheduler()
    scheduler.add_job(
        poll_and_process,
        trigger=IntervalTrigger(seconds=Config.POLL_INTERVAL_SECONDS),
        id="imap_poll",
        name="Poll QQ邮箱 IMAP",
        max_instances=1,       # 防止前一轮未结束时重叠执行
        coalesce=True,         # 错过的周期合并为一次
        misfire_grace_time=30,
    )

    # 启动立即执行一次，验证连接可用
    logger.info("执行启动初始轮询...")
    poll_and_process()

    logger.info("调度器启动，按 Ctrl+C 退出")
    scheduler.start()


if __name__ == "__main__":
    main()
