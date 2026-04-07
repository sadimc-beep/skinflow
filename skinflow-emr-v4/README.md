# Skinflow EMR v4 – Local Development (macOS)

This document describes how to run the **Django backend** and **Next.js frontend** for Skinflow EMR v4 on a Mac without breaking the existing development setup.

The project layout is:

- Django backend: `skinflow-emr-v4/`
- Next.js frontend: `skinflow-emr-v4/apps/web/`

## 1. Prerequisites

- **Python**: 3.10+ (recommended to use the system `python3` or a Homebrew-installed Python)
- **Node.js**: 18+ (e.g. via Homebrew: `brew install node` or via nvm)
- **npm**: bundled with Node.js

From the repo root:

```bash
cd skinflow-emr-v4
```

All commands below assume this as the working directory unless stated otherwise.

## 2. Backend – Django API

### 2.1. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2.2. Install Python dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 2.3. Configure environment variables

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. For local development you can keep the defaults:

   - `DJANGO_DEBUG=True`
   - SQLite database (`DJANGO_DB_ENGINE=django.db.backends.sqlite3`)

   For production/staging, override `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, CORS and DB vars as needed.

On macOS you can use `export` to temporarily override any value in your shell:

```bash
export DJANGO_DEBUG=True
export DJANGO_SECRET_KEY=dev-only-secret
```

> Note: The default `settings.py` is development-friendly and will fall back to sensible defaults if an env var is missing, so existing local workflows continue to work.

### 2.4. Apply migrations and run the server

```bash
python manage.py migrate
python manage.py runserver
```

By default the API will be available at `http://127.0.0.1:8000/`.

For production-minded deployments, you can point `DJANGO_SETTINGS_MODULE` to the new `settings_prod` module:

```bash
export DJANGO_SETTINGS_MODULE=skinflow.settings_prod
python manage.py runserver  # or your WSGI/ASGI server
```

## 3. Frontend – Next.js App

From the `apps/web` directory:

```bash
cd apps/web
```

### 3.1. Configure frontend env vars

Copy the example env file:

```bash
cp .env.example .env.local
```

The default value points to the local Django server:

```text
NEXT_PUBLIC_DJANGO_BASE_URL=http://127.0.0.1:8000
```

### 3.2. Install Node dependencies

```bash
npm install
```

### 3.3. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000/`.

## 4. Summary of environment-driven settings

The Django settings now read the following from the environment (with dev-friendly defaults):

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `DJANGO_CORS_ALLOW_ALL_ORIGINS`
- `DJANGO_CORS_ALLOW_CREDENTIALS`
- `DJANGO_DB_ENGINE`
- `DJANGO_DB_NAME`
- `DJANGO_DB_USER`
- `DJANGO_DB_PASSWORD`
- `DJANGO_DB_HOST`
- `DJANGO_DB_PORT`

For the frontend:

- `NEXT_PUBLIC_DJANGO_BASE_URL`

These changes provide a clear path to production-safe configuration while keeping the current local development behavior intact.

