import datetime
import uuid
from flask import Blueprint, jsonify, request, g
from sqlalchemy import text
from app.extensions import db
from app.utils.decorators import login_required

debug_bp = Blueprint('debug', __name__, url_prefix='/api/debug')
debug_bp.strict_slashes = False

DEBUG_NICKNAME = 'aaaaaa'


def _require_debug_user():
    if g.user.nickname != DEBUG_NICKNAME:
        return jsonify({'error': 'Forbidden'}), 403
    return None


def _validate_table(table_name: str):
    """校验 public schema 下表名存在，防止 SQL 注入"""
    check_sql = text("""
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = :tname
    """)
    return db.session.execute(check_sql, {'tname': table_name}).fetchone() is not None


def _get_columns(table_name: str) -> list[str]:
    cols_sql = text("""
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = :tname
        ORDER BY ordinal_position
    """)
    return [r[0] for r in db.session.execute(cols_sql, {'tname': table_name}).fetchall()]


def _get_primary_keys(table_name: str) -> list[str]:
    pk_sql = text("""
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public'
          AND tc.table_name = :tname
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
    """)
    return [r[0] for r in db.session.execute(pk_sql, {'tname': table_name}).fetchall()]


def _serialize_value(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat()
    if isinstance(v, uuid.UUID):
        return str(v)
    if isinstance(v, bytes):
        return v.hex()
    return v


def _serialize_rows(col_names: list[str], rows) -> list[dict]:
    data = [dict(zip(col_names, row)) for row in rows]
    for row_dict in data:
        for k, v in row_dict.items():
            row_dict[k] = _serialize_value(v)
    return data


# ── LIST TABLES ──────────────────────────────────────────────

@debug_bp.route('/tables', methods=['GET'])
@login_required
def list_tables():
    denied = _require_debug_user()
    if denied:
        return denied

    tables_sql = text("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)
    table_names = [r[0] for r in db.session.execute(tables_sql).fetchall()]

    columns_sql = text("""
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    """)
    columns_by_table: dict[str, list] = {}
    for tname, cname, dtype, nullable, default in db.session.execute(columns_sql).fetchall():
        columns_by_table.setdefault(tname, []).append({
            'name': cname,
            'type': dtype,
            'nullable': nullable == 'YES',
            'default': default,
        })

    result = []
    for tname in table_names:
        count_sql = text(f'SELECT COUNT(*) FROM "{tname}"')  # noqa: S608
        row_count = db.session.execute(count_sql).scalar()
        result.append({
            'table_name': tname,
            'row_count': row_count,
            'columns': columns_by_table.get(tname, []),
            'primary_keys': _get_primary_keys(tname),
        })

    return jsonify({'tables': result})


# ── READ ROWS ────────────────────────────────────────────────

@debug_bp.route('/tables/<table_name>/rows', methods=['GET'])
@login_required
def read_rows(table_name):
    denied = _require_debug_user()
    if denied:
        return denied
    if not _validate_table(table_name):
        return jsonify({'error': 'Table not found'}), 404

    limit = min(request.args.get('limit', 50, type=int), 200)
    offset = request.args.get('offset', 0, type=int)

    col_names = _get_columns(table_name)
    rows_sql = text(f'SELECT * FROM "{table_name}" LIMIT :lim OFFSET :off')  # noqa: S608
    rows = db.session.execute(rows_sql, {'lim': limit, 'off': offset}).fetchall()

    return jsonify({
        'columns': col_names,
        'rows': _serialize_rows(col_names, rows),
        'primary_keys': _get_primary_keys(table_name),
        'limit': limit,
        'offset': offset,
    })


# ── CREATE ROW ───────────────────────────────────────────────

@debug_bp.route('/tables/<table_name>/rows', methods=['POST'])
@login_required
def create_row(table_name):
    denied = _require_debug_user()
    if denied:
        return denied
    if not _validate_table(table_name):
        return jsonify({'error': 'Table not found'}), 404

    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    valid_columns = set(_get_columns(table_name))
    cols = [c for c in data.keys() if c in valid_columns]
    if not cols:
        return jsonify({'error': 'No valid columns provided'}), 400

    # 过滤空字符串值为 None（让数据库使用默认值）
    values = {}
    for c in cols:
        v = data[c]
        values[c] = None if v == '' else v

    col_list = ', '.join(f'"{c}"' for c in cols)
    param_list = ', '.join(f':{c}' for c in cols)
    sql = text(f'INSERT INTO "{table_name}" ({col_list}) VALUES ({param_list}) RETURNING *')  # noqa: S608

    try:
        result = db.session.execute(sql, values).fetchone()
        db.session.commit()
        all_cols = _get_columns(table_name)
        return jsonify({'row': _serialize_rows(all_cols, [result])[0]}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# ── UPDATE ROW ───────────────────────────────────────────────

@debug_bp.route('/tables/<table_name>/rows', methods=['PUT'])
@login_required
def update_row(table_name):
    """
    Body: { "pk": {"id": "xxx"}, "data": {"col": "new_value"} }
    """
    denied = _require_debug_user()
    if denied:
        return denied
    if not _validate_table(table_name):
        return jsonify({'error': 'Table not found'}), 404

    body = request.get_json(silent=True) or {}
    pk = body.get('pk', {})
    data = body.get('data', {})
    if not pk or not data:
        return jsonify({'error': 'pk and data are required'}), 400

    valid_columns = set(_get_columns(table_name))
    primary_keys = _get_primary_keys(table_name)
    if not primary_keys:
        return jsonify({'error': 'Table has no primary key, cannot update'}), 400

    # 校验 pk 字段合法
    for k in pk:
        if k not in valid_columns:
            return jsonify({'error': f'Invalid pk column: {k}'}), 400

    set_parts = []
    params = {}
    for col, val in data.items():
        if col not in valid_columns:
            continue
        set_parts.append(f'"{col}" = :set_{col}')
        params[f'set_{col}'] = None if val == '' else val

    if not set_parts:
        return jsonify({'error': 'No valid columns to update'}), 400

    where_parts = []
    for col, val in pk.items():
        where_parts.append(f'"{col}" = :pk_{col}')
        params[f'pk_{col}'] = val

    sql = text(
        f'UPDATE "{table_name}" SET {", ".join(set_parts)} '  # noqa: S608
        f'WHERE {" AND ".join(where_parts)} RETURNING *'
    )

    try:
        result = db.session.execute(sql, params).fetchone()
        db.session.commit()
        if not result:
            return jsonify({'error': 'Row not found'}), 404
        all_cols = _get_columns(table_name)
        return jsonify({'row': _serialize_rows(all_cols, [result])[0]})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# ── DELETE ROW ───────────────────────────────────────────────

@debug_bp.route('/tables/<table_name>/rows', methods=['DELETE'])
@login_required
def delete_row(table_name):
    """
    Body: { "pk": {"id": "xxx"} }
    """
    denied = _require_debug_user()
    if denied:
        return denied
    if not _validate_table(table_name):
        return jsonify({'error': 'Table not found'}), 404

    body = request.get_json(silent=True) or {}
    pk = body.get('pk', {})
    if not pk:
        return jsonify({'error': 'pk is required'}), 400

    valid_columns = set(_get_columns(table_name))
    for k in pk:
        if k not in valid_columns:
            return jsonify({'error': f'Invalid pk column: {k}'}), 400

    where_parts = []
    params = {}
    for col, val in pk.items():
        where_parts.append(f'"{col}" = :pk_{col}')
        params[f'pk_{col}'] = val

    sql = text(f'DELETE FROM "{table_name}" WHERE {" AND ".join(where_parts)}')  # noqa: S608

    try:
        result = db.session.execute(sql, params)
        db.session.commit()
        if result.rowcount == 0:
            return jsonify({'error': 'Row not found'}), 404
        return jsonify({'message': 'deleted', 'count': result.rowcount})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# ── LOGS ─────────────────────────────────────────────────────

@debug_bp.route('/logs', methods=['GET'])
@login_required
def get_logs():
    denied = _require_debug_user()
    if denied:
        return denied

    from app.services.log_collector import get_log_handler
    handler = get_log_handler()

    level_param = request.args.get('level', '')
    levels = {l.strip().upper() for l in level_param.split(',') if l.strip()} or None
    search = request.args.get('search', '').strip() or None
    limit = min(request.args.get('limit', 200, type=int), 500)

    logs = handler.get_logs(levels=levels, search=search, limit=limit)
    return jsonify({'logs': logs, 'total_buffered': handler.count})


@debug_bp.route('/logs/clear', methods=['POST'])
@login_required
def clear_logs():
    denied = _require_debug_user()
    if denied:
        return denied

    from app.services.log_collector import get_log_handler
    get_log_handler().clear()
    return jsonify({'message': 'cleared'})
