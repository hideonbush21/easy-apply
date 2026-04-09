"""
从 Excel 导入历史录取案例数据到 admission_cases 表。
用法：python seed_data/import_admission_cases.py <excel_path>
"""

import sys
import os
import pandas as pd


def parse_numeric(val, max_val=None):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    try:
        f = float(str(val).strip())
        if max_val is not None and f > max_val:
            return None
        return f
    except (ValueError, TypeError):
        return None


def import_excel(excel_path):
    print(f"读取文件：{excel_path}")
    df = pd.read_excel(excel_path)
    print(f"共 {len(df)} 条记录，开始导入...")

    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app import create_app
    from app.extensions import db
    from app.models.admission_case import AdmissionCase

    app = create_app()
    with app.app_context():
        db.create_all()

        inserted = 0
        batch = []

        for i, row in df.iterrows():
            case = AdmissionCase(
                country=str(row['国家']).strip(),
                degree_level=str(row['层次']).strip(),
                school_name_cn=str(row['申请学校中文名称']).strip() if pd.notna(row['申请学校中文名称']) else None,
                school_name_en=str(row['申请学校英文名称']).strip() if pd.notna(row['申请学校英文名称']) else None,
                school_name_raw=str(row['申请学校原始数据']).strip() if pd.notna(row['申请学校原始数据']) else None,
                major_name_raw=str(row['申请专业原始数据']).strip() if pd.notna(row['申请专业原始数据']) else None,
                major_name_cn=str(row['申请专业中文名称']).strip() if pd.notna(row['申请专业中文名称']) else None,
                major_name_en=str(row['申请专业英文名称']).strip() if pd.notna(row['申请专业英文名称']) else None,
                undergrad_school=str(row['本科学校']).strip() if pd.notna(row['本科学校']) else None,
                undergrad_tier=str(row['本科学校等级']).strip() if pd.notna(row['本科学校等级']) else None,
                undergrad_major=str(row['本科专业']).strip() if pd.notna(row['本科专业']) else None,
                avg_score=parse_numeric(row['均分'], max_val=150),
                gpa=parse_numeric(row['GPA'], max_val=4.0),
                result='录取',
            )
            batch.append(case)
            inserted += 1

            if len(batch) >= 500:
                db.session.bulk_save_objects(batch)
                db.session.commit()
                batch = []
                print(f"  进度：{inserted}/{len(df)}")

        if batch:
            db.session.bulk_save_objects(batch)
            db.session.commit()

        print(f"\n✅ 导入完成：共写入 {inserted} 条录取案例")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法：python seed_data/import_admission_cases.py <excel_path>")
        sys.exit(1)
    import_excel(sys.argv[1])
