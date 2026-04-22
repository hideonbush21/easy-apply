import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # 基础信息
    title = db.Column(db.String(200), nullable=False)
    is_all_day = db.Column(db.Boolean, default=False)
    start_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_date = db.Column(db.Date)
    end_time = db.Column(db.Time)
    timezone = db.Column(db.String(50), default='Asia/Shanghai')

    # 分类
    category = db.Column(db.String(50), nullable=False, default='custom')

    # 关联 Application
    application_id = db.Column(UUID(as_uuid=True), db.ForeignKey('applications.id', ondelete='SET NULL'), nullable=True)

    # 来源
    origin = db.Column(db.String(50), default='manual')
    email_fingerprint = db.Column(db.String(100), unique=True, nullable=True)
    extracted_raw_content = db.Column(db.Text)

    # 状态机联动
    status_change_from = db.Column(db.String(50))
    status_change_to = db.Column(db.String(50))
    status_change_confidence = db.Column(db.Float)
    status_change_auto_executed = db.Column(db.Boolean, default=False)
    status_change_confirmed_at = db.Column(db.DateTime(timezone=True))

    # UI
    color = db.Column(db.String(20))

    # 用户权限
    editable_by_user = db.Column(db.Boolean, default=True)
    deletable_by_user = db.Column(db.Boolean, default=True)

    # 用户交互
    manual_completed = db.Column(db.Boolean, default=False)
    manual_completed_at = db.Column(db.DateTime(timezone=True))
    user_notes = db.Column(db.Text, default='')

    # 生命周期
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime(timezone=True))
    archived_at = db.Column(db.DateTime(timezone=True))

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'title': self.title,
            'is_all_day': self.is_all_day,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'timezone': self.timezone,
            'category': self.category,
            'application_id': str(self.application_id) if self.application_id else None,
            'origin': self.origin,
            'color': self.color,
            'editable_by_user': self.editable_by_user,
            'deletable_by_user': self.deletable_by_user,
            'manual_completed': self.manual_completed,
            'manual_completed_at': self.manual_completed_at.isoformat() if self.manual_completed_at else None,
            'user_notes': self.user_notes or '',
            'status_change_from': self.status_change_from,
            'status_change_to': self.status_change_to,
            'status_change_confidence': self.status_change_confidence,
            'status_change_auto_executed': self.status_change_auto_executed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
