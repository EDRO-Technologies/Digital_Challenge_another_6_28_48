from datetime import datetime, date
from enum import Enum
import uuid

from services.db_service import db


class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(db.Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    country = db.Column(db.String(120))
    language = db.Column(db.String(120))
    gender = db.Column(db.String(20))

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)


class Lesson(db.Model):
    __tablename__ = "lessons"

    id = db.Column(db.Integer, primary_key=True)
    lesson_date = db.Column(db.Date, nullable=False, default=date.today)
    pair = db.Column(db.Integer, nullable=False)
    subject = db.Column(db.String(255), nullable=False)
    teacher = db.Column(db.String(255), nullable=False)
    audience = db.Column(db.String(120))
    status = db.Column(db.String(30), default="scheduled", nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.lesson_date.isoformat(),
            "pair": self.pair,
            "subject": self.subject,
            "teacher": self.teacher,
            "audience": self.audience,
            "status": self.status,
            "comment": self.comment,
        }


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.id"), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    contact = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Subscriber(db.Model):
    __tablename__ = "subscribers"

    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.String(64), unique=True, nullable=False)
    username = db.Column(db.String(255))
    full_name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
