from app.routes.auth import auth_bp
from app.routes.profile import profile_bp
from app.routes.experience import experience_bp
from app.routes.school import school_bp
from app.routes.application import application_bp
from app.routes.recommendation import recommendation_bp
from app.routes.admin import admin_bp


def register_routes(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(experience_bp)
    app.register_blueprint(school_bp)
    app.register_blueprint(application_bp)
    app.register_blueprint(recommendation_bp)
    app.register_blueprint(admin_bp)
