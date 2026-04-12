"""
QQ邮箱 IMAP 收件模块 — 配置

使用方式：
    1. cp .env.example .env
    2. 填入真实的 QQ邮箱账号、授权码、Kimi API Key
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # IMAP 连接
    IMAP_HOST: str = os.getenv("IMAP_HOST", "imap.qq.com")
    IMAP_PORT: int = int(os.getenv("IMAP_PORT", "993"))
    IMAP_USER: str = os.getenv("IMAP_USER", "")          # QQ邮箱地址
    IMAP_AUTH_CODE: str = os.getenv("IMAP_AUTH_CODE", "")  # 授权码，非 QQ 密码
    IMAP_FOLDER: str = os.getenv("IMAP_FOLDER", "INBOX")

    # 轮询间隔
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "60"))

    # UID 持久化：file（POC）或 redis（生产）
    UID_STORE_TYPE: str = os.getenv("UID_STORE_TYPE", "file")
    UID_FILE_PATH: str = os.getenv("UID_FILE_PATH", "processed_uids.json")
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # LLM（Kimi / Moonshot）
    KIMI_API_KEY: str = os.getenv("KIMI_API_KEY", "")

    # 附件保存目录
    ATTACHMENT_DIR: str = os.getenv("ATTACHMENT_DIR", "attachments")

    @classmethod
    def validate(cls) -> None:
        """启动前校验必填配置项"""
        missing = []
        if not cls.IMAP_USER:
            missing.append("IMAP_USER")
        if not cls.IMAP_AUTH_CODE:
            missing.append("IMAP_AUTH_CODE")
        if not cls.KIMI_API_KEY:
            missing.append("KIMI_API_KEY")
        if missing:
            raise ValueError(f"缺少必填环境变量: {', '.join(missing)}")
