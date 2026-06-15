# Система управления проектным практикумом

Внутренняя веб-система для автоматизации проектного практикума студентов вузов-партнеров банка. Приложение помогает кураторам вести проектные кейсы, команды, участников, встречи, оценки и отчетность в одном месте.

Основная бизнес-цепочка проекта:

```text
case -> semester -> case_semester -> team_case_history
```

На текущем этапе система ориентирована на работу кураторов. Взаимодействие со студентами выполняется через внешние сервисы и Telegram-бота.

## Возможности

- аутентификация по email и паролю с access- и refresh-токенами;
- управление кейсами, статусами и уровнями сложности;
- управление командами, студентами и составом команд;
- ведение истории назначения команд на кейсы по семестрам;
- работа с формами оценки и комментариями;
- интеграция с Microsoft Outlook через OAuth;
- управление встречами и поручениями;
- управление режимом Telegram-бота;
- формирование отчетов.

## Технологический стек

### Backend

- Python 3.12;
- FastAPI;
- SQLAlchemy 2 и asyncpg;
- PostgreSQL 16;
- Alembic;
- Pydantic и Pydantic Settings;
- Redis;
- httpx;
- PyJWT;
- MSAL;
- aiogram.

### Frontend

- React 19;
- TypeScript;
- Vite;
- React Router;
- Axios;
- Nginx для раздачи production-сборки.

### Инфраструктура

- Docker;
- Docker Compose;
- PostgreSQL и Redis в отдельных контейнерах;
- Docker volumes для хранения данных.

## Архитектура

Backend разделен на слои:

```text
router -> service -> repository -> database
```

Для внешних интеграций используется поток:

```text
router -> service -> integration client -> external API
```

Основные каталоги проекта:

```text
backend/
  api/             HTTP-эндпоинты FastAPI
  auth/            аутентификация и JWT
  integrations/    клиенты внешних сервисов
  models/          SQLAlchemy-модели
  repositories/    доступ к данным
  schemas/         Pydantic-схемы
  services/        бизнес-логика
  seeds/           заполнение справочных данных
  tg_bot/          Telegram-бот
  alembic/         миграции базы данных

frontend/
  src/app/         конфигурация React-приложения
  src/pages/       страницы интерфейса
  src/services/    работа с backend API
  src/components/  переиспользуемые компоненты
  src/styles/      глобальные стили
```

## Запуск через Docker Compose

### Требования

- Docker;
- Docker Compose.

### Настройка окружения

Backend читает настройки из `backend/.env`. Перед запуском проверьте значения следующих переменных:

```env
DATABASE_URL=postgresql+asyncpg://alpha_user:password123@postgres:5432/alpha_db
REDIS_URL=redis://redis:6379/0
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

OAUTH_MICROSOFT_CLIENT_ID=
OAUTH_MICROSOFT_CLIENT_SECRET=
OAUTH_MICROSOFT_REDIRECT_URL=
OAUTH_MICROSOFT_AUTHORITY=
OAUTH_MICROSOFT_AUTH_BASE_URL=
OAUTH_MICROSOFT_TOKEN_URL=
OAUTH_MICROSOFT_ME_URL=
OAUTH_MICROSOFT_EVENTS_URL=
OAUTH_MICROSOFT_CALENDAR_VIEW_URL=
TOKEN_ENCRYPTION_KEY=

GROQ_API_KEY=
GROQ_REQUEST_URL=
AI_MODEL=

BOT_TOKEN=
BOT_JWT=
```

Для работы JWT backend также использует ключи:

```text
backend/auth/certs/jwt-private.pem
backend/auth/certs/jwt-public.pem
```

### Запуск

Из корня проекта выполните:

```bash
docker compose up --build
```

При старте Docker Compose:

1. запускает PostgreSQL и Redis;
2. применяет миграции командой `alembic upgrade head`;
3. заполняет справочники и тестовые данные командой `python -m seeds.seed`;
4. запускает FastAPI на порту `8000`;
5. собирает frontend и запускает Nginx на порту `3000`.

После запуска доступны:

- frontend: `http://localhost:3000`;
- backend API: `http://localhost:8000`;
- Swagger UI: `http://localhost:8000/docs`;
- ReDoc: `http://localhost:8000/redoc`.

Тестовый пользователь, создаваемый seed-скриптом:

```text
Email: test@alfa.ru
Пароль: password
```

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить данные PostgreSQL и Redis:

```bash
docker compose down -v
```

## Локальный запуск для разработки

### 1. Запуск PostgreSQL и Redis

```bash
docker compose up -d postgres redis
```

При локальном запуске backend укажите в `backend/.env` адреса сервисов через `localhost`:

```env
DATABASE_URL=postgresql+asyncpg://alpha_user:password123@localhost:5432/alpha_db
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
```

### 2. Запуск backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m seeds.seed
uvicorn main:app --reload
```

Backend будет доступен по адресу `http://localhost:8000`.

### 3. Запуск frontend

В отдельном терминале:

```bash
cd frontend
npm ci
npm run dev
```

Frontend будет доступен по адресу `http://localhost:5173` и будет отправлять запросы к `http://localhost:8000`.

## Миграции

Команды выполняются из каталога `backend` с активированным виртуальным окружением:

```bash
alembic upgrade head
alembic current
alembic history
```

Создание новой миграции после изменения моделей:

```bash
alembic revision --autogenerate -m "описание изменения"
```

Перед применением автоматически созданной миграции необходимо проверить ее содержимое.

## Полезные команды

Проверка frontend:

```bash
cd frontend
npm run lint
npm run build
```

Просмотр логов контейнеров:

```bash
docker compose logs -f
```

Повторный запуск seed-скрипта:

```bash
docker compose exec backend python -m seeds.seed
```
