import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.extensions import db


class School(db.Model):
    __tablename__ = 'schools'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(200), nullable=False)
    name_cn = db.Column(db.String(200))
    country = db.Column(db.String(50), nullable=False)
    ranking = db.Column(db.Integer)
    majors = db.Column(JSONB)               # ["计算机科学", ...]
    gpa_requirement = db.Column(JSONB)      # {"min": 3.0, "preferred": 3.5}
    language_requirement = db.Column(JSONB) # {"toefl": 100, "ielts": 7.0}
    application_deadline = db.Column(db.Date)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    applications = db.relationship('Application', backref='school', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'name_cn': self.name_cn,
            'country': self.country,
            'ranking': self.ranking,
            'majors': self.majors,
            'gpa_requirement': self.gpa_requirement,
            'language_requirement': self.language_requirement,
            'application_deadline': self.application_deadline.isoformat() if self.application_deadline else None,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
