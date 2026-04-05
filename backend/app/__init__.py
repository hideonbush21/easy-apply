from flask import Flask
import os
from app.config import Config
from app.extensions import db, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    # Initialize extensions
    db.init_app(app)

    # ALLOWED_ORIGINS 支持逗号分隔多个域名，或 * 通配
    raw_origins = os.getenv('ALLOWED_ORIGINS', '*')
    if raw_origins == '*':
        origins = '*'
    else:
        origins = [o.strip() for o in raw_origins.split(',') if o.strip()]
    cors.init_app(app, resources={r"/api/*": {"origins": origins}})

    # Register routes
    from app.routes import register_routes
    register_routes(app)

    with app.app_context():
        db.create_all()

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    return app
