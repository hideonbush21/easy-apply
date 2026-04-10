import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Numeric
from app.extensions import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nickname = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False, server_default='')
    email = db.Column(db.String(255), unique=True, nullable=True)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = db.relationship('UserProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    experiences = db.relationship('Experience', backref='user', cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='user', cascade='all, delete-orphan')
    login_logs = db.relationship('UserLoginLog', backref='user', cascade='all, delete-orphan',
                                 order_by='UserLoginLog.login_at.desc()')

    def to_dict(self):
        last_log = self.login_logs[0] if self.login_logs else None
        return {
            'id': str(self.id),
            'nickname': self.nickname,
            'email': self.email,
            'is_admin': self.is_admin,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last_login_at': last_log.login_at.isoformat() if last_log else None,
            'last_login_ip': last_log.ip_address if last_log else None,
        }


class UserLoginLog(db.Model):
    __tablename__ = 'user_login_logs'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    login_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45))

    def to_dict(self):
        return {
            'login_at': self.login_at.isoformat() if self.login_at else None,
            'ip_address': self.ip_address,
        }


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True)
    name = db.Column(db.String(100))
    home_institution = db.Column(db.String(200))
    institution_tier = db.Column(db.String(20))  # c9/985/211/double_non/overseas/other
    current_major = db.Column(db.String(100))
    gpa = db.Column(Numeric(3, 2))
    gpa_scale = db.Column(Numeric(3, 1))
    language_scores = db.Column(JSONB)    # {"toefl": 108, "ielts": 7.5}
    target_countries = db.Column(JSONB)   # ["美国", "英国"]
    target_majors = db.Column(JSONB)      # ["计算机科学"]
    degree_type = db.Column(db.String(20))  # master/phd/bachelor
    completion_rate = db.Column(Numeric(5, 2), default=0)
    recommendation_cache = db.Column(JSONB)
    recommendation_hash = db.Column(db.String(64))
    recommendation_status = db.Column(db.String(20))  # None | 'pending' | 'done' | 'failed'
    onboarding_goals = db.Column(JSONB)    # ["智能选校推荐", "申请时间线"]
    onboarding_stage = db.Column(db.String(20))  # 不到大三 | 大三 | 大四 | 已毕业
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def calculate_completion_rate(self):
        fields = [
            self.name,
            self.home_institution,
            self.institution_tier,
            self.current_major,
            self.gpa,
            self.language_scores,
            self.target_countries,
            self.target_majors,
        ]
        filled = sum(1 for f in fields if f is not None and f != '' and f != [] and f != {})
        return round(filled / len(fields) * 100, 2)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'name': self.name,
            'home_institution': self.home_institution,
            'institution_tier': self.institution_tier,
            'current_major': self.current_major,
            'gpa': float(self.gpa) if self.gpa is not None else None,
            'gpa_scale': float(self.gpa_scale) if self.gpa_scale is not None else None,
            'language_scores': self.language_scores,
            'target_countries': self.target_countries,
            'target_majors': self.target_majors,
            'degree_type': self.degree_type,
            'completion_rate': float(self.completion_rate) if self.completion_rate is not None else 0,
            'onboarding_goals': self.onboarding_goals,
            'onboarding_stage': self.onboarding_stage,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
