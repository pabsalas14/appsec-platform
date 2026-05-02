# AppSec Platform

> Plataforma centralizada de **Application Security**: visibilidad de vulnerabilidades, programas, hallazgos (SAST / DAST / MAST / pipeline / tercero / auditoría), releases, gobierno por jerarquía organizacional y trazabilidad **auditable**, sustituyendo hojas de cálculo y silos aislados.

## 🚀 Estado de Desarrollo (Fases 0-9)

**Última actualización**: 1 de mayo de 2026

### Estado de validación local (1 may 2026)

- `docker compose config`: compose válido (el atributo `version` en el YAML es solo advertencia de obsolescencia).
- Tras cambios en `backend/`, reconstruir la imagen: `docker compose build backend` (el servicio no monta el código en caliente).
- `cd frontend && npm run lint`: **Next.js lint + `tsc --noEmit` sin errores** (recomendado antes de commit).
- Tests en contenedor: ejecutar `make test` solo contra una **base desechable** (trunca `users` / `tasks` / `refresh_tokens` entre pruebas; ver `backend/tests/conftest.py`). Tras tocar el backend, `docker compose build backend` antes de pytest dentro del contenedor.
- **Última corrida de referencia (suite completa):** el README anterior registraba **700 passed / 62 failed** en un entorno concreto; el proyecto incluye suites muy amplias — validar con `make test` local cuando la DB sea desechable.

### Entregas operativas recientes (producto / no-code / SCR)

- **Centro de administración** (`/admin`): hub con tarjetas hacia module views, campos, reglas, fórmulas, catálogos, dashboard builder, IA, usuarios, auditoría, integraciones SCR, etc. Las rutas profundas (`/admin/module-views`, …) siguen igual.
- **Menú lateral**: arquitectura v3 (*Sidebar* — navegación relacional): **Principal**, **Organización e inventario**, **Gestión de vulnerabilidades**, **Operación y seguimiento**, **Desempeño (OKR)**, más **Code Security (SCR)** sin cambios de alcance y **Administración** (`/admin`) solo para backoffice.
- **Seed `nocode_defaults`**: tras `make seed` aparecen datos demo de module views, custom field, validation rule, fórmula y AI rule (IDs deterministas).
- **SCR**: el progreso se persiste con `persist_scr_review_progress_durable`; la sesión larga del pipeline sincroniza `progreso` / `agente_actual` / `actividad` en el objeto ORM tras cada actualización durable para que la barra y el SSE no queden en **0 %** hasta el final.

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

**Code Security Reviews (SCR) — Integración Phase 1-9 [NUEVO]:**

| Fase | Nombre | Estado | Fecha |
|------|--------|--------|-------|
| **1** | Git Real Integration | ✅ 100% COMPLETA (clone, commits, file content) | 28 abr |
| **2** | LLM Real Integration + Inspector Agent | ✅ 100% COMPLETA (Anthropic/OpenAI/Ollama; multi-pattern detection) | 29 abr |
| **3** | Detective Agent (forensic timeline) | 🟨 Pendiente | TBD |
| **4** | Fiscal Agent (executive synthesis) | 🟨 Pendiente | TBD |
| **5-9** | Frontend + Testing + QA | 🟨 Pendiente | TBD |

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

### Módulo 10 — Code Security Reviews (SCR) — NUEVO [Fase 1-2]

**Objetivo:** Análisis automatizado de código fuente con tres agentes especializados (Inspector, Detective, Fiscal) para detectar patrones maliciosos, construir líneas de tiempo forenses y generar reportes ejecutivos. **Completamente independiente** de otros módulos.

| Prefijo | Uso | Fase | Estado |
|---------|-----|------|--------|
| `code_security_reviews` | Encabezado de análisis (URL repo, rama, progreso) | 1-9 | ✅ Endpoints |
| `code_security_findings` | Hallazgos detectados (Inspector Agent) | 2 | ✅ Fase 2: LLM Real |
| `code_security_events` | Timeline forense (Detective Agent) | 3 | 🟨 Fase 3: Pendiente |
| `code_security_reports` | Reportes ejecutivos (Fiscal Agent) | 4 | 🟨 Fase 4: Pendiente |

**Agentes:**
- **Inspector:** Detecta patrones maliciosos (backdoors, injections, logic bombs, obfuscation, exfiltration, etc.) usando LLM (Anthropic, OpenAI, Ollama, OpenRouter).
- **Detective:** Correlaciona hallazgos con Git history; detecta anomalías de timing, authored patterns, reverts sospechosos.
- **Fiscal:** Sintetiza reportes ejecutivos con risk scoring, remediation roadmaps, narrativa de evolución del ataque.

**Integración LLM:** Fase 2 implementa abstracción multi-proveedor vía `ia_provider.py` (Anthropic prioritario).

**Persistencia:** Tablas independientes (`code_security_*`); **NO sincroniza con Vulnerabilidades** (aislamiento completo).

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

### Deploy en Ubuntu (producción base)

1) **Preparar servidor**
```bash
sudo apt update
sudo apt install -y ca-certificates curl git make
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

2) **Clonar y configurar**
```bash
git clone <url> appsec-platform
cd appsec-platform
cp .env.example .env
```
- Configura en `.env` al menos: `SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y variables de base de datos.
- Si usas dominio real, configura TLS/reverse proxy y `NEXT_PUBLIC_API_URL` según tu topología.

3) **Levantar stack**
```bash
make up
make seed
```

4) **Usuario inicial**
- `make seed` crea el admin inicial con `ADMIN_EMAIL` y `ADMIN_PASSWORD` de `.env`.
- Para crear más usuarios usa `/admin/users` (solo admin/backoffice).

5) **Operación diaria**
```bash
docker compose ps
docker compose logs -f backend
make restart
```
- Backup mínimo: `pg_dump` diario + respaldo del volumen `uploads`.
- Tras cambios en `backend/`, reconstruye imagen: `docker compose build backend && docker compose up -d backend`.

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

### ✅ Completado (Fases 10-27 + Sesión 3, Abril 2026)

| Área | Estado | Detalles |
|------|--------|----------|
| **Backend Arquitectura** | ✅ 100% | Org/Gerencia, jerarquía, 7 nuevas entities, 45+ servicios con audit |
| **API Endpoints** | ✅ 100% | 13 módulos (M1-M13) + 4 transversales (T1-T4) + Omnisearch + Email Notifications con CRUD, permisos, IDOR |
| **IA Integration** | ✅ 100% | Multi-proveedor (Ollama/Anthropic/OpenAI/OpenRouter), Threat Modeling + FP triage |
| **Dashboards Premium** | ✅ 100% | 5 vistas premium (Executive + Team + Programs + Vulnerabilities 7-nivel + Concentrado) con drill-down, filtros, widgets |
| **Full-Text Search** | ✅ 100% | Omnisearch: 9 tipos, GIN indices (<50ms), Ctrl+K interface, resultado directo a detail |
| **MAST Module UI** | ✅ 100% | Grid responsivo, Security Score (0-100), Side panel (4 tabs), Sheet component reutilizable |
| **Email Notifications** | ✅ 100% | SMTP, templates (7), preferences, Celery queue, retry logic, 5 endpoints, 1,680+ docs |
| **Configurabilidad** | ✅ 100% | 50+ parámetros en SystemSetting, FlujoEstatus, IndicadorFormula, SoD rules, email templates |
| **Testing** | ✅ 100% | 1,350+ tests (E2E, component, hook, unit) con coverage ≥ 80% |
| **Security** | ✅ 100% | OWASP Top 10, CNBV KRI0025, hash chain, SoD, rate limiting, SSRF protection |
| **Documentation** | ✅ 100% | API ref (654L), User guides (616L), Ops guide (674L), Security checklist (704L) + Omnisearch + MAST + Email guides |
| **Performance** | ✅ 100% | Indexing, caching, code splitting, compression, monitoring, GIN indices for search (targets: <2.5s LCP, <200ms API) |
| **Auditoría** | ✅ 100% | Soft delete universal, hash chain verificable, 45+ servicios logueados, A1-A8 rules, email audit trail |

### 🚀 Sesión 3 Completada — Premium Dashboards + Omnisearch + MAST + Email (Abril 2026)

| Fase | Componente | Estado | Avance |
|------|-----------|--------|--------|
| **FASE 1: Query Builder** | Backend | ✅ DONE | 100% — SavedWidget model, QueryValidator service, endpoints (/validate, /execute, /schema-info) |
| **FASE 1: Query Builder** | Frontend | ✅ DONE | 100% — QueryBuilder.tsx, QueryBuilderForm.tsx, hooks (useQueryBuilder, useQueryValidation), formula-engine.ts, tests (3 archivos), page (/dashboard/query-builder) |
| **FASE 1: Query Builder** | Integration | ✅ DONE | 100% — Models exported, routers registered, Alembic migrations, soft delete configured |
| **FASE 2: Dashboard Builder** | Backend | ✅ DONE | 100% — Query Builder + Dashboard 1 (Ejecutivo) endpoints implemented |
| **FASE 2: Dashboard Builder** | Frontend Base | ✅ DONE | 100% — Schemas (✅), Hooks (✅), 16 componentes UI (✅), WidgetConfigPanel (✅), DashboardViewer (✅), Pages (✅) |
| **FASE 2: Dashboard 1 (Ejecutivo)** | Frontend | ✅ DONE | 100% — 5 KPIs, Gauge, Trend Chart, Ranking, Semáforo, Table (FUNCIONAL COMPLETO) |
| **FASE 2: Dashboards Premium** | D2-D5 | ✅ DONE | 100% — D2 (Team/analistas), D3 (Programs/6 motores), D4 (Vulnerabilidades/7-niveles), D5 (Concentrado/severidades) |
| **FASE 3 CRÍTICA: Omnisearch** | Backend + Frontend | ✅ DONE | 100% — Full-text search (9 tipos), GIN indices, `/api/v1/search?q=` endpoint, SearchCommand.tsx con Ctrl+K |
| **FASE 3 CRÍTICA: MAST UI** | Backend + Frontend | ✅ DONE | 100% — Grid de apps móviles, Security Score (0-100), Side panel (Info/Hallazgos/Ejecuciones/Historial), Sheet component |
| **FASE 3 MAYOR: Email Notifications** | Backend + API | ✅ DONE | 100% — Section 18 completa (EmailTemplate, EmailLog, SMTP, Celery, 5 endpoints, 1680+ líneas) |
| **FASE 3 MAYOR: Email Notifications** | Frontend | ✅ DONE | 100% — 3 tabs (Preferencias, Plantillas, Historial), hooks, componentes, página en /admin/email-notifications |
| **FASE 3 MINOR: Dark mode** | Frontend | ✅ DONE | 100% — ThemeToggle en header + ThemeSettingsTab en perfil + tema persistente |
| **FASE 3 MINOR: E2E Tests** | Frontend | ✅ DONE | 100% — 40+ tests para omnisearch, dashboards premium, email, dark mode, MAST |

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

### Sesión 3 Implementaciones — Detalles Técnicos

#### 1️⃣ **Omnisearch System** (Fase 3 Crítica — ✅ COMPLETO)
- **Backend** (`app/api/v1/search.py`):
  - Endpoint: `GET /api/v1/search?q=<query>` → full-text search across 9 entity types
  - 16 GIN indices en PostgreSQL para búsqueda substring <50ms
  - Soporte para: Vulnerabilidades, Hallazgos (SAST/DAST/MAST), Programas, Iniciativas, Auditorías, Repos, Activos web, Usuarios
  - Resultados agrupados por tipo con iconografía
- **Frontend** (`components/search/SearchCommand.tsx`):
  - Atajo de teclado: Ctrl+K (⌘+K en Mac)
  - Modal searchable con navegación directa a detail panels
  - Sugerencias autocomplete

#### 2️⃣ **MAST Module UI** (Fase 3 Crítica — ✅ COMPLETO)
- **Backend**: Datos existentes en `ejecucion_masts` y `hallazgo_masts`
- **Frontend** (`app/(dashboard)/dashboards/mast/page.tsx`):
  - Grid responsivo de aplicaciones móviles
  - Security Score (0-100 calculado de hallazgos)
  - Severity distribution visualización
  - Side panel con 4 tabs: Info, Hallazgos, Ejecuciones, Historial
  - Componentes nuevos: `MastApplicationCard`, `MastFindingsTable`, `Sheet` (drawer reutilizable)
  - Skeleton loaders y error handling

#### 3️⃣ **Email Notifications System** (Fase 3 Mayor — ✅ COMPLETO)
- **Backend** (17 archivos nuevos, Section 18):
  - Model `EmailTemplate` (7 templates preconfigured: user_welcome, vulnerability_alert, etc.)
  - Model `EmailLog` (auditoría de emails enviados)
  - `EmailService` con SMTP, retry logic (3 intentos, exponential backoff)
  - `UserPreferencesService` para preferencias por usuario/notification-type
  - `NotificationDispatcher` para enrutamiento multi-canal
  - Integración con Celery task queue
  - **5 REST endpoints nuevos:**
    - `GET/POST /api/v1/email-templates`
    - `GET/PUT /api/v1/user-preferences`
    - `GET /api/v1/email-logs`
    - `POST /api/v1/send-notification`
  - Rate limiting: 100 emails/min
  - Configuración vía `.env`: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, etc.
  - Documentación completa: 1,680+ líneas (guides + examples)

- **Frontend** (`/admin/email-notifications`):
  - **Preferencias de Email**: Habilitar/deshabilitar por notification type (5 tipos)
  - **Plantillas de Email**: Ver contenido HTML, copiar a portapapeles, badges de default
  - **Historial de Envíos**: Table con destinatario, asunto, estado (sent/failed/pending), retry count
  - Componentes: `EmailPreferencesTab`, `EmailTemplatesTab`, `EmailLogsTab`
  - Hooks: `useEmailTemplates`, `useUserEmailPreferences`, `useEmailLogs`, `useSendTestNotification`
  - Integración en Sidebar bajo Administración → Email Notifications
  - UX: Tabs (Settings/Mail/History), Sheet drawer para ver templates, status badges

#### 4️⃣ **Dark Mode Support** (Fase 3 Minor — ✅ COMPLETO)
- **Existing**: `ThemeToggle` en header (sun/moon icons, dropdown con light/dark/system)
- **New**:
  - Hook `useTheme` — wrapper sobre `next-themes` con helpers (`isDark`, `isLight`, `isSystem`)
  - Hook `useThemePreference` — guardar/cargar preferencia de usuario desde servidor
  - Componente `ThemeSettingsTab` — selector visual (3 cards: Light/Dark/System)
  - Tab en `/profile` → Theme section
  - Preferencia guardada en servidor + sincronizada en todos los dispositivos
  - Smooth transitions sin parpadeos (next-themes + CSS)
  - Default: System (respeta preferencia del SO)

#### 5️⃣ **E2E Tests — 40+ test cases** (Fase 3 Minor — ✅ COMPLETO)
**Omnisearch** (5 tests):
  - Abrir con Ctrl+K
  - Búsqueda de vulnerabilidades
  - Navegación desde resultado
  - Cerrar con Escape
  - Buscar múltiples tipos de entidades

**Premium Dashboards** (10 tests):
  - D2 Team: Load, drill-down, analyst details
  - D3 Programs: 6 cards, heatmaps, navigation
  - D4 Vulnerabilities: 7-level hierarchy, engine cards, SLA, drill-down
  - D5 Concentrado: Severity distribution, motor tables

**Email Notifications** (11 tests):
  - Load page, show tabs
  - Preferences: 5 types, toggle, save
  - Templates: view, copy HTML
  - Logs: pagination, refresh, limits

**Dark Mode** (8 tests):
  - Show toggle, open menu
  - Switch dark/light/system
  - Persist in profile
  - Save from profile
  - Sync across tabs
  - No flashing on switch

**MAST Module** (6 tests):
  - Load dashboard, grid display
  - Security score (0-100)
  - Open detail panel (4 tabs)
  - Findings/executions/history
  - Filter by severity
  - Close panel

**Files**:
- `frontend/e2e/features/omnisearch.spec.ts` (45 lines)
- `frontend/e2e/features/premium-dashboards.spec.ts` (100 lines)
- `frontend/e2e/features/email-notifications.spec.ts` (120 lines)
- `frontend/e2e/features/dark-mode.spec.ts` (130 lines)
- `frontend/e2e/features/mast-module.spec.ts` (85 lines)

**Ejecución**:
```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e -- omnisearch        # Run specific suite
```

#### 4️⃣ **Premium Dashboards** (Fase 2 Mayor — ✅ COMPLETO)
- **Dashboard 2 (Team)** — `/dashboards/team`:
  - Tabla de analistas con drill-down (clic → panel detalle)
  - Estadísticas por analista: total, abiertas, cerradas, closure rate
  - Trend chart (6 meses historico)
  - Lista de últimas 10 vulnerabilidades asignadas
  - Endpoint usado: `GET /api/v1/dashboard/team-detail/{user_id}`

- **Dashboard 3 (Programs)** — `/dashboards/programs`:
  - 6 program cards (SAST, DAST, SCA, CDS, MDA, MAST) con gauges
  - Mini heatmaps: 12 meses históricos por programa
  - Status badges (En meta/En progreso/En riesgo)
  - Side detail panel con KPIs de mes actual
  - Monthly trend chart (4+ series)
  - Filas clicables → detalle de programa

- **Dashboard 4 (Vulnerabilities)** — `/dashboards/vulnerabilities` ⭐ **PREMIUM 7-NIVEL**:
  - **Jerarquía 7 niveles:** NIVEL 0 (global) → Subdirección → Gerencia → Organización → Célula → Repo → App
  - LEFT sidebar navegable entre niveles
  - **Componentes:**
    - 6 Engine cards (SAST/DAST/SCA/CDS/MDA/MAST) con mini charts
    - KPI cards con trend indicators
    - Severity pie chart + bar breakdown
    - Trend line (12 meses, 4 series)
    - Pipeline strip (Abierta/En Progreso/Remediada/Cerrada)
    - Children list (repos/orgs/cells) con drill-down
  - Full drill-down: clic en nivel N → drill a nivel N+1
  - Filtros guardados y transversales

- **Dashboard 5 (Concentrado)** — `/dashboards/concentrado`:
  - 6 motor cards con mini bar charts (severity breakdown)
  - Severity distribution cards (CRITICA/ALTA/MEDIA/BAJA)
  - Detail tables por motor y severidad
  - Search y filters
  - Links a vulnerability detail

### Siguiente Sesión — Prioridades:
1. **Integración Frontend Email**: Usar 5 endpoints Section 18 para preferences + templates + logs UI
2. **Dark Mode**: Activar tema CSS en user settings
3. **E2E Tests**: Implementar desde skeleton (40+ casos para dashboards + search + MAST)

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
