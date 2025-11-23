from flask import Blueprint, request, jsonify, session, redirect
from services.db_service import db
from services.models import User, UserRole

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/register")
def register_action():
    data = request.json

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()
    policy = data.get("policy", False)

    if not username or not email or not password:
        return jsonify({"ok": False, "error": "Все поля обязательны!"}), 400

    import re
    if not re.match(r"^[A-Za-z0-9_]+$", username):
        return jsonify({"ok": False, "error": "Имя может содержать только латинские буквы и цифры!"}), 400

    if len(username) < 3:
        return jsonify({"ok": False, "error": "Имя должно быть минимум 3 символа!"}), 400

    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
    if not re.match(email_regex, email):
        return jsonify({"ok": False, "error": "Некорректная почта!"}), 400

    if len(password) < 6:
        return jsonify({"ok": False, "error": "Пароль слишком короткий!"}), 400

    if not policy:
        return jsonify({"ok": False, "error": "Необходимо согласие!"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"ok": False, "error": "Имя пользователя уже занято!"}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({"ok": False, "error": "Почта уже занята!"}), 409

    user = User(
        username=username,
        email=email,
        country="",
        language="",
        gender="",
        role=UserRole.STUDENT
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({"ok": True, "message": "Регистрация успешна!"})


@auth_bp.post("/login")
def login_action():
    data = request.json

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"ok": False, "error": "Заполните все поля!"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"ok": False, "error": "Пользователь не найден!"}), 404

    if not user.check_password(password):
        return jsonify({"ok": False, "error": "Неверный пароль!"}), 401

    session["user_id"] = user.id

    return jsonify({"ok": True, "message": "Вход успешен!", "redirect": "/profile"})


@auth_bp.post("/update_profile")
def update_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"ok": False, "error": "Вы не авторизованы"}), 401

    data = request.json
    user = User.query.get(user_id)

    new_username = data.get("username", "").strip()
    new_email = data.get("email", "").strip()
    new_password = data.get("password", "").strip()
    new_country = data.get("country", "").strip()
    new_language = data.get("language", "").strip()
    new_gender = data.get("gender", "").strip()

    if not new_username:
        return jsonify({"ok": False, "error": "Имя не может быть пустым"}), 400

    if not new_email:
        return jsonify({"ok": False, "error": "Почта не может быть пустой"}), 400

    if new_email != user.email and User.query.filter_by(email=new_email).first():
        return jsonify({"ok": False, "error": "Такая почта уже используется"}), 409

    if new_username != user.username and User.query.filter_by(username=new_username).first():
        return jsonify({"ok": False, "error": "Это имя уже занято"}), 409

    if new_password and len(new_password) < 6:
        return jsonify({"ok": False, "error": "Пароль слишком короткий"}), 400

    user.username = new_username
    user.email = new_email
    user.country = new_country
    user.language = new_language
    user.gender = new_gender

    if new_password:
        user.set_password(new_password)

    db.session.commit()

    return jsonify({"ok": True, "message": "Профиль сохранён"})


@auth_bp.get("/logout")
def logout():
    session.pop("user_id", None)
    return redirect("/")
