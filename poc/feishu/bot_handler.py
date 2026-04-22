"""
飞书机器人消息处理模块

职责：事件去重 → mention 清理 → LLM 调用 → 飞书回复
"""

import json
import time
import threading
import logging
import os

from openai import OpenAI

import lark_oapi as lark
from lark_oapi.api.im.v1 import (
    ReplyMessageRequest,
    ReplyMessageRequestBody,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 事件去重：内存 dict，key=event_id，value=timestamp，5 分钟过期
# ---------------------------------------------------------------------------
_seen_events: dict[str, float] = {}
_seen_lock = threading.Lock()
_EVENT_TTL = 300  # 5 min


def _is_duplicate(event_id: str) -> bool:
    """检查 event_id 是否已处理过，同时清理过期条目"""
    now = time.time()
    with _seen_lock:
        # 清理过期
        expired = [k for k, v in _seen_events.items() if now - v > _EVENT_TTL]
        for k in expired:
            del _seen_events[k]
        # 检查 & 标记
        if event_id in _seen_events:
            return True
        _seen_events[event_id] = now
        return False


# ---------------------------------------------------------------------------
# Mention 清理
# ---------------------------------------------------------------------------
def _clean_mention_text(content_json: str, mentions: list | None) -> str:
    """
    飞书消息中 @机器人 显示为 @_user_1 占位符，需要去掉。

    content_json 格式: '{"text":"@_user_1 你好"}'
    mentions: [{"key":"@_user_1", ...}]
    """
    try:
        text = json.loads(content_json).get("text", "")
    except (json.JSONDecodeError, TypeError):
        return ""

    if mentions:
        for m in mentions:
            key = m.get("key", "")
            if key:
                text = text.replace(key, "")

    return text.strip()


# ---------------------------------------------------------------------------
# LLM 调用
# ---------------------------------------------------------------------------
def _call_llm(user_text: str) -> str:
    """调用 Kimi (Moonshot) Chat API 生成回复"""
    system_prompt = os.environ.get(
        "BOT_SYSTEM_PROMPT",
        "你是一个留学申请助手，帮助用户解答留学相关问题。请用简洁友好的语气回答。",
    )
    try:
        client = OpenAI(
            api_key=os.environ["KIMI_API_KEY"],
            base_url="https://api.moonshot.cn/v1",
        )
        resp = client.chat.completions.create(
            model="moonshot-v1-8k",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            max_tokens=1024,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"LLM 调用失败: {e}")
        return "抱歉，我暂时无法处理你的请求，请稍后再试。"


# ---------------------------------------------------------------------------
# 飞书回复
# ---------------------------------------------------------------------------
def _reply_message(client: lark.Client, message_id: str, text: str) -> None:
    """通过飞书 API reply 到原消息"""
    body = (
        ReplyMessageRequestBody.builder()
        .content(json.dumps({"text": text}))
        .msg_type("text")
        .build()
    )
    request = (
        ReplyMessageRequest.builder()
        .message_id(message_id)
        .request_body(body)
        .build()
    )
    resp = client.im.v1.message.reply(request)
    if not resp.success():
        logger.error(
            f"飞书回复失败: code={resp.code}, msg={resp.msg}, "
            f"log_id={resp.get_log_id()}"
        )
    else:
        logger.info(f"回复成功: message_id={message_id}")


# ---------------------------------------------------------------------------
# 后台处理线程
# ---------------------------------------------------------------------------
def _handle_and_reply(client: lark.Client, message_id: str, user_text: str) -> None:
    """后台线程：LLM 生成 → 飞书回复"""
    logger.info(f"开始处理消息: message_id={message_id}, text={user_text!r}")
    reply_text = _call_llm(user_text)
    _reply_message(client, message_id, reply_text)


# ---------------------------------------------------------------------------
# 事件回调（由 app.py 注册到 EventDispatcherHandler）
# ---------------------------------------------------------------------------
def make_message_handler(client: lark.Client):
    """
    工厂函数：创建消息事件回调，闭包持有 lark.Client 用于回复。

    返回的函数签名满足 lark-oapi register_p2_im_message_receive_v1 要求。
    """

    def on_message_receive(data: lark.im.v1.P2ImMessageReceiveV1) -> None:
        event_id = data.header.event_id
        if _is_duplicate(event_id):
            logger.info(f"重复事件，跳过: {event_id}")
            return

        msg = data.event.message
        # 只处理文本消息
        if msg.message_type != "text":
            logger.info(f"非文本消息，跳过: type={msg.message_type}")
            return

        # 提取并清理文本
        mentions_raw = msg.mentions if hasattr(msg, "mentions") else None
        mentions = []
        if mentions_raw:
            mentions = [{"key": m.key} for m in mentions_raw]

        user_text = _clean_mention_text(msg.content, mentions)
        if not user_text:
            logger.info("消息内容为空，跳过")
            return

        sender = data.event.sender
        logger.info(
            f"收到消息: event_id={event_id}, "
            f"sender={sender.sender_id.open_id}, "
            f"chat_id={msg.chat_id}, "
            f"text={user_text!r}"
        )

        # 后台线程处理，不阻塞事件回调（飞书 3s 超时）
        t = threading.Thread(
            target=_handle_and_reply,
            args=(client, msg.message_id, user_text),
            daemon=True,
        )
        t.start()

    return on_message_receive
