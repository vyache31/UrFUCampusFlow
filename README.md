# Система управления проектным практикумом

Внутренняя веб-система для автоматизации проектного практикума студентов вузов-партнеров банка. Приложение помогает кураторам вести проектные кейсы, команды, участников, встречи, оценки и отчетность в одном месте.

### Содержание

- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Быстрый запуск проекта](#быстрый-запуск-через-docker-compose)
- [Локальный запуск для разработки](#локальный-запуск-для-разработки)
- [Миграции](#миграции)
- [Полезные команды](#полезные-команды)

Основная бизнес-цепочка проекта:

```text
case -> semester -> case_semester -> team_case_history
```

На текущем этапе система ориентирована на работу кураторов. Взаимодействие со студентами выполняется через внешние сервисы и Telegram-бота.

----
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
---
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
---
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
---
## Быстрый запуск через Docker Compose

### 1. Склонируйте репозиторий

```bash
git clone https://github.com/vyache31/UrFUCampusFlow.git
cd UrFUCampusFlow
```

### 2. Создайте файл окружения

Backend использует переменные окружения из файла backend/.env

Создайте его на основе шаблона

```bash
cp backend/.env.example backend/.env
```

### 3. Заполнение секретов

Некоторые переменные окружения содержат секретные данные,
поэтому не хранятся в репозитории.
Однако для работы функционала,
связанного с ИИ генерацией и Telegram Bot, они нужны

**Если вы хотите запустить без данного функционала,
то переходите к [шагу 4](#4-запуск-проекта).**

Откройте файл `backend/.env` и заполните необходимые значения

#### Telegram bot
Для успешной работы функционала, связанного с телеграмм ботом, нужно заполнить токен бота:

1. Откройте telegram и перейдите в чат с `@BotFather`
2. Отправьте команду `/newbot`
3. Заполните имя и юзернейм бота
4. Получите токен и вставьте укажите его в `BOT_TOKEN`

#### Microsoft Outlook integration

Для работы функционала, связанного с интеграцией Outlook, нужно зарегистрировать приложение в Microsoft Entra ID и получить OAuth2

1. Перейдите в Microsoft Azure

   `https://portal.azure.com/`
2. Откройте `Microsoft Entra ID` - `App registrations`
3. Нажмите `New registration`
4. Укажите параметры приложения:
   1. `Name:` - любое название
   2. `Supported account types:` => Выберите
   `Accounts in any organizational directory and personal Microsoft accounts`
5. Добавьте Redirect URI: 
    1. `Platform:` - Web
   2. `Redirect URI:` - `http://localhost:8000/auth/microsoft/callback`
   (значение должно совпадать с `OAUTH_MICROSOFT_REDIRECT_URL`)
6. После создания приложения откройте `Overview` и скопируйте `Application ID`
7. Вставьте полученное значение в переменную `OAUTH_MICROSOFT_CLIENT_ID=`
8. Создайте секрет в `Certificates & secrets` => `New client secret`
9. Скопируйте значение секрета и добавьте в `OAUTH_MICROSOFT_CLIENT_SECRET=`
10. Настройте права доступа
    1. Перейдите в `API permissions` => `Add a permission` 
    => `Miscrosoft Graph` => `Delegated permissions`
    2. Добавьте:
     
    ```text
    User.Read
    Calendars.Read
    Calendars.ReadWrite
    offline_access
    ```
11. Нажмите `Grant admin consent` _(если используется корпоративный Microsoft 365 аккаунт)_
12. Получите Tenant ID
    1. В разделе `Overview` скопируйте `Directory (tenant) ID` и добавьте
    в `OAUTH_MICROSOFT_AUTHORITY=
    https://login.microsoftonline.com/<TENANT_ID>`

#### GROQ API
1. Перейдите на сайт GROQ Console
`https://console.groq.com/`
2. Авторизуйтесь через Google или GitHub
3. Откройте раздел `API Keys`
4. Нажмите `Create API Key`
5. Укажите название ключа, например `alpha-backend-local`
6. Скопируйте созданный ключ.
_(Важно! после закрытия окна создания ключ больше нельзя будет посмотреть)_

7. Добавьте его в  `GROQ_API_KEY=`

_Будьте осторожны и не допускайте утечки ваших секретов!_

### 4. Запуск проекта

Из корня проекта выполните
```bash
docker compose up -d --build
```


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
### Остановка проекта
Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить данные PostgreSQL и Redis:

```bash
docker compose down -v
```
----
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

---
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

---
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
