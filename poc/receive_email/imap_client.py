"""
QQ邮箱 IMAP 客户端

负责：SSL 连接、拉取未读 UID、下载原始邮件、标记已读、断开连接。

设计原则：
- 每次轮询新建连接，不复用（避免 QQ IMAP 29 分钟 idle 超时）
- 始终使用 UID 命令（稳定），不用 sequence number
- 双重去重：UNSEEN flag + processed_uids set
"""

import imaplib
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from config import Config

logger = logging.getLogger(__name__)


def connect(config: "type[Config]") -> imaplib.IMAP4_SSL:
    """SSL 连接 QQ邮箱 IMAP，使用授权码登录（非 QQ 密码）。"""
    logger.info(f"连接 IMAP: {config.IMAP_HOST}:{config.IMAP_PORT} 用户: {config.IMAP_USER}")
    conn = imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT)
    conn.login(config.IMAP_USER, config.IMAP_AUTH_CODE)
    logger.info("IMAP 登录成功")
    return conn


def fetch_new_uids(
    conn: imaplib.IMAP4_SSL,
    folder: str,
    processed_uids: set,
) -> list:
    """
    SELECT 文件夹，SEARCH UNSEEN，过滤已处理的 UID。
    返回需要处理的 UID 字符串列表。
    """
    status, _ = conn.select(folder)
    if status != "OK":
        logger.error(f"SELECT 文件夹失败: {folder}")
        return []

    status, data = conn.uid("search", None, "UNSEEN")
    if status != "OK":
        logger.error("SEARCH UNSEEN 失败")
        return []

    all_uids = data[0].decode().split() if data[0] else []
    if not all_uids:
        logger.info("没有未读邮件")
        return []

    # 过滤已处理的 UID
    new_uids = [uid for uid in all_uids if uid not in processed_uids]
    logger.info(f"未读邮件 {len(all_uids)} 封，其中新邮件 {len(new_uids)} 封")
    return new_uids


def fetch_raw_email(conn: imaplib.IMAP4_SSL, uid: str) -> bytes:
    """下载单封邮件的完整原始字节（RFC822）。"""
    status, data = conn.uid("fetch", uid, "(RFC822)")
    if status != "OK" or not data or data[0] is None:
        raise RuntimeError(f"UID {uid} 拉取失败，状态: {status}")
    # data[0] 是 (header, raw_bytes) 元组
    raw = data[0][1]
    if not isinstance(raw, bytes):
        raise RuntimeError(f"UID {uid} 返回数据格式异常")
    logger.debug(f"UID {uid}: 原始邮件 {len(raw)} 字节")
    return raw


def mark_as_seen(conn: imaplib.IMAP4_SSL, uid: str) -> None:
    """为邮件添加 \\Seen 标记。"""
    conn.uid("store", uid, "+FLAGS", "\\Seen")
    logger.debug(f"UID {uid}: 已标记为已读")


def disconnect(conn: imaplib.IMAP4_SSL) -> None:
    """优雅断开 IMAP 连接。"""
    try:
        conn.logout()
        logger.info("IMAP 连接已断开")
    except Exception:
        pass  # logout 失败不影响主流程
