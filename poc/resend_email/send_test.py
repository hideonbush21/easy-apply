"""
POC: Resend 发送邮件测试
用法:
    1. cp .env.example .env  然后填入真实的 RESEND_API_KEY / MAIL_FROM / MAIL_TO
    2. pip install -r requirements.txt
    3. python send_test.py
"""

import os
import resend
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.environ['RESEND_API_KEY']
MAIL_FROM = os.environ['MAIL_FROM']
MAIL_TO = os.environ['MAIL_TO']


def send_plain(to: str, subject: str, html: str) -> dict:
    resend.api_key = RESEND_API_KEY
    return resend.Emails.send({
        'from': MAIL_FROM,
        'to': [to],
        'subject': subject,
        'html': html,
    })


HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px;">
  <div style="max-width:480px;margin:0 auto;background:#1e1b4b;border-radius:12px;padding:32px;">
    <h2 style="color:#a78bfa;margin-top:0;">EasyApply</h2>
    <p>你好，这是一封来自 <strong>EasyApply</strong> 的测试邮件。</p>
    <p>如果你收到这封邮件，说明 Resend 集成配置正确。</p>
    <hr style="border-color:#312e81;">
    <p style="color:#64748b;font-size:12px;">此邮件由系统自动发出，请勿回复。</p>
  </div>
</body>
</html>
"""


if __name__ == '__main__':
    print(f'发件人: {MAIL_FROM}')
    print(f'收件人: {MAIL_TO}')
    print('发送中...')

    try:
        result = send_plain(
            to=MAIL_TO,
            subject='[EasyApply] Resend 集成测试',
            html=HTML_TEMPLATE,
        )
        print(f'发送成功！邮件 ID: {result["id"]}')
    except Exception as e:
        print(f'发送失败: {e}')
