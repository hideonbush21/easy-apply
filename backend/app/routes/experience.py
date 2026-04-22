import uuid
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.experience import Experience
from app.utils.decorators import login_required

experience_bp = Blueprint('experience', __name__, url_prefix='/api/experiences')
experience_bp.strict_slashes = False

# 新增 4 类 + 保留旧值向后兼容
VALID_TYPES = {
    'education', 'academic', 'professional', 'extracurricular',
    '实习', '科研', '竞赛', '论文', '项目', '志愿者', '社团', '其他',
}

ALLOWED_FIELDS = [
    'type', 'title', 'organization', 'role', 'start_date', 'end_date',
    'description', 'achievements', 'skills',
    'importance', 'country', 'degree_level', 'degree_name', 'major',
    'gpa_info', 'other_info', 'related_degree', 'subjective_description', 'work_type',
]


@experience_bp.route('/', methods=['GET'])
@login_required
def list_experiences():
    exp_type = request.args.get('type')
    query = Experience.query.filter_by(user_id=g.user.id)
    if exp_type:
        query = query.filter_by(type=exp_type)
    experiences = query.order_by(Experience.created_at.desc()).all()
    return jsonify([e.to_dict() for e in experiences])


@experience_bp.route('/', methods=['POST'])
@login_required
def create_experience():
    data = request.get_json(silent=True) or {}
    exp_type = data.get('type', '')
    title = (data.get('title') or '').strip()

    if not title:
        return jsonify({'error': 'title is required'}), 400
    if exp_type not in VALID_TYPES:
        return jsonify({'error': f'type must be one of: {", ".join(sorted(VALID_TYPES))}'}), 400

    exp = Experience(user_id=g.user.id)
    for field in ALLOWED_FIELDS:
        if field in data:
            setattr(exp, field, data[field])

    db.session.add(exp)
    db.session.commit()
    return jsonify(exp.to_dict()), 201


@experience_bp.route('/<exp_id>', methods=['PUT'])
@login_required
def update_experience(exp_id):
    exp = Experience.query.filter_by(id=exp_id, user_id=g.user.id).first()
    if not exp:
        return jsonify({'error': 'Experience not found'}), 404

    data = request.get_json(silent=True) or {}
    for field in ALLOWED_FIELDS:
        if field in data:
            if field == 'type' and data[field] not in VALID_TYPES:
                return jsonify({'error': f'type must be one of: {", ".join(sorted(VALID_TYPES))}'}), 400
            setattr(exp, field, data[field])

    db.session.commit()
    return jsonify(exp.to_dict())


@experience_bp.route('/<exp_id>', methods=['DELETE'])
@login_required
def delete_experience(exp_id):
    exp = Experience.query.filter_by(id=exp_id, user_id=g.user.id).first()
    if not exp:
        return jsonify({'error': 'Experience not found'}), 404
    db.session.delete(exp)
    db.session.commit()
    return jsonify({'message': 'deleted'})
