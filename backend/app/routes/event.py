from datetime import datetime, date, time as time_type
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.event import Event
from app.models.application import Application
from app.utils.decorators import login_required

event_bp = Blueprint('event', __name__, url_prefix='/api/events')
event_bp.strict_slashes = False

VALID_CATEGORIES = {
    'deadline', 'exam', 'interview', 'milestone',
    'reminder', 'submission', 'decision', 'task', 'custom'
}

# Application 状态中，哪些属于"终态"（已超过的状态不能再重复触发）
STATUS_ORDER = [
    '待申请', '材料准备中', '已提交', '面试邀请',
    '面试完成', '等待结果', '已录取', '已拒绝', '候补名单'
]


def _parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def _parse_time(value):
    if not value:
        return None
    if isinstance(value, time_type):
        return value
    try:
        return datetime.strptime(value, '%H:%M').time()
    except (ValueError, TypeError):
        return None


@event_bp.route('/', methods=['GET'])
@login_required
def list_events():
    """查询当前用户的事件，支持按年月过滤。"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    query = Event.query.filter_by(user_id=g.user.id)

    if year and month:
        from datetime import date as date_type
        import calendar
        last_day = calendar.monthrange(year, month)[1]
        start = date_type(year, month, 1)
        end = date_type(year, month, last_day)
        query = query.filter(Event.start_date >= start, Event.start_date <= end)

    events = query.order_by(Event.start_date.asc(), Event.start_time.asc()).all()
    return jsonify([e.to_dict() for e in events])


@event_bp.route('/', methods=['POST'])
@login_required
def create_event():
    """手动创建 Event。若关联 Application 且附带状态变更，执行状态更新。"""
    data = request.get_json(silent=True) or {}

    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': '事件标题不能为空'}), 400

    start_date = _parse_date(data.get('start_date'))
    if not start_date:
        return jsonify({'error': 'start_date 格式错误，应为 YYYY-MM-DD'}), 400

    category = data.get('category', 'custom')
    if category not in VALID_CATEGORIES:
        return jsonify({'error': f'无效的事件类型: {category}'}), 400

    # 验证关联的 Application
    application_id = data.get('application_id')
    application = None
    if application_id:
        application = Application.query.filter_by(id=application_id, user_id=g.user.id).first()
        if not application:
            return jsonify({'error': '关联的申请不存在'}), 404

    # 状态变更校验
    status_change_to = data.get('status_change_to')
    if application and status_change_to:
        # 防重复：当前状态已达到或超过目标状态时报警
        current_idx = STATUS_ORDER.index(application.status) if application.status in STATUS_ORDER else -1
        target_idx = STATUS_ORDER.index(status_change_to) if status_change_to in STATUS_ORDER else -1
        if current_idx >= target_idx >= 0:
            return jsonify({
                'error': 'duplicate_status',
                'message': f'该申请当前已是"{application.status}"状态，重复创建可能导致状态混乱',
                'current_status': application.status,
            }), 409

    event = Event(
        user_id=g.user.id,
        title=title,
        is_all_day=bool(data.get('is_all_day', False)),
        start_date=start_date,
        start_time=_parse_time(data.get('start_time')),
        end_date=_parse_date(data.get('end_date')),
        end_time=_parse_time(data.get('end_time')),
        timezone=data.get('timezone', 'Asia/Shanghai'),
        category=category,
        application_id=application_id,
        origin='manual',
        color=data.get('color'),
        user_notes=data.get('user_notes', ''),
    )

    # 执行状态变更
    if application and status_change_to:
        old_status = application.status
        application.status = status_change_to
        application.updated_at = datetime.utcnow()
        event.status_change_from = old_status
        event.status_change_to = status_change_to
        event.status_change_confidence = 1.0
        event.status_change_auto_executed = True
        event.status_change_confirmed_at = datetime.utcnow()
        event.editable_by_user = False

    db.session.add(event)
    db.session.commit()
    return jsonify(event.to_dict()), 201


@event_bp.route('/<uuid:event_id>', methods=['PUT'])
@login_required
def update_event(event_id):
    """更新 Event（仅允许编辑 editable_by_user=true 的字段）。"""
    event = Event.query.filter_by(id=event_id, user_id=g.user.id).first_or_404()

    if not event.editable_by_user:
        return jsonify({'error': '该事件不允许编辑'}), 403

    data = request.get_json(silent=True) or {}

    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return jsonify({'error': '事件标题不能为空'}), 400
        event.title = title

    if 'is_all_day' in data:
        event.is_all_day = bool(data['is_all_day'])
    if 'start_date' in data:
        event.start_date = _parse_date(data['start_date']) or event.start_date
    if 'start_time' in data:
        event.start_time = _parse_time(data['start_time'])
    if 'end_date' in data:
        event.end_date = _parse_date(data['end_date'])
    if 'end_time' in data:
        event.end_time = _parse_time(data['end_time'])
    if 'category' in data and data['category'] in VALID_CATEGORIES:
        event.category = data['category']
    if 'color' in data:
        event.color = data['color']
    if 'user_notes' in data:
        event.user_notes = data['user_notes']

    event.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(event.to_dict())


@event_bp.route('/<uuid:event_id>', methods=['DELETE'])
@login_required
def delete_event(event_id):
    """删除 Event。"""
    event = Event.query.filter_by(id=event_id, user_id=g.user.id).first_or_404()

    if not event.deletable_by_user:
        return jsonify({'error': '该事件不允许删除'}), 403

    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': '删除成功'})


@event_bp.route('/<uuid:event_id>/complete', methods=['POST'])
@login_required
def complete_event(event_id):
    """标记事件为已完成/取消完成。"""
    event = Event.query.filter_by(id=event_id, user_id=g.user.id).first_or_404()

    data = request.get_json(silent=True) or {}
    completed = bool(data.get('completed', True))

    event.manual_completed = completed
    event.manual_completed_at = datetime.utcnow() if completed else None
    if completed and not event.completed_at:
        event.completed_at = datetime.utcnow()
    elif not completed:
        event.completed_at = None

    event.updated_at = datetime.utcnow()
    db.session.commit()
    return jsonify(event.to_dict())
