# AppSec Platform

Plataforma centralizada de **Application Security**: vulnerabilidades, programas (SAST/DAST/SCA/CDS/MDA/MAST), pipelines y hallazgos, **releases** operativos, **gobierno organizacional** (jerarquía BRD), **OKR**, **auditorías**, **temas emergentes**, **Code Security Reviews (SCR)** y **administración no-code** (campos personalizados, vistas de módulo, reglas), con **API contratada**, **cookies + CSRF**, **ownership** y **auditoría** persistente.

**Normas de desarrollo obligatorias:** [`AGENTS.md`](AGENTS.md) · **Decisiones de arquitectura:** [`docs/adr/README.md`](docs/adr/README.md) · **Cumplimiento spec UX/dominio (24 puntos):** [`docs/qa/AUDITORIA_24_PUNTOS_CUMPLIMIENTO_2026-05-02.md`](docs/qa/AUDITORIA_24_PUNTOS_CUMPLIMIENTO_2026-05-02.md) y [`docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md`](docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md) · **Criterios medibles P01–P24:** [`docs/adr/0017-appsec-spec-ux-criteria.md`](docs/adr/0017-appsec-spec-ux-criteria.md) · **Alcance no-code builder:** [`docs/adr/0016-no-code-builder-scope-brd.md`](docs/adr/0016-no-code-builder-scope-brd.md).

---

## Stack

| Capa | Tecnología |
|------|------------|
| API | FastAPI (Python 3.12), SQLAlchemy async, Pydantic v2, Alembic |
| Web | Next.js 14 (App Router), TypeScript, Tailwind, TanStack Query, RHF + Zod |
| Datos | PostgreSQL 16 |
| Cola / async | Redis 7, Celery (SCR y tareas) |
| Borde | Nginx (reverse proxy, uploads estáticos) |
| Contrato | OpenAPI → `make types` → `frontend/src/types/api.ts` (no duplicar tipos a mano) |

Flujo resumido: **Navegador → Nginx (:80) →** `{ /api/* → FastAPI ; /* → Next.js }` **→ PostgreSQL**.

---

## Inicio rápido

**Requisitos:** Docker Compose v2, GNU Make, Git.

```bash
git clone <url> appsec-platform && cd appsec-platform
cp .env.example .env   # SECRET_KEY, APPSEC_MASTER_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, …
make up
make seed    # opcional: usuario admin + datos demo (según seed)
```

| URL | Uso |
|-----|-----|
| http://127.0.0.1 | App vía Nginx |
| http://127.0.0.1:8000/openapi.json | Esquema OpenAPI (también útil para `make types`) |
| http://127.0.0.1:8000/docs | Swagger (según entorno; ver ADR-0013) |

**Usuario inicial:** credenciales `ADMIN_EMAIL` / `ADMIN_PASSWORD` del `.env` tras `make seed`.

---

## Docker: qué ocurre al levantar el stack

Compose principal: [`docker-compose.yml`](docker-compose.yml). En desarrollo se fusiona automáticamente [`docker-compose.override.yml`](docker-compose.override.yml).

| Servicio | Rol |
|----------|-----|
| **postgres** | Base de datos persistente (`postgres_data`) |
| **redis** | Broker/resultados Celery |
| **backend** | FastAPI; al iniciar ejecuta **`alembic upgrade heads`** y opcionalmente **`python -m app.seed`** si `RUN_SEED=true` |
| **celery-worker** | Worker para pipeline SCR y jobs |
| **frontend** | Next.js (en override: `npm run dev` con hot-reload) |
| **nginx** | Proxy a frontend y API |

**Desarrollo (`make up`):** bind-mount de `./backend` y `./frontend` para hot-reload (override).

**Producción “ish” (`make up-prod`):** solo `docker-compose.yml` — imagen backend sin montar todo el repo; **hay que reconstruir** la imagen tras cambios en `backend/` antes de desplegar.

**Migraciones:** aplicadas en el arranque del contenedor backend (`upgrade heads`). Para ejecutar a mano:  
`docker compose exec backend alembic upgrade heads`

**Seed:** por defecto no corre; activar `RUN_SEED=true` en `.env` o usar `make seed` (reinicia backend con seed según Makefile).

---

## Comandos (Makefile)

| Comando | Descripción |
|---------|-------------|
| `make up` | Stack con override de desarrollo (hot-reload) |
| `make up-prod` | Stack sin override (imagen backend “cerrada”) |
| `make down` / `make restart` | Parar / reiniciar |
| `make seed` | Vuelve a ejecutar seeding (admin demo) |
| `make test` | Pytest **dentro del contenedor backend** — ⚠ trunca tablas de usuario en la BD objetivo; usar BD desechable |
| `make types` | Regenera `frontend/src/types/api.ts` desde `http://127.0.0.1:8000/openapi.json` |
| `make clean` | Destructivo: borra volúmenes |

Frontend (directo):

```bash
cd frontend && npm run lint    # ESLint + tsc --noEmit
```

---

## Especificación funcional por módulo (mapa)

Ámbito UI autenticada: `frontend/src/app/(dashboard)/`. Prefijo API: `/api/v1/`.

### Shell, auth y perfil

- Cookies HttpOnly, refresh rotativo, **CSRF** en mutaciones con cookie de sesión.
- Rutas: login/registro, `AuthGate`, sidebar, header, **Command Palette** (Ctrl+K), tema, `/profile`.

### Organización e inventario (BRD jerarquía)

- **Catálogos:** dirección → subdirección → gerencia → organización → célula (`direccions`, `subdireccions`, `gerencias`, `organizacions`, `celulas`).
- **Vista árbol:** `/organizacion/jerarquia` (madurez por célula vía API madurez).
- **Inventario:** `/inventario` — enlaces a **repositorios** y **activos web**; CRUD con ownership y CSV donde aplique.
- Activos adicionales: servicios, aplicaciones móviles; tipos de prueba y controles de seguridad como catálogo.

### Vulnerabilidades

- Registro masivo y detalle: `/vulnerabilidads/registros`, `/vulnerabilidads/[id]`.
- Filtros en URL + chips; **célula** y **organización** en listado; SLA, reincidencia, motores (incl. CDS/MDA según dominio).
- Import CSV **por motor** (pestañas en UI + endpoints `import/{motor}`).
- Excepciones, aceptación de riesgo, evidencias de remediación, historial donde esté cableado.

### Operación y liberaciones

- **Service releases**, etapas, **pipeline releases**, hallazgos de pipeline, revisión de terceros.
- **Kanban de liberaciones:** `/dashboards/kanban` — columnas ordenables según config operación (`GET /service_releases/config/operacion` + ajustes en admin).
- Tablas y dashboards de releases: `/dashboards/releases`, `/service_releases`, `/pipeline_releases`, `/hallazgo_pipelines`.

### Programas anuales e iniciativas

- Programas por motor: SAST, DAST, threat modeling, source code, MAST, etc. (routers `programa_*`, actividades, ejecuciones).
- **Hub unificado:** `/programas` — acceso a dashboard anual, programas por tipo e iniciativas.
- **Iniciativas:** registros, dashboard, detalle con pestañas y campos personalizados; hitos con peso/avance según modelo.

### Desempeño (OKR)

- `/okr_dashboard`, compromisos, subcompromisos, revisiones trimestrales y cierres — datos expuestos vía routers `okr_*` y paneles dedicados.

### Auditorías y temas emergentes

- Auditorías, hallazgos, evidencias, planes de remediación enlazados a vulnerabilidades donde aplique.
- Temas emergentes, actualizaciones y cierres; dashboards de “temas” / emerging themes.

### Code Security Reviews (SCR)

- Flujo propio: repositorio/rama, agentes (Inspector / Detective / Fiscal), hallazgos, progreso y SSE según configuración.
- Rutas bajo `/code_security_reviews/*` y API `code_security_reviews` (+ integración Git/LLM según `.env`).

### Administración y no-code

- Usuarios, roles, permisos, audit logs, ajustes de sistema, email, operación (BRD), **custom fields** y **module views** acotados por ADR-0016.
- **Entity custom fields** en fichas de entidad priorizadas (`EntityCustomFieldsCard` + API dedicada).

---

## Dashboards analíticos (referencia de rutas)

Requieren autenticación y, donde aplique, permiso `dashboards.view` (u rol administrativo según API).

| Vista UI | Descripción breve |
|----------|-------------------|
| `/dashboards` o `/dashboards/hub` | Índice de tableros |
| `/dashboards/executive` | Ejecutivo / KPIs |
| `/dashboards/team` | Equipo |
| `/dashboards/programs` | Programas + heatmaps |
| `/dashboards/vulnerabilities` | Riesgo por jerarquía / motor |
| `/dashboards/concentrado` | Concentrado de hallazgos |
| `/dashboards/releases` | Liberaciones (tabla) |
| `/dashboards/kanban` | Kanban de liberaciones |
| `/dashboards/emerging-themes` | Temas emergentes |
| `/dashboards/iniciativas` | Panel iniciativas (nombre puede variar; ver sidebar) |
| `/okr_dashboard` | OKR (cascada / revisiones) |

Para **homogeneidad visual** entre tableros (paletas y layouts), ver auditoría: [`docs/qa/FRONTEND_UI_AUDIT_DASHBOARDS_2026-05-02.md`](docs/qa/FRONTEND_UI_AUDIT_DASHBOARDS_2026-05-02.md).

---

## Exportaciones y auditoría

Múltiples dominios exponen `GET .../export.csv` con permiso de export y registro en `audit_logs`. Catálogos organizacionales suelen requerir permisos `catalogs.*`. Detalle en código de cada router y en [`AGENTS.md`](AGENTS.md).

---

## Verificación de calidad (gate local)

1. Tras cambios en **`backend/`**: `docker compose build backend` antes de `make test` si el contenedor no monta código actualizado en tu flujo.
2. **`make test`** — suite grande (~15–40 min según máquina); usar BD desechable.
3. **`cd frontend && npm run lint`**
4. **`make types`** si cambió OpenAPI.

---

## Seguridad y cumplimiento API

Resumen: cookies sin tokens en JSON, CSRF en mutaciones, envelopes de respuesta, ownership anti-IDOR, logs estructurados sin secretos. **No duplicar reglas aquí** — ver [`AGENTS.md`](AGENTS.md) y ADRs 0001–0017.

---

## Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [`docs/brd/`](docs/brd/) | Negocio / BRD |
| [`docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md`](docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md) | Matriz spec ↔ implementación |
| [`docs/qa/AUDITORIA_24_PUNTOS_CUMPLIMIENTO_2026-05-02.md`](docs/qa/AUDITORIA_24_PUNTOS_CUMPLIMIENTO_2026-05-02.md) | Auditoría 24 puntos |
| [`docs/qa/`](docs/qa/) | QA, UAT, decisiones |

---

## Badges (referencia tecnológica)

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

---

*README renovado en bloque — mayo 2026 — alineado al comportamiento real de Docker Compose, Makefile y módulos desplegados.*
