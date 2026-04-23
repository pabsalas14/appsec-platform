# 🏗️ Development Framework

> **Production-ready full-stack starter kit** — accelerate new projects with a battle-tested architecture, built-in authentication, and end-to-end type safety.

---

## Starting a new project from this framework

You do **not** need to manually duplicate folders and edit everything by hand.
The intended workflow is: **get a copy of the repo → run `init.sh` → run the stack**.
That copy can come from GitHub’s template button or from an ordinary `git clone` /
folder copy of this repository.

### Recommended: GitHub template repository

If this repo is configured as a template on GitHub (**Settings → Template repository**):

1. Open the repo on GitHub and click **Use this template → Create a new repository**.
2. Clone **your new repository** (not the template source), then:

   ```bash
   cd your-new-repo
   ./scripts/init.sh my-app-slug
   make up
   make seed
   ```

You now have your own project folder with renamed placeholders, a generated
`.env`, and git ready for your first commits.

### Alternative: clone or copy without “Use this template”

If you prefer not to use the template button (or you only have a local mirror):

1. Clone this repository, **or** copy the project directory into a new folder
   where your app will live.
2. From that folder, still run `./scripts/init.sh <project-slug>` before you
   treat it as “your” app. That step replaces framework placeholders (e.g.
   package/project names), creates `.env` from `.env.example` with a fresh
   `SECRET_KEY`, prompts for admin credentials, removes template-only files,
   and can re-init git — see [`TEMPLATE.md`](TEMPLATE.md).
3. Then `make up` and `make seed` as above.

Skipping `init.sh` means you keep the template names and must configure `.env`
yourself (see **Quick Start** below).

If you cloned **this** repository to contribute changes upstream, **do not** run
`init.sh` there — it deletes `.git` and is meant only for spinning off a **new**
downstream project.

### What `init.sh` does (summary)

| Step | Effect |
|------|--------|
| Placeholder rename | Slug-based names across Compose, backend metadata, README, etc. |
| `.env` | Created from `.env.example` with new `SECRET_KEY` and admin prompts |
| Cleanup | Removes template-only files (e.g. `TEMPLATE.md`, template workflows) |
| Git | Replaces `.git` with a new repo and an initial commit (see `scripts/init.sh`) |

Further detail: [`TEMPLATE.md`](TEMPLATE.md). Design decisions you inherit:
[`docs/adr/`](docs/adr/README.md).

The sections below describe the framework **as a running app** — they apply the
same whether you arrived here via template + `init.sh` or manual clone + `.env`.

---

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org)

---

## ✨ Features

- **🔐 Authentication** — Browser sessions use HttpOnly cookies, CSRF double-submit protection, refresh rotation, and session-family revocation on suspicious reuse
- **🧩 CRUD Pattern** — Reference `Tasks` module showing the full Model → Schema → Service → Router → Frontend flow
- **📦 Async Everywhere** — SQLAlchemy Async + FastAPI async handlers for non-blocking I/O
- **🎨 Shadcn UI + Tailwind** — Beautiful, accessible component library with dark mode support
- **📡 Server-Sent Events** — Real-time push notifications with SSE, Nginx buffering pre-configured
- **🗃️ Database Migrations** — Alembic auto-migrations integrated into the Docker startup flow
- **🔄 TanStack Query** — Smart client-side caching, pagination, and optimistic updates
- **🐳 Fully Dockerized** — One command (`make up`) to spin up the entire stack
- **🌐 Nginx Reverse Proxy** — Unified entry point with CORS, security headers, and upload serving
- **🤖 AI Provider Ready** — Optional OpenAI, Anthropic, and Ollama integrations

---

## 🏛️ Architecture

```
                        ┌──────────┐
                        │  Client  │
                        └────┬─────┘
                             │ :80
                     ┌───────▼────────┐
                     │     Nginx      │
                     │ (reverse proxy)│
                     └──┬─────────┬───┘
                        │         │
             /api/*     │         │  /*
         ┌──────────────▼┐    ┌───▼──────────────┐
         │    Backend     │    │    Frontend       │
         │  FastAPI :8000 │    │  Next.js :3000    │
         │  Python 3.12   │    │  TypeScript       │
         │  SQLAlchemy    │    │  Tailwind + Shadcn│
         │  Pydantic v2   │    │  TanStack Query   │
         └───────┬────────┘    └──────────────────┘
                 │
         ┌───────▼────────┐
         │   PostgreSQL   │
         │      :5432     │
         └────────────────┘
```

All services run as Docker containers orchestrated via `docker-compose.yml`.

---

## 🚀 Quick Start

Use this section to run the stack. How you configure the environment depends on
whether you already ran **`./scripts/init.sh`** (see *Starting a new project* above).

| Situation | Configure env |
|-----------|-----------------|
| **After `init.sh`** | `.env` already exists with `SECRET_KEY` and admin values. Adjust only if needed, then jump to **Start the Stack**. |
| **No `init.sh`** (e.g. hacking on the framework repo itself) | Follow **Clone & configure** below: copy `.env.example` → `.env` and set variables manually. |

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/) v2+
- [Git](https://git-scm.com/)
- GNU Make (pre-installed on most Linux/macOS systems)

### 1. Clone & configure

```bash
git clone <your-repo-url> my-project
cd my-project
cp .env.example .env
```

Skip `cp .env.example .env` if `./scripts/init.sh` already created `.env`.

Edit `.env` and set the **required** variables (unless `init.sh` already set them):

```dotenv
# Generate with: python -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY=your-secret-key-here

# Initial admin account (used by seed script)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Changeme123!
```

### 2. Start the Stack

```bash
make up
```

This single command will:
1. Build all Docker images
2. Start PostgreSQL, Backend, Frontend, and Nginx
3. Run Alembic migrations automatically
4. Display the container status

### 3. Access the Application

| Service         | URL                          |
|-----------------|------------------------------|
| **Application** | http://localhost              |
| **API Docs**    | http://localhost/docs (dev/staging only unless explicitly enabled in prod) |
| **ReDoc**       | http://localhost/redoc (dev/staging only unless explicitly enabled in prod) |
| **Health Check**| http://localhost/api/health   |

### 4. Seed Initial Data (Optional)

```bash
make seed
```

This creates the admin user and sample data defined in `backend/app/seed.py`.

---

## 📂 Project Structure

```
.
├── .env.example              # Environment variables template
├── docker-compose.yml        # Service orchestration
├── Makefile                  # Developer commands (single entry point)
│
├── backend/                  # FastAPI application
│   ├── Dockerfile
│   ├── requirements.txt      # Python dependencies
│   ├── alembic.ini           # Migration config
│   ├── alembic/              # Database migrations
│   └── app/
│       ├── main.py           # ASGI entry point
│       ├── config.py         # Settings (env vars)
│       ├── database.py       # Async DB session
│       ├── core/             # Security, exceptions, response helpers
│       ├── models/           # SQLAlchemy ORM models
│       ├── schemas/          # Pydantic DTOs (validation)
│       ├── services/         # Business logic (async)
│       └── api/
│           ├── deps.py       # Shared dependencies (auth, DB)
│           └── v1/           # Versioned API routes
│               ├── router.py # Route registry
│               ├── auth.py   # Auth endpoints
│               └── tasks.py  # Tasks CRUD endpoints
│
├── frontend/                 # Next.js application
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── app/              # App Router (pages & layouts)
│       │   ├── layout.tsx    # Root layout
│       │   ├── login/        # Auth pages
│       │   └── (dashboard)/  # Protected dashboard routes
│       ├── components/       # React components
│       │   ├── ui/           # Shadcn base components
│       │   └── providers.tsx # QueryClient, Theme providers
│       ├── hooks/            # TanStack Query hooks
│       ├── lib/              # API client, utils, validators
│       └── types/            # TypeScript interfaces
│
└── nginx/
    └── nginx.conf            # Reverse proxy + CORS + security headers
```

---

## 🛠️ Development Commands

All operations are managed through the `Makefile`:

### Lifecycle

| Command        | Description                                           |
|----------------|-------------------------------------------------------|
| `make up`      | Build and start all services                          |
| `make down`    | Stop all containers and remove orphans                |
| `make restart` | Quick restart of all services                         |
| `make build`   | Rebuild Docker images without starting                |
| `make seed`    | Re-run database seeding                               |
| `make clean`   | ⚠️ Stop containers and remove **all** volumes          |

### Debugging

| Command          | Description                              |
|------------------|------------------------------------------|
| `make logs`      | Tail logs for all services               |
| `make logs-back` | Tail backend logs only                   |
| `make logs-front`| Tail frontend logs only                  |
| `make shell-back`| Bash shell inside the backend container  |
| `make shell-db`  | PSQL shell inside the PostgreSQL container |
| `make status`    | Show container status and active branch  |
| `make stats`     | Show CPU/RAM usage per container         |

### Testing

| Command          | Description                              |
|------------------|------------------------------------------|
| `make test`      | Run backend tests (`pytest`)             |
| `npm run lint`   | Frontend linting (inside `frontend/`)    |
| `npm test`       | Frontend tests with Vitest               |

---

## 🔑 API Contract

All API responses follow a standardized envelope format:

### Success Response

```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "v1"
  }
}
```

### Paginated List Response

```json
{
  "status": "success",
  "data": [ ... ],
  "pagination": {
    "total": 42,
    "skip": 0,
    "limit": 10,
    "hasMore": true
  },
  "meta": { ... }
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  },
  "meta": { ... }
}
```

---

## 🧩 Adding a New Entity (CRUD Pattern)

Follow this checklist when adding a new resource (e.g., `Clients`):

### Backend

1. **Model** — `backend/app/models/client.py` — SQLAlchemy ORM definition
2. **Schema** — `backend/app/schemas/client.py` — Pydantic Create/Update/Response DTOs
3. **Service** — `backend/app/services/client_service.py` — Async business logic
4. **Router** — `backend/app/api/v1/clients.py` — HTTP endpoints
5. **Register** — Add the router in `backend/app/api/v1/router.py`
6. **Migrate** — Run `alembic revision --autogenerate -m "add clients"` then `alembic upgrade head`

### Frontend

7. **Types** — `frontend/src/types/client.ts` — TypeScript interfaces (mirroring Pydantic schemas)
8. **API Hook** — `frontend/src/hooks/useClients.ts` — TanStack Query queries/mutations
9. **Components** — `frontend/src/components/clients/` — UI components
10. **Page** — `frontend/src/app/(dashboard)/clients/page.tsx` — App Router page

> 💡 Use the existing **Tasks** module as a reference implementation to copy and adapt.

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `SECRET_KEY` | ✅ | — | JWT signing key |
| `ADMIN_EMAIL` | ✅ | — | Initial admin email (seed) |
| `ADMIN_PASSWORD` | ✅ | — | Initial admin password (seed) |
| `POSTGRES_USER` | | `framework` | Database user |
| `POSTGRES_PASSWORD` | | `framework_secret` | Database password |
| `POSTGRES_DB` | | `framework` | Database name |
| `JWT_ALGORITHM` | | `HS256` | Token algorithm |
| `JWT_ACCESS_EXPIRE_MINUTES` | | `30` | Access cookie TTL |
| `JWT_REFRESH_EXPIRE_DAYS` | | `7` | Refresh cookie TTL |
| `AUTH_MIN_PASSWORD_LENGTH` | | `10` | Minimum password length enforced by auth flows |
| `AUTH_LOGIN_RATE_LIMIT_PER_MIN` | | `10` | Per-client login attempts per minute |
| `AUTH_REGISTER_RATE_LIMIT_PER_MIN` | | `5` | Per-client register attempts per minute |
| `AUTH_REFRESH_RATE_LIMIT_PER_MIN` | | `30` | Per-client refresh attempts per minute |
| `AUTH_LOCKOUT_THRESHOLD` | | `5` | Failed logins before temporary cooldown |
| `AUTH_LOCKOUT_MINUTES` | | `15` | Cooldown duration after repeated failed login attempts |
| `CORS_ORIGINS` | | localhost variants | Allowed origins |
| `NEXT_PUBLIC_API_URL` | | _(empty)_ | Leave empty behind Nginx |
| `RUN_SEED` | | `false` | Run seed on startup |
| `SSE_ENABLED` | | `true` | Enable Server-Sent Events |
| `ENABLE_OPENAPI_DOCS` | | `true` | Enable docs outside prod, or with explicit prod override |
| `ALLOW_OPENAPI_IN_PROD` | | `false` | Required alongside `ENABLE_OPENAPI_DOCS=true` in prod |
| `MAX_UPLOAD_SIZE_MB` | | `10` | File upload limit |

See [`.env.example`](.env.example) for the full list including optional AI provider keys.

---

## 🗄️ Database Migrations

Migrations run automatically on container startup. For manual operations:

```bash
# Open a shell in the backend container
make shell-back

# Generate a new migration after model changes
alembic revision --autogenerate -m "describe your change"

# Apply pending migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

---

## 🔒 Authentication Flow

```
┌──────────┐    POST /api/v1/auth/login    ┌──────────┐
│ Browser  │ ───────────────────────────▶  │ FastAPI  │
│ Client   │                               │ Backend  │
│          │ ◀─ Set-Cookie: access/refresh │          │
│          │ ◀─ Set-Cookie: csrf_token     │          │
└──────────┘                               └──────────┘
```

1. The browser sends credentials to `POST /api/v1/auth/login`.
2. The backend validates credentials and sets `access_token` and `refresh_token`
   as HttpOnly cookies plus a readable `csrf_token` cookie.
3. Browser requests include auth cookies automatically; mutating requests echo
   `csrf_token` through `X-CSRF-Token`.
4. `POST /api/v1/auth/refresh` rotates the refresh token and preserves the same
   session family.
5. If a revoked refresh token is reused, the backend revokes the whole session
   family and future access from that session is rejected.

---

## 📋 Tech Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Docker Compose | Container orchestration |
| **Proxy** | Nginx Alpine | Reverse proxy, CORS, security headers |
| **Backend** | FastAPI + Uvicorn | Async REST API |
| **ORM** | SQLAlchemy 2.0 (async) | Database access |
| **Validation** | Pydantic v2 | Request/response schemas |
| **Migrations** | Alembic | Database version control |
| **Database** | PostgreSQL 16 | Primary data store |
| **Frontend** | Next.js 14 (App Router) | React framework with SSR |
| **Styling** | Tailwind CSS + Shadcn UI | Component library |
| **State** | TanStack Query + Zustand | Server & client state |
| **Forms** | React Hook Form + Zod | Form handling & validation |
| **Testing** | Pytest / Vitest | Backend & frontend tests |

---

## 📄 License

This project is private. All rights reserved.
