from flask import Flask, session, abort, redirect
from services.db_service import db
from services.models import User, UserRole
from config import Config
from sqlalchemy import event
from sqlalchemy.engine import Engine
import os
from dotenv import load_dotenv

load_dotenv()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()
        except Exception:
            pass

    @app.context_processor
    def inject_user():
        user_id = session.get("user_id")
        user = User.query.get(user_id) if user_id else None
        return dict(current_user=user)

    @app.errorhandler(403)
    def handle_forbidden(_):
        resp = redirect("/")
        resp.status_code = 403
        return resp

    with app.app_context():
        db.create_all()

        admin_username = "adrkaaa"
        admin_email = "adrkaaa"
        admin = User.query.filter(
            (User.username == admin_username) | (User.email == admin_email)
        ).first()
        if not admin:
            admin = User(
                username=admin_username,
                email=admin_email,
                role=UserRole.ADMIN,
                country="",
                language="",
                gender="",
            )
            admin.set_password("pisyakakapopa228")
            db.session.add(admin)
            db.session.commit()
        else:
            if admin.role != UserRole.ADMIN:
                admin.role = UserRole.ADMIN
                db.session.commit()

    from routes.pages import pages_bp
    from routes.api import api_bp
    from routes.auth import auth_bp

    app.register_blueprint(pages_bp)
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app


app = create_app()

_BOT_THREAD = None


def _start_bot_if_possible():
    global _BOT_THREAD
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token or _BOT_THREAD:
        return
    if os.environ.get("WERKZEUG_RUN_MAIN") not in (None, "true"):
        return
    try:
        from bot.main import run_bot_in_thread
        _BOT_THREAD = run_bot_in_thread()
    except Exception as e:
        print(f"[BOT] Не удалось запустить: {e}")

if __name__ == "__main__":
    app.run(debug=True)
