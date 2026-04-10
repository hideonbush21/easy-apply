import os
import resend

_OTP_HTML = """<!DOCTYPE html>
<html lang="zh">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f7f6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:linear-gradient(135deg,#1dd3b0,#10b981);padding:28px 36px;">
            <span style="font-size:22px;font-weight:700;color:#fff;">EasyApply</span>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 36px 28px;">
            <p style="margin:0 0 8px;font-size:15px;color:#374151;">你好，</p>
            <p style="margin:0 0 28px;font-size:15px;color:#374151;line-height:1.6;">
              你正在登录 / 注册 EasyApply 账号，验证码如下：
            </p>
            <div style="background:#f0fdf9;border:2px dashed #1dd3b0;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px;">
              <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#0d9e88;font-family:monospace;">{code}</span>
            </div>
            <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
              验证码 <strong>5 分钟内</strong>有效，请勿泄露给他人。<br>
              如果这不是你的操作，请忽略此邮件。
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 36px 28px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#d1d5db;">此邮件由系统自动发出，请勿回复。</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_otp_email(to: str, code: str) -> None:
    resend.api_key = os.environ['RESEND_API_KEY']
    mail_from = os.environ.get('MAIL_FROM', 'noreply@easyapply.chat')
    resend.Emails.send({
        'from': mail_from,
        'to': [to],
        'subject': f'[EasyApply] 验证码：{code}',
        'html': _OTP_HTML.format(code=code),
    })
