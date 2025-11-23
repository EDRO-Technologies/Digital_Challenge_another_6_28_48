"""
Простой Telegram-бот расписания на python-telegram-bot 13.x (polling).
Команды: /start /today /tomorrow /future /subscribe /unsubscribe.
"""
import logging
import os
import threading
from datetime import date, timedelta

import requests
from dotenv import load_dotenv
from telegram import ReplyKeyboardMarkup, Update
from telegram.ext import (
    Updater,
    CommandHandler,
    MessageHandler,
    Filters,
    CallbackContext,
)

# подгружаем .env
load_dotenv()

TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_BASE = os.getenv("SCHEDULE_API", "http://127.0.0.1:5000/api")

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

subscribers = set()
bot_app = None
_BOT_STARTED = False


def fmt_lessons(data):
    if not data:
        return "Нет занятий."
    status_map = {
        "canceled": "❌ Отменено",
        "moved": "🔄 Перенесено",
        "online": "💻 Онлайн",
    }
    out = []
    for l in data:
        status = status_map.get((l.get("status") or "").lower(), "📌 Запланировано")
        audience = f"🏫 {l.get('audience')}" if l.get("audience") else "🏫 —"
        comment = f"\n💬 {l.get('comment')}" if l.get("comment") else ""
        out.append(
            f"📅 {l['date']} · пара {l['pair']}\n"
            f"📖 {l['subject']}\n"
            f"👤 {l['teacher']}\n"
            f"{audience}\n"
            f"{status}{comment}"
        )
    return "\n\n".join(out)


def safe_reply(message, text: str, chunk_size: int = 3500):
    """Отправляет длинный текст частями, чтобы не ловить BadRequest: text is too long."""
    if not text:
        return
    chunks = []
    while len(text) > chunk_size:
        cut = text.rfind("\n", 0, chunk_size)
        if cut == -1:
            cut = chunk_size
        chunks.append(text[:cut])
        text = text[cut:].lstrip("\n")
    chunks.append(text)
    for part in chunks:
        message.reply_text(part)


def start(update: Update, context: CallbackContext):
    kb = ReplyKeyboardMarkup(
        [["Сегодня", "Завтра"], ["Подписаться", "Отписаться"]],
        resize_keyboard=True,
    )
    update.message.reply_text(
        "Привет! Я бот расписания.\n"
        "Команды: /today /tomorrow /future /subscribe /unsubscribe",
        reply_markup=kb,
    )


def subscribe(update: Update, context: CallbackContext):
    chat_id = update.effective_chat.id
    subscribers.add(chat_id)
    update.message.reply_text("Вы подписаны на уведомления.")


def unsubscribe(update: Update, context: CallbackContext):
    chat_id = update.effective_chat.id
    subscribers.discard(chat_id)
    update.message.reply_text("Вы отписались от уведомлений.")


def handle_buttons(update: Update, context: CallbackContext):
    text = (update.message.text or "").lower()
    if text == "сегодня":
        return today(update, context)
    if text == "завтра":
        return tomorrow(update, context)
    if text == "подписаться":
        return subscribe(update, context)
    if text == "отписаться":
        return unsubscribe(update, context)


def today(update: Update, context: CallbackContext):
    r = requests.get(f"{API_BASE}/lessons?start={date.today()}&end={date.today()}")
    safe_reply(update.message, fmt_lessons(r.json()))


def tomorrow(update: Update, context: CallbackContext):
    d = date.today() + timedelta(days=1)
    r = requests.get(f"{API_BASE}/lessons?start={d}&end={d}")
    safe_reply(update.message, fmt_lessons(r.json()))


def future(update: Update, context: CallbackContext):
    d = date.today() + timedelta(days=1)
    r = requests.get(f"{API_BASE}/lessons?start={d}")
    safe_reply(update.message, fmt_lessons(r.json()))


def notify_user(telegram_id: int, message: str):
    if bot_app:
        bot_app.bot.send_message(chat_id=telegram_id, text=message)


def broadcast_message(message: str):
    if not bot_app:
        return
    for cid in list(subscribers):
        try:
            bot_app.bot.send_message(chat_id=cid, text=message)
        except Exception as e:
            logger.warning("Не удалось отправить %s: %s", cid, e)


def start_bot(with_idle: bool = True):
    global bot_app, _BOT_STARTED
    if _BOT_STARTED:
        return bot_app
    if not TOKEN:
        raise RuntimeError("TELEGRAM_BOT_TOKEN не задан")
    bot_app = Updater(TOKEN, use_context=True)
    dp = bot_app.dispatcher

    dp.add_handler(CommandHandler("start", start))
    dp.add_handler(CommandHandler("help", start))
    dp.add_handler(CommandHandler("today", today))
    dp.add_handler(CommandHandler("tomorrow", tomorrow))
    dp.add_handler(CommandHandler("future", future))
    dp.add_handler(CommandHandler("subscribe", subscribe))
    dp.add_handler(CommandHandler("unsubscribe", unsubscribe))
    dp.add_handler(MessageHandler(Filters.text & ~Filters.command, handle_buttons))

    logger.info("Bot started (polling v13)")
    bot_app.start_polling()
    _BOT_STARTED = True
    if with_idle:
        bot_app.idle()


def run_bot_in_thread():
    def _worker():
        try:
            start_bot(with_idle=False)
        except Exception as e:
            logger.exception("Bot stopped with error: %s", e)
    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    return t


if __name__ == "__main__":
    start_bot(with_idle=True)
