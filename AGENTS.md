# Agent Guide — Desarrollo Framework

Compact, enforceable instructions for AI agents and humans working in this
repository. The rules below are not suggestions: they are validated by tests
and CI, and breaking them fails the pipeline.

> New here? Read [`docs/adr/README.md`](docs/adr/README.md) first. Every hard
> rule points to the ADR that justifies it.

---

## 🚦 Hard Rules

### MUST

| # | Rule | Enforced by |
|---|------|-------------|
| 1 | Every route under `/api/v1/*` depends (transitively) on `get_current_user` or `require_role`, OR is explicitly listed in `tests/test_contract.py::PUBLIC_ROUTES`. | [test_contract.py](backend/tests/test_contract.py) — ADR-0001 |
| 2 | Every response — success and error — uses the envelope helpers in [`app/core/response.py`](backend/app/core/response.py). Error handlers in [`app/main.py`](backend/app/main.py) wrap `HTTPException` and `RequestValidationError`. | test_contract.py — ADR-0001 |
| 3 | Owned entities declare `owner_field` on their service and use `require_ownership` in the router. | [test_ownership.py](backend/tests/test_ownership.py) — ADR-0004 |
| 4 | Every owned entity is listed in `tests/test_ownership.py::OWNED_ENTITIES` with a `creator` fixture. | test_ownership.py — ADR-0004 |
| 5 | All auth cookies are set via `app/core/cookies.py` helpers. | ADR-0002 |
| 6 | Frontend API types are imported from `@/types` (generated). Manual wire-shape types require an ADR. | `drift-types` CI job — ADR-0005 |
| 7 | New entities are scaffolded with `make new-entity NAME=X FIELDS="…"`, not by hand. | scripts/new_entity.py — ADR-0006 |
| 8 | Every owned `BaseService` sets `audit_action_prefix=<entity>`, so mutations are persisted in `audit_logs`. | [test_contract.py](backend/tests/test_contract.py) — ADR-0007 |
| 9 | Every backend log call goes through `from app.core.logging import logger` (never `print`). Every frontend log goes through `@/lib/logger` (never `console.*`). | `ruff T20` + ESLint `no-console` — ADR-0007 |
| 10 | Authenticated UI lives under `frontend/src/app/(dashboard)/` so it inherits `AuthGate`, sidebar, header, theme, and command palette. New admin pages live under `/admin/*` and the router under `app/api/v1/admin/*` with `Depends(require_role("admin"))`. | ADR-0008 |
| 11 | New UI primitives are exported from `@/components/ui` and get a section in `/kitchen-sink`. Chart primitives under `@/components/charts` read CSS variables, not hard-coded colors, so they react to `next-themes`. | ADR-0008 |
| 12 | Public registration always creates `role="user"` and the public auth schema MUST NOT expose role assignment fields. | `test_auth.py` + `test_contract.py` — ADR-0012 |
| 13 | Browser auth is cookie-only: `login` / `refresh` set cookies and MUST NOT expose access tokens in JSON responses. | `test_auth.py` + `test_contract.py` — ADR-0010 |
| 14 | Cookie-authenticated mutating requests require double-submit CSRF (`csrf_token` cookie + `X-CSRF-Token` header). | `test_auth.py` + `test_contract.py` — ADR-0010 |
| 15 | Auth endpoints (`login`, `register`, `refresh`) ship with abuse controls: rate limiting by default and refresh-token family revocation on suspicious reuse. | `test_auth.py` — ADR-0011 |
| 16 | Production docs exposure fails closed unless explicitly overridden with `ALLOW_OPENAPI_IN_PROD=true`. | `test_contract.py` — ADR-0013 |

### MUST NEVER

| # | Rule | Enforced by |
|---|------|-------------|
| 1 | Call `await db.commit()` anywhere outside `app/database.py::get_db()`. `BaseService` and user code MUST use `db.flush()`. | test_ownership.py (`test_base_service_never_commits`) — ADR-0003 |
| 2 | Call `response.set_cookie(...)` outside `app/core/cookies.py`. | `ruff`/grep check — ADR-0002 |
| 3 | Query an owned entity without passing `scope={owner_field: user.id}` to the service. `BaseService` raises `RuntimeError` if you try. | Runtime + test_ownership.py — ADR-0004 |
| 4 | Store access / refresh tokens in `localStorage` or `sessionStorage`. Cookies only. | ADR-0002 |
| 5 | Import `axios` directly in a frontend module. Use `@/lib/api`. | ESLint `no-restricted-imports` |
| 6 | Use `any` in TypeScript. Use generated types or zod schemas. | ESLint `@typescript-eslint/no-explicit-any` |
| 7 | Hand-write types that duplicate OpenAPI schemas. Re-export from `@/types/api` instead. | `drift-types` CI job — ADR-0005 |
| 8 | Call `print(...)` in backend code or `console.*` in frontend code (except inside `frontend/src/lib/logger.ts`). | `ruff T20` + ESLint `no-console` — ADR-0007 |
| 9 | Log raw tokens, passwords, cookies or hashed passwords. The `RedactFilter` scrubs them, but don't rely on it — never put them in `extra={}` in the first place. | ADR-0007 |
| 10 | Reintroduce `access_token` or `refresh_token` in JSON responses for browser auth endpoints. | `test_auth.py` + `test_contract.py` — ADR-0010 |
| 11 | Create a public self-registration path that lets the caller pick privileged roles. | `test_auth.py` + `test_contract.py` — ADR-0012 |

---

## 🛠️ Developer Commands

The `Makefile` is the source of truth.

### Environment & lifecycle

| Command | Purpose |
|---------|---------|
| `make up` | Build + start the stack (docker compose with override for hot-reload). |
| `make up-prod` | Same without the override, production-ish image. |
| `make down` | Stop all containers. |
| `make restart` | Quick restart. |
| `make seed` | Re-run seeding (creates the admin user). |
| `make clean` | ⚠️ Drop all volumes — destructive. |

### Verification

| Command | Purpose |
|---------|---------|
| `make test` | Backend pytest suite (contract + IDOR + smoke). ⚠ truncates `users`/`tasks`/`refresh_tokens` between tests — run only against a disposable DB (the dev compose DB is fine; `make seed` afterwards to restore the admin). |
| `make types` | Regenerate `frontend/src/types/api.ts` from the running backend. |
| `cd frontend && npm run lint` | ESLint + `tsc --noEmit`. |

### Scaffolding

```bash
make new-entity NAME=Project FIELDS="title:str,description:text?,due_date:datetime?"
docker compose exec backend alembic revision --autogenerate -m "add projects"
docker compose exec backend alembic upgrade head
make test
```

Generates backend model/schema/service/router/tests and frontend
schema/hook/page, and registers the router in `api/v1/router.py`.

---

## 🏗️ Architecture snapshot

- **Backend**: FastAPI (Python 3.12) + SQLAlchemy Async + Pydantic v2 + Alembic
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + Shadcn UI + TanStack Query
- **Infra**: Nginx reverse proxy + PostgreSQL 16 + Docker Compose

### Layered responsibilities

```
Request → Nginx → FastAPI route → require_ownership? → BaseService → DB
                      ↓                                    ↓
               success()/error()                       flush() only
                      ↓
                 Envelope JSON
```

- **Router** only wires dependencies, validates input with Pydantic, and
  returns through `success/paginated/error`.
- **Service** only touches the DB via the session. Never commits. Never
  raises HTTP errors.
- **Route errors** (404/403/etc.) are raised as `NotFoundException` &
  friends from `app/core/exceptions.py`.

---

## 📂 Project structure (essentials)

```
backend/
  app/
    api/
      deps.py              # get_current_user, require_role
      deps_ownership.py    # require_ownership (single source of IDOR defence)
      v1/                  # routers (one module per entity)
    core/
      cookies.py           # only allowed set_cookie caller
      exceptions.py        # typed HTTPException subclasses
      response.py          # success/paginated/error envelopes
    services/
      base.py              # generic CRUD + ownership
    main.py                # global exception handlers + middleware
    database.py            # engine + get_db (sole commit site)
  alembic/versions/        # one migration per model change
  tests/
    test_contract.py       # envelope + auth guard
    test_ownership.py      # IDOR per entity
    test_<entity>.py       # smoke CRUD per entity
frontend/
  src/
    lib/api.ts             # only allowed axios import
    lib/schemas/*.ts       # zod schemas (forms)
    types/api.ts           # generated from OpenAPI (do not edit)
    types/index.ts         # re-exports
scripts/
  new_entity.py            # scaffolding
  init.sh                  # post-clone customization
docs/adr/                  # architecture decision records
```

---

## 📋 Observability & logs

Every backend module uses the same structured logger; every frontend module
uses the same batched client logger. Both emit JSON through the same
aggregation path, correlated by `X-Request-ID`.

### Backend

```python
from app.core.logging import logger

logger.info("task.create", extra={"event": "task.create", "task_id": str(task.id)})
logger.warning("scan.throttled", extra={"event": "scan.throttled", "scan_id": sid})
```

- `event` is mandatory and follows `<domain>.<verb>` (e.g. `auth.login_success`,
  `http.response`). Stays stable across deploys so dashboards don't break.
- `request_id`, `user_id`, `ip`, `method`, `path` are injected automatically
  from contextvars — never pass them by hand.
- Secrets (`password`, `token`, `cookie`, `authorization`, `refresh_token`, …)
  are scrubbed by `RedactFilter` even if passed through `extra={}`. Do NOT
  rely on that — keep them out of logs in the first place.

### Frontend

```typescript
import { logger } from '@/lib/logger';

logger.info('task.create.click', { taskId });
logger.error('unexpected.state', { stateId });
```

- Dev → `console.*` with `[app]` prefix.
- Prod → batched to `POST /api/v1/client-logs` (5 s / visibility hide /
  buffer full). Dropped silently on network failure.

### Audit log

Every owned `BaseService` (`owner_field != None`) MUST also set
`audit_action_prefix=<entity>`. The scaffolder does this by default.

```python
from app.services.base import BaseService
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate

task_svc = BaseService[Task, TaskCreate, TaskUpdate](
    Task, owner_field="user_id", audit_action_prefix="task",
)
```

Browse entries as admin at `GET /api/v1/audit-logs` or the dedicated
`/admin/audit-logs` page in the UI (filters + date range picker).

---

## 🖥️ Frontend application shell (ADR-0008)

All authenticated pages live under `app/(dashboard)/`:

```
AuthGate → TooltipProvider → CommandPalette
        → <Sidebar> | <Header> | <main>{children}</main>
```

Key pieces (do not duplicate; reuse them for new pages):

| Piece                              | Where                                          |
|------------------------------------|------------------------------------------------|
| Sidebar (collapsible, role-aware)  | `components/layout/Sidebar.tsx`                |
| Header (breadcrumbs + utilities)   | `components/layout/Header.tsx`                 |
| Command palette (Ctrl+K)           | `components/layout/CommandPalette.tsx`         |
| Theme toggle (`next-themes`)       | `components/layout/ThemeToggle.tsx`            |
| User menu                          | `components/layout/UserMenu.tsx`               |
| Current user / sidebar state hooks | `hooks/useCurrentUser.ts`, `useSidebarState.ts`|
| Chart wrappers (theme-aware)       | `components/charts/index.tsx`                  |
| Kanban primitives (`dnd-kit`)      | `components/kanban/`                           |
| Kitchen Sink gallery               | `app/(dashboard)/kitchen-sink/page.tsx`        |

New backend endpoints powering this surface:

- `GET /api/v1/dashboard/stats` — aggregated counters + activity series.
- `/api/v1/admin/users` — admin-only user CRUD + password reset.
- `/api/v1/admin/roles` — admin-managed roles + permissions (M:N demo).
- `/api/v1/admin/settings` — runtime-mutable JSONB system settings.
- `/api/v1/uploads` — multipart upload + per-user storage.
- `PATCH /api/v1/auth/me` + `POST /api/v1/auth/me/password` — self-service
  profile/password edits.

---

## ✅ PR checklist (copy into every PR body)

- [ ] All touched routes have `get_current_user` / `require_role` / `require_ownership` (ADR-0001, ADR-0004).
- [ ] Returns use `success` / `paginated` / `error` (ADR-0001).
- [ ] No new `db.commit()` outside `get_db` (ADR-0003).
- [ ] No new `set_cookie` outside `core/cookies.py` (ADR-0002).
- [ ] Public registration still forces `role="user"` and auth responses do not expose tokens in JSON (ADR-0010, ADR-0012).
- [ ] Cookie-authenticated mutating requests still enforce CSRF (ADR-0010).
- [ ] Production docs remain fail-closed unless explicitly overridden (ADR-0013).
- [ ] New owned entity? Added to `tests/test_ownership.py::OWNED_ENTITIES`.
- [ ] New backend schema? Ran `make types` and committed `frontend/src/types/api.ts`.
- [ ] Tests pass locally: `make test` and `cd frontend && npm run lint`.
- [ ] New owned service sets `audit_action_prefix=<entity>` (ADR-0007).
- [ ] No new `print(...)` in backend; no new `console.*` in frontend outside `lib/logger.ts` (ADR-0007).
- [ ] ADR added/updated if we changed a hard rule.

---

## ⚠️ Operational gotchas

- **Async DB tests**: `tests/conftest.py` uses `NullPool` + session-scoped
  engine because `asyncpg` connections are bound to their creating event
  loop. Don't switch to a pooled engine without understanding ADR-0006.
- **Nginx buffering**: SSE streams (`/api/v1/events/stream`) require
  `proxy_buffering off`.
- **Frontend API URL**: `NEXT_PUBLIC_API_URL` is a build-time arg. Leave
  empty when accessing via `http://127.0.0.1` (Nginx handles routing);
  only set for direct backend dev (`http://localhost:8000`).
- **`asyncpg` + pool**: never reduce `pool_size` below the expected
  concurrency — prefer `NullPool` in tests.
