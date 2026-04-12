"""
邮件解析模块

负责：RFC822 字节 → ParsedEmail 结构体
- 处理 QQ邮箱 常见的 GBK/GB2312 编码（声明 gb2312 但实际是 GBK 超集）
- 解析 text/plain 和 text/html 正文
- 提取附件（文件名、类型、原始字节）
- 解码 RFC2047 编码的邮件头（主题、发件人等）
"""

import email
import email.header
import email.utils
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from email.message import Message
from html.parser import HTMLParser
from typing import Optional

logger = logging.getLogger(__name__)

# GBK 解码 fallback 链：声明的 charset → gbk → gb18030 → utf-8 → latin-1
_GBK_FALLBACK_CHAIN = ["gbk", "gb18030", "utf-8", "latin-1"]


@dataclass
class Attachment:
    filename: str
    content_type: str
    data: bytes
    size: int


@dataclass
class ParsedEmail:
    uid: str
    message_id: str
    subject: str
    sender: str
    recipients: list = field(default_factory=list)
    date: Optional[datetime] = None
    text_body: str = ""
    html_body: str = ""
    attachments: list = field(default_factory=list)


class _HTMLStripper(HTMLParser):
    """简单 HTML 标签剥离器，提取纯文本用于 LLM 分析。"""

    def __init__(self):
        super().__init__()
        self._parts: list = []

    def handle_data(self, data: str) -> None:
        self._parts.append(data)

    def get_text(self) -> str:
        return " ".join(part.strip() for part in self._parts if part.strip())


def _strip_html(html: str) -> str:
    stripper = _HTMLStripper()
    try:
        stripper.feed(html)
        return stripper.get_text()
    except Exception:
        # fallback：正则粗暴剥标签
        return re.sub(r"<[^>]+>", " ", html)


def _decode_bytes(data: bytes, declared_charset: Optional[str]) -> str:
    """
    按 fallback 链解码字节串。
    fallback 链：声明的 charset → gbk → gb18030 → utf-8 → latin-1
    """
    charsets_to_try = []
    if declared_charset:
        charsets_to_try.append(declared_charset.lower())
    for cs in _GBK_FALLBACK_CHAIN:
        if cs not in charsets_to_try:
            charsets_to_try.append(cs)

    for charset in charsets_to_try:
        try:
            return data.decode(charset)
        except (UnicodeDecodeError, LookupError):
            continue
    # 理论上 latin-1 永不失败，走到这里说明 fallback 链有问题
    return data.decode("latin-1", errors="replace")


def _decode_header_value(raw_value: str) -> str:
    """
    解码 RFC2047 编码的邮件头字段（如 =?gb2312?B?...?= 形式的主题）。
    返回解码后的 Unicode 字符串。
    """
    parts = email.header.decode_header(raw_value)
    decoded_parts = []
    for chunk, charset in parts:
        if isinstance(chunk, bytes):
            decoded_parts.append(_decode_bytes(chunk, charset))
        else:
            decoded_parts.append(chunk)
    return "".join(decoded_parts)


def _decode_payload(part: Message) -> str:
    """解码 MIME part 的 payload，处理 GBK 编码。"""
    payload = part.get_payload(decode=True)
    if not payload:
        return ""
    declared_charset = part.get_content_charset()
    return _decode_bytes(payload, declared_charset)


def _decode_attachment_filename(part: Message) -> str:
    """提取附件文件名，处理 RFC2231 / RFC2047 编码及 GBK 文件名。"""
    # 优先从 Content-Disposition 取
    filename = part.get_filename()
    if filename:
        return _decode_header_value(filename)

    # 从 Content-Type 的 name 参数取
    name = part.get_param("name")
    if name:
        return _decode_header_value(name)

    return "unnamed"


def _extract_attachments(msg: Message) -> list:
    """遍历 MIME 树，提取所有附件。"""
    attachments = []
    for part in msg.walk():
        content_disposition = part.get_content_disposition()
        content_type = part.get_content_type()

        # 跳过 multipart 容器
        if part.get_content_maintype() == "multipart":
            continue

        # 判断是否为附件：Content-Disposition=attachment，或有文件名但不是内联
        is_attachment = content_disposition == "attachment"
        has_filename = bool(part.get_filename() or part.get_param("name"))
        is_inline_text = content_disposition in (None, "inline") and content_type.startswith("text/")

        if not is_attachment and not (has_filename and not is_inline_text):
            continue

        payload = part.get_payload(decode=True)
        if payload is None:
            continue

        filename = _decode_attachment_filename(part)
        att = Attachment(
            filename=filename,
            content_type=content_type,
            data=payload,
            size=len(payload),
        )
        attachments.append(att)
        logger.debug(f"附件: {filename} ({content_type}, {len(payload)} 字节)")

    return attachments


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    """解析邮件 Date 头，返回 datetime 对象。"""
    if not date_str:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(date_str)
        return parsed
    except Exception:
        return None


def parse_email(uid: str, raw_bytes: bytes) -> ParsedEmail:
    """
    将 RFC822 原始字节解析为 ParsedEmail。

    Args:
        uid: IMAP UID 字符串
        raw_bytes: UID FETCH RFC822 返回的原始邮件字节

    Returns:
        ParsedEmail 结构体
    """
    msg = email.message_from_bytes(raw_bytes)

    # 解析头部
    subject = _decode_header_value(msg.get("Subject", ""))
    sender = _decode_header_value(msg.get("From", ""))
    message_id = msg.get("Message-ID", "")
    date = _parse_date(msg.get("Date"))

    # 解析收件人
    recipients_raw = msg.get_all("To", []) + msg.get_all("Cc", [])
    recipients = [_decode_header_value(r) for r in recipients_raw]

    # 解析正文：优先 text/plain，同时保留 text/html
    text_body = ""
    html_body = ""

    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_maintype() == "multipart":
                continue
            if part.get_content_disposition() == "attachment":
                continue
            ct = part.get_content_type()
            if ct == "text/plain" and not text_body:
                text_body = _decode_payload(part)
            elif ct == "text/html" and not html_body:
                html_body = _decode_payload(part)
    else:
        ct = msg.get_content_type()
        if ct == "text/plain":
            text_body = _decode_payload(msg)
        elif ct == "text/html":
            html_body = _decode_payload(msg)

    # 如果没有 text/plain，从 HTML 提取纯文本
    if not text_body and html_body:
        text_body = _strip_html(html_body)

    # 提取附件
    attachments = _extract_attachments(msg)

    parsed = ParsedEmail(
        uid=uid,
        message_id=message_id,
        subject=subject,
        sender=sender,
        recipients=recipients,
        date=date,
        text_body=text_body,
        html_body=html_body,
        attachments=attachments,
    )

    logger.info(
        f"解析邮件 UID={uid} | 主题: {subject!r} | "
        f"发件人: {sender} | 附件: {len(attachments)} 个"
    )
    return parsed
