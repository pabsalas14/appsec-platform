# PLAN CONSOLIDADO 100% FASES 0-9
**AppSec Platform — Dashboard + Builders Dinámicos**

**Fecha**: 25 de abril 2026  
**Objetivo**: Alcanzar 100% cumplimiento en todas las fases 0-9  
**Exclusión explícita**: Fase 10, Workflow Engine, Report Builder, Branding/White-Label (futuro)

---

## 📊 ESTADO ACTUAL (25 ABRIL 2026, 17:25 UTC-6)

| Fase | Nombre | Estado | Completado |
|------|--------|--------|-----------|
| **0** | Setup Dependencias | ✅ 100% DONE | 25 abr |
| **1** | Query Builder Manual | ✅ 100% DONE | 25 abr |
| **2** | Dashboard Builder + 9 Dashboards | 🟨 ~50% (Frontend) | — |
| **3** | Module View Builder | ❌ NOT STARTED | — |
| **4** | Custom Fields + Personalización | ❌ NOT STARTED | — |
| **5** | Formula Engine + Validation Rules | ❌ NOT STARTED | — |
| **6** | Catalog Builder | ❌ NOT STARTED | — |
| **7** | Navigation Builder | ❌ NOT STARTED | — |
| **8** | AI Automation Rules | ❌ NOT STARTED | — |
| **9** | Testing + Optimization | ❌ NOT STARTED | — |

**Cumplimiento global**: ~17% (2 de 10 fases al 100%)

---

## 🎯 ORDEN DE EJECUCIÓN (Optimizado)

### SEMANA 1 (AHORA - Días 1-5)

**PRIORIDAD 1: Completar FASE 2 Backend + Endpoints reales**

Dashboard 1 requiere endpoints reales. Sin ellos, no podemos validar nada.

```
Día 1-2:
├─ Backend: Implementar 4 endpoints Dashboard 1 (Ejecutivo)
│  ├─ POST /api/v1/dashboard/executive-kpis
│  ├─ POST /api/v1/dashboard/security-posture
│  ├─ POST /api/v1/dashboard/top-repos-criticas
│  ├─ POST /api/v1/dashboard/sla-semaforo
│  └─ POST /api/v1/dashboard/auditorias-activas (tabla paginada)
│
├─ Frontend: Conectar Dashboard 1 a endpoints reales
│  ├─ Reemplazar mock data con useWidgetData hooks
│  ├─ Validar que datos se cargan correctamente
│  ├─ Manejar errores y estados de carga
│  └─ Tests E2E: verificar cargas reales
│
└─ Validación:
   ├─ Dashboard 1 funciona 100% con datos reales
   ├─ Performance < 2 segundos
   └─ E2E tests pasan

Día 3-5:
├─ Backend: Implementar endpoints para Dashboard 2-9
│  ├─ Dashboard 2 (Equipo): 2 endpoints
│  ├─ Dashboard 3 (Programas): 2 endpoints
│  ├─ Dashboard 4 (Vulns): 13 endpoints ⭐ (el más grande)
│  ├─ Dashboard 5 (Concentrado): 3 endpoints
│  ├─ Dashboard 6 (Operación): 3 endpoints
│  ├─ Dashboard 7 (Kanban): 3 endpoints
│  ├─ Dashboard 8 (Iniciativas): 2 endpoints
│  └─ Dashboard 9 (Temas): 2 endpoints
│
├─ Total: 35 endpoints backend (paralelo puede acelerase)
│
└─ Dependencia: Estos endpoints BLOQUEAN el frontend de Dashboard 2-9

NOTA: Si hay 2 personas (Claude), pueden dividirse.
Alternativa: Claude hace Dashboard 1 endpoints (4) mientras Cursor hace Dashboard 2-9 frontend (con mocks mientras los endpoints no estén listos).
```

---

## 🔧 DESGLOSE DETALLADO POR FASE

### FASE 0: SETUP DEPENDENCIAS
**Status**: ✅ 100% COMPLETA
**Descripción**: Instalación de dependencias, seed inicial

**Checklist:**
- [x] pip install requirements.txt
- [x] npm install frontend libs
- [x] 4 nuevos roles en seed.py
- [x] Alembic migration
- [x] make up + make types
- [x] make seed

**Tareas completadas**:
- ✅ Backend dependencies (pip)
- ✅ Frontend dependencies (npm)
- ✅ Test data endpoints
- ✅ 4 new roles (ciso, responsable_celula, director_subdireccion, lider_liberaciones)
- ✅ DB seeding

---

### FASE 1: QUERY BUILDER MANUAL
**Status**: ✅ 100% COMPLETA (25 abril 2026)
**Descripción**: Plataforma para crear queries sin SQL con live preview

**Backend - COMPLETADO:**
- ✅ SavedWidget model + migration
- ✅ QueryValidator service (6 validators)
- ✅ QueryBuilderService (build + execute + validate)
- ✅ 8 endpoints backend (POST validate, execute, schema-info, save + CRUD widgets)
- ✅ Router registration
- ✅ Model exports

**Frontend - COMPLETADO:**
- ✅ QueryBuilder.tsx component (left panel + right panel preview)
- ✅ QueryBuilderForm.tsx (table selector, joins, fields, filters, groupby, aggs)
- ✅ useQueryBuilder.ts hook (state + mutations)
- ✅ useQueryValidation.ts hook (real-time validation)
- ✅ formula-engine.ts utility (safe formula evaluation)
- ✅ 3 test files (component + hook + formula tests)

**Commit**: ba7c86f — "feat: Fase 1 Frontend - Query Builder complete"

**Checklist:**
- [x] Backend 100% (endpoints + services + validators)
- [x] Frontend 100% (UI + hooks + utils)
- [x] Tests creados (pytest + vitest)
- [x] Live preview funciona
- [x] Validaciones en tiempo real

---

### FASE 2: DASHBOARD BUILDER + 9 DASHBOARDS
**Status**: 🟨 ~50% EN PROGRESO
**Duración estimada**: 8-10 días (Cursor responsable frontend, Claude paralelo backend)

#### PARTE 1: Backend Dashboard CRUD + Endpoints Datos
**Status**: ✅ 100% DONE (modelos + router base)

**Completado:**
- ✅ CustomDashboard model + soft delete
- ✅ CustomDashboardAccess model (RBAC)
- ✅ DashboardConfig model
- ✅ Dashboard schemas (Pydantic)
- ✅ Dashboard service (CRUD + ownership)
- ✅ Dashboard router base (`POST /api/v1/dashboards` CRUD)
- ✅ Alembic migration
- ✅ Model exports + router registration

**PENDIENTE: Endpoints de DATOS para cada dashboard**

Este es el BLOCKER actual. Sin estos endpoints, Dashboard 2-9 frontend no puede cargar datos reales.

| Dashboard | Endpoints | Status | Prioridad |
|-----------|-----------|--------|-----------|
| **1. Ejecutivo** | 4 | 🟨 PRIORIDAD 1 | Hoy-Mañana |
| **2. Equipo** | 2 | ❌ PENDING | Semana 1 |
| **3. Programas** | 2 | ❌ PENDING | Semana 1 |
| **4. Vulns (4-Drill)** | 13 | ❌ PENDING | Semana 1-2 |
| **5. Concentrado** | 3 | ❌ PENDING | Semana 1 |
| **6. Operación** | 3 | ❌ PENDING | Semana 1 |
| **7. Kanban** | 3 | ❌ PENDING | Semana 1 |
| **8. Iniciativas** | 2 | ❌ PENDING | Semana 1 |
| **9. Temas** | 2 | ❌ PENDING | Semana 1 |

**Total: 35 endpoints** (Claude responsable)

---

#### PARTE 2: Frontend Dashboard Builder + 9 Dashboards
**Status**: 🟨 ~80% UI creada, ❌ Falta conectar a endpoints

**Completado (Cursor):**
- ✅ Dashboard list page (`/dashboards`)
- ✅ Dashboard builder page (`/dashboards/builder`) - create
- ✅ Dashboard edit page (`/dashboards/[id]/edit`)
- ✅ Dashboard view page (`/dashboards/[id]`)
- ✅ DashboardBuilder.tsx (drag-drop editor con react-grid-layout)
- ✅ WidgetConfigPanel.tsx (editor 3-tab para widget properties)
- ✅ DashboardViewer.tsx (renderizador dinámico de widgets)
- ✅ 16 componentes UI transversales:
  - GaugeChart, SemaforoSla, HistoricoMensualGrid, HorizontalBarRanking, DrilldownBreadcrumb
  - SeverityChip, StatusChip, ProgressBarSemaforo, SidePanel, AreaLineChart
  - KPICard ✨, DataTable ✨, TrendChart ✨
- ✅ Hooks: useDashboard, useDrilldown, useWidgetData, useCreateDashboard, useUpdateDashboard, useDeleteDashboard
- ✅ Schemas: dashboard-schema.ts (Zod validation)
- ✅ Types: dashboard.ts (shared interfaces)
- ✅ Dashboard 1 (Ejecutivo) - COMPLETO CON MOCK DATA ✨
  - 5 KPIs, Gauge, Area chart, HBarRank, Semáforo, Table
  - E2E test skeleton (40+ tests)
- ✅ Backend specification document (BACKEND_ENDPOINTS_SPECIFICATION.md)

**PENDIENTE:**
- ❌ Conectar Dashboard 1 a endpoints reales (cambiar mock data por API calls)
- ❌ Implementar Dashboard 2-9 frontends (basado en Dashboard 1 pattern)
- ❌ Advanced UI components:
  - AdvancedFilterBar.tsx
  - ReleaseKanbanBoard.tsx
  - TimelineBitacora.tsx
  - TabsContainer.tsx
  - RepositoryMetadata.tsx
  - VulnerabilityExpandible.tsx
- ❌ E2E tests para Dashboard 2-9
- ❌ Dark mode verificación

**Estimación**: 8-10 días (Cursor)
- Día 1-2: Conectar Dashboard 1 a endpoints reales
- Día 3-5: Dashboard 2-3 frontend completos
- Día 6-7: Dashboard 4-5 frontend (4 es el más complejo)
- Día 8: Dashboard 6-7 frontend
- Día 9: Dashboard 8-9 frontend
- Día 10: Tests E2E + refinamientos

**Dependencias**:
- ⚠️ BLOQUEA en: Endpoints Dashboard 1-9 backend (Claude)
- ⚠️ Workaround: Usar mock data mientras endpoints no estén listos, luego swap a real

**Checklist FASE 2 - 100% DONE:**
- [ ] Backend CRUD dashboards ✅
- [ ] 35 endpoints datos backend (4 + 31)
  - [ ] Dashboard 1: 4 endpoints
  - [ ] Dashboard 2-9: 31 endpoints
- [ ] Frontend: Dashboard 1 con datos reales
- [ ] Frontend: Dashboard 2-9 (todos creados + datos reales)
- [ ] 6 Advanced UI components creados
- [ ] E2E tests para todos los dashboards (Dashboard 1-9)
- [ ] Performance validado (< 2s per endpoint)
- [ ] Dark mode OK
- [ ] Permisos RBAC validados
- [ ] IDOR testing completado

---

### FASE 3: MODULE VIEW BUILDER
**Status**: ❌ NOT STARTED
**Duración estimada**: 3 días
**Responsable**: Cursor (frontend), Claude (backend)

**Objetivo**: Crear vistas personalizadas dentro de módulos (tabla, kanban, calendario, cards)

#### Backend (Claude):
- [ ] ModuleView model (module, nombre, tipo, columns config, filters, sort, groupBy, pageSize)
- [ ] ModuleView schemas (Pydantic)
- [ ] ModuleView service (CRUD + ownership)
- [ ] ModuleView router:
  - [ ] POST /api/v1/module-views (create)
  - [ ] GET /api/v1/module-views (list por module)
  - [ ] GET /api/v1/module-views/{id} (get one)
  - [ ] PATCH /api/v1/module-views/{id} (update config)
  - [ ] DELETE /api/v1/module-views/{id} (soft delete)
- [ ] Alembic migration
- [ ] Model exports + router registration
- [ ] Tests pytest (CRUD + permissions + IDOR)

#### Frontend (Cursor):
- [ ] ModuleViewBuilder.tsx component
- [ ] Column reorder UI (drag-drop)
- [ ] View type selector (Table/Kanban/Calendar/Cards)
- [ ] Filter builder UI
- [ ] Sort config UI
- [ ] GroupBy selector
- [ ] PageSize selector
- [ ] Save/Apply buttons
- [ ] useModuleView.ts hook (CRUD)
- [ ] Integrate with existing modules (Vulnerabilidades, Liberaciones, etc.)
- [ ] E2E tests (Playwright)

**Checklist FASE 3 - 100% DONE:**
- [ ] Backend CRUD ModuleView
- [ ] 5+ module views creadas (examples: "Críticas SLA Vencido", "Releases en QA", etc.)
- [ ] Frontend builder UI
- [ ] Reorder columns funciona
- [ ] View type switching funciona
- [ ] Filters funciona
- [ ] Sort funciona
- [ ] GroupBy funciona
- [ ] Datos load correctamente
- [ ] E2E tests pass
- [ ] IDOR protection OK

---

### FASE 4: CUSTOM FIELDS + PERSONALIZACIÓN TABLAS
**Status**: ❌ NOT STARTED
**Duración estimada**: 4 días
**Responsable**: Cursor (frontend), Claude (backend)

**Objetivo**: Admin agrega campos dinámicamente + personalización columnas

#### Backend (Claude):
- [ ] CustomField model (entity_type, nombre, type, required, default_value, visible, orden)
- [ ] CustomFieldValue model (entity_id, custom_field_id, value)
- [ ] CustomField schemas (Pydantic)
- [ ] CustomField service (CRUD + validation)
- [ ] CustomField router:
  - [ ] POST /api/v1/admin/custom-fields (create)
  - [ ] GET /api/v1/admin/custom-fields (list)
  - [ ] PATCH /api/v1/admin/custom-fields/{id} (update)
  - [ ] DELETE /api/v1/admin/custom-fields/{id} (soft delete)
  - [ ] GET /api/v1/{entity_type}/{id}/custom-fields (get values for entity)
  - [ ] PATCH /api/v1/{entity_type}/{id}/custom-field/{field_id} (set value)
- [ ] Migration (ADD TABLE custom_fields, custom_field_values)
- [ ] Soft delete en queries
- [ ] Tests pytest

#### Frontend (Cursor):
- [ ] CustomFieldsManager.tsx (admin: add/edit/delete fields)
- [ ] CustomFieldForm.tsx (name, type selector, required checkbox, default value, order)
- [ ] CustomFieldInput.tsx (render input per type: text, number, date, select, boolean, url, user_ref)
- [ ] ModuleView: dynamic column rendering para custom fields
- [ ] Hooks: useCustomFields.ts
- [ ] Zod schemas para validación
- [ ] E2E tests

**Field Types soportados:**
- [ ] text (255 chars)
- [ ] number (integer or decimal)
- [ ] date (date picker)
- [ ] select (dropdown, options configurables)
- [ ] boolean (toggle)
- [ ] url (validate http/https)
- [ ] user_ref (select from users)

**Checklist FASE 4 - 100% DONE:**
- [ ] Backend CRUD custom fields
- [ ] Custom field values persist
- [ ] Frontend admin UI para crear/editar/borrar fields
- [ ] Campo custom aparece en tablas dinámicamente
- [ ] Validación de tipos funciona
- [ ] Default values funciona
- [ ] Required validation funciona
- [ ] Ordenamiento de campos funciona
- [ ] Soft delete funciona
- [ ] E2E tests pass
- [ ] IDOR protection (solo admin puede manage fields)

---

### FASE 5: FORMULA ENGINE + VALIDATION RULES
**Status**: ❌ NOT STARTED
**Duración estimada**: 5 días
**Responsable**: Claude (backend), Cursor (frontend)

**Objetivo**: Fórmulas dinámicas + validaciones configurables

#### Backend (Claude):
- [ ] IndicadorFormula model (código, nombre, expresión, tipo, descripción)
- [ ] ValidationRule model (entity_type, nombre, condición, error_message, tipo)
- [ ] Formula + Rule schemas (Pydantic)
- [ ] FormulaEngine service (safe evaluation, NO eval())
  - [ ] parse_formula(expr)
  - [ ] validate_syntax(expr)
  - [ ] evaluate(expr, context)
- [ ] Supported functions (sin eval):
  - [ ] days_between(date1, date2)
  - [ ] days_until(date)
  - [ ] IF(condition, true_val, false_val)
  - [ ] percentage(a, b)
  - [ ] round(n, decimals)
  - [ ] count(array)
  - [ ] sum(array.field)
  - [ ] avg(array.field)
  - [ ] coalesce(a, b)
  - [ ] concatenate(a, b)
  - [ ] uppercase(str)
  - [ ] lowercase(str)
  - [ ] substring(str, start, end)
  - [ ] min(array), max(array)
  - [ ] now(), today()
- [ ] Routers:
  - [ ] POST /api/v1/admin/formula (create)
  - [ ] GET /api/v1/admin/formulas (list)
  - [ ] POST /api/v1/admin/formula/test (test expression)
  - [ ] POST /api/v1/admin/validation-rules (create)
  - [ ] GET /api/v1/admin/validation-rules (list)
  - [ ] PATCH /api/v1/admin/validation-rules/{id}
- [ ] Migration
- [ ] Tests pytest (formula evaluation, validation, edge cases)

#### Frontend (Cursor):
- [ ] FormulaBuilder.tsx (visual formula editor)
  - [ ] Function picker
  - [ ] Parameter input
  - [ ] Live preview evaluation
  - [ ] Error messages
- [ ] ValidationRuleBuilder.tsx
  - [ ] Condition builder (if-then rules)
  - [ ] Error message customization
- [ ] useFormula.ts hook
- [ ] useValidationRule.ts hook
- [ ] Tests Playwright

**Checklist FASE 5 - 100% DONE:**
- [ ] FormulaEngine safe (no eval)
- [ ] 13+ functions soportadas
- [ ] Formula testing endpoint funciona
- [ ] Fórmulas se evalúan correctamente
- [ ] Custom fields pueden usar fórmulas
- [ ] Validation rules funciona
- [ ] Error messages on validation fail
- [ ] Frontend formula editor UI
- [ ] Validation rule editor UI
- [ ] Tests pass (formulas + rules)

---

### FASE 6: CATALOG BUILDER
**Status**: ❌ NOT STARTED
**Duración estimada**: 2 días
**Responsable**: Claude (backend), Cursor (frontend)

**Objetivo**: Enums dinámicos sin hardcode

#### Backend (Claude):
- [ ] SystemCatalog model (type, key, values JSON, activo)
- [ ] Schemas (Pydantic)
- [ ] Service (CRUD)
- [ ] Router:
  - [ ] GET /api/v1/admin/catalogs (list)
  - [ ] POST /api/v1/admin/catalogs (create)
  - [ ] PATCH /api/v1/admin/catalogs/{id} (update values)
  - [ ] DELETE /api/v1/admin/catalogs/{id}
  - [ ] GET /api/v1/catalogs/{type} (public - get catalog values)
- [ ] Migration
- [ ] Pre-populate catalogs (SAST, DAST, SCA, MAST, MDA, Secretos, estados, severidades, tipos cambio, etc.)

#### Frontend (Cursor):
- [ ] CatalogManager.tsx (admin view)
  - [ ] List catalogs
  - [ ] Edit catalog values (add/remove/reorder)
- [ ] useCatalog.ts hook (fetch + cache)
- [ ] Tests Playwright

**Catalogs to create:**
- [ ] Severidades (CRITICA, ALTA, MEDIA, BAJA)
- [ ] Estados (Abierta, En Progreso, Cerrada, etc.)
- [ ] Motores (SAST, DAST, SCA, MAST, MDA, Secretos)
- [ ] Tipos Cambio (Hotfix, Feature, Patch)
- [ ] Criticidades (Crítica, Alta, Media, Baja)
- [ ] Programas (SAST, DAST, SCA, MAST, MDA, Secretos)
- [ ] Estados Flujo Release (Design, Validation, Tests, QA, Prod)
- [ ] Tipos Iniciativas (RFI, Proceso, Plataforma, Custom)
- [ ] Tipos Temas (Seguridad, Operación, Regulatorio, Custom)

**Checklist FASE 6 - 100% DONE:**
- [ ] SystemCatalog model creado
- [ ] Backend CRUD catalogs
- [ ] 10+ catalogs pre-poblados
- [ ] Frontend admin UI funciona
- [ ] Edición de valores funciona
- [ ] Reorder values funciona
- [ ] Soft delete funciona
- [ ] Public endpoint GET /catalogs/{type} funciona
- [ ] Frontend cache funciona
- [ ] Tests pass

---

### FASE 7: NAVIGATION BUILDER
**Status**: ❌ NOT STARTED
**Duración estimada**: 2 días
**Responsable**: Claude (backend), Cursor (frontend)

**Objetivo**: Sidebar dinámico con nombres/órdenes editables

#### Backend (Claude):
- [ ] NavigationItem model (label, icon, href, orden, visible, required_role, parent_id)
- [ ] Schema (Pydantic)
- [ ] Service (CRUD + reorder)
- [ ] Router:
  - [ ] GET /api/v1/navigation (get tree)
  - [ ] POST /api/v1/admin/navigation (create item)
  - [ ] PATCH /api/v1/admin/navigation/{id} (update)
  - [ ] DELETE /api/v1/admin/navigation/{id} (soft delete)
  - [ ] PATCH /api/v1/admin/navigation/reorder (batch reorder)
- [ ] Migration
- [ ] Pre-populate default navigation

#### Frontend (Cursor):
- [ ] NavigationManager.tsx (admin view)
  - [ ] Tree view con drag-drop reorder
  - [ ] Edit item dialog (label, icon, href, role)
  - [ ] Add/remove items
- [ ] Sidebar.tsx: consume dynamic navigation from API
- [ ] useNavigation.ts hook
- [ ] Tests Playwright

**Navigation Items default:**
- [ ] Dashboard (submenu: Executive, Equipo, Programas, Vulns, etc.)
- [ ] Vulnerabilidades
- [ ] Releases
- [ ] Programas
- [ ] Iniciativas
- [ ] Temas
- [ ] Admin (if role=admin)
  - [ ] Dashboards
  - [ ] Custom Fields
  - [ ] Validation Rules
  - [ ] Catalogs
  - [ ] Navigation
  - [ ] AI Automation
  - [ ] Users/Roles

**Checklist FASE 7 - 100% DONE:**
- [ ] NavigationItem model creado
- [ ] Backend CRUD navigation
- [ ] Default navigation pre-poblada
- [ ] Frontend admin UI (tree view)
- [ ] Drag-drop reorder funciona
- [ ] Edit item funciona
- [ ] Add/remove items funciona
- [ ] Soft delete funciona
- [ ] Sidebar consume dynamic navigation
- [ ] Role-based visibility funciona
- [ ] Tests pass

---

### FASE 8: AI AUTOMATION RULES
**Status**: ❌ NOT STARTED
**Duración estimada**: 5 días
**Responsable**: Claude (backend), Cursor (frontend)

**Objetivo**: Triggers automáticos, prompts, acciones configurables

#### Backend (Claude):
- [ ] AIAutomationRule model (nombre, trigger_type, trigger_config, action_type, action_config, enabled, created_by)
- [ ] ConfiguracionIA model (provider: "anthropic"/"openai", api_key_encrypted, model, temperatura, max_tokens, activo)
- [ ] Schemas (Pydantic)
- [ ] AIAutomationService:
  - [ ] evaluate_trigger(rule, event)
  - [ ] execute_action(rule, context)
  - [ ] call_llm(prompt, model, params)
- [ ] Trigger types:
  - [ ] on_vulnerability_created
  - [ ] on_vulnerability_status_changed
  - [ ] on_release_created
  - [ ] on_theme_created
  - [ ] on_sla_at_risk
  - [ ] cron (scheduled: "0 9 * * MON" - lunes 9am)
- [ ] Action types:
  - [ ] send_notification
  - [ ] create_ticket
  - [ ] assign_to_user
  - [ ] tag_entity
  - [ ] generate_summary (LLM)
  - [ ] enrich_data (LLM)
  - [ ] suggest_fix (LLM)
- [ ] Router:
  - [ ] POST /api/v1/admin/ai-rules (create)
  - [ ] GET /api/v1/admin/ai-rules (list)
  - [ ] PATCH /api/v1/admin/ai-rules/{id} (update)
  - [ ] DELETE /api/v1/admin/ai-rules/{id}
  - [ ] POST /api/v1/admin/ai-config (update IA settings)
  - [ ] POST /api/v1/admin/ai-rules/{id}/test (test rule)
- [ ] Middleware: hook en models (vulnerability_svc, release_svc) para ejecutar rules
- [ ] Migration
- [ ] Tests pytest

#### Frontend (Cursor):
- [ ] AIRuleBuilder.tsx
  - [ ] Trigger type selector
  - [ ] Trigger config form (conditional logic)
  - [ ] Action type selector
  - [ ] Action config form (prompt template, assignment, etc.)
  - [ ] Enable/disable toggle
- [ ] AIConfigForm.tsx (admin settings)
  - [ ] Provider selector (Anthropic/OpenAI)
  - [ ] API key input
  - [ ] Model selector
  - [ ] Temperature slider
  - [ ] Max tokens input
- [ ] useAIRule.ts hook
- [ ] Tests Playwright

**Example Rules:**
- [ ] "Si vulnerabilidad CRÍTICA creada → generar summary + enviar Slack"
- [ ] "Si SLA a riesgo (< 1 día) → assign a on-call analyst"
- [ ] "Lunes 9am → generar reporte semanal"
- [ ] "Si release en Prod → generar audit log summary"

**Checklist FASE 8 - 100% DONE:**
- [ ] AIAutomationRule model creado
- [ ] ConfiguracionIA model creado
- [ ] Backend CRUD rules + config
- [ ] 6+ trigger types soportados
- [ ] 6+ action types soportados
- [ ] LLM integration (Anthropic)
- [ ] Frontend AI rule builder
- [ ] Frontend IA config form
- [ ] Test rule endpoint funciona
- [ ] Rules ejecutan correctly en eventos
- [ ] Notifications/tickets se crean
- [ ] Cron jobs schedulados
- [ ] Error handling (LLM fails, network, etc.)
- [ ] Tests pass

---

### FASE 9: TESTING + OPTIMIZATION
**Status**: ❌ NOT STARTED
**Duración estimada**: 4 días
**Responsable**: Claude (backend tests), Cursor (frontend tests)

**Objetivo**: Tests integrales (80%+ coverage) + performance tuning + docs

#### Backend Testing (Claude):
- [ ] pytest test suite (coverage ≥80%)
  - [ ] Fase 2: Dashboard CRUD + 35 endpoints (tests per endpoint)
  - [ ] Fase 3: ModuleView CRUD + builder logic
  - [ ] Fase 4: CustomField CRUD + validation
  - [ ] Fase 5: Formula evaluation + validation rules
  - [ ] Fase 6: Catalog CRUD + pre-population
  - [ ] Fase 7: Navigation CRUD + reorder
  - [ ] Fase 8: AI rule evaluation + execution
- [ ] Security tests:
  - [ ] IDOR: intentar acceder a datos de otro usuario (por endpoint)
  - [ ] RBAC: intentar acciones sin permisos requeridos
  - [ ] SQL injection: intentar inyectar SQL en filtros
  - [ ] XSS: intentar valores maliciosos en custom fields
- [ ] Performance tests:
  - [ ] Response time < 2 segundos (95th percentile)
  - [ ] Query plans (EXPLAIN ANALYZE)
  - [ ] Índices evaluados
- [ ] Data validation tests:
  - [ ] Soft delete queries (deleted_at IS NULL)
  - [ ] Scope cascade
  - [ ] SoD rules
- [ ] Error handling tests:
  - [ ] 400 Bad Request (invalid input)
  - [ ] 401 Unauthorized (no token)
  - [ ] 403 Forbidden (no permission)
  - [ ] 404 Not Found
  - [ ] 500 Internal Server Error (graceful)
- [ ] Run: `make test` (all pass, coverage reported)

#### Frontend Testing (Cursor):
- [ ] Playwright E2E tests (80+ tests)
  - [ ] Fase 2: Dashboard 1-9 happy path (load, filter, export, drill-down)
  - [ ] Fase 3: Module view builder workflow
  - [ ] Fase 4: Custom field creation + usage
  - [ ] Fase 5: Formula builder + validation
  - [ ] Fase 6: Catalog manager
  - [ ] Fase 7: Navigation builder
  - [ ] Fase 8: AI rule builder + execution
- [ ] vitest unit tests (40+ component tests)
  - [ ] UI components render correctly
  - [ ] Hooks state management
  - [ ] Utility functions
- [ ] Accessibility tests (a11y)
  - [ ] Keyboard navigation
  - [ ] Screen reader compatible
  - [ ] Color contrast
- [ ] Responsive tests
  - [ ] Desktop (1920px)
  - [ ] Tablet (768px)
  - [ ] Mobile (375px)
- [ ] Dark mode tests
  - [ ] Colors correct
  - [ ] Preference persisted
- [ ] Run: `npm run test:run` (all pass, coverage reported)

#### Performance Optimization:
- [ ] Backend:
  - [ ] Database indexes for soft delete, foreign keys, common filters
  - [ ] Query optimization (no N+1, eager loading)
  - [ ] Response caching (Redis if available, or in-memory)
  - [ ] Pagination enforcement (max 100 rows)
- [ ] Frontend:
  - [ ] Code splitting (lazy load dashboards)
  - [ ] Image optimization
  - [ ] Bundle size (< 500 KB gzipped)
  - [ ] React.memo for expensive components
  - [ ] Debounce input handlers
  - [ ] Virtualization for large tables

#### Documentation:
- [ ] Admin Guide (Markdown)
  - [ ] Cómo crear/editar dashboards
  - [ ] Cómo agregar custom fields
  - [ ] Cómo definir validation rules
  - [ ] Cómo configurar AI automation
  - [ ] Troubleshooting
- [ ] User Guide (Markdown + screenshots)
  - [ ] Cómo usar cada dashboard
  - [ ] Cómo filtrar/drill-down
  - [ ] Cómo exportar datos
- [ ] Developer Guide (Markdown)
  - [ ] Architecture overview
  - [ ] How to extend dashboards
  - [ ] How to add custom components
  - [ ] Testing patterns
  - [ ] Performance tips
- [ ] API Documentation (Swagger auto-generated)
- [ ] Architecture Decision Records (ADR)

#### Performance Targets (Verify):
- [ ] Dashboard 1 load: < 1.5 segundos
- [ ] Dashboard 4 level 0: < 1 segundo
- [ ] Dashboard 4 level 3 (con tabla): < 2.5 segundos
- [ ] CSV export (max 10k rows): < 5 segundos
- [ ] Page load FCP: < 1.5 segundos
- [ ] Page load TTI: < 3 segundos

**Checklist FASE 9 - 100% DONE:**
- [ ] pytest coverage ≥80% (all phases 2-8)
- [ ] Playwright E2E 80+ tests (all pass)
- [ ] vitest component tests 40+ (all pass)
- [ ] Security tests (IDOR, RBAC, SQL injection, XSS)
- [ ] Performance tests (response times OK)
- [ ] Responsive tests (desktop/tablet/mobile)
- [ ] Dark mode tests OK
- [ ] Accessibility tests OK
- [ ] Database indexes created
- [ ] Queries optimized (no N+1)
- [ ] Admin guide completo
- [ ] User guide completo
- [ ] Developer guide completo
- [ ] API docs actualizado
- [ ] ADRs creados
- [ ] Performance targets met

---

## 🎯 RESUMEN EJECUTIVO: 100% FASES 0-9

| Fase | Nombre | Estado | Completado | Estimado |
|------|--------|--------|-----------|----------|
| **0** | Setup | ✅ DONE | 25 abr | — |
| **1** | Query Builder | ✅ DONE | 25 abr | — |
| **2** | Dashboards 1-9 | 🟨 50% | — | 8-10 d |
| **3** | Module View Builder | ❌ TODO | — | 3 d |
| **4** | Custom Fields | ❌ TODO | — | 4 d |
| **5** | Formula Engine | ❌ TODO | — | 5 d |
| **6** | Catalog Builder | ❌ TODO | — | 2 d |
| **7** | Navigation Builder | ❌ TODO | — | 2 d |
| **8** | AI Automation | ❌ TODO | — | 5 d |
| **9** | Testing + Optimization | ❌ TODO | — | 4 d |
| **TOTAL** | | | | ~33 días |

**Blocker Actual**: Dashboard endpoints backend (PRIORIDAD MÁXIMA)

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS (HOY/MAÑANA)

1. ✅ Read this plan completely (done)
2. **INICIAR FASE 2 ENDPOINTS** (Claude):
   - Dashboard 1 (4 endpoints) → HOY
   - Dashboard 2-9 (31 endpoints) → Semana 1
3. **CONECTAR Dashboard 1 frontend a endpoints reales** (Cursor):
   - Una vez Dashboard 1 endpoints listos
4. **Implementar Dashboard 2-9 frontends** (Cursor):
   - Basado en Dashboard 1 pattern
   - Con endpoints reales de Claude
5. **Comenzar FASE 3** (Module View) en paralelo (Semana 1-2)

---

**Plan validado. Listo para ejecutar al 100%.**
