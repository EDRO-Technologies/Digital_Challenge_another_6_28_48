# Расписание + Telegram-бот

## Стек
- Python 3.9
- Flask 2.3 (API, страницы)
- SQLAlchemy 2.x (ORM, SQLite по умолчанию)
- python-telegram-bot 13.x (бот, polling)
- openpyxl (импорт/экспорт Excel)
- python-dotenv (загрузка .env)
- frontend: HTML/Jinja2 + CSS/JS

## Быстрый старт
```bash
pip install -r requirements.txt

# Запуск backend (Flask + автозапуск бота)
python app.py

# (Опционально, если нужен ручной запуск бота)
python -m bot.main
```

## Структура проекта
- `app.py` — инициализация Flask, БД, создание базового админа из .env, регистрация blueprints, автозапуск бота в отдельном потоке.
- `config.py` — конфиги (URI БД, секреты из окружения).
- `routes/`
  - `api.py` — REST API расписания (CRUD lessons, импорт/экспорт Excel, подписчики, notify).
  - `pages.py` — публичные страницы и админка.
  - `auth.py` — аутентификация.
- `services/`
  - `models.py` — модели: User, Lesson, Participant, Subscriber.
  - `db_service.py` — инициализация БД.
  - `telegram_sender.py` — рассылка уведомлений (notify_lesson_change, send_message, broadcast).
- `bot/`
  - `main.py` — Telegram-бот: команды /start /today /tomorrow /future /subscribe /unsubscribe, кнопки, notify_user/broadcast_message для вызова из backend.
- `static/`, `templates/` — фронтенд админки/публичных страниц.

## БД
- По умолчанию SQLite `database.db` в корне.
- Админ создаётся при старте (`ADMIN_USERNAME/ADMIN_EMAIL/ADMIN_PASSWORD` из .env, роль admin).

## Ключевые API
- `GET /api/lessons?start=YYYY-MM-DD&end=YYYY-MM-DD` — занятия за период (или month/year).
- `POST /api/lessons` / `PATCH /api/lessons/<id>` / `DELETE /api/lessons/<id>` — CRUD.
- `POST /api/import_excel` — импорт (1-й лист, с 10-й строки, дни ПН–СБ, пары, предметы C–F, преподаватель G; раскладывает даты с 1.09 по 30.12).
- `GET /api/export_week?start=YYYY-MM-DD&end=YYYY-MM-DD` — экспорт недели в xlsx.
- Подписки/notify:
  - `POST /api/subscribers` (chat_id, username, full_name)
  - `DELETE /api/subscribers/<chat_id>`
  - `GET /api/subscribers_list`
  - `POST /api/notify` — отправка сообщения конкретному chat_id.

## Уведомления
- `services/telegram_sender.notify_lesson_change` вызывается при создании/изменении/удалении урока.
- Собирает chat_id из `subscribers` и числовых `participants`, рассылает HTML-уведомление (дата, пара, предмет, препод, аудитория, статус; при update — блок «Изменения»).

## Бот
- Polling (python-telegram-bot 13.x), командами /subscribe /unsubscribe управляет подпиской через API.
- /today /tomorrow /future тянут данные из API `SCHEDULE_API` (по умолчанию локальный backend).
- Автозапуск из app.py (отдельный поток) либо ручной `python -m bot.main`.

## Импорт Excel (детали)
- Читает первый лист, начиная с 10-й строки.
- Столбец A — день недели (ПН–СБ), B — пара, C–F — дисциплины (каждая непустая ячейка = занятие), G — преподаватель (можно разделять `;` или `/` для нескольких предметов).
- Каждая строка размножается на все даты соответствующего дня недели с 1 сентября по 30 декабря текущего года.

## Health-check / тесты
- Смоук API: `curl http://127.0.0.1:5000/api/lessons?start=2025-11-23&end=2025-11-23`
- Бот: в Telegram `/start`, `/subscribe`, `/today`.

## Деплой (Linux, dev)
- Установить Python 3.9+, `pip install -r requirements.txt`.
- Заполнить `.env` (SECRET_KEY, TELEGRAM_BOT_TOKEN, ADMIN_*).
- Запустить `python app.py` (Flask dev-сервер; бот стартует сам, если есть токен). Для продакшена — uwsgi/gunicorn + systemd, бот отдельным сервисом.
