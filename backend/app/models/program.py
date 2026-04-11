import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.extensions import db


class Program(db.Model):
    __tablename__ = 'programs'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school_id = db.Column(UUID(as_uuid=True), db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    project_code = db.Column(db.String(20))          # PROJ0001
    name_cn = db.Column(db.String(300))              # 数据科学的运输理学硕士
    name_en = db.Column(db.String(300))              # MSc Transport with Data Science
    major_category = db.Column(db.String(100))       # 专业大类：交通运输
    department = db.Column(db.String(200))           # 学院：土木与环境工程学院
    intake_month = db.Column(db.String(20))          # 入学时间：9月
    duration = db.Column(db.String(50))              # 学制：1年
    tuition = db.Column(db.String(100))              # 42900英镑/年
    tuition_cny = db.Column(db.Integer)              # 411840
    description = db.Column(db.Text)
    requirements = db.Column(db.Text)               # 录取要求
    ielts_requirement = db.Column(JSONB)             # {"total": 6.5, "sub": 6.0}
    toefl_requirement = db.Column(JSONB)             # {"total": 92, "sub": 20}
    pte_requirement = db.Column(JSONB)               # {"total": 62, "sub": 56}
    deadline_26fall = db.Column(db.Date)
    deadline_25fall = db.Column(db.Date)
    application_plan = db.Column(JSONB)              # 多轮次时间计划
    program_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_school=False):
        data = {
            'id': str(self.id),
            'school_id': str(self.school_id),
            'project_code': self.project_code,
            'name_cn': self.name_cn,
            'name_en': self.name_en,
            'major_category': self.major_category,
            'department': self.department,
            'intake_month': self.intake_month,
            'duration': self.duration,
            'tuition': self.tuition,
            'tuition_cny': self.tuition_cny,
            'description': self.description,
            'requirements': self.requirements,
            'ielts_requirement': self.ielts_requirement,
            'toefl_requirement': self.toefl_requirement,
            'pte_requirement': self.pte_requirement,
            'deadline_26fall': self.deadline_26fall.isoformat() if self.deadline_26fall else None,
            'deadline_25fall': self.deadline_25fall.isoformat() if self.deadline_25fall else None,
            'application_plan': self.application_plan,
            'program_url': self.program_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        if include_school and self.school:
            data['school'] = self.school.to_dict()
        return data
