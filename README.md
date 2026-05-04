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
# Seed al arrancar: en `docker-compose.yml` el valor por defecto es RUN_SEED=false si no está en `.env`;
#   `.env.example` trae RUN_SEED=true para desarrollo (el script del contenedor solo ejecuta seed si es la cadena `true`).
# Con RUN_SEED=true: catálogos dinámicos, fórmulas de indicadores, valores manuales de ejemplo, navegación/no-code por defecto,
#   inventario mínimo (árbol SEED-*) y programas anuales + actividades mensuales + pipeline (bootstrap operativo).
# SEED_DEMO_BUSINESS=false (recomendado): sin vulns/OKR/auditorías de juguete con prefijo [DEMO]. Pon SEED_DEMO_BUSINESS=true
#   solo si quieres el dataset showroom completo (vulns [DEMO], OKR, auditorías, notificaciones de ejemplo, etc.).
# En producción: RUN_SEED=false y, si hace falta una sola carga, `make seed` o `make seed-admin` según caso.
make up
# opcional — usuario admin:
make seed-admin   # solo admin/promoción por ADMIN_EMAIL (sin catálogos ni bootstrap de datos)
# make seed       # mismo pipeline que el seed en runtime; respeta SEED_DEMO_BUSINESS del `.env` del contenedor
```

| URL | Uso |
|-----|-----|
| http://127.0.0.1 | App vía Nginx |
| http://127.0.0.1:8000/openapi.json | Esquema OpenAPI (también útil para `make types`) |
| http://127.0.0.1:8000/docs | Swagger (según entorno; ver ADR-0013) |

**Usuario admin:** define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `.env`. Tras **`make seed-admin`** se crea el usuario `admin` con ese email, **o** si ya te registraste públicamente con el mismo `ADMIN_EMAIL`, esa cuenta pasa a rol admin (sigues entrando con tu `username` y, si activaste `SEED_FORCE_ADMIN_PASSWORD`, con `ADMIN_PASSWORD`).

---

## Docker: qué ocurre al levantar el stack

Compose principal: [`docker-compose.yml`](docker-compose.yml). En desarrollo se fusiona automáticamente [`docker-compose.override.yml`](docker-compose.override.yml).

| Servicio | Rol |
|----------|-----|
| **postgres** | Base de datos persistente (`postgres_data`) |
| **redis** | Broker/resultados Celery |
| **backend** | FastAPI; al iniciar ejecuta **`alembic upgrade heads`** y opcionalmente **`python -m app.seed`** si `RUN_SEED=true`. El contenido del seed depende de **`SEED_DEMO_BUSINESS`** (ver `.env.example`) |
| **celery-worker** | Worker para pipeline SCR y jobs |
| **frontend** | Next.js (en override: `npm run dev` con hot-reload) |
| **nginx** | Proxy a frontend y API |

**Desarrollo (`make up`):** bind-mount de `./backend` y `./frontend` para hot-reload (override).

**Producción “ish” (`make up-prod`):** solo `docker-compose.yml` — imagen backend sin montar todo el repo; **hay que reconstruir** la imagen tras cambios en `backend/` antes de desplegar.

**Migraciones:** aplicadas en el arranque del contenedor backend (`upgrade heads`). Para ejecutar a mano:  
`docker compose exec backend alembic upgrade heads`

**Seed:** Compose usa `RUN_SEED:-false` si no defines la variable; con `.env` copiado desde `.env.example` suele quedar `RUN_SEED=true`. También puedes ejecutar **`make seed`** sin reiniciar el stack. **`SEED_DEMO_BUSINESS`** (inyectada en el servicio `backend`) decide entre bootstrap operativo únicamente (`false`) o dataset adicional `[DEMO]` (`true`). Declara ambas en `.env` y en `docker-compose.yml` → `backend.environment` si añades variables nuevas.

**Servidor Ubuntu (producción / staging):** instala Docker Engine + plugin Compose v2, clona el repo, `cp .env.example .env` y rellena secretos. Ajusta `CORS_ORIGINS` y el `map` CORS en `nginx/nginx.conf` a tu dominio `https://…`. Deja `NEXT_PUBLIC_API_URL` vacío si el front y la API se sirven por el mismo Nginx. `host.docker.internal` queda resuelto vía `extra_hosts` en `docker-compose.yml` (Ollama u otros servicios en el host). En producción: `ENV=prod`, cookies `Secure`, expón solo el puerto `80`/`443` (pon un reverse proxy TLS delante o `listen 443 ssl` en Nginx) y restringe qué puertos del host quedan abiertos (firewall).

**Redis y puerto 6379 en el host:** muchos servidores ya tienen un Redis en `127.0.0.1:6379`. El `docker-compose` publica el contenedor Redis en **`REDIS_PUBLISH_PORT` (por defecto 16379)** hacia el host; **backend y Celery no cambian** (`redis://redis:6379/0` dentro de la red Docker). Si quieres `6379` en el host, libera el puerto (p. ej. `sudo systemctl stop redis-server`) o define `REDIS_PUBLISH_PORT=6379` solo cuando no haya conflicto.

---

## Comandos (Makefile)

| Comando | Descripción |
|---------|-------------|
| `make up` | Stack con override de desarrollo (hot-reload) |
| `make up-prod` | Stack sin override (imagen backend “cerrada”) |
| `make down` / `make restart` | Parar / reiniciar |
| `make seed-admin` | Solo admin (o promoción por `ADMIN_EMAIL`); no ejecuta el seed de catálogos ni bootstrap |
| `make seed` | Admin + catálogos + KPIs + bootstrap operativo; el dataset `[DEMO]` solo si `SEED_DEMO_BUSINESS=true` en el entorno del contenedor |
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

- Programas por motor anual: SAST, DAST, SCA/CDS, threat modeling, source code, etc. (routers `programa_*`, actividades, ejecuciones). **MAST no es programa anual**: indicadores y ejecuciones móviles mes a mes; los hallazgos con fuente MAST siguen en dashboards de vulnerabilidades.
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
2. **`make test`** — suite grande (~15–40 min según máquina); usar BD desechable. **Referencia CI local (may 2026):** 918 passed, 1 skipped en imagen Docker reconstruida.
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
