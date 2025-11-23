from flask import Blueprint, render_template, session, redirect, abort
from services.models import User, Lesson, UserRole

pages_bp = Blueprint("pages", __name__)


def is_admin(user: User):
    return user and user.role == UserRole.ADMIN and (user.username == "adrkaaa" or user.email == "adrkaaa")


@pages_bp.get("/")
def index():
    return render_template("index.html")


@pages_bp.get("/login")
def login():
    return render_template("login.html")


@pages_bp.get("/register")
def register():
    return render_template("register.html")


@pages_bp.get("/profile")
def profile():
    user_id = session.get("user_id")
    if not user_id:
        return redirect("/login")

    user = User.query.get(user_id)
    return render_template("profile.html", user=user)


@pages_bp.get("/schedule")
def public_schedule():
    return render_template("admin/schedule.html")


@pages_bp.get("/admin/schedule")
def admin_schedule():
    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    if not is_admin(user):
        abort(403)
    return render_template("admin/schedule_create.html")


@pages_bp.get("/admin/schedule/create")
def admin_schedule_create():
    user_id = session.get("user_id")
    user = User.query.get(user_id) if user_id else None
    if not is_admin(user):
        abort(403)
    return render_template("admin/schedule_create.html")
