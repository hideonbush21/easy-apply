import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.extensions import db


class Experience(db.Model):
    __tablename__ = 'experiences'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 实习/科研/竞赛/论文/项目/志愿者/社团/其他
    title = db.Column(db.String(200), nullable=False)
    organization = db.Column(db.String(200))
    role = db.Column(db.String(100))
    start_date = db.Column(db.String(7))    # YYYY-MM
    end_date = db.Column(db.String(7))      # YYYY-MM or "present"
    description = db.Column(db.Text)
    achievements = db.Column(JSONB)          # ["获得一等奖"]
    skills = db.Column(JSONB)               # ["Python"]
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
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
