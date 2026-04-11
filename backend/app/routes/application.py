from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify, g
from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models.application import Application
from app.models.school import School
from app.models.program import Program
from app.utils.decorators import login_required

application_bp = Blueprint('application', __name__, url_prefix='/api/applications')
application_bp.strict_slashes = False

VALID_STATUSES = {'待申请', '材料准备中', '已提交', '面试邀请', '面试完成', '等待结果', '已录取', '已拒绝', '候补名单'}
VALID_PRIORITIES = {'冲刺', '匹配', '保底'}


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


@application_bp.route('/', methods=['GET'])
@login_required
def list_applications():
    apps = (
        Application.query
        .filter_by(user_id=g.user.id)
        .options(
            joinedload(Application.program).joinedload(Program.school),
            joinedload(Application.school),
        )
        .order_by(Application.created_at.desc())
        .all()
    )
    return jsonify([a.to_dict(include_school=True) for a in apps])


@application_bp.route('/', methods=['POST'])
@login_required
def create_application():
    data = request.get_json(silent=True) or {}
    program_id = data.get('program_id')
    school_id = data.get('school_id')

    program = None
    if program_id:
        program = Program.query.get(program_id)
        if not program:
            return jsonify({'error': 'Program not found'}), 404
        # 防止重复申请同一 program
        existing = Application.query.filter_by(
            user_id=g.user.id, program_id=program_id
        ).first()
        if existing:
            return jsonify({'error': '已加入申请列表', 'application_id': str(existing.id)}), 409
        school_id = str(program.school_id)
    elif school_id:
        school = School.query.get(school_id)
        if not school:
            return jsonify({'error': 'School not found'}), 404
    else:
        return jsonify({'error': 'program_id 或 school_id 必填一项'}), 400

    status = data.get('status', '待申请')
    if status not in VALID_STATUSES:
        status = '待申请'

    priority = data.get('priority')
    if priority and priority not in VALID_PRIORITIES:
        return jsonify({'error': f'priority must be one of: {", ".join(VALID_PRIORITIES)}'}), 400

    app_obj = Application(
        user_id=g.user.id,
        school_id=school_id,
        program_id=program_id,
        major=data.get('major') or (program.name_cn if program else None),
        status=status,
        priority=priority,
        application_deadline=_parse_date(data.get('application_deadline')),
        applied_at=datetime.utcnow() if status == '已提交' else None,
        notes=data.get('notes'),
    )
    db.session.add(app_obj)
    db.session.commit()
    return jsonify(app_obj.to_dict(include_school=True)), 201


@application_bp.route('/<app_id>', methods=['PUT'])
@login_required
def update_application(app_id):
    app_obj = Application.query.filter_by(id=app_id, user_id=g.user.id).first()
    if not app_obj:
        return jsonify({'error': 'Application not found'}), 404

    data = request.get_json(silent=True) or {}
    if 'status' in data:
        if data['status'] not in VALID_STATUSES:
            return jsonify({'error': 'Invalid status'}), 400
        app_obj.status = data['status']
        if data['status'] == '已提交' and not app_obj.applied_at:
            app_obj.applied_at = datetime.utcnow()
    if 'priority' in data:
        if data['priority'] and data['priority'] not in VALID_PRIORITIES:
            return jsonify({'error': 'Invalid priority'}), 400
        app_obj.priority = data['priority']
    if 'major' in data:
        app_obj.major = data['major']
    if 'application_deadline' in data:
        app_obj.application_deadline = _parse_date(data['application_deadline'])
    if 'result_date' in data:
        app_obj.result_date = _parse_date(data['result_date'])
    if 'notes' in data:
        app_obj.notes = data['notes']

    app_obj.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(app_obj.to_dict(include_school=True))


@application_bp.route('/<app_id>', methods=['DELETE'])
@login_required
def delete_application(app_id):
    app_obj = Application.query.filter_by(id=app_id, user_id=g.user.id).first()
    if not app_obj:
        return jsonify({'error': 'Application not found'}), 404
    db.session.delete(app_obj)
    db.session.commit()
    return jsonify({'message': 'deleted'})


@application_bp.route('/deadlines', methods=['GET'])
@login_required
def get_deadlines():
    today = date.today()
    in_30_days = today + timedelta(days=30)
    apps = (
        Application.query
        .filter_by(user_id=g.user.id)
        .filter(Application.application_deadline >= today)
        .filter(Application.application_deadline <= in_30_days)
        .order_by(Application.application_deadline.asc())
        .all()
    )
    return jsonify([a.to_dict(include_school=True) for a in apps])
