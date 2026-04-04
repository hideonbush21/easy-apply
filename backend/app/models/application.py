import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    school_id = db.Column(UUID(as_uuid=True), db.ForeignKey('schools.id', ondelete='CASCADE'), nullable=False)
    major = db.Column(db.String(100))
    status = db.Column(db.String(50), default='待申请')
    priority = db.Column(db.String(20))     # 冲刺/匹配/保底
    application_deadline = db.Column(db.Date)
    applied_at = db.Column(db.DateTime)
    result_date = db.Column(db.Date)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recommendation_letters = db.relationship(
        'RecommendationLetter', backref='application', cascade='all, delete-orphan'
    )

    def to_dict(self, include_school=False):
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'school_id': str(self.school_id),
            'major': self.major,
            'status': self.status,
            'priority': self.priority,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'result_date': self.result_date.isoformat() if self.result_date else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_school and self.school:
            data['school'] = self.school.to_dict()
        return data
