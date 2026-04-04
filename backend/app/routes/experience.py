import uuid
from flask import Blueprint, request, jsonify, g
from app.extensions import db
from app.models.experience import Experience
from app.utils.decorators import login_required

experience_bp = Blueprint('experience', __name__, url_prefix='/api/experiences')
experience_bp.strict_slashes = False

VALID_TYPES = {'实习', '科研', '竞赛', '论文', '项目', '志愿者', '社团', '其他'}


@experience_bp.route('/', methods=['GET'])
@login_required
def list_experiences():
    experiences = Experience.query.filter_by(user_id=g.user.id).order_by(Experience.created_at.desc()).all()
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
        return jsonify({'error': f'type must be one of: {", ".join(VALID_TYPES)}'}), 400

    exp = Experience(
        user_id=g.user.id,
        type=exp_type,
        title=title,
        organization=data.get('organization'),
        role=data.get('role'),
        start_date=data.get('start_date'),
        end_date=data.get('end_date'),
        description=data.get('description'),
        achievements=data.get('achievements'),
        skills=data.get('skills'),
    )
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
    allowed_fields = [
        'type', 'title', 'organization', 'role', 'start_date',
        'end_date', 'description', 'achievements', 'skills',
    ]
    for field in allowed_fields:
        if field in data:
            if field == 'type' and data[field] not in VALID_TYPES:
                return jsonify({'error': f'type must be one of: {", ".join(VALID_TYPES)}'}), 400
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
