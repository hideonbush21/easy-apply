from app import create_app
from app.extensions import db
from app.models.user import User
import bcrypt

app = create_app()
with app.app_context():
    pw = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()
    u = User(nickname='admin', password_hash=pw, is_admin=True)
    db.session.add(u)
    db.session.commit()
    print('Admin created:', u.id)
