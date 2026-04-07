"""
数据库迁移脚本 - 自动执行 migrations/ 目录下的 SQL 文件
直接使用 psycopg2，不依赖 Flask/SQLAlchemy，避免 schema 检查副作用
"""
import os
import sys

import psycopg2
from dotenv import load_dotenv

# 确保加载 backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'migrations')


def run_migrations():
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('[migrate] ERROR: DATABASE_URL not set in .env')
        sys.exit(1)

    try:
        conn = psycopg2.connect(db_url)
    except Exception as e:
        print(f'[migrate] ERROR: Cannot connect to database: {e}')
        sys.exit(1)

    cursor = conn.cursor()

    sql_files = sorted(
        f for f in os.listdir(MIGRATIONS_DIR) if f.endswith('.sql')
    )

    if not sql_files:
        print('[migrate] No SQL migration files found.')
        cursor.close()
        conn.close()
        return

    for filename in sql_files:
        filepath = os.path.join(MIGRATIONS_DIR, filename)
        with open(filepath, 'r') as f:
            sql = f.read()
        try:
            cursor.execute(sql)
            conn.commit()
            print(f'[migrate] OK: {filename}')
        except Exception as e:
            conn.rollback()
            print(f'[migrate] SKIP ({filename}): {e}')

    cursor.close()
    conn.close()


if __name__ == '__main__':
    run_migrations()
