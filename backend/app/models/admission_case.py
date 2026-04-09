import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class AdmissionCase(db.Model):
    __tablename__ = 'admission_cases'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 申请目标
    country = db.Column(db.String(50), nullable=False, index=True)
    degree_level = db.Column(db.String(20), nullable=False, index=True)  # 硕士/本科/博士
    school_name_cn = db.Column(db.String(200))
    school_name_en = db.Column(db.String(200), index=True)
    school_name_raw = db.Column(db.String(200))
    major_name_raw = db.Column(db.String(500))
    major_name_cn = db.Column(db.String(500))
    major_name_en = db.Column(db.String(500))

    # 申请人背景
    undergrad_school = db.Column(db.String(200))
    undergrad_tier = db.Column(db.String(20), index=True)   # 985/211/双非/海外院校/C9
    undergrad_major = db.Column(db.String(300))
    avg_score = db.Column(db.Numeric(5, 2))                 # 均分
    gpa = db.Column(db.Numeric(4, 2))                       # GPA

    # 申请结果
    result = db.Column(db.String(20), nullable=False, default='录取', index=True)

    # 可选关联（来源不同，允许为空）
    school_id = db.Column(UUID(as_uuid=True), db.ForeignKey('schools.id', ondelete='SET NULL'), nullable=True)
    program_id = db.Column(UUID(as_uuid=True), db.ForeignKey('programs.id', ondelete='SET NULL'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.Index('ix_admission_cases_country_level_result', 'country', 'degree_level', 'result'),
        db.Index('ix_admission_cases_tier_gpa', 'undergrad_tier', 'gpa'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'country': self.country,
            'degree_level': self.degree_level,
            'school_name_cn': self.school_name_cn,
            'school_name_en': self.school_name_en,
            'school_name_raw': self.school_name_raw,
            'major_name_raw': self.major_name_raw,
            'major_name_cn': self.major_name_cn,
            'major_name_en': self.major_name_en,
            'undergrad_school': self.undergrad_school,
            'undergrad_tier': self.undergrad_tier,
            'undergrad_major': self.undergrad_major,
            'avg_score': float(self.avg_score) if self.avg_score is not None else None,
            'gpa': float(self.gpa) if self.gpa is not None else None,
            'result': self.result,
        }
