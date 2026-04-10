import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(UUID(as_uuid=True), db.ForeignKey('schools.id', ondelete='SET NULL'), nullable=True)
    program_id = db.Column(UUID(as_uuid=True), db.ForeignKey('programs.id', ondelete='SET NULL'), nullable=True)
    major = db.Column(db.String(100))          # 兼容旧数据；新数据从 program 读
    status = db.Column(db.String(50), default='待申请')
    priority = db.Column(db.String(20))        # 冲刺/匹配/保底
    application_deadline = db.Column(db.Date)  # 兼容旧数据；新数据从 program 读
    applied_at = db.Column(db.DateTime)
    result_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    program = db.relationship('Program', backref='applications', lazy='joined')
    recommendation_letters = db.relationship(
        'RecommendationLetter', backref='application', cascade='all, delete-orphan'
    )

    def to_dict(self, include_school=False):
        p = self.program
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'school_id': str(self.school_id) if self.school_id else (str(p.school_id) if p else None),
            'program_id': str(self.program_id) if self.program_id else None,
            # Program 详情（新数据优先，旧数据兼容）
            'program_name_cn': p.name_cn if p else None,
            'program_name_en': p.name_en if p else None,
            'program_url': p.program_url if p else None,
            'department': p.department if p else None,
            'duration': p.duration if p else None,
            'tuition': p.tuition if p else None,
            'tuition_cny': float(p.tuition_cny) if p and p.tuition_cny else None,
            'ielts_requirement': p.ielts_requirement if p else None,
            'toefl_requirement': p.toefl_requirement if p else None,
            # 学校信息（通过 program.school 关联）
            'school_name': (p.school.name if p and p.school else None) or (self.school.name if self.school_id and self.school else None),
            'school_name_cn': (p.school.name_cn if p and p.school else None) or (self.school.name_cn if self.school_id and self.school else None),
            'school_ranking': p.school.ranking if p and p.school else None,
            # 兼容旧字段
            'major': self.major or (p.name_cn if p else None),
            'status': self.status,
            'priority': self.priority,
            'application_deadline': (
                p.deadline_26fall.isoformat() if p and p.deadline_26fall else
                p.deadline_25fall.isoformat() if p and p.deadline_25fall else
                self.application_deadline.isoformat() if self.application_deadline else None
            ),
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'result_date': self.result_date.isoformat() if self.result_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_school and self.school:
            data['school'] = self.school.to_dict()
        return data
