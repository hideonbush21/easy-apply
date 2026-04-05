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
    # TODO: replace "*" with your Vercel frontend URL in production
    cors.init_app(app, resources={r"/api/*": {"origins": os.getenv('ALLOWED_ORIGINS', '*')}})

    # Register routes
    from app.routes import register_routes
    register_routes(app)

    @app.route('/health')
    def health():
        return {'status': 'ok'}

    return app
