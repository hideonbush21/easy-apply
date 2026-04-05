"""
数据库迁移脚本 - 自动执行 migrations/ 目录下的 SQL 文件
"""
import os
import sys

# 确保使用 backend 目录的 .env
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'migrations')


def run_migrations():
    app = create_app()
    with app.app_context():
        conn = db.engine.raw_connection()
        cursor = conn.cursor()

        sql_files = sorted(
            f for f in os.listdir(MIGRATIONS_DIR) if f.endswith('.sql')
        )

        if not sql_files:
            print('[migrate] No SQL migration files found.')
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
