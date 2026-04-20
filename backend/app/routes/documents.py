from datetime import datetime
from flask import Blueprint, request, jsonify, g
from sqlalchemy.orm import joinedload
from app.extensions import db
from app.models.sop import SopLetter
from app.models.recommendation import RecommendationLetter
from app.models.application import Application
from app.models.school import School
from app.models.program import Program
from app.utils.decorators import login_required

documents_bp = Blueprint('documents', __name__, url_prefix='/api/documents')
documents_bp.strict_slashes = False


@documents_bp.route('/check', methods=['GET'])
@login_required
def check_documents():
    has_sop = SopLetter.query.filter_by(user_id=g.user.id).first() is not None
    if not has_sop:
        has_rec = RecommendationLetter.query.filter_by(user_id=g.user.id).first() is not None
    else:
        has_rec = True  # already know has_documents is True
    return jsonify({'has_documents': has_sop or has_rec})


@documents_bp.route('/all', methods=['GET'])
@login_required
def get_all_documents():
    user_id = g.user.id

    sop_letters = SopLetter.query.filter_by(user_id=user_id).all()
    rec_letters = RecommendationLetter.query.filter_by(user_id=user_id).all()

    # Build lookup by application_id
    sop_by_app = {}
    for s in sop_letters:
        app_id = str(s.application_id)
        # Keep the latest one if multiple exist
        if app_id not in sop_by_app or (s.created_at and sop_by_app[app_id].created_at and s.created_at > sop_by_app[app_id].created_at):
            sop_by_app[app_id] = s

    rec_by_app = {}
    for r in rec_letters:
        app_id = str(r.application_id)
        if app_id not in rec_by_app or (r.created_at and rec_by_app[app_id].created_at and r.created_at > rec_by_app[app_id].created_at):
            rec_by_app[app_id] = r

    # Collect all unique application IDs
    all_app_ids = set(sop_by_app.keys()) | set(rec_by_app.keys())
    if not all_app_ids:
        return jsonify({'documents': []})

    # Fetch applications — eager-load program + school to avoid N+1
    applications = Application.query.filter(
        Application.id.in_(all_app_ids),
        Application.user_id == user_id,
    ).options(
        joinedload(Application.program).joinedload(Program.school),
    ).all()

    # Pre-fetch schools for legacy apps (school_id without program)
    legacy_school_ids = {
        a.school_id for a in applications
        if a.school_id and not a.program_id
    }
    school_map = {}
    if legacy_school_ids:
        schools = School.query.filter(School.id.in_(legacy_school_ids)).all()
        school_map = {s.id: s for s in schools}

    app_map = {str(a.id): a for a in applications}

    documents = []
    for app_id in all_app_ids:
        app_obj = app_map.get(app_id)
        if not app_obj:
            continue

        # Resolve school/program names (all data already loaded, zero queries)
        p = app_obj.program
        if p and p.school:
            school_name = p.school.name
            school_name_cn = p.school.name_cn
        elif app_obj.school_id:
            school = school_map.get(app_obj.school_id)
            school_name = school.name if school else None
            school_name_cn = school.name_cn if school else None
        else:
            school_name = None
            school_name_cn = None

        program_name_cn = p.name_cn if p else (app_obj.major or None)
        program_name_en = p.name_en if p else None

        sop = sop_by_app.get(app_id)
        rec = rec_by_app.get(app_id)

        documents.append({
            'application_id': app_id,
            'school_name': school_name,
            'school_name_cn': school_name_cn,
            'program_name_cn': program_name_cn,
            'program_name_en': program_name_en,
            'sop': sop.to_dict() if sop else None,
            'recommendation': rec.to_dict() if rec else None,
        })

    return jsonify({'documents': documents})


@documents_bp.route('/<letter_type>/<letter_id>', methods=['PUT'])
@login_required
def update_document(letter_type, letter_id):
    if letter_type not in ('sop', 'recommendation'):
        return jsonify({'error': 'Invalid letter type'}), 400

    data = request.get_json(silent=True) or {}
    content = data.get('content')
    if content is None:
        return jsonify({'error': 'content is required'}), 400

    if letter_type == 'sop':
        letter = SopLetter.query.filter_by(id=letter_id, user_id=g.user.id).first()
    else:
        letter = RecommendationLetter.query.filter_by(id=letter_id, user_id=g.user.id).first()

    if not letter:
        return jsonify({'error': 'Letter not found'}), 404

    letter.content = content
    letter.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify(letter.to_dict())
