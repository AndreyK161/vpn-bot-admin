# VPN Bot Admin

Админ-панель для VPN-бота: аутентификация по JWT, лог сообщений бота, статистика по событиям и их конверсии.

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

Настройки бэкенда лежат в `backend/.env` (скопировано из `backend/.env.example`). Перед продакшеном обязательно смени `JWT_SECRET_KEY`, `BOT_API_KEY` и пароль от базы.

## Аутентификация

`access_token` живёт 30 минут (`JWT_ACCESS_EXPIRES_MINUTES`), `refresh_token` — 30 дней (`JWT_REFRESH_EXPIRES_DAYS`), хранится в БД в виде хэша (таблица `refresh_tokens`) с возможностью отзыва.

- `POST /api/auth/login` — возвращает `access_token` + `refresh_token`.
- `POST /api/auth/refresh` — по `refresh_token` выдаёт новую пару и отзывает старый refresh (ротация).
- `POST /api/auth/logout` — отзывает переданный `refresh_token`.

Фронтенд ([lib/api.ts](frontend/src/lib/api.ts)) сам ловит `401` от протухшего `access_token`, тихо обновляет его через `/api/auth/refresh` и повторяет запрос — разлогин происходит только если и `refresh_token` уже недействителен. Плюс весь UI обёрнут в `ErrorBoundary` ([components/ErrorBoundary.tsx](frontend/src/components/ErrorBoundary.tsx)), чтобы непойманная ошибка рендера не превращалась в белый экран.

## Интеграция с ботом

Бот пишет в админку напрямую через отдельный API-ключ (заголовок `X-API-Key`, значение из `BOT_API_KEY`) — этот ключ не связан с JWT-логином админов.

- `POST /api/ingest/events` — зафиксировать событие сценария (например, `subscription_expired_discount_offered`). Тело: `event_type`, `telegram_user_id`, `username?`, `payload?`. В ответе — `id` события.
- `POST /api/ingest/events/{id}/convert` — отметить, что пользователь воспользовался предложением (например, купил по скидке).
- `POST /api/ingest/messages` — залогировать сообщение, отправленное ботом. Тело: `telegram_user_id`, `text`, опционально `event_id` (тогда сообщение свяжется с событием и появится с бейджем в админке).
- `GET /api/ingest/templates/{key}` — получить актуальный текст редактируемого шаблона сообщения (только активные). Так бот может брать текст из админки вместо захардкоженного файла.

Админка (под JWT):

- `GET /api/messages` — лог сообщений с фильтрами (`telegram_user_id`, `event_type`, `search`) и пагинацией.
- `GET /api/events` — сырые события с фильтрами.
- `GET /api/events/stats` — агрегация по типам событий: сколько отправлено, сколько сконвертировано, конверсия в %.
- `GET/POST/PATCH/DELETE /api/templates` — CRUD шаблонов сообщений (все сообщения бота, включая дефолтные, с редактируемым текстом и опциональной привязкой к типу события).

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

Работает: аутентификация, лог всех сообщений бота, статистика конверсии по событиям, CRUD-редактор шаблонов сообщений (включая дефолтные). В планах: раздел с пользователями/подписками, серверами и платежами.
