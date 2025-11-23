import logging
import os
import re
from typing import Optional, Set
from datetime import date

from dotenv import load_dotenv
from telegram import Bot

from services.models import Subscriber, Participant, Lesson

load_dotenv()

logger = logging.getLogger(__name__)


def _get_bot() -> Optional[Bot]:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        logger.warning("TELEGRAM_BOT_TOKEN не задан, рассылка пропущена")
        return None
    try:
        return Bot(token=token)
    except Exception:
        logger.exception("Не удалось инициализировать Bot")
        return None


def send_message(chat_id: int, text: str):
    bot = _get_bot()
    if not bot:
        return
    try:
        bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")
    except Exception:
        logger.exception("Не удалось отправить сообщение chat_id=%s", chat_id)


def _collect_chat_ids() -> Set[str]:
    ids: Set[str] = set()
    for s in Subscriber.query.all():
        if s.chat_id:
            ids.add(str(s.chat_id).strip())
    for p in Participant.query.all():
        if p.contact and re.match(r"^-?\d+$", str(p.contact).strip()):
            ids.add(str(p.contact).strip())
    return ids


def broadcast(text: str):
    bot = _get_bot()
    if not bot:
        return
    chat_ids = _collect_chat_ids()
    if not chat_ids:
        logger.info("Нет подписчиков для рассылки")
        return
    for cid in chat_ids:
        try:
            bot.send_message(chat_id=cid, text=text, parse_mode="HTML")
        except Exception:
            logger.exception("Не удалось отправить сообщение chat_id=%s", cid)


def notify_lesson_change(action: str, lesson: Lesson, old: Optional[dict] = None):
    """
    Рассылка при изменении занятия.
    action: created|updated|deleted
    """
    def human_date(dt: date) -> str:
        months = [
            "января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря"
        ]
        return f"{dt.day} {months[dt.month-1]} {dt.year}"

    def human_status(val: str) -> str:
        s = (val or "").lower()
        return {
            "canceled": "❌ Отменено",
            "moved": "🔄 Перенесено",
            "online": "💻 Онлайн",
        }.get(s, "📌 Запланировано")

    title = {
        "created": "🆕 Новое занятие",
        "updated": "📚 Обновление занятия",
        "deleted": "🗑 Занятие удалено",
    }.get(action, "ℹ️ Занятие")

    lines = [
        f"<b>{title}</b>",
        "",
        f"🗓 Дата: {human_date(lesson.lesson_date)}",
        f"⏰ Пара: {lesson.pair}",
        f"📖 Дисциплина: {lesson.subject}",
        f"👨‍🏫 Преподаватель: {lesson.teacher}",
        f"🏫 Аудитория: {lesson.audience or '—'}",
        f"📌 Статус: {human_status(lesson.status)}",
    ]
    if lesson.comment:
        lines.append(f"💬 Комментарий: {lesson.comment}")

    if action == "updated" and old:
        diffs = []
        new_dict = lesson.to_dict()
        fields = [
            ("date", "Дата", human_date(lesson.lesson_date)),
            ("pair", "Пара", lesson.pair),
            ("subject", "Дисциплина", lesson.subject),
            ("teacher", "Преподаватель", lesson.teacher),
            ("audience", "Аудитория", lesson.audience or "—"),
            ("status", "Статус", human_status(lesson.status)),
            ("comment", "Комментарий", lesson.comment or "—"),
        ]
        for key, label, new_val in fields:
            old_val = old.get(key)
            if key == "status":
                old_val_fmt = human_status(old_val)
            elif key == "date" and old_val:
                try:
                    old_dt = date.fromisoformat(str(old_val))
                    old_val_fmt = human_date(old_dt)
                except Exception:
                    old_val_fmt = old_val
            else:
                old_val_fmt = old_val or "—"
            if str(old_val_fmt) != str(new_val):
                diffs.append(f"{label}: {old_val_fmt} → {new_val}")
        if diffs:
            lines.append("")
            lines.append("🔄 <b>Изменения:</b>")
            lines.extend(diffs)

    broadcast("\n".join(lines))
