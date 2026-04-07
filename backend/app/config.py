import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key')
    _db_url = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/easy_apply')
    # Supabase / Heroku returns "postgres://", SQLAlchemy 3.x requires "postgresql://"
    SQLALCHEMY_DATABASE_URI = _db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # 5秒连接超时，避免 DB 不可达时卡死启动
    SQLALCHEMY_ENGINE_OPTIONS = {'connect_args': {'connect_timeout': 5}}
    KIMI_API_KEY = os.getenv('KIMI_API_KEY', '')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
