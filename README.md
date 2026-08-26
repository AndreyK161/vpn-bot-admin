# VPN Bot Admin

Админ-панель для VPN-бота. Каркас проекта: аутентификация по JWT, база данных, минималистичный UI.

## Стек

- Backend: FastAPI, SQLAlchemy (async), Alembic, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Docker Compose для локального запуска

## Структура

```
backend/    FastAPI-приложение, миграции, скрипты
frontend/   React SPA админки
docker-compose.yml
```

## Запуск

```bash
docker compose up -d --build
```

Применить миграции:

```bash
docker compose exec backend alembic upgrade head
```

Создать администратора:

```bash
docker compose exec backend python -m app.scripts.create_admin --email admin@example.com --full-name "Имя"
```

Скрипт запросит пароль дважды (скрытый ввод).

После этого:

- Админка: http://localhost:5173
- API: http://localhost:8000
- Проверка здоровья: http://localhost:8000/api/health

## Переменные окружения

Настройки бэкенда лежат в `backend/.env` (скопировано из `backend/.env.example`). Перед продакшеном обязательно смени `JWT_SECRET_KEY` и пароль от базы.

## Разработка без Docker

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Текущее состояние

Сейчас это каркас: аутентификация и подключение к базе работают, разделы админки (Раздел 1/2/3) — заглушки под будущий функционал (пользователи бота, серверы, тарифы, платежи).
