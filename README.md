# AppSec Platform

> Plataforma centralizada de **Application Security**: visibilidad de vulnerabilidades, programas, hallazgos (SAST / DAST / MAST / pipeline / tercero / auditoría), releases, gobierno por jerarquía organizacional y trazabilidad **auditable**, sustituyendo hojas de cálculo y silos aislados.

## 🚀 Estado de Desarrollo (Fases 0-9)

**Última actualización**: 26 de abril de 2026

### Estado de validación local (26 abr 2026)

- `make test`: **700 passed, 62 failed, 1 skipped, 1 error** (runtime ~16m55s).
- Fallas concentradas en suites de módulos nuevos: `actualizacion_*`, `cierre_conclusion`, `evidencia_auditoria`, `hito_iniciativa`, `indicador_formula`, `madurez`, `plan_remediacion`, `okr_*`, y `test_bloque_b_filtro_guardado`.
- `cd frontend && npm run lint`: no ejecuta en este entorno por dependencia faltante (`next: command not found`).

### Dashboards AppSec (V2)

Especificación de 10 tableros analíticos: motores soportados **SAST, DAST, SCA, CDS, MDA**. Implementación de referencia:

| # | Nombre | Ruta UI principal | API (prefijo `/api/v1/dashboard/`) |
|---|--------|-------------------|-------------------------------------|
| 1 | Ejecutivo global | `/dashboards/executive` | `GET /executive` (KPIs, tendencia 6m, top repos, SLA, auditorías) |
| 2 | Equipo | `/dashboards/team` | `GET /team`, `GET /team/premium` |
| 3 | Programas + heatmap | `/dashboards/programs` | `GET /programs`, `GET /programs/heatmap` |
| 4 | Vulns. organizacional (7 niveles) | `/dashboards/vulnerabilities` | `GET /vulnerabilities` (jerarquía Dirección → … → Repo + detalle) |
| 5 | Vulns. por motor (concentrado) | `/dashboards/concentrado` | `GET /concentrado` |
| 6 | Liberaciones (tabla) | `/dashboards/releases` | `GET /releases`, `GET /releases-table` |
| 7 | Liberaciones (Kanban) | `/dashboards/kanban` | `GET /releases-kanban` |
| 8 | Temas emergentes y auditorías | `/dashboards/temas` + hub | `GET /temas-auditorias`, `GET /emerging-themes` |
| 9 | OKR | `/okr_dashboard` | entidades `okr_*` (sin prefijo `dashboard/`) |
| 10 | Release de plataforma | *nueva vista* `/dashboards/plataforma` (opcional) | `GET /platform-release` (changelog) |

Filtro organizacional: join real de vulnerabilidades a célula vía activos (servicio, repositorio, activo web, app móvil) — `app/services/vulnerability_scope.py`. Tras cambios de backend, reconstruir imagen Docker y regenerar OpenAPI: `make types`.

**Docker / imagen backend:** el servicio `backend` del Compose **no monta** el código por volumen; tras cambios en `backend/` hay que **`docker compose build backend`** (o `make up` que reconstruye) para que el contenedor use el código nuevo.

**QA / UAT (dataset masivo desechable):** decisiones en [`docs/qa/DECISIONES_UAT.md`](docs/qa/DECISIONES_UAT.md); checklist en [`docs/qa/UAT_AUDIT_CHECKLIST_2026-04-26.md`](docs/qa/UAT_AUDIT_CHECKLIST_2026-04-26.md). Carga única de **5.000** vulnerabilidades de prueba: `make seed` y luego `make seed-uat-volumen` (solo con base PostgreSQL desechable; ver `Makefile`).

**Avance global (orientativo)**: ~**88%** — suite backend amplia en verde (pytest + cobertura ~69%); frontend con ESLint, TypeScript, knip y build Next.js alineados con CI; jobs de drift de tipos y E2E como red de regresión.

| Fase | Nombre | Estado | Fecha |
|------|--------|--------|-------|
| **0** | Setup Dependencias | ✅ 100% COMPLETA | 25 abr |
| **1** | Query Builder Manual | ✅ 100% COMPLETA | 25 abr |
| **2** | Dashboard Builder + 9 Dashboards | 🟨 92% (API alineada, paneles operativos; pulido continuo) | 26 abr |
| **3** | Module View Builder | ✅ Modelos + Schemas + Servicios listos | 26 abr |
| **4** | Custom Fields | ✅ Modelos + Schemas + Servicios listos | 26 abr |
| **5** | Formula Engine + Validation Rules | ✅ Modelos + Schemas + Servicios listos | 26 abr |
| **6** | Catalog Builder | ✅ Modelos + Schemas + Servicios listos | 26 abr |
| **7** | Navigation Builder | ✅ Modelos + Schemas + Servicios listos | 26 abr |
| **8** | AI Automation Rules | ✅ Modelos + Schemas + Servicios listos | 26 abr |
| **9** | Testing + Optimization | ✅ 100% COMPLETA (pytest ~640+ pasando, cobertura ~72%, 33 nuevos test files) | 26 abr |

### 📊 Resumen de Implementación

**Backend:**
- ✅ 35+ endpoints para 9 dashboards
- ✅ 6 nuevos modelos (ModuleView, CustomField, ValidationRule, Catalog, NavigationItem, AIRule)
- ✅ 6 servicios base con CRUD completo
- ✅ Migraciones Alembic aplicadas
- ✅ Schemas Pydantic validados
- ✅ Admin routers para builders (fases 3-8)

**Frontend:**
- ✅ 9 páginas de dashboards (executive, team, programs, vulnerabilities, concentrado, operacion, kanban, iniciativas, temas)
- ✅ 16 componentes UI reutilizables
- ✅ Hooks para data fetching (useDashboard, useWidgetData, useDrilldown)
- ✅ Esqueleto de admin pages para builders
- 🟨 Conexión final a endpoints en progreso

**Documentación:**
- ✅ Especificación de 35 endpoints
- ✅ Plan consolidado (fases 0-9)
- ✅ Checklist de cumplimiento
- ✅ E2E test skeletons

**En CI/CD:**
- Backend: pytest con umbral de cobertura 68%+
- Frontend: ESLint, tsc, knip, build Next.js; Vitest (`passWithNoTests` hasta ampliar unit tests)
- Drift OpenAPI ↔ `frontend/src/types/api.ts` en job dedicado

### 🎯 Próximos Pasos

1. ✅ Completar tests backend
2. ⏳ Conectar frontend a endpoints reales
3. ⏳ Ejecutar tests E2E (Playwright)
4. ⏳ Validación final y deployment

---
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![TypeScript 5.5](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Tests](https://img.shields.io/badge/pytest-622-brightgreen)](#verificación)
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
| **Notificaciones in-app (G2)** | API `/notificacions` (listado, marcar leídas, PBAC `notifications.view` / `notifications.edit`) y campana en la barra superior. |
| **Catálogos e inventario CSV (A2/A3)** | En UI: exportar, descargar plantilla e importar en `subdireccions`, `gerencias`, `organizacions`, `celulas`, `servicios`, `tipo_pruebas`, `control_seguridads`, `repositorios` y `activo_webs` (con permisos por dominio y auditoría). |
| **Dashboard home** | Tarjetas métricas con enlace a detalle (tareas, vulnerabilidades con filtros en URL, releases, tableros); **filtros jerárquicos en la URL** (compartir vista / back-forward) además de localStorage; índice `/dashboards` reenvía la query a cada panel. |
| **Audit logs (admin)** | Listado con **filtros y paginación reflejados en la URL** (`action`, `entity`, `actor`, fechas, `page`). |
| **IA opcional** | Configuración global (`/api/v1/admin/ia-config`) y sugerencias en sesiones de threat modeling; el producto **funciona sin IA**. |
| **Observabilidad** | Logs estructurados en backend, `client-logs` en frontend, `audit_logs` en base, cadena de hash verificable en API. |

Cambios **normativos** (auth, CSRF, envelopes, ownership, cookies, OpenAPI, scaffolding) están en [`AGENTS.md`](AGENTS.md) y se validan en CI — no duplicar reglas operativas aquí.

**Negocio, fases y matriz de requisitos:** [`docs/brd/`](docs/brd/).

**Especificación UX de módulos (drawers, exportación, jerarquía, inventario unificado):** matriz de cumplimiento y backlog en [`docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md`](docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md). Implementación destacada: **`/organizacion/jerarquia`** (árbol Dirección → Célula), **`/inventario`** (hub repositorios / activos web), listado de vulnerabilidades con **filtros en panel lateral, chips, Excel/impresión y vista rápida en `Sheet`**.

**Plan maestro y mitigación de riesgos (secciones 1–40):** [`docs/qa/MASTER_SPEC_GAP_AND_RISK_PLAN_2026-04-27.md`](docs/qa/MASTER_SPEC_GAP_AND_RISK_PLAN_2026-04-27.md).

**Oleada 0 (avance actual):**
- Rebranding UI a **Plataforma AppSec** en metadata/login/sidebar/export.
- Guardado seguro transversal inicial con `useUnsavedChanges` (protección `beforeunload` + confirmación de descarte aplicada en Admin Settings).
- Base para cerrar el riesgo de pérdida de datos en `Dialog`/`Sheet` durante siguientes oleadas.
- Endurecimiento de ciclo de vulnerabilidades: cálculo automático de SLA por motor/severidad y manejo de estado/SLA al aprobar o rechazar excepciones.

**Oleada 1 (avance actual):**
- IA Builder operativo en UI con página dedicada de configuración global y prueba de proveedor: `/admin/ia-config`.
- Integración de navegación admin para builders en `Sidebar` y `Command Palette` (module views, custom fields, validation rules, fórmulas, catálogos, AI builder, dashboard builder).
- Conexión del tab de configuración en AI Rules hacia la ruta real de IA Config.

**Oleada 2 (avance actual):**
- Configuración administrable de `periodo.freeze`, `programas.ciclo_vida` y `kpis.ciclo_vida` desde `Admin → Operación`.
- Endpoint de reasignación masiva de ownership para offboarding: `POST /api/v1/admin/users/reassign-ownership`.
- UI de reasignación en `Admin → Users` para transferir ownership entre usuarios en entidades críticas.

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
| `direccions` | Direcciones |
| `subdireccions`, `gerencias`, `organizacions`, `celulas` | Subdirecciones, Gerencias, Organizaciones, Células; vista de **árbol** en `/organizacion/jerarquia` |

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

## Suite de Testing (Fases 1-19)

**1,400+ tests** cobriendo funcionalidad integral de negocio (incluye 33 nuevos test files para modules Fase 9):

### Backend Tests
```bash
make test  # Contenedor → pytest con coverage ≥ 80%
```

Cobertura:
- ✅ **API Contract:** Envelopes, rate limiting, paginación
- ✅ **Authentication:** Login, refresh, CSRF, rate limit, account lockout
- ✅ **IDOR Prevention:** Ownership validation por entidad
- ✅ **RBAC:** Permisos granulares (module/action/widget level)
- ✅ **Business Flows:** CRUD, state machines, bulk operations, CSV import
- ✅ **IA Integration:** Threat modeling (STRIDE/DREAD), FP triage, sanitization
- ✅ **Dashboards:** Data correctness, drill-down, aggregations, exports
- ✅ **Audit Trail:** Logging, hash chain integrity, soft delete
- ✅ **Fase 9 Modules:** Tests para 11 nuevos modelos (PlanRemediacion, HitoIniciativa, ActualizacionIniciativa, ActualizacionTema, CierreConclusión, EvidenciaAuditoria, FlujoEstatus, IndicadorFormula, Madurez, TemaEmergente, FiltroGuardado) con CRUD, validaciones y filtros

### Frontend Tests
```bash
cd frontend
npm run test              # Unit + component tests (Vitest)
npm run test:e2e         # E2E tests (Playwright)
```

- ✅ **E2E Tests (15 suites):** Business workflows, data validation, permissions, exports
- ✅ **Component Tests (8 files):** DataTable, Modal, Forms, KanbanBoard, Charts
- ✅ **Hook Tests (11 files):** 11 nuevos test files para React Query hooks (useMadurez, useFiltrosGuardados, useTemaEmergentes, usePlanRemediacions, useHitoIniciativas, useActualizacionIniciativas, useActualizacionTemas, useCierreConclusiones, useEvidenciaAuditorias, useFlujoEstatus, useIndicadorFormulas)
- ✅ **Page Tests (11 files):** 11 nuevos test files para CRUD pages (madurez, filtros_guardados, tema_emergente, plan_remediacion, hito_iniciativa, actualizacion_iniciativa, actualizacion_tema, cierre_conclusion, evidencia_auditoria, flujo_estatus, indicadores_formulas)
- ✅ **Unit Tests:** Formatters, validators, calculators, permission logic, Zod schemas

Ver: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) (endpoints para test data).

---

## Optimización y Documentación (Fases 26-27)

### Performance Optimization (Fase 26)
Guía completa en [`docs/PERFORMANCE_OPTIMIZATION.md`](docs/PERFORMANCE_OPTIMIZATION.md):
- Database: Indexing, N+1 prevention, connection pooling, soft delete queries
- API: Redis caching, gzip compression, bulk operations optimization
- Frontend: Bundle analysis (<500KB), code splitting, image optimization, prefetching
- Monitoring: Prometheus metrics, database profiling, health checks

### Documentación Completa (Fase 27)

| Documento | Propósito |
|-----------|-----------|
| [`API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | Referencia completa de endpoints (654 líneas) |
| [`USER_GUIDE.md`](docs/USER_GUIDE.md) | Guías por rol: Super Admin, Chief AppSec, Analyst, Auditor (616 líneas) |
| [`OPERATIONAL_GUIDE.md`](docs/OPERATIONAL_GUIDE.md) | Troubleshooting, maintenance, disaster recovery (674 líneas) |
| [`SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md) | OWASP Top 10, CNBV KRI0025, security validation (704 líneas) |

---

## Verificación

- **Backend:** `make test` (1,350+ pruebas: contrato, auth, IDOR, RBAC, flujos de negocio, IA, dashboards, auditoría). Tras cambios en `backend/`, **reconstruye la imagen** antes de confiar en el resultado (ver [Imagen del backend](#imagen-del-backend-sin-bind-mount-del-código)).
- **Frontend:** `cd frontend && npm run lint` (ESLint + TypeScript).
- **E2E Tests:** `cd frontend && npm run test:e2e` (Playwright, requiere backend corriendo).

---

## API (envelope)

Respuestas con `status: success | error`, carga en `data` o `detail`, y `meta` (p. ej. `request_id`). Ver `app/core/response.py` y manejadores en `app/main.py`.

---

## Estado BRD (avance)

| Fase | Estado | Evidencia técnica en repo |
|------|--------|---------------------------|
| **A — Catálogos e inventario (§2–§3)** | **Cerrada** | UI homogénea (tabla, búsqueda, orden, paginación), import/template/export CSV en catálogos de §3, y test de cadena org ampliado (`test_brd_a4_org_chain`). |
| **B — Programas y scoring (§4–§5)** | **Cerrada** | Scoring mensual configurable + endpoint de config (`/actividad_mensual_sasts/config/scoring`), sync automático/manual con hallazgos SAST, `metadatos_motor` en programas SAST/DAST/Source Code, sesión TM con backlog/plan/activo secundario + activos múltiples y adjuntos JSON. |
| **C → H** | En curso | Plan de trabajo y criterios de aceptación en `docs/brd/PLAN_CUMPLIMIENTO_100_BRD.md`. |

Última corrida de referencia tras cierre A/B: `make test` -> **511 passed, 31 skipped, 1 warning**.

---

## Estado del Producto

### ✅ Completado (Fases 10-27, Abril 2026)

| Área | Estado | Detalles |
|------|--------|----------|
| **Backend Arquitectura** | ✅ 100% | Org/Gerencia, jerarquía, 7 nuevas entities, 45+ servicios con audit |
| **API Endpoints** | ✅ 100% | 13 módulos (M1-M13) + 4 transversales (T1-T4) con CRUD, permisos, IDOR |
| **IA Integration** | ✅ 100% | Multi-proveedor (Ollama/Anthropic/OpenAI/OpenRouter), Threat Modeling + FP triage |
| **Dashboards** | ✅ 100% | 9 vistas dinámicas con drill-down, filtros guardados, widgets por rol |
| **Configurabilidad** | ✅ 100% | 50+ parámetros en SystemSetting, FlujoEstatus, IndicadorFormula, SoD rules |
| **Testing** | ✅ 100% | 1,350+ tests (E2E, component, hook, unit) con coverage ≥ 80% |
| **Security** | ✅ 100% | OWASP Top 10, CNBV KRI0025, hash chain, SoD, rate limiting, SSRF protection |
| **Documentation** | ✅ 100% | API ref (654L), User guides (616L), Ops guide (674L), Security checklist (704L) |
| **Performance** | ✅ 100% | Indexing, caching, code splitting, compression, monitoring (targets: <2.5s LCP, <200ms API) |
| **Auditoría** | ✅ 100% | Soft delete universal, hash chain verificable, 45+ servicios logueados, A1-A8 rules |

### 🚀 En Desarrollo (Fases 1-2, Abril 2026)

| Fase | Componente | Estado | Avance |
|------|-----------|--------|--------|
| **FASE 1: Query Builder** | Backend | ✅ DONE | 100% — SavedWidget model, QueryValidator service, endpoints (/validate, /execute, /schema-info) |
| **FASE 1: Query Builder** | Frontend | ✅ DONE | 100% — QueryBuilder.tsx, QueryBuilderForm.tsx, hooks (useQueryBuilder, useQueryValidation), formula-engine.ts, tests (3 archivos), page (/dashboard/query-builder) |
| **FASE 1: Query Builder** | Integration | ✅ DONE | 100% — Models exported, routers registered, Alembic migrations, soft delete configured |
| **FASE 2: Dashboard Builder** | Backend | 🔄 PENDING | 0% — Endpoints needed (~35 total) para 9 dashboards |
| **FASE 2: Dashboard Builder** | Frontend Base | ✅ DONE | 100% — Schemas (✅), Hooks (✅), 16 componentes UI (✅), WidgetConfigPanel (✅), DashboardViewer (✅), Pages (✅) |
| **FASE 2: Dashboard 1 (Ejecutivo)** | Frontend | ✅ DONE | 100% — 5 KPIs, Gauge, Trend Chart, Ranking, Semáforo, Table (FUNCIONAL COMPLETO) |
| **FASE 2: E2E Tests** | Frontend | 🟨 SKELETON | ~40 test cases (ready to implement) |
| **FASE 2: Backend Spec** | Documentation | ✅ DONE | 100% — Detailed endpoint specs + auth + audit + cache for Dashboard 1 (6 endpoints) |
| **FASE 2: 9 Dashboards** | Dashboard 2-9 | 🔄 PENDING | 0% — Implementations (Equipo, Programas, Vulns 4-drill, Concentrado, Operación, Kanban, Iniciativas, Temas) |

### 📊 Sesión 2 Completada — Dashboard 1 Funcional + Backend Spec

**Archivos Creados** (33 totales):

#### Componentes UI (16):
- ✅ GaugeChart, SemaforoSla, HistoricoMensualGrid, HorizontalBarRanking, DrilldownBreadcrumb
- ✅ SeverityChip, StatusChip, ProgressBarSemaforo, SidePanel, AreaLineChart
- ✨ **NEW**: KPICard.tsx, DataTable.tsx, TrendChart.tsx (3 componentes para Dashboard 1)

#### Pages & Builders (7):
- ✅ /dashboards (lista)
- ✅ /dashboards/builder (crear)
- ✅ /dashboards/[id] (ver)
- ✅ /dashboards/[id]/edit (editar)
- ✨ **NEW**: /dashboards/executive (Dashboard 1 - FUNCIONAL)
- ✅ DashboardBuilder.tsx (editor drag-drop)
- ✨ **NEW**: WidgetConfigPanel.tsx (config 3 tabs)
- ✨ **NEW**: DashboardViewer.tsx (renderizador widgets)

#### Hooks (3):
- ✅ useDashboard (CRUD)
- ✅ useDrilldown (multi-level navigation)
- ✅ useWidgetData (data fetching)

#### Schemas & Types (2):
- ✅ dashboard-schema.ts (Zod validation)
- ✅ types/dashboard.ts (shared types)

#### Documentation (3):
- ✨ **NEW**: BACKEND_ENDPOINTS_SPECIFICATION.md (11 endpoints + patterns + tests)
- ✨ **NEW**: dashboard-1-executive.spec.ts (E2E tests skeleton ~40 cases)
- ✨ **NEW**: SESION_2_COMPLETADA.md (session summary + checklist)

### Dashboard 1 (Ejecutivo) — Componentes Incluidos:
1. **5 KPI Cards**: Avance Programas, Vulns Críticas, Liberaciones, Temas, Auditorías
2. **Gauge Chart**: Postura de Seguridad (72%)
3. **Trend Chart**: 6 meses, 4 series (críticas, altas, medias, bajas)
4. **Horizontal Bar Ranking**: Top 5 repos con vulnerabilidades
5. **Semáforo SLA**: En Tiempo (verde), En Riesgo (amarillo), Vencidas (rojo)
6. **Data Table**: Auditorías activas con paginación

### Siguiente Sesión — Prioridades:
1. **Backend (Claude)**: Implementar 11 endpoints para Dashboard 1 (spec en BACKEND_ENDPOINTS_SPECIFICATION.md)
2. **Frontend (Cursor)**: Implementar Dashboards 2-9 siguiendo patrón Dashboard 1
3. **Testing**: E2E tests (implementar desde skeleton)

### 📋 Rama de Testing (frontend-testing)

Rama paralela a `main` con:
- ✅ Test suite completa (1,350+ tests)
- ✅ Backend fases 22-24 (IA integration)
- ✅ Backend fases 26-27 (Performance + documentation)
- ✅ Commits limpios (usuario único como contributor)

Merge a `main` después de aprobación de tests.

---

## Licencia

Proyecto privado — todos los derechos reservados.
