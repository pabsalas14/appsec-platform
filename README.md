# AppSec Platform

> Plataforma centralizada de **Application Security**: visibilidad de vulnerabilidades, programas, hallazgos (SAST/DAST/MAST/pipeline/tercero/auditoría), releases y trazabilidad auditable, sin depender de hojas de cálculo.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript 5.5](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tests](https://img.shields.io/badge/pytest-438%20tests-brightgreen)](#verificación)
[![OWASP](https://img.shields.io/badge/OWASP-API%20Top%2010-red)](https://owasp.org/API-Security/)

---

## Visión y alcance

- Ciclo de vida de **vulnerabilidades** (historial, excepciones, aceptación de riesgo, evidencias).
- **Programas y ejecuciones** (SAST, DAST, MAST, pipeline, tercero, source code) con pantallas de catálogo bajo el dashboard.
- **Jerarquía organizacional (BRD §3)**, inventario (repositorios, activos web) y entrega (servicios, releases, pipelines, iniciativas).
- **Dashboards** bajo permiso `dashboards.view`, drill-down y export CSV donde aplica (auditoría A7).
- **IA** configurable (Ollama / proveedores de pago) para threat modeling y triaje; el producto **funciona sin IA**.

Cambios duros (auth, CSRF, envelopes, ownership, cookies, no `print` en backend, `logger` en front) viven en **[`AGENTS.md`](AGENTS.md)** — allí apunta el CI. No dupliques reglas en este README.

**Negocio y cumplimiento (BRD):** [`docs/brd/`](docs/brd/) — plan por fases, matriz, backlog de pantallas.

---

## Arquitectura (resumen)

```
Navegador → Nginx (:80) → { /api/* → FastAPI (async, SQLAlchemy, Pydantic v2) ; /* → Next.js 14 (App Router) } → PostgreSQL 16
```

| Capa | Tecnología |
|------|------------|
| API | FastAPI, Alembic, `BaseService` + `require_ownership` (IDOR) |
| Web | Next.js, TanStack Query, RHF + Zod, Shadcn UI |
| Contrato | OpenAPI → `make types` → `frontend/src/types/api.ts` |
| Notas / auditoría | `app.core.logging` + `client-logs` (frontend) + `audit_logs` |

Estructura de carpetas esencial: ver **[`AGENTS.md`](AGENTS.md)** (sección estructura).

---

## Inicio rápido

**Requisitos:** Docker + Compose v2, GNU Make, Git.

```bash
git clone <url> appsec-platform && cd appsec-platform
cp .env.example .env   # rellenar SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, etc.
make up
make seed
```

| URL | Uso |
|-----|-----|
| http://localhost | App (Nginx) |
| http://localhost/docs | OpenAPI (Swagger) |
| http://localhost/api/health | Health |

> Tras pruebas que truncan la BD, `make seed` restaura el admin. Ver advertencia de `make test`.

---

## Comandos de desarrollo (Makefile = fuente de verdad)

| Comando | Uso |
|---------|-----|
| `make up` / `make down` / `make restart` | Ciclo de vida del stack |
| `make test` | Suite pytest en contenedor (⚠ base de pruebas) |
| `make types` | Regenera `frontend/src/types/api.ts` contra el API en ejecución |
| `cd frontend && npm run lint` | ESLint + `tsc --noEmit` |
| `make new-entity NAME=… FIELDS="…"` | Scaffolding (no crear entidades a mano) |

Nuevas entidades: `make new-entity` + migración Alembic + `make types` + pruebas — ver `AGENTS.md` y el checklist del PR allí.

---

## Verificación

- **Backend:** `make test` (p. ej. **438** pruebas en el último pase local; el número puede variar con el repo).
- **Frontend:** `cd frontend && npm run lint`.
- **Contrato / IDOR / auth:** cubiertos por tests en `backend/tests/`.

---

## API (envelope)

Respuestas JSON con `status: success | error`, `data` o `detail`, y `meta` (p. ej. `request_id`). Errores de validación con código `RequestValidationError`. Detalle en el código: `app/core/response.py` y manejadores en `app/main.py`.

---

## Seguridad (lectura)

- **Cookies HttpOnly** + **CSRF** en mutaciones con sesión. Sin tokens de acceso en JSON en login. Ver tests en `test_auth.py` y `test_contract.py`.
- **IDOR:** `require_ownership` en entidades con dueño. Tabla de rutas en tests de contrato.
- **Reglas A1–A8** (auditoría, SoD, export, etc.): resumen en `AGENTS.md` y ADRs en `docs/adr/`.
- **OWASP API Top 10:** alineación descrita en `AGENTS.md` (no se duplica aquí el mapa entero).

---

## Estado del producto (una sola tabla)

| Área | Estado (orientativo) |
|------|----------------------|
| API + contrato + auth + ownership | Sólido (tests) |
| Catálogos y pantallas de listado (dashboard) | Sustituidos listados `JSON` por tablas + CRUD donde el API lo permite; ver `docs/brd/BACKLOG_PANTALLAS_CATALOGO.md` |
| Hallazgos (SAST/DAST/MAST/pipeline/tercero/auditoría) | Rutas y CRUD bajo sección *Hallazgos (BRD)* en la UI |
| Dashboards e IA | En evolución; permisos `dashboards.view` / `ia.execute` / export con auditoría |
| E2E / performance / cierre de calidad | Ver plan en `docs/brd/` (fases y matriz) |

> Los números de entidades, migraciones o fases no se repiten aquí para evitar desalinearse con el código. La **fuente de verdad** del cumplimiento negocio es `docs/brd/`.

---

## Licencia

Proyecto privado — todos los derechos reservados.
