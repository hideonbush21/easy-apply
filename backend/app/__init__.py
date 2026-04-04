from flask import Flask
from app.config import Config
from app.extensions import db, cors


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.url_map.strict_slashes = False

    # Initialize extensions
    db.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": "*"}})

    # Register routes
    from app.routes import register_routes
    register_routes(app)

    return app
