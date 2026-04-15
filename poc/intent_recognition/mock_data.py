"""
Mock 数据：申请列表 + 邮件模板

申请列表覆盖所有关键状态，邮件模板覆盖全部 intent 类型。
"""

import copy

# ── Mock 申请列表（运行时内存副本，状态可变） ─────────────────────────────
_MOCK_APPLICATIONS_TEMPLATE = [
    {
        "id": "app_001",
        "school": "MIT",
        "program": "计算机科学 MSc",
        "status": "已提交",
        "waitlist_mode": False,   # 候补监控模式开关
    },
    {
        "id": "app_002",
        "school": "Stanford",
        "program": "人工智能 PhD",
        "status": "面试邀请",
        "waitlist_mode": False,
    },
    {
        "id": "app_003",
        "school": "CMU",
        "program": "机器学习 MSML",
        "status": "候补名单",
        "waitlist_mode": True,    # 候补模式开启
    },
    {
        "id": "app_004",
        "school": "UC Berkeley",
        "program": "电气工程与计算机科学 MSc",
        "status": "材料准备中",
        "waitlist_mode": False,
    },
    {
        "id": "app_005",
        "school": "Harvard",
        "program": "数据科学 MDS",
        "status": "已录取",
        "waitlist_mode": False,
    },
]

# 运行时可变副本（demo.py 操作这个）
MOCK_APPLICATIONS: list[dict] = copy.deepcopy(_MOCK_APPLICATIONS_TEMPLATE)


def reset_applications() -> None:
    """重置所有申请到初始状态（用于测试重置）。"""
    global MOCK_APPLICATIONS
    MOCK_APPLICATIONS = copy.deepcopy(_MOCK_APPLICATIONS_TEMPLATE)


def get_application_by_id(app_id: str) -> dict | None:
    for app in MOCK_APPLICATIONS:
        if app["id"] == app_id:
            return app
    return None


def update_application_status(app_id: str, new_status: str) -> None:
    """更新 Mock 申请状态（内存操作）。"""
    for app in MOCK_APPLICATIONS:
        if app["id"] == app_id:
            app["status"] = new_status
            # 候补转正/拒绝时关闭候补监控
            if new_status in ("已录取", "已拒绝"):
                app["waitlist_mode"] = False
            # 进入候补时开启候补监控
            if new_status == "候补名单":
                app["waitlist_mode"] = True
            return


# ── Mock 邮件模板 ─────────────────────────────────────────────────────────
# 每个模板包含：name（展示名）、school（用于自动匹配）、content（邮件原文）、expected_intent（预期意图，仅供参考）

MOCK_EMAIL_TEMPLATES = [
    {
        "id": "email_001",
        "name": "MIT CS 录取通知",
        "school": "MIT",
        "expected_intent": "admitted",
        "content": """Subject: Congratulations! Admission Offer - MIT Computer Science MSc

Dear Applicant,

We are delighted to inform you that the Admissions Committee of the Massachusetts Institute of Technology
has voted to offer you admission to the Master of Science program in Computer Science for the Fall 2026 semester.

This offer reflects our confidence in your academic excellence and research potential.

Your admission offer is contingent upon:
- Successful completion of your current degree program
- Maintenance of your current academic standing

Please respond to this offer by May 15, 2026.

We look forward to welcoming you to MIT.

Sincerely,
MIT Graduate Admissions Office
admissions@mit.edu
""",
    },
    {
        "id": "email_002",
        "name": "Stanford AI PhD 拒信",
        "school": "Stanford",
        "expected_intent": "rejected",
        "content": """Subject: Stanford University Graduate Admissions Decision

Dear Applicant,

Thank you for your application to the Stanford University PhD program in Artificial Intelligence.

After careful review of all applications, we regret to inform you that we are unable to offer you admission
to our program for the 2026-2027 academic year. The competition for admission was exceptionally strong this year,
and we received many more qualified applications than we had positions available.

We encourage you to consider reapplying in the future and wish you success in your academic endeavors.

Best regards,
Stanford Graduate Admissions
""",
    },
    {
        "id": "email_003",
        "name": "CMU MSML 面试邀请",
        "school": "CMU",
        "expected_intent": "interview_invite",
        "content": """Subject: Interview Invitation - CMU MSML Program

Dear Applicant,

We are pleased to invite you to interview for the Master of Science in Machine Learning program
at Carnegie Mellon University.

Interview Details:
- Date: March 15, 2026
- Time: 10:00 AM - 11:00 AM (Eastern Time) / 23:00 - 24:00 (Beijing Time)
- Format: Zoom Video Conference
- Meeting ID: 987-654-321
- Password: CMUML2026

The interview will be conducted by two faculty members from the MLKD group and will last approximately 45-60 minutes.
Topics may include your research experience, technical background, and motivation for the program.

Please confirm your availability by replying to this email by March 10, 2026.

Best regards,
CMU MSML Admissions Committee
""",
    },
    {
        "id": "email_004",
        "name": "UC Berkeley EECS 候补通知",
        "school": "UC Berkeley",
        "expected_intent": "waitlisted",
        "content": """Subject: UC Berkeley EECS MSc - Waitlist Notification

Dear Applicant,

Thank you for applying to the Master of Science in Electrical Engineering and Computer Sciences at UC Berkeley.

After reviewing your application, the Admissions Committee has placed you on our waitlist for the Fall 2026 class.
While we are not able to offer you admission at this time, your application remains under active consideration.

Waitlisted applicants will be notified of any changes to their status as space becomes available,
typically between April and June 2026.

We encourage you to notify us if you have received other offers that you are seriously considering,
as this may affect the waitlist process.

Sincerely,
UC Berkeley Graduate Division
""",
    },
    {
        "id": "email_005",
        "name": "CMU MSML 候补转正通知",
        "school": "CMU",
        "expected_intent": "waitlist_converted",
        "content": """Subject: IMPORTANT: Updated Admission Decision - CMU MSML

Dear Applicant,

We are writing to inform you of an important update regarding your application to the
Master of Science in Machine Learning program at Carnegie Mellon University.

We are pleased to offer you admission from our waitlist for the Fall 2026 semester.
A space has become available, and after reviewing our waitlist, we would like to extend you a formal offer of admission.

This offer is valid until April 30, 2026. Please confirm your acceptance by that date.

Congratulations, and we look forward to having you join our program!

Best regards,
CMU MSML Admissions
admissions-msml@cs.cmu.edu
""",
    },
    {
        "id": "email_006",
        "name": "Harvard MDS 申请提交确认",
        "school": "Harvard",
        "expected_intent": "submission_confirmed",
        "content": """Subject: Application Received - Harvard Data Science MDS

Dear Applicant,

This email confirms that we have received your complete application for the
Master of Data Science program at Harvard University for Fall 2026.

Application Reference Number: HDS-2026-78432

Your application is now under review. The admissions committee will evaluate all applications
after the January 15, 2026 deadline. We expect to send decisions by March 2026.

You may check your application status at apply.harvard.edu using your applicant ID.

Thank you for your interest in Harvard University.

Harvard Graduate School of Arts and Sciences
""",
    },
]
