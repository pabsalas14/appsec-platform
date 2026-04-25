# AppSec Platform

> Plataforma centralizada de **Application Security**: visibilidad de vulnerabilidades, programas, hallazgos (SAST / DAST / MAST / pipeline / tercero / auditoría), releases, gobierno por jerarquía organizacional y trazabilidad **auditable**, sustituyendo hojas de cálculo y silos aislados.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript 5.5](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tests](https://img.shields.io/badge/pytest-~440%2B-brightgreen)](#verificación)
[![OWASP](https://img.shields.io/badge/OWASP-API%20Top%2010-red)](https://owasp.org/API-Security/)

---

## Qué ofrece (funcionalidades)

| Área | Descripción |
|------|-------------|
| **Ciclo de vulnerabilidades** | CRUD, historial, excepciones, aceptación de riesgo, evidencias de remediación; acoplamiento a servicios, repositorios, activos y apps móviles (vía célula / inventario). |
| **Operación y releases** | `service_release`, etapas, pipelines; hallazgos asociados a pipeline y revisiones tercero. |
| **Programas anuales (AppSec)** | SAST (programa + actividad mensual + hallazgos), DAST (programa + ejecuciones + hallazgos), **threat modeling** (programa + sesión + amenazas + controles de mitigación), source code (revisiones, controles, regulación y cumplimiento), MAST. |
| **Iniciativas y temas** | Iniciativas con hitos y actualizaciones; temas emergentes con cierres. |
| **Auditoría interna** | Auditorías, hallazgos, evidencias, planes de remediación. |
| **Gobierno (BRD §3)** | Subdirección → Gerencia → Organización → Célula; inventario (repositorios, activos web, servicios, apps móviles, tipos de prueba, controles de seguridad). |
| **Transversal** | Flujos de estatus, indicadores con fórmulas JSON, filtros guardados, configuración de widgets de dashboard, changelog, uploads por usuario. |
| **IA opcional** | Configuración global (`/api/v1/admin/ia-config`) y sugerencias en sesiones de threat modeling; el producto **funciona sin IA**. |
| **Observabilidad** | Logs estructurados en backend, `client-logs` en frontend, `audit_logs` en base, cadena de hash verificable en API. |

Cambios **normativos** (auth, CSRF, envelopes, ownership, cookies, OpenAPI, scaffolding) están en [`AGENTS.md`](AGENTS.md) y se validan en CI — no duplicar reglas operativas aquí.

**Negocio, fases y matriz de requisitos:** [`docs/brd/`](docs/brd/).

---

## Módulos (API ↔ dominio)

El prefijo de API es siempre `/api/v1/`. A continuación, agrupación alineada al router de FastAPI y a las secciones de la UI autenticada (`frontend/src/app/(dashboard)/`).

### Core (framework)

| Ruta de montaje (ejemplos) | Uso |
|---------------------------|-----|
| `/auth` | Registro, login, cookies, `me`, perfil, password. |
| `/tasks`, `/projects` | Demostración de ownership + auditoría. |
| `/dashboard` | Agregados y paneles (ver tabla de [Dashboards analíticos](#dashboards-analíticos)). |
| `/audit-logs` | Listado y filtros (backoffice: `admin` o `super_admin`). |
| `/client-logs` | Trazas del cliente (batch). |
| `/uploads` | Multipart por usuario. |
| `/admin/*` | Usuarios, roles, permisos, ajustes de sistema, integraciones, SoD, IA, salud, etc. |

### Módulo 1 — Organización (catálogos centrales)

| Entidad (prefijo API) | Pantalla UI típica |
|-----------------------|--------------------|
| `subdireccions`, `gerencias`, `organizacions`, `celulas` | Subdirecciones, Gerencias, Organizaciones, Células |

### Inventario y entrega

| Entidad (prefijo API) | Notas |
|-----------------------|--------|
| `repositorios`, `activo_webs`, `servicios`, `aplicacion_movils` | Enlace a célula; base para asociar vulnerabilidades. |
| `tipo_pruebas`, `control_seguridads` | Catálogos de prueba y controles. |
| `service_releases`, `etapa_releases`, `pipeline_releases` | Releases y etapas; pipelines. |
| `iniciativas`, `hito_iniciativas`, `actualizacion_iniciativas` | Roadmap de iniciativas. |

### Módulo 9 — Vulnerabilidades

| Ruta (prefijos) | Función |
|-----------------|---------|
| `vulnerabilidads` | Ficha, listados, comentarios de negocio, export CSV (permiso + auditoría A7). |
| `historial_vulnerabilidads`, `excepcion_vulnerabilidads`, `aceptacion_riesgos`, `evidencia_remediacions` | Flujos de excepción, riesgo y remediación. |

### Módulo 3 — Programas (SAST / DAST / TM / source)

| Ruta (prefijos) | Función |
|-----------------|---------|
| `programa_sasts`, `actividad_mensual_sasts`, `hallazgo_sasts` | Programa y hallazgos SAST. |
| `programa_dasts`, `ejecucion_dasts`, `hallazgo_dasts` | DAST. |
| `programa_threat_modelings`, `sesion_threat_modelings`, `amenazas`, `control_mitigacions` | Threat modeling, STRIDE, mitigaciones, **IA** (`ia.execute`). |
| `programa_source_codes`, `revision_source_codes`, `control_source_codes` | Revisiones y controles. |
| `servicio_regulado_registros`, `regulacion_controls`, `evidencia_regulacions`, `estado_cumplimientos` | Cumplimiento y regulación. |
| `ejecucion_masts`, `hallazgo_masts` | MAST. |

### Módulo 4 — MAST (operación)

- `ejecucion_masts`, `hallazgo_masts` (vía router principal).

### Módulo 5 — (ya cubierto en iniciativas arriba)

### Módulo 6 — Auditorías

| Prefijo | Uso |
|---------|-----|
| `auditorias`, `hallazgo_auditorias`, `evidencia_auditorias`, `plan_remediacions` | Hallazgos de auditoría y planes. |

### Módulo 7 — Temas emergentes

| Prefijo | Uso |
|---------|-----|
| `temas_emergentes`, `actualizacion_temas`, `cierre_conclusiones` | Seguimiento y cierre. |

### Módulo 8 (hallazgos en releases / tercero)

| Prefijo | Uso |
|---------|-----|
| `hallazgo_pipelines`, `revision_terceros`, `hallazgo_terceros` | Hallazgos en CI/CD y revisiones tercero. |

### Módulo 2 (panel transversal y governance)

| Prefijo o ruta | Uso |
|----------------|-----|
| `flujos_estatus`, `indicadores_formulas`, `filtros_guardados` | Estatus, KPIs, filtros reutilizables. |
| `dashboard_configs` | Visibilidad de widgets por rol (`super_admin` en API para CRUD; lectura de “my visibility” autenticada). |
| `changelog_entradas` | Novedades del producto (lectura pública / gestión restringida según ruta). |
| `admin/herramienta-externas` | Conectores y secretos. |
| `admin/regla-sods` | Reglas de segregación de funciones (SoD). |

---

## Dashboards analíticos

Toda la rama **`GET /api/v1/dashboard/*`** exige el permiso granular **`dashboards.view`** (los roles `admin` y `super_admin` lo bypasean vía `require_permission` en backend).

| Endpoint API | Ruta de UI (App Router) | Contenido orientativo |
|--------------|-------------------------|------------------------|
| `GET /dashboard/stats` | `/` (home) + tarjetas resumen | Contadores, actividad reciente; home respeta visibilidad de widgets (`/dashboard_configs/my-visibility`). |
| `GET /dashboard/executive` | `/dashboards/executive` | Vista ejecutivo / KPIs agregados (filtros de jerarquía). |
| `GET /dashboard/vulnerabilities` | `/dashboards/vulnerabilities` | Panel de riesgo y estatus de vulnerabilidades. |
| `GET /dashboard/team` | `/dashboards/team` | Capacidad y carga del equipo. |
| `GET /dashboard/releases` | `/dashboards/releases` | Situación de releases. |
| `GET /dashboard/programs` | `/dashboards/programs` | Cartera de programas. |
| `GET /dashboard/program-detail` | `/dashboards/program-detail` | Detalle de un programa (filtros de query en hook). |
| `GET /dashboard/initiatives` | `/dashboards/initiatives` | Iniciativas agregadas. |
| `GET /dashboard/emerging-themes` | `/dashboards/emerging-themes` | Temas emergentes. |
| `GET /dashboard/releases-table` | (consumido por paneles) | Tabla densa de releases. |
| `GET /dashboard/releases-kanban` | `kanban` (vista) | Datos estilo tablero para la vista Kanban. |

La página **`/dashboards`** actúa como **índice** hacia los distintos tableros; en el **sidebar** y en **Ctrl+K** se enlazan las rutas anteriores.

> **Diferencia con `dashboard_config`:** los endpoints de la tabla de arriba son *analítica / agregados*. La entidad `dashboard_configs` define **qué widgets ve cada rol** en el home, no el cálculo de negocio en sí.

---

## Exportaciones CSV (auditoría A7)

Los endpoints `GET .../export.csv` exigen el permiso de export del dominio (p. ej. `vulnerabilities.export`, `releases.export`) y registran el evento en `audit_logs` de forma acorde al recurso. Recursos con export en API:

| Recurso | Ruta aprox. |
|---------|------------|
| Vulnerabilidades | `GET /api/v1/vulnerabilidads/export.csv` |
| Service releases | `GET /api/v1/service_releases/export.csv` |
| Etapas de release | `GET /api/v1/etapa_releases/export.csv` |
| Iniciativas | `GET /api/v1/iniciativas/export.csv` |
| Aceptación de riesgo | `GET /api/v1/aceptacion_riesgos/export.csv` |
| Excepciones (vulns) | `GET /api/v1/excepcion_vulnerabilidads/export.csv` |
| Temas emergentes (M7) | `GET /api/v1/temas_emergentes/export.csv` — `emerging_themes.export` |
| Auditorías (M6) | `GET /api/v1/auditorias/export.csv` — `audits.export` |

Ampliar a más recursos: misma ruta, permiso en `P`, `audit_record` y test — ver `tema_emergente.py` / `iniciativa.py` y la matriz en [`tests/test_fase19_permissions.py`](backend/tests/test_fase19_permissions.py).

**Catálogo organizacional (Subdirección → Célula):** el CRUD de `subdireccions`, `gerencias`, `organizacions` y `celulas` requiere `catalogs.view` / `catalogs.create` / `catalogs.edit` / `catalogs.delete` (rol `user` del framework las incluye además de todas las `.view` generadas).

---

## Seguridad y gobierno (resumen)

- **Autenticación de navegador:** cookies HttpOnly, sin access token en JSON; **CSRF** en mutaciones.
- **Autorización:** mezcla de **rol** (`require_role` / `require_backoffice` = `admin` + `super_admin` para APIs admin legacy) y **permisos** (`require_permission` con códigos `P.*` en el catálogo).
- **IDOR:** `require_ownership` con `owner_field` en servicios; tests por entidad en `test_ownership.py`.
- **Solo `super_admin` (ejemplos):** p. ej. `dashboard_configs` (CRUD), `changelog` administración, tramos de *system health* — ver OpenAPI o `test_dashboard_config.py`.

Detalle y OWASP: [`AGENTS.md`](AGENTS.md) y ADRs en [`docs/adr/`](docs/adr/README.md).

---

## Arquitectura (resumen)

```
Navegador → Nginx (:80) → { /api/* → FastAPI (async, SQLAlchemy, Pydantic v2) ; /* → Next.js 14 (App Router) } → PostgreSQL 16
```

| Capa | Tecnología |
|------|------------|
| API | FastAPI, Alembic, `BaseService`, `require_ownership`, `require_permission` |
| Web | Next.js, TanStack Query, RHF + Zod, Shadcn |
| Contrato | OpenAPI → `make types` → `frontend/src/types/api.ts` (no escribir tipos a mano) |
| Trazas | `app.core.logging` + `client-logs` + tabla `audit_logs` |

Estructura de carpetas: [`AGENTS.md`](AGENTS.md) (sección estructura).

---

## Inicio rápido

**Requisitos:** Docker + Compose v2, GNU Make, Git.

```bash
git clone <url> appsec-platform && cd appsec-platform
cp .env.example .env   # SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, etc.
make up
make seed
```

| URL | Uso |
|-----|-----|
| http://localhost | App (Nginx) |
| http://localhost/docs | OpenAPI (Swagger) |
| http://localhost/api/health | Health |

> Tras `make test` (trunca `users` / `tasks` / `refresh_tokens` en la base de pruebas), **`make seed`** restablece el usuario admin.

### Imagen del backend (sin bind-mount del código)

El servicio `backend` en Compose **no monta** el directorio `backend/` del host en `/app`: solo se monta el volumen de **uploads**. El código que ejecuta el contenedor es el **de la última imagen construida**.

| Situación | Qué hacer |
|-----------|-----------|
| Cambiaste `backend/` (rutas, modelos, `tests/`, Alembic, etc.) y quieres verlo **en el contenedor** | `docker compose build backend` y luego `docker compose up -d backend` (o `make up` si ya reconstruiste). |
| Ejecutas `make test` o `docker compose exec backend pytest` | Corren el código **dentro de la imagen**; si no has reconstruido, las pruebas siguen la build anterior. |
| Desarrollo rápido sin rebuild continuo | Opcional: ejecutar API o `pytest` **en el host** con el mismo `DATABASE_URL` que apunte al Postgres del stack (flujo avanzado; el repo asume Docker para `make test`). |

---

## Comandos de desarrollo (Makefile = fuente de verdad)

| Comando | Uso |
|---------|-----|
| `make up` / `make down` / `make restart` | Ciclo de vida del stack |
| `make test` | Suite `pytest` en contenedor (⚠ base de pruebas) |
| `make types` | Regenera `frontend/src/types/api.ts` contra el API levantado |
| `cd frontend && npm run lint` | ESLint + `tsc --noEmit` |
| `make new-entity NAME=… FIELDS="…"` | Scaffolding de entidad (ver `AGENTS.md`) |

---

## Verificación

- **Backend:** `make test` (varios cientos de pruebas: contrato, auth, IDOR, humo por entidad, permisos fase 19, dashboards, IA en sesión TM, etc.). Tras cambios en `backend/`, **reconstruye la imagen** antes de confiar en el resultado (ver [Imagen del backend](#imagen-del-backend-sin-bind-mount-del-código)).
- **Frontend:** `cd frontend && npm run lint`.

---

## API (envelope)

Respuestas con `status: success | error`, carga en `data` o `detail`, y `meta` (p. ej. `request_id`). Ver `app/core/response.py` y manejadores en `app/main.py`.

---

## Estado del producto (orientativo)

| Área | Nota |
|------|--------|
| API + tests de contrato / auth | Estable, CI |
| UI | Catálogos y tableros; nuevas pantallas → [`docs/brd/`](docs/brd/) y backlog de pantallas |
| Permisos finos en todos los listados de catálogo | Evolutivo: priorizar rutas con impacto (mutación / export) |
| E2E / performance / hardening adicional | Plan en `docs/brd/` |

---

## Licencia

Proyecto privado — todos los derechos reservados.
