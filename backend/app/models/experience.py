import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.extensions import db


class Experience(db.Model):
    __tablename__ = 'experiences'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # education/academic/professional/extracurricular (+ legacy values)
    title = db.Column(db.String(200), nullable=False)
    organization = db.Column(db.String(200))
    role = db.Column(db.String(100))
    start_date = db.Column(db.String(7))    # YYYY-MM
    end_date = db.Column(db.String(7))      # YYYY-MM or "present"
    description = db.Column(db.Text)
    achievements = db.Column(JSONB)          # ["获得一等奖"]
    skills = db.Column(JSONB)               # ["Python"]

    # ── 新增字段（各 category 按需使用）──
    importance = db.Column(db.String(20))           # 学术/职业/课外: 重要/一般/次要
    country = db.Column(db.String(100))             # 教育: 院校所在国家
    degree_level = db.Column(db.String(50))         # 教育: 学历 (本科/硕士/博士)
    degree_name = db.Column(db.String(100))         # 教育: 学位
    major = db.Column(db.String(100))               # 教育: 专业
    gpa_info = db.Column(db.String(100))            # 教育: 成绩
    other_info = db.Column(db.Text)                 # 教育: 其他信息
    related_degree = db.Column(db.String(50))       # 学术/课外: 相关学历
    subjective_description = db.Column(db.Text)     # 学术/职业/课外: 主观性描述
    work_type = db.Column(db.String(50))            # 职业: 工作类型

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'type': self.type,
            'title': self.title,
            'organization': self.organization,
            'role': self.role,
            'start_date': self.start_date,
            'end_date': self.end_date,
            'description': self.description,
            'achievements': self.achievements,
            'skills': self.skills,
            'importance': self.importance,
            'country': self.country,
            'degree_level': self.degree_level,
            'degree_name': self.degree_name,
            'major': self.major,
            'gpa_info': self.gpa_info,
            'other_info': self.other_info,
            'related_degree': self.related_degree,
            'subjective_description': self.subjective_description,
            'work_type': self.work_type,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
