"""
飞书机器人 POC — Flask 主应用

启动方式: python app.py
服务端口: 9999
Webhook 端点: POST /webhook/event
"""

import os
import logging

from dotenv import load_dotenv

load_dotenv()

import lark_oapi as lark
from lark_oapi.adapter.flask import parse_req, parse_resp
from flask import Flask

from bot_handler import make_message_handler

# ---------------------------------------------------------------------------
# 日志配置
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 环境变量
# ---------------------------------------------------------------------------
FEISHU_APP_ID = os.environ["FEISHU_APP_ID"]
FEISHU_APP_SECRET = os.environ["FEISHU_APP_SECRET"]
FEISHU_ENCRYPT_KEY = os.environ.get("FEISHU_ENCRYPT_KEY", "")
FEISHU_VERIFICATION_TOKEN = os.environ.get("FEISHU_VERIFICATION_TOKEN", "")

# ---------------------------------------------------------------------------
# Lark Client（用于主动调用飞书 API，如回复消息）
# ---------------------------------------------------------------------------
lark_client = (
    lark.Client.builder()
    .app_id(FEISHU_APP_ID)
    .app_secret(FEISHU_APP_SECRET)
    .log_level(lark.LogLevel.INFO)
    .build()
)

# ---------------------------------------------------------------------------
# 事件处理器
# ---------------------------------------------------------------------------
message_handler = make_message_handler(lark_client)

event_handler = (
    lark.EventDispatcherHandler.builder(
        FEISHU_ENCRYPT_KEY,
        FEISHU_VERIFICATION_TOKEN,
    )
    .register_p2_im_message_receive_v1(message_handler)
    .build()
)

# ---------------------------------------------------------------------------
# Flask 应用
# ---------------------------------------------------------------------------
app = Flask(__name__)


@app.route("/webhook/event", methods=["POST"])
def webhook_event():
    resp = event_handler.do(parse_req())
    return parse_resp(resp)


@app.route("/health", methods=["GET"])
def health():
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# 启动
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("飞书机器人 POC 启动中...")
    logger.info(f"App ID: {FEISHU_APP_ID[:8]}...")
    logger.info("Webhook 端点: POST /webhook/event")
    logger.info("健康检查: GET /health")
    app.run(host="0.0.0.0", port=9999, debug=True)
