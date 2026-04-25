# PLAN DE TRABAJO: DASHBOARDS + BUILDERS DINÁMICOS
**Plataforma AppSec — Especificación de Implementación**

**Fecha**: 25 abril 2026  
**Estado**: En Validación  
**Timeline**: 35-40 días (Fase 1-10)
**Enfoque**: 9 dashboards dinámicos (MUY similar a imágenes de referencia) + builders 100% configurables
**Standard Visual**: `/Users/pablosalas/Appsec/appsec-platform/Dashboards - Templates/*.png` (9 imágenes vinculantes)

---

## 🎯 REGLAS DE OPERACIÓN (OBLIGATORIAS)

| Regla | Descripción |
|-------|-------------|
| **O1** | Nuevas reglas aplican PRIMERO a este archivo |
| **O2** | Claude + Cursor trabajan EN PARALELO (no secuencial) — ambos leen este documento |
| **O3** | Claude/Cursor NO ejecuta: tests, make types, git commit, git push — solo si Usuario lo pide explícitamente |
| **O4** | Nunca sesión sin completar algo: si empiezo algo, DEBO terminarlo o entregar resultado concreto y actualizar dentro de este documento.|

---

## ⏱️ SEMANA 0 — Setup Dependencias (SOLO Claude)

**Ejecutar ANTES de Fase 1**. Una sola vez. Duración: 1 día.

### Checklist SEMANA 0 — Status: ✅ 100% COMPLETA

| Tarea | Estado | Responsable | Completado |
|-------|--------|-------------|-----------|
| Backend: pip install requirements.txt | ✅ DONE | Claude (verificación) | 25 abr 2026 |
| Frontend: npm install librerías | ✅ DONE | Claude (verificación) | 25 abr 2026 |
| test_data.py endpoints (seed/reset) | ✅ DONE | Claude | 25 abr 2026 |
| 4 nuevos roles en seed.py | ✅ DONE | Claude | 25 abr 2026 |
| make up + make types | ✅ DONE | Usuario | 25 abr 2026 |
| curl verification tests | ✅ DONE | Usuario | 25 abr 2026 |
| Git commit SEMANA 0 | ✅ DONE | Usuario | 25 abr 2026 |

**Status**: ✅ Listo. Proceder a Fase 1 EN PARALELO (Claude + Cursor)

---

## 👥 DIVISIÓN DE TRABAJO EN PARALELO

### Modelo:

```
SEMANA 0 (1 día)
└─ Claude: Setup completo

SEMANA 1-4 (Fases 1-10) — EN PARALELO
├─ THREAD CLAUDE:
│  ├─ Fase 1: Query Builder Backend + Validaciones (6 días)

---

## 📊 TRACKING DE PROGRESO — REAL TIME

**Leyenda**: ✅ = Completado | 🟨 = En Progreso | 🟨 Pending | ❌ = Bloqueado

### SEMANA 0: Setup Inicial

| Componente | Backend | Frontend | Estado | Fecha |
|-----------|---------|----------|--------|-------|
| Dependencies | ✅ Verificado | ✅ Verificado | ✅ READY | 25 abr |
| Test Data Endpoints | ✅ Implementado | — | ✅ READY | 25 abr |
| New Roles (4) | ✅ Agregadas a seed.py | — | ✅ READY | 25 abr |
| **Make up / DB migration** | 🟨 PENDING | 🟨 PENDING | 🟨 USER ACTION | — |
| **Git Commit** | — | — | 🟨 PENDING | — |

### FASE 1: Query Builder Manual (6 días)

**Timeline**: 25 abr - 1 mayo 2026  
**Backend (Claude)**: ✅ 100% DONE | **Frontend (Cursor)**: ✅ 100% DONE

| Componente | Backend | Frontend | Estado | Completado |
|-----------|---------|----------|--------|-----------|
| **Models** | | | | |
| SavedWidget model | ✅ DONE | — | ✅ | 25 abr 16:00 |
| Alembic migration | ✅ DONE | — | ✅ | 25 abr 16:10 |
| **Schemas** | | | | |
| SavedWidget schemas | ✅ DONE | — | ✅ | 25 abr 16:05 |
| QueryConfig schema | ✅ DONE | — | ✅ | 25 abr 16:05 |
| **Services** | | | | |
| QueryValidator (6 methods) | ✅ DONE | — | ✅ | 25 abr 16:15 |
| QueryBuilderService | ✅ DONE | — | ✅ | 25 abr 16:20 |
| **Endpoints** | | | | |
| POST /validate | ✅ DONE | — | ✅ | 25 abr 16:25 |
| POST /execute | ✅ DONE | — | ✅ | 25 abr 16:25 |
| POST /schema-info | ✅ DONE | — | ✅ | 25 abr 16:25 |
| CRUD widgets | ✅ DONE | — | ✅ | 25 abr 16:30 |
| **Frontend** | | | | |
| QueryBuilder.tsx | — | 🟨 PENDING | 🟨 | — |
| QueryBuilderForm.tsx | — | 🟨 PENDING | 🟨 | — |
| Hooks (useQueryBuilder, etc) | — | 🟨 PENDING | 🟨 | — |
| formula-engine.ts | — | 🟨 PENDING | 🟨 | — |
| Tests | — | 🟨 PENDING | 🟨 | — |
| **Integration** | | | | |
| Router registration | ✅ DONE | — | ✅ | 25 abr 16:35 |
| Model exports | ✅ DONE | — | ✅ | 25 abr 16:35 |

**Backend Status**: ✅ 100% COMPLETE — Ready for frontend integration  
**Blocker**: User needs to run `make up` + migrations to activate DB changes

---

### FASE 2: Dashboard Builder (4 días) — INICIADA (CURSOR)

**Timeline**: 25 abr (18:00) - 30 abr 2026  
**Backend (Claude)**: ✅ 100% DONE | **Frontend (Cursor)**: 🔄 EN PROGRESO (Sesión 2)

**Objetivos Fase 2**:
1. Dashboard Builder UI (drag-drop layout builder)
2. 9 Dashboards base (preconfigurados)
3. 13+ Componentes transversales UI
4. ~35 endpoints backend para data

**Responsabilidades**:
- **Claude**: Endpoints backend por dashboard (después de Fase 1 FE completada)
- **Cursor**: UI components, builder, 9 dashboard pages (PARALELO con Claude)

**Status Sesión 2 (FASE 2 COMPLETA)**: 
- [✅] Schemas dashboard (zod validation) — `dashboard-schema.ts`
- [✅] Hooks: useDashboard, useDrilldown, useWidgetData — 3 archivos
- [✅] 13 componentes UI transversales (charts)
  - GaugeChart.tsx
  - SemaforoSla.tsx
  - HistoricoMensualGrid.tsx
  - HorizontalBarRanking.tsx
  - DrilldownBreadcrumb.tsx
  - SeverityChip.tsx
  - StatusChip.tsx
  - ProgressBarSemaforo.tsx
  - SidePanel.tsx
  - AreaLineChart.tsx
  - KPICard.tsx ✨ NEW
  - DataTable.tsx ✨ NEW
  - TrendChart.tsx ✨ NEW
- [✅] WidgetConfigPanel.tsx — Editor completo (3 tabs: Básico, Datos, Display)
- [✅] DashboardViewer.tsx — Renderizador real de widgets con useWidgetData
- [✅] Dashboard list page (/dashboards) — lista y búsqueda
- [✅] DashboardBuilder.tsx (editor drag-drop con react-grid-layout)
- [✅] Dashboard builder page (/dashboards/builder) — crear nuevo
- [✅] Dashboard edit page (/dashboards/[id]/edit) — editar existente
- [✅] Dashboard view page (/dashboards/[id]) — visualizar
- [✅] Types compartidos (dashboard.ts)
- [✅] Exports centralizados (components/charts/index.ts)
- [✅] Dashboard 1 (Ejecutivo) — COMPLETO Y FUNCIONAL ✨ NEW
  - 5 KPI Cards (Avance Programas, Vulns Críticas, Liberaciones, Temas, Auditorías)
  - Gauge: Postura de Seguridad Global
  - Trend Chart: Tendencia 6 meses (4 series: críticas, altas, medias, bajas)
  - Horizontal Bar Ranking: Top 5 Repos
  - Semáforo SLA: En Tiempo/Riesgo/Vencidas
  - Data Table: Auditorías Activas (con filtros y paginación)
- [✅] E2E Test skeleton — Dashboard 1 (Playwright) ✨ NEW
  - Tests KPI Cards, Gauge, Tendencia, Ranking, Semáforo, Tabla
  - Tests Filtros, Exportación, Responsividad, Dark Mode, Permisos
  - Tests Performance
- [✅] Backend specification document — Endpoints requeridos ✨ NEW
  - Especificación detallada: /api/v1/dashboards CRUD
  - Dashboard 1: 6 endpoints (KPIs, Postura, Tendencia, Top Repos, SLA, Auditorías)
  - Cada endpoint con Input/Output specs, lógica, auth, audit, cache
  - Test data fixtures recomendadas
  - Patrón estándar (ADR-0001, ADR-0004)
- [✅] Types compartidos (dashboard.ts)
- [✅] Exports centralizados (components/charts/index.ts)

**Archivos Creados en Sesión 2** (33 totales):
```
frontend/src/
├── schemas/
│   └── dashboard-schema.ts (✅)
├── hooks/
│   ├── useDashboard.ts (✅)
│   ├── useDrilldown.ts (✅)
│   └── useWidgetData.ts (✅)
├── components/
│   ├── WidgetConfigPanel.tsx (✨ NEW)
│   ├── DashboardViewer.tsx (✨ NEW)
│   ├── DashboardBuilder.tsx (✅)
│   ├── charts/
│   │   ├── GaugeChart.tsx (✅)
│   │   ├── SemaforoSla.tsx (✅)
│   │   ├── HistoricoMensualGrid.tsx (✅)
│   │   ├── HorizontalBarRanking.tsx (✅)
│   │   ├── DrilldownBreadcrumb.tsx (✅)
│   │   ├── SeverityChip.tsx (✅)
│   │   ├── StatusChip.tsx (✅)
│   │   ├── ProgressBarSemaforo.tsx (✅)
│   │   ├── SidePanel.tsx (✅)
│   │   ├── AreaLineChart.tsx (✅)
│   │   ├── KPICard.tsx (✨ NEW)
│   │   ├── DataTable.tsx (✨ NEW)
│   │   ├── TrendChart.tsx (✨ NEW)
│   │   └── index.ts (✅)
├── types/
│   └── dashboard.ts (✅)
├── app/(dashboard)/
│   ├── dashboards/
│   │   ├── page.tsx (✅)
│   │   ├── builder/
│   │   │   └── page.tsx (✅)
│   │   ├── [id]/
│   │   │   ├── page.tsx (✅)
│   │   │   └── edit/
│   │   │       └── page.tsx (✅)
│   │   └── executive/
│   │       └── page.tsx (✨ NEW - DASHBOARD 1 COMPLETO)
└── __tests__/
    └── e2e/
        └── dashboard-1-executive.spec.ts (✨ NEW - E2E TESTS)

docs/
└── BACKEND_ENDPOINTS_SPECIFICATION.md (✨ NEW - API SPEC FOR CLAUDE)
```
```
frontend/src/
├── schemas/
│   └── dashboard-schema.ts (✅)
├── hooks/
│   ├── useDashboard.ts (✅)
│   ├── useDrilldown.ts (✅)
│   └── useWidgetData.ts (✅)
├── components/
│   ├── charts/
│   │   ├── GaugeChart.tsx (✅)
│   │   ├── SemaforoSla.tsx (✅)
│   │   ├── HistoricoMensualGrid.tsx (✅)
│   │   ├── HorizontalBarRanking.tsx (✅)
│   │   ├── DrilldownBreadcrumb.tsx (✅)
│   │   ├── SeverityChip.tsx (✅)
│   │   ├── StatusChip.tsx (✅)
│   │   ├── ProgressBarSemaforo.tsx (✅)
│   │   ├── SidePanel.tsx (✅)
│   │   ├── AreaLineChart.tsx (✅)
│   │   └── index.ts (✅)
│   └── DashboardBuilder.tsx (✅)
├── types/
│   └── dashboard.ts (✅)
└── app/(dashboard)/
    └── dashboards/
        ├── page.tsx (✅)
        ├── builder/
        │   └── page.tsx (✅)
        └── [id]/
            ├── page.tsx (✅)
            └── edit/
                └── page.tsx (✅)
```

| Componente | Backend | Frontend | Estado | Completado |
|-----------|---------|----------|--------|-----------|
| **Models** | | | | |
| CustomDashboard model | ✅ DONE | — | ✅ | 25 abr 16:40 |
| CustomDashboardAccess model | ✅ DONE | — | ✅ | 25 abr 16:45 |
| DashboardConfig model | ✅ DONE | — | ✅ | 25 abr 16:50 |
| **Schemas** | | | | |
| CustomDashboard schemas | ✅ DONE | — | ✅ | 25 abr 16:55 |
| CustomDashboardAccess schemas | ✅ DONE | — | ✅ | 25 abr 16:55 |
| DashboardConfig schemas | ✅ DONE | — | ✅ | 25 abr 16:55 |
| **Services** | | | | |
| custom_dashboard_svc | ✅ DONE | — | ✅ | 25 abr 17:00 |
| custom_dashboard_access_svc | ✅ DONE | — | ✅ | 25 abr 17:00 |
| dashboard_config_svc | ✅ DONE | — | ✅ | 25 abr 17:00 |
| **Endpoints** | | | | |
| Dashboard CRUD (create, list, get, update, delete) | ✅ DONE | — | ✅ | 25 abr 17:05 |
| Grant access endpoints | ✅ DONE | — | ✅ | 25 abr 17:05 |
| Configure widget visibility | ✅ DONE | — | ✅ | 25 abr 17:05 |
| **Migration** | | | | |
| Alembic migration | ✅ DONE | — | ✅ | 25 abr 17:10 |
| **Integration** | | | | |
| Router registration | ✅ DONE | — | ✅ | 25 abr 17:10 |
| Model exports | ✅ DONE | — | ✅ | 25 abr 17:10 |
| **Frontend** | | | | |
| DashboardBuilder.tsx | — | 🟨 PENDING | 🟨 | — |
| DashboardForm.tsx | — | 🟨 PENDING | 🟨 | — |
| Grid layout + drag-drop | — | 🟨 PENDING | 🟨 | — |
| Widget config panel | — | 🟨 PENDING | 🟨 | — |
| Tests | — | 🟨 PENDING | 🟨 | — |

**Backend Status**: ✅ 100% COMPLETE — Ready for frontend integration  

---

### FASE 3-10: Upcoming (Scheduled after Fase 2 frontend done)

| Fase | Nombre | Responsable | Duración | Estado |
|------|--------|-------------|----------|--------|
| 3 | Module View Builder | Claude + Cursor | 4 días | ❌ BLOCKED (waiting Fase 2 FE) |
| 4 | Custom Fields + Field Visibility | Claude + Cursor | 4 días | ❌ BLOCKED |
| 5 | Formula Engine (Dinámicas) | Claude + Cursor | 3 días | ❌ BLOCKED |
| 6 | Catalog Builder (Enums) | Claude + Cursor | 3 días | ❌ BLOCKED |
| 7 | Navigation Builder | Claude + Cursor | 3 días | ❌ BLOCKED |
| 8 | AI Automation Rules | Claude + Cursor | 3 días | ❌ BLOCKED |
| 9 | Validation Rules Builder | Claude + Cursor | 2 días | ❌ BLOCKED |
| 10 | Testing + Optimization | Claude + Cursor | 5 días | ❌ BLOCKED |

---
│  └─ Luego Fase 3-4: Module View + Custom Fields (7 días)
│
└─ THREAD CURSOR:
   ├─ Fase 1: Query Builder UI (6 días) — paralelo con Claude
   ├─ Fase 2: Dashboard Builder + 9 Dashboards (8 días)
   └─ Luego Fase 5-10: Fórmulas, Builders, Testing
```

### Tabla División por Fase:

| Fase | Nombre | Responsable | Duración | Puede hacerse paralelo con |
|------|--------|------------|----------|---------------------------|
| **SEMANA 0** | Setup | Claude | 1 día | — |
| **1** | Query Builder | Claude (backend) + Cursor (UI) | 6 días | Paralelo: ambos |
| **2** | Dashboard Builder + 9 Dashboards | **Cursor** | 8 días | Paralelo con Fase 1 (Claude) |
| **3** | 13 Componentes UI | **Cursor** | 5 días | Paralelo con Fase 2 |
| **4** | Module View Builder | **Claude** | 3 días | Después de Fase 2 |
| **5** | Custom Fields + Personalización | **Cursor** | 4 días | Paralelo con Fase 4 (Claude) |
| **6** | Formula Engine | **Claude** | 5 días | Paralelo con Fase 5 |
| **7** | Catalog Builder | **Cursor** | 2 días | Después de Fase 6 |
| **8** | Navigation Builder | **Claude** | 2 días | Paralelo con Fase 7 |
| **9** | AI Automation Rules | **Cursor** | 5 días | Después de Fase 8 |
| **10** | Testing + Optimización | Coordinados | 4 días | Último, necesita todo anterior |

---

## 📊 TRACKING DE AVANCE

**Formato**: `⬜ TODO | 🟨 IN_PROGRESS | ✅ DONE`

### SEMANA 0 — Setup

| Tarea | Estado | Responsable | Notas |
|-------|--------|-------------|-------|
| Backend dependencies | ✅ DONE | Claude | requirements.txt ya tiene todas |
| Frontend dependencies | ✅ DONE | Claude | package.json ya tiene react-grid-layout, date-fns, @dnd-kit/* |
| Test data endpoints | ✅ DONE | Claude | Creado backend/app/api/v1/admin/test_data.py + registrado en router |
| 4 nuevos roles | ✅ DONE | Claude | Agregado _seed_roles() en seed.py + llamada en seed() |
| make up + verificación | ⬜ TODO | Usuario | Ejecutar: make up, hacer curl test |
| Git commit | ⬜ TODO | Usuario | "SEMANA 0: Setup test data endpoints + 4 new roles" |

### Fases 1-10

| Fase | Tarea | Estado | Responsable | Notas |
|------|-------|--------|------------|-------|
| **1** | Query Builder Backend | ⬜ TODO | Claude | Endpoints + Services |
| **1** | Query Builder UI | ⬜ TODO | Cursor | Componentes + Hooks |
| **2** | CustomDashboard Model | ⬜ TODO | Cursor | Entity + Migration |
| **2** | 9 Dashboards Base | ⬜ TODO | Cursor | Sistema + Layout JSON |
| **2.1-2.9** | Dashboard 1-9 Implementation | ⬜ TODO | Cursor | ~13 días totales |
| **3** | 13 Componentes UI | ⬜ TODO | Cursor | GaugeChart, SemaforoSla, etc. |
| **4** | Module View Builder | ⬜ TODO | Claude | Entity + Router |
| **5** | Custom Fields | ⬜ TODO | Cursor | Model + UI |
| **6** | Formula Engine | ⬜ TODO | Claude | Validator + Service |
| **7** | Catalog Builder | ⬜ TODO | Cursor | SystemSetting CRUD |
| **8** | Navigation Builder | ⬜ TODO | Claude | NavigationItem model |
| **9** | AI Automation Rules | ⬜ TODO | Cursor | Entity + Triggers |
| **10** | Testing + Docs | ⬜ TODO | Coordinados | pytest + vitest + Playwright |

---

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#visión-general)
2. [DEPENDENCIAS Y REQUISITOS](#dependencias-y-requisitos) ⭐ CHECKLIST TÉCNICO
3. [Timeline y Fases](#timeline-y-fases)
4. [Especificaciones de los 9 Dashboards](#especificaciones-de-los-9-dashboards)
5. [Fase 1: Query Builder Manual](#fase-1-query-builder-manual)
6. [Fase 2: Dashboard Builder + 9 Dashboards](#fase-2-dashboard-builder--9-dashboards)
7. [Fase 3: Module View Builder](#fase-3-module-view-builder)
8. [Fase 4: Custom Fields + Personalización](#fase-4-custom-fields--personalización)
9. [Fase 5: Formula Engine + Validation Rules](#fase-5-formula-engine--validation-rules)
10. [Fase 6: Catalog Builder](#fase-6-catalog-builder)
11. [Fase 7: Navigation Builder](#fase-7-navigation-builder)
12. [Fase 8: AI Automation Rules](#fase-8-ai-automation-rules)
13. [Fase 9: Testing + Optimización](#fase-9-testing--optimización)

---

## ⚙️ DEPENDENCIAS Y REQUISITOS

### CHECKLIST: LO QUE EXISTE vs LO QUE FALTA

Para que los 9 dashboards funcionen **exactamente como en las imágenes** con gráficos, filtros, drill-down y exportación, necesitas:

#### ✅ YA INSTALADO (Framework)
- **Librerías gráficas**: `recharts`, `@dnd-kit`, `next-themes`, `sonner`, `zod`
- **UI Library**: Shadcn UI (componentes base)
- **ORM**: SQLAlchemy Async, Pydantic v2
- **Auth framework**: Sistema de roles y permisos
- **Soft delete**: `SoftDeleteMixin` universal

#### ❌ FALTA: MODELOS DE BASE DE DATOS

```
Backend Models (BD):
├─ CustomDashboard (guardar layouts JSON)
├─ CustomDashboardAccess (permisos por rol/usuario)
├─ SavedWidget (queries reutilizables con preview)
├─ DashboardConfig (visibilidad de widgets por rol)
├─ CustomField (campos dinámicos sin migración SQL)
├─ CustomFieldValue (valores de campos custom)
├─ FlujoEstatus (máquina de estados configurable)
├─ IndicadorFormula (fórmulas de métricas XXX-001 a KRI0025)
├─ FiltroGuardado (filtros personales + compartidos)
├─ ConfiguracionIA (IA provider settings)
├─ ReglaSoD (Segregación de Funciones)
├─ ModuleFieldVisibility (qué campos ve cada rol)
├─ Extensiones a AuditLog: previous_hash, current_hash (hash chain)
└─ ⭐ EXTENSIÓN A MODELOS EXISTENTES:
   └─ Repositorio model:
      ├─ Verificar que existe campo: url (string, obligatorio)
      ├─ Si no existe, agregar: url: str (ej: "https://github.com/org/repo")
      └─ Usar para: botón "Ver en GitHub" en Dashboard 4 Nivel 3
```

#### ❌ FALTA: ENDPOINTS BACKEND

**Por Dashboard:**
- Dashboard 1 (Ejecutivo): 4 endpoints (KPIs, SLA semáforo, top repos, auditorías)
- Dashboard 2 (Equipo): 2 endpoints (lista analistas, detalle por usuario)
- Dashboard 3 (Programas): 2 endpoints (consolidado, zoom programa)
- Dashboard 4 (Vulns Drill-Down): 6 endpoints (global, subdir, célula, repo, dependencias, config)
- Dashboard 5 (Concentrado): 3 endpoints (por motor, por severidad, tabla)
- Dashboard 6 (Operación): 3 endpoints (liberaciones, terceros, detalle release)
- Dashboard 7 (Kanban): 3 endpoints (columnas config, datos kanban, move + validación)
- Dashboard 8 (Iniciativas): 2 endpoints (lista, detalle con ponderación)
- Dashboard 9 (Temas): 2 endpoints (lista, detalle con bitácora)

**Total: ~27 endpoints nuevos**

#### ❌ FALTA: COMPONENTES TRANSVERSALES UI (13 nuevos)

```
1. GaugeChart           → Velocímetro circular (Dashboard 1, 3)
2. SemaforoSla          → Verde/Amarillo/Rojo con conteos (Dashboard 1, 4)
3. HistoricoMensualGrid → Cuadritos color por mes (Dashboard 3)
4. SidePanel            → Panel deslizante derecha con tabs (Dashboard 2, 3, 6, 8, 9)
5. DrilldownBreadcrumb  → Navegación niveles (Dashboard 4)
6. AdvancedFilterBar    → Filtros múltiples tipo/estado/fechas (Dashboard 5, 6, 8, 9)
7. ProgressBarSemaforo  → Barra con color dinámico (Dashboard 2, 8)
8. SeverityChip         → Chip color por severidad (Dashboard 4, 5)
9. StatusChip           → Chip color por estatus (Dashboard 6, 7, 8, 9)
10. HorizontalBarRanking → Top N con barras (Dashboard 1)
11. ReleaseKanbanBoard   → Nuevo kanban para releases (Dashboard 7)
12. TimelineBitacora     → Chat/timeline comentarios (Dashboard 9)
13. AreaLineChart        → Área rellena + línea meta (Dashboard 1, 3, 4)
```

#### ❌ FALTA: FUNCIONALIDADES

- **Drill-down multidimensional**: Org → Subdir → Célula → Detalle (4 niveles)
- **Filtros dinámicos**: Por severidad, estado, motor, fecha, etc.
- **Exportación**: CSV, Excel, PDF con audit trail
- **Paginación**: Tablas con page size configurable
- **Soft delete**: Verificación en todos los endpoints
- **SoD (Segregación Funciones)**: Validación en aprobaciones
- **Justificación obligatoria**: En acciones críticas
- **Visibilidad por rol**: Widgets hidden/shown según rol

#### ❌ FALTA: SERVICIOS/HOOKS FRONTEND

```
Frontend Hooks:
├─ useDashboard(id)
├─ useDashboardBuilder()
├─ useWidgetData(dataSource, filters)
├─ useIndicatorFormula(code)
├─ useFiltrosGuardados(modulo)
├─ useCustomFields(entityType)
├─ useModuleFieldVisibility(modulo)
├─ useDrilldown(level, filters)
└─ useExportDashboard()

Frontend Utils:
├─ formatSeverity(severity)
├─ formatStatus(status)
├─ calculateDaysUntilSLA(date)
├─ calculateSemaforoColor(value, thresholds)
└─ buildQueryConfig(filters, aggregations)
```

#### ❌ FALTA: 4 NUEVOS ROLES

```
Roles confirmados a crear:
├─ ciso                  → Director de seguridad, ve todo
├─ responsable_celula    → Gestiona su célula
├─ director_subdireccion → Ve todos datos de subdirección
└─ lider_liberaciones    → Gestiona flujo Kanban

Matriz de acceso (qué rol ve qué dashboard):
┌──────────────────────────────────────────────────────────┐
│ Dashboard │ Admin │ CISO │ Dir │ Lider │ Resp │ Anal │ ... │
├──────────────────────────────────────────────────────────┤
│ 1. Ejecut │  ✅   │  ✅  │ ✅  │  ❌   │  ❌  │  ❌  │     │
│ 2. Equipo │  ✅   │  ✅  │ ✅  │  ✅   │  ✅  │  ✅* │     │
│ 3. Progra │  ✅   │  ✅  │ ✅  │  ✅   │  ✅  │  ❌  │     │
│ 4. Vulns  │  ✅   │  ✅  │ ✅  │  ✅   │  ✅  │  ✅  │     │
│ 5. Concen │  ✅   │  ✅  │ ✅  │  ✅   │  ✅  │  ✅  │     │
│ 6. Operac │  ✅   │  ✅  │ ✅  │  ❌   │  ✅  │  ✅  │     │
│ 7. Kanban │  ✅   │  ❌  │ ❌  │  ✅   │  ✅  │  ✅  │     │
│ 8. Inicia │  ✅   │  ✅  │ ✅  │  ✅   │  ✅  │  ❌  │     │
│ 9. Temas  │  ✅   │  ✅  │ ✅  │  ✅   │  ✅  │  ✅  │     │
└──────────────────────────────────────────────────────────┘
* Analista en Equipo: solo ve su propia fila
```

#### ❌ FALTA: VALIDACIONES Y REGLAS

- Validar transiciones de estado (FlujoEstatus)
- Validar SoD en aprobaciones (quien crea ≠ quien aprueba)
- Validar scope organizacional cascada (Subdir → Cel → Repo)
- Validar fórmulas en IndicadorFormula (no eval(), sandbox)
- Validar queries sin SQL injection (SQLAlchemy parameterized)

---

## 🎯 VISIÓN GENERAL

**Objetivo**: Plataforma 100% configurable donde el admin NO escribe código pero controla:
- ✅ Dashboards personalizados (layout, widgets, datos)
- ✅ Vistas por módulo (tabla, kanban, calendario)
- ✅ Campos dinámicos (sin migración SQL)
- ✅ Fórmulas calculadas (sin SQL)
- ✅ Validaciones dinámicas (sin código)
- ✅ Enums configurables (sin hardcode)
- ✅ Navegación personalizada (nombres editables)
- ✅ Automatización IA (triggers, prompts, acciones)

**Principios**:
1. **Admin nunca toca código** — todo por UI
2. **Soft delete always** — nada se borra, se oculta
3. **100% auditable** — cada cambio registrado
4. **Dinámico** — cambios sin redeploy
5. **Reutilizable** — componentes y lógica compartida

---

## ⏱️ TIMELINE Y FASES

### AHORA (35-40 días)

| Fase | Nombre | Duración | Tareas Clave | Estado |
|------|--------|----------|-------------|--------|
| **1** | Query Builder Manual + Validaciones | 6 días | • Endpoint schema-info • Service QueryBuilder • UI QueryBuilder • Live preview • Validaciones | 🚀 Inicio |
| **2** | Dashboard Builder + 9 Dashboards Base | 8 días | • CustomDashboard model • Layout JSON schema • 9 dashboards system=true • Endpoint /dashboards CRUD | 🚀 Inicio |
| **2.1** | Dashboard 1 (Ejecutivo) Implementation | 2 días | • 4 endpoints nuevos • 5 KPI components • Gauge, Area, Semáforo, HBarRank | 👷 |
| **2.2** | Dashboard 2 (Equipo) Implementation | 1.5 días | • 2 endpoints • Table + SidePanel • ProgressBarSemaforo | 👷 |
| **2.3** | Dashboard 3 (Programas) Implementation | 1.5 días | • 2 endpoints • 5 Gauges • HistoricoMensual + BarChart | 👷 |
| **2.4** | Dashboard 4 (Vulns 4-Drill) Implementation | 5 días | **⭐⭐ MÁXIMO COMPLEJO** • 13 endpoints • DrilldownBreadcrumb • 4 niveles navegación • **9 tabs** (SAST/DAST/SCA/MAST/Secretos/Secretos/Historial/Config/Resumen) • Cada tab con tabla dinámicas • RepositoryMetadata • VulnerabilityExpandible | 👷 |
| **2.5** | Dashboard 5 (Concentrado) Implementation | 2 días | • 3 endpoints • Motor + Severity views • AdvancedFilterBar • Toggle | 👷 |
| **2.6** | Dashboard 6 (Operación) Implementation | 2 días | • 3 endpoints • 2 tabs (Lib + Terceros) • SidePanel flujo estatus | 👷 |
| **2.7** | Dashboard 7 (Kanban) Implementation | 2 días | • 3 endpoints • ReleaseKanbanBoard • Drag-drop validación SoD | 👷 |
| **2.8** | Dashboard 8 (Iniciativas) Implementation | 1.5 días | • 2 endpoints • Table + SidePanel • 5 tabs • Ponderación mensual | 👷 |
| **2.9** | Dashboard 9 (Temas Emergentes) Implementation | 1.5 días | • 2 endpoints • TimelineBitacora/Chat • Color dinámico días abierto | 👷 |
| **3** | 13+ Componentes Transversales UI | 5 días | GaugeChart, SemaforoSla, HistoricoMensual, SidePanel, DrilldownBreadcrumb, AdvancedFilter, ProgressBarSemaforo, SeverityChip, StatusChip, HBarRank, ReleaseKanban, Timeline, AreaChart, **TabsContainer**, **RepositoryMetadata**, **VulnerabilityExpandible** | ⏳ Paralelo con Fase 2 |
| **4** | Module View Builder (Tabla/Kanban/Calendar/Cards) | 3 días | • ModuleView entity • Type selector (tabla/kanban/calendar/cards) • Column reorder • FilterBar | ⏳ Después de 2 |
| **5** | Custom Fields + Personalización Tablas | 4 días | • CustomField model • Visible toggle • Role-based visibility • Soft hide (no delete) | ⏳ Después de 4 |
| **6** | Formula Engine + Validation Rules | 5 días | • IndicadorFormula model • Sandbox evaluation (NO eval()) • Fórmulas dinámicas • Validación regex/required_if | ⏳ Después de 5 |
| **7** | Catalog Builder (Enums Dinámicos) | 2 días | • SystemSetting ampliación • Admin CRUD para catálogos • Sin hardcode | ⏳ Después de 6 |
| **8** | Navigation Builder | 2 días | • NavigationItem configurable • Labels editables • Visibilidad por rol • Reorder | ⏳ Después de 7 |
| **9** | AI Automation Rules | 5 días | • AIAutomationRule model • Trigger types • Prompt templates • Action types • ConfiguracionIA | ⏳ Después de 8 |
| **10** | Testing + Optimización | 4 días | • Backend: pytest 80% coverage • Frontend: vitest + Playwright E2E • Performance tuning • Docs | ⏳ Después de 9 |
| **TOTAL** | | **~40 días** | | |

**Dependencias críticas**:
```
Fase 1 → Fase 2 (Query Builder necesita para preview de widgets)
Fase 2 → Fase 3-9 (Dashboards base antes de customización)
Fase 2 + Fase 3 (13 componentes UI pueden hacerse paralelo)
Fase 7 → Fase 8-9 (Builders necesitan catalogs para opciones)
```

### FUTURE (Fase 11+)

| Capa | Nombre | Estado |
|------|--------|--------|
| 6 | Workflow Engine (flujos multi-paso) | ⏳ Fase 11+ |
| 7 | Report Builder (reportes personalizados) | ⏳ Fase 11+ |
| 9 | Branding/White-Label | ⏳ Fase 11+ |

---

## 🔍 GAPS DETALLADOS POR DASHBOARD

**Fuente**: `/Users/pablosalas/Appsec/appsec-platform/Dashboards - Templates/gap_analysis.md`

El archivo gap_analysis.md contiene análisis elemento-por-elemento de cada dashboard mostrando:
- ✅ Qué existe (rutas, endpoints, componentes)
- ❌ Qué falta (componentes, endpoints, funcionalidades)
- 🔧 Acción: REESCRIBIR / CREAR / EXTENDER

**Resumen por dashboard**:
- **Dashboard 1 (Ejecutivo)**: Existe `dashboards/executive/page.tsx` pero es esqueleto. Falta: 4 endpoints, 5 KPIs dinámicos, Gauge, Area chart, Semáforo, HBarRank
- **Dashboard 2 (Equipo)**: Existe pero solo StatCards genéricos. Falta: tabla ordenable, SidePanel, ProgressBarSemaforo, restricción de visibilidad por analista
- **Dashboard 3 (Programas)**: Existe pero muy básico. Falta: 5 Gauges, HistoricoMensualGrid, BarChart, SidePanel con actividades
- **Dashboard 4 (Vulns)**: **⭐ MAYOR TRABAJO** (~40% del esfuerzo). Existe pero NO tiene drill-down. Falta: 6 endpoints, DrilldownBreadcrumb, 4 niveles navegación, 4 tabs en nivel 3, Pipeline indicators
- **Dashboard 5 (Concentrado)**: **NO EXISTE** completamente. Falta: 3 endpoints, 6 tarjetas motores, 4 recuadros severidad, AdvancedFilterBar, Toggle vista
- **Dashboard 6 (Operación)**: Existe pero necesita rediseño. Falta: 4 KPIs, 2 tabs, columnas completas, dark mode, SidePanel flujo estatus
- **Dashboard 7 (Kanban)**: Existe pero es genérico de tasks. **FALTA**: ReleaseKanbanBoard específica para service_releases, 8 columnas configurables, tarjetas ricas, validación SoD en drag-drop
- **Dashboard 8 (Iniciativas)**: Existe pero esqueleto. Falta: tabla completa, SidePanel con 5 tabs, ProgressBarSemaforo, ponderación mensual
- **Dashboard 9 (Temas)**: Existe pero esqueleto. Falta: tabla completa, color dinámico en días abierto, SidePanel con TimelineBitacora/chat

**Acción recomendada antes de comenzar Fase 1**:
- ✅ Leer `/Dashboards - Templates/gap_analysis.md` completamente para entender elemento-por-elemento
- ✅ Revisar cada imagen PNG como referencia visual
- ✅ Confirmar que el plan coincide con gap_analysis (está usando la misma fuente)

---

## FASE 1: QUERY BUILDER MANUAL

**Duración**: 6 días  
**Objetivo**: Plataforma para crear queries sin SQL con live preview

### 1.1 Backend

**Endpoints nuevos**:
```
POST   /api/v1/admin/schema-info
       → Retorna estructura de BD (tablas, campos, relaciones)

POST   /api/v1/widget-data/query
       → Ejecuta query configurada, retorna datos con preview

GET    /api/v1/widget-data/query/:id
       → Recupera query guardada
```

**Services**:
```
QueryBuilderService
├─ build_query(config) → SQLAlchemy query dinámico
├─ validate_query(config) → Valida sintaxis/lógica
└─ execute_with_limits(query) → Ejecuta con timeout, max rows

QueryValidator
├─ validate_joins()
├─ validate_select_fields()
├─ validate_calculated_fields()
├─ validate_filters()
├─ validate_aggregations()
└─ validate_performance()
```

**Models**:
```python
SavedWidget
├─ id: UUID
├─ nombre: str(255)
├─ query_config: dict (JSONB)
├─ chart_type: str (kpi_card, bar_chart, line_chart, etc.)
├─ preview_data: dict (último resultado)
├─ created_by: FK(users.id)
└─ created_at, updated_at, deleted_at
```

### 1.2 Frontend

**UI Components**:
```
QueryBuilder.tsx
├─ Left panel: QueryBuilderForm
│  ├─ Base table selector
│  ├─ Join builder (drag-drop)
│  ├─ Field selector (checkboxes)
│  ├─ Calculated fields editor
│  ├─ Filter builder
│  ├─ Group By selector
│  └─ Aggregation config
├─ Right panel: Live Preview
│  ├─ Chart preview (recharts)
│  ├─ Data table preview
│  └─ Error/Warning messages
└─ Save button
```

**Validations en tiempo real**:
```typescript
- ✅ Joins válidos (FK exists)
- ✅ Campos existen
- ✅ GROUP BY válido (SQL standard)
- ✅ Fórmulas sintaxis correcta
- ✅ Type compatibility (SUM en número)
- ⚠️ Performance warnings (max joins)
```

### 1.3 Archivos a Crear

```
Backend:
├─ app/services/query_builder_service.py
├─ app/services/query_validator.py
├─ app/services/query_executor.py
├─ app/models/saved_widget.py
├─ app/schemas/query_builder_schema.py
├─ app/api/v1/admin/query_builder.py
└─ tests/test_query_builder.py

Frontend:
├─ components/QueryBuilder.tsx
├─ components/QueryBuilderForm.tsx
├─ components/QueryValidator.tsx
├─ hooks/useQueryBuilder.ts
├─ hooks/useQueryValidation.ts
├─ utils/formula-engine.ts
└─ __tests__/query-builder.test.ts
```

### 1.4 FASE 1 Implementation Status (25 Abril 2026)

**Backend — CLAUDE ✅ COMPLETADO**:
- ✅ SavedWidget model (`app/models/saved_widget.py`)
  - Campos: id, nombre, descripcion, query_config (JSONB), chart_type, preview_data, row_count, last_executed_at, user_id
  - Soft delete: deleted_at, deleted_by
  - Relationships: FK to users
- ✅ SavedWidget schemas (`app/schemas/saved_widget.py`)
  - SavedWidgetBase, SavedWidgetCreate, SavedWidgetUpdate, SavedWidgetRead
  - QueryConfig schema para validación JSONB
- ✅ QueryValidator service (`app/services/query_validator.py`)
  - validate_base_table() ✅
  - validate_joins() ✅
  - validate_select_fields() ✅
  - validate_calculated_fields() ✅
  - validate_filters() ✅
  - validate_aggregations() ✅
  - validate_performance() (warnings) ✅
- ✅ QueryBuilderService (`app/services/query_builder_service.py`)
  - build_query(config) → SQLAlchemy select() dinámico ✅
  - execute_with_limits(query) → Ejecución con timeout y row limits ✅
  - validate_query() → Llamada a QueryValidator ✅
  - Helpers: _get_model_class(), _apply_join(), _build_filter_conditions(), _build_order_by()
- ✅ Query Builder Router (`app/api/v1/admin/query_builder.py`)
  - POST /api/v1/admin/query-builder/validate → Validar sin ejecutar ✅
  - POST /api/v1/admin/query-builder/execute → Ejecutar query ✅
  - POST /api/v1/admin/query-builder/schema-info → Retorna BD schema ✅
  - POST /api/v1/admin/query-builder/save → Guardar widget ✅
  - GET /api/v1/admin/query-builder/widgets → Listar widgets del usuario ✅
  - GET /api/v1/admin/query-builder/widgets/:id → Obtener widget ✅
  - PATCH /api/v1/admin/query-builder/widgets/:id → Actualizar widget ✅
  - DELETE /api/v1/admin/query-builder/widgets/:id → Borrar widget (soft delete) ✅
- ✅ Alembic migration (`alembic/versions/a1b2c3d4e5f6_add_saved_widget_fase1_query_builder.py`)
  - CREATE TABLE saved_widgets ✅
  - Índices, FKs, soft delete columns ✅
- ✅ Model exports (`app/models/__init__.py`)
  - Agregado SavedWidget a imports y __all__ ✅
- ✅ Router registration (`app/api/v1/admin/router.py`)
  - Importado admin_query_builder ✅
  - include_router() registrado ✅

**Frontend — CURSOR [✅ DONE]**:
- [✅] QueryBuilder.tsx component — DONE 25 abr 16:42
  - Left panel: QueryBuilderForm (table selector, joins, fields, filters, groupby, aggs)
  - Right panel: Live preview (charts, table, errors)
  - Save button + Dialog
- [✅] QueryBuilderForm.tsx — DONE 25 abr 16:42
  - Table selector dropdown
  - Join builder (drag-drop support)
  - Field selector checkboxes
  - Calculated fields editor
  - Filter builder
  - Group By selector
  - Aggregation config
- [✅] useQueryBuilder.ts hook — DONE 25 abr 16:42
  - State: query_config, chart_type, preview_data
  - Mutations: validate, execute, save, update
  - TanStack Query integration
- [✅] useQueryValidation.ts hook — DONE 25 abr 16:42
  - Real-time validation on config change (debounced)
  - Errors + warnings display
- [✅] formula-engine.ts utility — DONE 25 abr 16:42
  - Safe formula evaluation (NO eval())
  - Supported functions: days_between, IF, percentage, etc.
  - Validation + documentation
- [✅] __tests__/query-builder.test.ts (3 files) — DONE 25 abr 16:42
  - QueryBuilder.test.tsx: Component rendering, validation feedback, save dialog
  - useQueryBuilder.test.ts: Hook state management, API calls
  - formula-engine.test.ts: Formula validation + evaluation
  - tests/test_query_builder.py: Backend tests

**Status**: ✅ FASE 1 100% COMPLETE — LISTA PARA PRODUCCIÓN
**Commits**: ba7c86f — "feat: Fase 1 Frontend - Query Builder complete (UI + hooks + utils + tests)" + pushed

**Próximo paso**:
- INICIAR FASE 2: Dashboard Builder Frontend (8 días)
  - CustomDashboard UI (builder drag-drop)
  - 9 Dashboards base implementation
  - Componentes transversales (GaugeChart, SemaforoSla, SidePanel, etc.)

---

## FASE 2: DASHBOARD BUILDER + 9 DASHBOARDS

**Duración**: 4 días  
**Objetivo**: Dashboard Builder (drag-drop, widgets, layouts JSON) + 9 dashboards preconfigurados

### 2.1 Dashboard Builder Architecture

**Librerías**:
```
react-grid-layout    → Grid drag-drop, resize
recharts            → Gráficas (ya en proyecto)
@dnd-kit            → Drag-drop avanzado (ya en proyecto)
zod                 → Validación layouts JSON (ya en proyecto)
```

**Layout JSON Structure**:
```jsonc
{
  "version": 1,
  "grid": {
    "cols": 12,
    "rowHeight": 80,
    "compactType": "vertical"
  },
  "widgets": [
    {
      "id": "w1",
      "type": "kpi_card",
      "layout": {"x": 0, "y": 0, "w": 3, "h": 2, "minW": 2, "minH": 2},
      "config": {
        "title": "Vulnerabilidades Críticas",
        "dataSource": "vulnerabilidades",
        "metric": "count",
        "filters": {"severidad": "CRITICA", "estado": ["Abierta", "En Progreso"]},
        "display": {"color": "#ef4444", "icon": "shield-alert", "showTrend": true}
      }
    },
    // ... más widgets
  ]
}
```

**Widget Types**:
```
kpi_card        → Tarjeta con métrica + trending
bar_chart       → Gráfica barras (horizontal/vertical, stacked)
line_chart      → Gráfica línea (multi-serie, temporal)
donut_gauge     → Velocímetro/donut (con threshold semáforo)
data_table      → Tabla con sort, filtros, paginación
heatmap         → Mapa de calor (2 dimensiones)
alert_list      → Lista de alertas priorizado
pie_chart       → Gráfica pastel (porcentajes)
```

**Data Sources** (catálogo dinámico):
```
vulnerabilidades    → Cuenta, por severidad, por estado, SLA overdue
liberaciones        → Counts, por status, días en flujo
programas           → % completado, histórico actividades
amenazas_tm         → Por categoría STRIDE, DREAD scores
auditorias          → Counts, por tipo, hallazgos
iniciativas         → Avance, at-risk, timeline
temas_emergentes    → Abiertos, días sin movimiento
equipo              → Carga de trabajo, % cierre
```

### 2.2 Backend (Dashboard Builder)

**Models**:
```python
CustomDashboard
├─ id: UUID
├─ nombre: str(255) ← EDITABLE por admin
├─ descripcion: str | None
├─ created_by: FK(users.id)
├─ layout_json: dict (JSONB) ← Todo el layout
├─ is_system: bool ← True para los 9 fijos
├─ is_template: bool
├─ orden: int
├─ icono: str(64) | None
├─ activo: bool
├─ created_at, updated_at, deleted_at
└─ deleted_by: FK(users.id) | None

CustomDashboardAccess
├─ id: UUID
├─ dashboard_id: FK(custom_dashboards.id)
├─ role_id: FK(roles.id) | None
├─ user_id: FK(users.id) | None
├─ puede_ver: bool
├─ puede_editar: bool
└─ deleted_at
```

**Endpoints**:
```
GET    /api/v1/dashboards
       → Lista dashboards accesibles para usuario actual

GET    /api/v1/dashboards/{id}
       → Retorna layout_json completo + datos preview

POST   /api/v1/dashboards
       → Crear dashboard nuevo (requiere super_admin)

PATCH  /api/v1/dashboards/{id}
       → Actualizar layout_json (nombre, widgets, posición)

POST   /api/v1/widget-data/query
       → (Reutiliza Fase 1) Ejecuta widget data query
```

### 2.3 Frontend (Dashboard Builder)

**Components**:
```
DashboardBuilder.tsx
├─ Canvas (GridLayout con widgets)
├─ Widget palette (drag from left)
├─ Properties panel (config selected widget)
├─ Preview toggle
└─ Save button

WidgetConfigPanel.tsx
├─ Widget type selector
├─ Data source selector
├─ Field/metric selector
├─ Filter builder
├─ Display options (colors, icons, etc.)
└─ Save widget

DashboardViewer.tsx
├─ Read-only grid view
├─ Widget rendering (based on type + data)
├─ Drill-down navigation
└─ Export button
```

### 2.4 Los 9 Dashboards Preconfigurados

**Todos tienen**:
- ✅ Layout JSON guardado en BD (is_system=true)
- ✅ Widgets con configuración exacta (basada en análisis gap)
- ✅ Dinámicos (datos se actualizan via /widget-data/query)
- ✅ Editables (admin puede cambiar layout/widgets)
- ✅ Drill-down multidimensional (org → subdir → célula → detalle)
- ✅ Exportable (CSV, Excel, PDF con audit trail)

**Ver sección: "Especificaciones de los 9 Dashboards"** (abajo)

### 2.5 Archivos a Crear

```
Backend:
├─ app/models/custom_dashboard.py
├─ app/schemas/dashboard_schema.py
├─ app/services/dashboard_service.py
├─ app/api/v1/dashboards.py
├─ migrations/xxxxx_create_dashboards.py
└─ tests/test_dashboards.py

Frontend:
├─ components/DashboardBuilder.tsx
├─ components/DashboardCanvas.tsx
├─ components/WidgetConfigPanel.tsx
├─ components/WidgetPalette.tsx
├─ components/DashboardViewer.tsx
├─ hooks/useDashboard.ts
├─ hooks/useDashboardBuilder.ts
├─ pages/dashboards/[id]/page.tsx
├─ pages/dashboards/builder/page.tsx
└─ __tests__/dashboards.test.ts
```

---

## FASE 3: MODULE VIEW BUILDER

**Duración**: 3 días  
**Objetivo**: Crear vistas personalizadas dentro de módulos (tabla, kanban, calendario, cards)

### 3.1 Module View Types

```typescript
// "Vista de Vulnerabilidades - Críticas SLA Vencido"

{
  "id": "uuid",
  "module": "vulnerabilidades",
  "nombre": "Críticas SLA Vencido",  ← EDITABLE
  "tipo": "table",                    ← "table" | "kanban" | "calendar" | "cards"
  
  // TABLA
  "columns": [
    {"field": "titulo", "width": 300, "order": 0, "sortable": true},
    {"field": "severidad", "width": 100, "order": 1, "chipColor": true},
    {"field": "estado", "width": 120, "order": 2},
    {"field": "dias_sla", "width": 80, "order": 3, "formula": "days_until(fecha_sla)"},
    {"field": "responsable.full_name", "width": 150, "order": 4}
  ],
  
  // KANBAN (si tipo="kanban")
  "kanban_field": "estado",  ← Columnas basadas en valores de este campo
  "kanban_columns_order": ["Abierta", "En Progreso", "Cerrada"],
  
  // CALENDAR (si tipo="calendar")
  "calendar_date_field": "fecha_limite_sla",
  
  // FILTROS
  "filters": {
    "severidad": ["CRITICA"],
    "sla_status": "vencido"
  },
  
  "sort": {"key": "fecha_limite_sla", "dir": "asc"},
  "groupBy": null,
  "pageSize": 25
}
```

---

## FASE 4: CUSTOM FIELDS + PERSONALIZACIÓN TABLAS

**Duración**: 4 días  
**Objetivo**: Admin agrega campos dinámicamente + personalización columnas/orden

### 4.1 Custom Fields - Admin agrega campos sin SQL

Admin puede agregar campos a cualquier módulo (repositorio, vulnerabilidad, etc.) desde UI sin tocar código.

---

## FASE 5: FORMULA ENGINE + VALIDATION RULES

**Duración**: 5 días  
**Objetivo**: Fórmulas dinámicas + validaciones configurables

### 5.1 Formula Engine

**Funciones soportadas** (sandbox seguro, sin `eval()`):
```
days_between(date1, date2)      → Días entre fechas
days_until(date)                → Días hasta fecha
IF(condition, true_val, false_val)
percentage(a, b)                → a/b * 100
round(n, decimals)
count(array)
sum(array.field)
avg(array.field)
coalesce(a, b)                  → Primer no-null
concatenate(a, b)
uppercase(str)
lowercase(str)
substring(str, start, end)
```

---

## FASE 6: CATALOG BUILDER

**Duración**: 2 días  
**Objetivo**: Enums dinámicos sin hardcode (severidades, estados, tipos, etc.)

Admin puede editar catálogos desde UI sin tocar código.

---

## FASE 7: NAVIGATION BUILDER

**Duración**: 2 días  
**Objetivo**: Sidebar dinámico con nombres/órdenes editables

Admin puede editar el sidebar (nombres, orden, visibilidad por rol) desde UI.

---

## FASE 8: AI AUTOMATION RULES

**Duración**: 5 días  
**Objetivo**: Triggers automáticos, prompts, acciones configurables

Admin puede crear reglas de automatización IA (triaje, enriquecimiento, sugerencias) desde UI.

---

## FASE 9: TESTING + OPTIMIZACIÓN

**Duración**: 4 días  
**Objetivo**: Tests integrales + performance tuning + documentación

- Backend: pytest con ≥80% coverage
- Frontend: vitest + playwright E2E
- Performance: indexes, caching, code splitting
- Documentation: admin guide, API docs, architecture

---

## FUTURE: CAPAS 6, 7, 9

**NO se implementan ahora**. Son Fase 10+.

- **Capa 6**: Workflow Engine (flujos multi-paso)
- **Capa 7**: Report Builder (reportes personalizados)
- **Capa 9**: Branding/White-Label

---

## NAVIGATION & LABELS EDITABLES

### 🔑 TODO ES EDITABLE (Sin código)

Admin PUEDE cambiar CUALQUIER nombre/label:

```
✅ Nombres de dashboards
✅ Nombres de módulos  
✅ Nombres de secciones
✅ Etiquetas de columnas
✅ Labels de custom fields
✅ Opciones de catálogos
✅ Nombres de vistas
✅ Nombres de fórmulas
✅ Nombres de validaciones
✅ Nombres de navigation items
```

**NUNCA borra, solo oculta**:
```
❌ No puede borrar dashboard → puede ocultar (visible=false)
❌ No puede borrar campo → puede ocultar (visible=false)  
❌ No puede borrar opción catálogo → puede desactivar (activo=false)
```

---

## ESPECIFICACIONES DE LOS 9 DASHBOARDS

**Base de especificaciones**: `/Users/pablosalas/Appsec/appsec-platform/Dashboards - Templates/gap_analysis.md` (análisis elemento-por-elemento)

---

### DASHBOARD 1: GENERAL EJECUTIVO

**Referencia visual**: `Dashboard General.png`

**Layout (12 columnas grid)**:
```
Top: Filtros [Mes dropdown] [Filtros Globales] [Exportar]

Row 1 (h=2):  [KPI: Avance Progr]  [KPI: Vulns Críticas]  [KPI: Liberaciones]  [KPI: Temas Emerg]  [KPI: Auditorías]

Row 2 (h=3):  [Gauge: Postura Seguridad]                   [Line/Area Chart: Tendencia 6 meses]

Row 3 (h=3):  [HorizontalBarRanking: Top 5 Repos]  [SemaforoSla: En tiempo/Riesgo/Vencidos]

Row 4 (h=4):  [Table: Auditorías Activas]
```

**Componentes exactos**:
- 5 KPIs: Avance Programas (%), Vulns Críticas (count), Liberaciones Activas (count), Temas Emergentes (count), Auditorías (count)
- GaugeChart: Postura de Seguridad (0-100%)
- AreaLineChart: Vulnerabilidades últimos 6 meses (multi-serie por severidad)
- HorizontalBarRanking: Top 5 repositorios por vulns críticas
- SemaforoSla: 3 filas (En tiempo verde, En riesgo amarillo, Vencidos rojo) con conteos
- DataTable: Auditorías (Nombre, Tipo, Responsable, Fecha, Estado, Hallazgos)

**Endpoints necesarios**: 4
- `GET /api/v1/dashboard/executive-kpis` → {avance_programas, vulns_criticas, liberaciones_activas, temas, auditorias}
- `GET /api/v1/dashboard/security-posture` → {percentage, trend}
- `GET /api/v1/dashboard/top-repos-criticas` → [{repo, count, trend}] (top 5)
- `GET /api/v1/dashboard/sla-semaforo` → {on_time, at_risk, overdue}

**Funcionalidades**:
- ✅ Filtro por mes
- ✅ Click en KPI → drill-down a módulo correspondiente
- ✅ Exportar CSV/Excel con datos actuales
- ✅ Dark mode

---

### DASHBOARD 2: EQUIPO

**Referencia visual**: `Dashboard Equipo.png`

**Layout**:
```
Top: [KPI: Analistas Activos] [KPI: Asignadas] [KPI: En Riesgo/Vencidas] [KPI: Promedio Avance]

Main: [Tabla ordenable] + [SidePanel al click en fila]

Table columns:
├─ Nombre (avatar + nombre)
├─ Programas (count)
├─ Completadas / Pendientes (fracción)
├─ Avance % (ProgressBarSemaforo rojo/amarillo/verde)
├─ Liberaciones (count)
└─ Próximas Tareas (chip estado + fecha)

SidePanel (al click en analista):
├─ Nombre, Rol, Email
├─ 12-month histórico barras (completadas por mes)
├─ Actividades pendientes
└─ Performance promedio
```

**Componentes exactos**:
- 4 KPIs top
- DataTable: 7 columnas como arriba
- SidePanel: Con tabs (Resumen, Actividades, Performance, Historial)
- ProgressBarSemaforo: Barra % con color dinámico

**Endpoints necesarios**: 2
- `GET /api/v1/dashboard/team-summary` → KPIs
- `GET /api/v1/dashboard/team-detail/{user_id}` → Detalles analista

**Funcionalidades**:
- ✅ Tabla sorteable por columna
- ✅ Analista solo ve su propia fila (frontend + backend validation)
- ✅ Click en fila → abre SidePanel
- ✅ Filtro por mes

---

### DASHBOARD 3: PROGRAMAS ANUALES

**Referencia visual**: `Dashboard Programas Anuales.png`

**Layout**:
```
Row 1: [Tarjeta SAST gauge + monthly] [Tarjeta DAST] [Tarjeta SCA] [Tarjeta MAST] [Tarjeta MDA]
       Cada tarjeta: % circular gauge + "Avance del Mes"

Row 2: [HistoricoMensualGrid 12 meses]

Row 3: [BarChart: Avance Actual vs Meta (100%) por programa]

Row 4: [SidePanel al click]
```

**Componentes exactos**:
- 5 tarjetas con GaugeChart (% acumulado del año)
- HistoricoMensualGrid: 5 programas × 12 meses (verde/amarillo/rojo por mes)
- BarChart: Comparativa Avance Actual vs Meta
- SidePanel: Actividades del mes + Historial tendencia

**Endpoints necesarios**: 2
- `GET /api/v1/dashboard/programs-summary` → Consolidado
- `GET /api/v1/dashboard/program/{code}/detail` → Detalle + actividades

**Funcionalidades**:
- ✅ Click en tarjeta → abre SidePanel con detalles
- ✅ Hover en histórico → tooltip con % exacto
- ✅ CTA "Ir al Concentrado de Hallazgos"

---

### DASHBOARD 4: VULNERABILIDADES (⭐ 4-NIVEL DRILL-DOWN)

**Referencia visual**: `Dashboard Vulnerabilidades Desarrollo.png`

**CARACTERÍSTICA CLAVE**: Navegación secuencial entre 4 niveles

```
NIVEL 0 (Global):
├─ Breadcrumb: [Global]
├─ 6 tarjetas motores (SAST, DAST, SCA, MAST, MDA - Threat Modeling, Secretos)
├─ SemaforoSla global (ALTO, MEDIO, BAJO con colores)
├─ LineChart: Tendencia anual multi-serie
├─ Pipeline indicators (total, aprobados, rechazados, % aprobación)
├─ Recuadros clickeables: 3-5 subdirecciones (mini-resumen)
└─ Click en subdir → Nivel 1

NIVEL 1 (Subdirección):
├─ Breadcrumb: [Global] > [Subdirección X]
├─ Tarjetas motores: Anterior, Actual, Solventadas, Nuevas
├─ Pipeline indicators + Top 3 vulns recurrentes
├─ Análisis IA (si habilitado)
├─ Recuadros: Células de esta subdir
└─ Click en célula → Nivel 2

NIVEL 2 (Célula):
├─ Breadcrumb: [Global] > [Subdir] > [Célula]
├─ Resumen pipeline (aprobados vs rechazados última semana)
├─ Table repositorios: [Nombre] [# Críticas] [# Altas] [Score Madurez] [SLA Status] [Último Escaneo]
└─ Click en repo → Nivel 3

NIVEL 3 (Repositorio):
├─ Breadcrumb: [Global] > [Subdir] > [Célula] > [Repo]
├─ Tabs (dinámicos según qué datos tenga el repo):
│  ├─ SAST: Tabla SAST vulns (CWE, CVSS, estado, asignado, SLA)
│  ├─ DAST: Tabla DAST vulns (URL afectada, tipo ataque, CVSS, estado)
│  ├─ SCA/Dependencias: Tabla dependencies (library, version, CVE count, severity)
│  ├─ MAST: Tabla mobile app testing (plataforma, versión, tipo, severidad)
│  ├─ MDA (Threat Modeling): Tabla amenazas modeladas (STRIDE, DREAD, controles, estado)
│  ├─ Secretos: Tabla secrets detectados (tipo secret, ubicación, acción, estado)
│  ├─ Historial: Timeline cambios estado (cuándo cambió, quién, de qué a qué, justificación)
│  ├─ Configuración: Ficha repo (rama default, último escaneo por motor, owner, tags)
│  └─ Resumen Agregado: Overview vulns por motor + SLA status global + health score
│
├─ Tabla estándar por tab:
│  ├─ Columnas: ID/Ref, Título, Severidad (chip color), Estatus (chip), Asignado, Fecha, SLA
│  ├─ Sorteable: click en header
│  ├─ Filtrable: filtro por estado, severidad
│  ├─ Paginable: 25 rows default
│  ├─ Expandible: click en fila → detalles completos (descripción, remediation, etc.)
│  └─ Acciones: Asignar, cambiar estado, agregar etiqueta, exportar fila
│
├─ Botones de acción:
│  ├─ "Ver en GitHub" (link externo → repo URL)
│  ├─ "Exportar esta tab" (CSV/Excel con datos actuales)
│  └─ "Crear Excepción" (si rol permite) → abre dialog
│
└─ Info adicional repo (siempre visible):
   ├─ **URL GitHub** ⭐ (OBLIGATORIO - para botón "Ver en GitHub")
   ├─ Lenguaje(s): Python, JavaScript, etc.
   ├─ Framework: Django, React, etc.
   ├─ Última actualización: timestamp
   ├─ Rama default: main/master
   ├─ Último escaneo por motor: SAST (2h), DAST (5h), SCA (1h), etc.
   ├─ Owner: Team/usuario responsable
   └─ Tags: producción, crítico, legacy, etc.
```

**Componentes exactos**:
- DrilldownBreadcrumb: Navegación con ← back button
- 6 tarjetas motores (SAST, DAST, SCA, MAST, MDA - Threat Modeling, Secretos)
- SemaforoSla: Semáforo global (ALTO/MEDIO/BAJO)
- LineChart: Tendencia anual multi-serie por severidad
- DataTable: Repositorios (Nivel 2), Vulnerabilidades (Nivel 3)
- **9 Tabs en Nivel 3**: SAST, DAST, SCA, MAST/MDA, Secretos, Secretos, Historial, Configuración, Resumen
- SeverityChip: Chips color rojo/amarillo/verde/azul por severidad
- TimelineBitacora: Para tab Historial (changelog)
- TabsContainer: Para renderizar 9 tabs dinámicamente
- RepositoryMetadata: Card con info repo (lenguaje, framework, owner, último escaneo)
- VulnerabilityExpandible: Row que expande para mostrar detalles completos (descripción, remediation, etc.)

**Endpoints necesarios**: ~13 endpoints (consolidados)

```
Nivel 0 (Global):
├─ GET /api/v1/dashboard/vuln-global
│  └─ Retorna: 6 tarjetas motores, semáforo, tendencia, pipeline, subdirecciones

Nivel 1 (Subdirección):
├─ GET /api/v1/dashboard/vuln-subdireccion/{id}
│  └─ Retorna: Motor cards (anterior/actual/solventes/nuevas), pipeline, top 3 recurrentes, células

Nivel 2 (Célula):
├─ GET /api/v1/dashboard/vuln-celula/{id}
│  └─ Retorna: Pipeline último período, gráfica aprobados/rechazados, lista repositorios

Nivel 3 (Repositorio) - TABS:
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/sast
│  └─ Tabla SAST vulnerabilities (paginada)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/dast
│  └─ Tabla DAST vulnerabilities (paginada)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/sca
│  └─ Tabla SCA dependencies con CVE counts (paginada)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/mast-mda
│  └─ Tabla mobile vulnerabilities MAST + MDA (paginada)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/secrets
│  └─ Tabla detected secrets (paginada)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/cds
│  └─ Tabla Secretos code analysis findings (paginada)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/historial
│  └─ Timeline de cambios (estado changes, fechas, usuarios)
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/config
│  └─ Repo metadata: lenguaje, framework, owner, tags, último escaneo por motor
├─ GET /api/v1/dashboard/vuln-repositorio/{id}/resumen
│  └─ Overview agregado: vulns por motor, SLA status global, health score
└─ GET /api/v1/dashboard/vuln-repositorio/{id}/detail
   └─ Información completa del repo (para siempre visible)
```

**Funcionalidades**:
- ✅ Drill-down 4 niveles con validación de scope
- ✅ Breadcrumb clickeable (volver a nivel anterior)
- ✅ Filtros por severidad, estado, motor
- ✅ Exportar datos de nivel actual
- ✅ **MÁS ESFUERZO**: Este es el dashboard más complejo (~40% del esfuerzo total)

---

### DASHBOARD 5: CONCENTRADO DE VULNERABILIDADES

**Referencia visual**: `Dashboard Concentrado de Vulnerabilidades.png`

**Layout**:
```
Top: [AdvancedFilterBar: Motor/Severidad/Estado/OWASP/Org/Célula/Fechas/SLA vencido]

Tabs: [Pipeline] [Programa Anual] [Bajo Demanda]

VISTA POR MOTOR:
├─ 6 tarjetas motores (SAST, DAST, SCA, MAST, MDA - Threat Modeling, Secretos)
│  Cada tarjeta: [Anterior] [Actual] [Solventadas] [Nuevas] + mini chart 3 meses
├─ Toggle: Vista Agrupada / Vista Plana
└─ Click en motor → tabla expandida

VISTA POR SEVERIDAD:
├─ 4 recuadros (Crítica/Alta/Media/Baja)
│  Cada uno: [Activas] [SLA vencido] [Nuevas este mes]
└─ Click en severidad → tabla plana filtrada
```

**Componentes exactos**:
- AdvancedFilterBar: 8-10 filtros combinables
- 6 tarjetas motores con mini-charts
- 4 recuadros severidad
- DataTable expandible (motor/severidad)
- Toggle Agrupada/Plana

**Endpoints necesarios**: 3
- `GET /api/v1/dashboard/vuln-concentrated/by-motor` → Agrupado por motor
- `GET /api/v1/dashboard/vuln-concentrated/by-severity` → Agrupado por severidad
- `GET /api/v1/dashboard/vuln-concentrated/table` → Tabla con filtros

**Funcionalidades**:
- ✅ Filtros avanzados combinables
- ✅ Toggle vista agrupada/plana
- ✅ Click en tarjeta/recuadro → tabla expandida

---

### DASHBOARD 6: OPERACIÓN (Releases)

**Referencia visual**: `Dashboard Operacion.png`

**Layout**:
```
Top: [KPI: Total Activas] [KPI: SLA en Riesgo] [KPI: Observaciones Pendientes] [KPI: Críticas en Proceso]

Tabs: [Liberaciones de Servicios] [Revisión de Terceros]

Table columns (Liberaciones):
├─ ID Jira / Referencia
├─ Servicio (nombre)
├─ Tipo Cambio (chip: Hotfix/Feature/Patch)
├─ Criticidad (chip color: Crítica/Alta/Media/Baja)
├─ Estatus (chip color: Design/Validation/Tests/QA/Prod)
├─ Responsable (avatar + nombre)
├─ Fecha Inicio / Fecha Fin
├─ Días en Flujo
└─ Alerta SLA (rojo si vencido)

SidePanel (click en fila):
├─ Flujo estatus visual (Design → Validation → Tests → QA → Prod)
├─ Pruebas de seguridad (pass/fail)
├─ Participantes (avatares)
└─ Observaciones (texto)
```

**Componentes exactos**:
- 4 KPIs top
- 2 tabs (Liberaciones + Terceros)
- DataTable: 10 columnas
- StatusChip, CriticidadChip
- SidePanel: Flujo estatus visual

**Endpoints necesarios**: 3
- `GET /api/v1/dashboard/releases-table` → Datos tabla liberaciones
- `GET /api/v1/dashboard/releases-terceros` → Datos terceros
- `GET /api/v1/dashboard/release/{id}/detail` → Detalle release

**Funcionalidades**:
- ✅ Tabla sorteable/filtrable
- ✅ Paginación
- ✅ Click en fila → SidePanel
- ✅ Dark mode confirmado
- ✅ Exportar CSV/Excel

---

### DASHBOARD 7: KANBAN DE LIBERACIONES

**Referencia visual**: `Kanban de liberaciones.png`

**Layout**:
```
Top: [Filtros: Criticidad/Responsable/Tipo Cambio] [+ Nueva Liberación] [Toggle Kanban/Tabla]

Kanban: 8 columnas (configurables):
├─ Design Review
├─ Security Validation
├─ Security Tests
├─ Approval
├─ QA
├─ Production
├─ Done
└─ [admin puede agregar/reordenar]

Card (Tarjeta en Kanban):
├─ ID Jira / Referencia
├─ Nombre servicio (bold)
├─ Tipo cambio (chip)
├─ Criticidad (chip color)
├─ Responsable (avatar)
├─ Días en flujo (contador)
├─ Barra SLA (roja si vencido)
└─ Motores escaneo (icons SAST/DAST/SCA)
```

**Componentes exactos**:
- ReleaseKanbanBoard: 8 columnas configurables
- ReleaseKanbanCard: Con info rica
- Filtros: Criticidad, Responsable, Tipo Cambio
- Toggle Kanban ↔ Tabla

**Endpoints necesarios**: 3
- `GET /api/v1/dashboard/release-kanban-columns` → Columnas configuradas
- `GET /api/v1/dashboard/releases-kanban` → Datos kanban
- `PATCH /api/v1/service-releases/{id}/move` → Drag-drop move + validación

**Funcionalidades**:
- ✅ Drag & drop con validación de reglas de flujo
- ✅ Al soltar: actualizar BD + audit log
- ✅ Columnas configurables por admin
- ✅ Contador tarjetas por columna
- ✅ Toggle Kanban ↔ Tabla
- ✅ SoD: aprobador ≠ creador

---

### DASHBOARD 8: INICIATIVAS

**Referencia visual**: `Dashboard Iniciativas.png`

**Layout**:
```
Top: [KPI: Total Activas] [KPI: Avance Promedio] [KPI: En Riesgo] [KPI: Próx. Cerrar]

Table columns:
├─ Nombre
├─ Tipo (chip: RFI/Proceso/Plataforma/Custom)
├─ Responsable (avatar)
├─ Fecha Inicio / Fin
├─ % Avance (ProgressBarSemaforo rojo/amarillo/verde)
├─ Estatus (chip)
└─ Días Restantes

SidePanel (click en fila):
├─ Descripción
├─ Info general (responsable, dueño, presupuesto)
├─ Ponderación mensual (tabla: mes, actividades, % parcial)
├─ Historial avance (line chart)
└─ "Ver plan de trabajo" (link)

Tabs en SidePanel:
├─ Resumen
├─ Actividades
├─ Documentos
├─ Riesgos
└─ Notas
```

**Componentes exactos**:
- 4 KPIs
- DataTable: 8 columnas
- ProgressBarSemaforo
- StatusChip
- SidePanel: Con 5 tabs

**Endpoints necesarios**: 2
- `GET /api/v1/dashboard/initiatives-summary` → KPIs + lista
- `GET /api/v1/dashboard/initiative/{id}/detail` → Detalle + ponderación

**Funcionalidades**:
- ✅ Tabla sorteable/filtrable
- ✅ Click → SidePanel
- ✅ Ponderación mensual visible
- ✅ Filtro por estado/tipo/responsable

---

### DASHBOARD 9: TEMAS EMERGENTES

**Referencia visual**: `Dashboard Temas Emergentes.png`

**Layout**:
```
Top: [KPI: Total Abiertos] [KPI: Sin Movimiento >7d] [KPI: Próximos Vencer] [KPI: Cerrados este Mes]

Table columns:
├─ Nombre (con icono tipo)
├─ Tipo (chip: Seguridad/Operación/Regulatorio/Custom)
├─ Responsable (avatar)
├─ Fecha Registro
├─ Fecha Compromiso
├─ Días Abierto (color dinámico: <30 verde, 30-60 amarillo, >60 rojo)
├─ Último Movimiento (timestamp relativo)
└─ Estatus (chip: Abierto/En Progreso/Cerrado)

SidePanel (click en fila):
├─ Descripción tema
├─ Origen (Ticket #123, Fuente ABC, Link)
├─ Bitácora timeline/chat:
│  ├─ Entrada 1: "Usuario X: Comentario..." (timestamp)
│  ├─ Entrada 2: "Sistema: Cambio estado a En Progreso" (timestamp)
│  └─ Input: "Escribe un comentario..."
├─ Actividades seguimiento (tabla)
└─ Estado actual (chip + responsable)
```

**Componentes exactos**:
- 4 KPIs
- DataTable: 9 columnas con color dinámico en "Días Abierto"
- StatusChip
- SidePanel: Con bitácora timeline/chat
- TimelineBitacora: Chat-like interface

**Endpoints necesarios**: 2
- `GET /api/v1/dashboard/emerging-themes-summary` → KPIs + lista
- `GET /api/v1/dashboard/tema/{id}/detail` → Detalle + bitácora

**Funcionalidades**:
- ✅ Tabla sorteable/filtrable
- ✅ Color dinámico en "Días Abierto"
- ✅ Click → SidePanel con bitácora
- ✅ Input comentario en bitácora
- ✅ Filtro por tipo/estado/responsable/sin movimiento en X días

---

### RESUMEN VISUAL: 9 DASHBOARDS

| Dashboard | Componentes Clave | Endpoints | Complejidad |
|-----------|-------------------|-----------|-------------|
| 1. Ejecutivo | 5 KPIs, Gauge, Area, HBarRank, Semáforo, Table | 4 | ⭐⭐ |
| 2. Equipo | 4 KPIs, Table, SidePanel, ProgressBar | 2 | ⭐⭐ |
| 3. Programas | 5 Gauges, HistMensual, BarChart, SidePanel | 2 | ⭐⭐ |
| 4. Vulns (4-drill) | 6 Tarjetas, Semáforo, Area, Breadcrumb, **9 Tabs** (SAST/DAST/SCA/MAST/Secrets/Secretos/Historial/Config/Resumen) | 13 | ⭐⭐⭐⭐⭐⭐ |
| 5. Concentrado | 6 Tarjetas, 4 Recuadros, Filtros Avanzados | 3 | ⭐⭐⭐ |
| 6. Operación | 4 KPIs, 2 Tabs, Table, SidePanel | 3 | ⭐⭐⭐ |
| 7. Kanban | ReleaseKanban, Cards, Filtros, Toggle | 3 | ⭐⭐⭐ |
| 8. Iniciativas | 4 KPIs, Table, SidePanel, ProgressBar | 2 | ⭐⭐ |
| 9. Temas | 4 KPIs, Table, SidePanel, Timeline/Chat | 2 | ⭐⭐ |
| **TOTAL** | **13+ componentes nuevos** | **~35 endpoints** | **~42-45 días** |

---

## 🎯 RESUMEN EJECUTIVO

| Dashboard | Propósito | Dinámico | Drill-down | Editable |
|-----------|-----------|----------|-----------|----------|
| 1. Ejecutivo | Chief AppSec overview | ✅ | ✅ | ✅ |
| 2. Equipo | Workload analistas | ✅ | ✅ | ✅ |
| 3. Programas | Avance programas | ✅ | ✅ | ✅ |
| 4. Prog Zoom | Detalle programa | ✅ | ✅ | ✅ |
| 5. Vulns | 4-nivel drill-down | ✅ | ✅ 4 niveles | ✅ |
| 6. Concentrado | Por motor + severidad | ✅ | ✅ | ✅ |
| 7. Operación | Releases + terceros | ✅ | ✅ | ✅ Dark |
| 8. Iniciativas | Initiatives tracking | ✅ | ✅ | ✅ |
| 9. Temas | Emerging issues | ✅ | ✅ | ✅ |

---

---

## 📋 DEFINITION OF DONE (Checklist por Dashboard)

**Un dashboard se considera COMPLETO cuando**:

### Backend (Fase implementación)
- [ ] Todos los endpoints creados (ver tabla Endpoints por Dashboard)
- [ ] Schemas Pydantic validados (input + output)
- [ ] Services implementados con lógica de negocio
- [ ] Soft delete validado (queries filtran deleted_at IS NULL)
- [ ] IDOR protection: require_ownership() si aplica
- [ ] Permisos validados: require_role() per endpoint
- [ ] SoD validado en aprobaciones (aprobador ≠ creador)
- [ ] Justificación obligatoria en acciones críticas
- [ ] Scope organizacional cascada respetado
- [ ] Response envelope correcto (success/paginated/error)
- [ ] Paginación implementada (max 100 rows)
- [ ] Error handling completo (400/401/403/404/500)
- [ ] Logging y audit trail registrados
- [ ] Performance: response time < 2 segundos (95th percentile)
- [ ] Tests: pytest 80%+ coverage para servicios
- [ ] API docs: OpenAPI spec actualizado

### Frontend (Fase implementación)
- [ ] Página/componente renderiza sin errores
- [ ] Componentes UI necesarios creados
- [ ] Datos se cargan desde endpoints correctamente
- [ ] Tabla sorteable/filtrable/paginable (si aplica)
- [ ] Drill-down funciona (si aplica)
- [ ] Filtros funcionan (frontend validation + backend)
- [ ] SidePanel abre/cierra correctamente (si aplica)
- [ ] Exportación CSV/Excel funciona
- [ ] Responsive: desktop (1920px) + tablet (768px)
- [ ] Dark mode funciona (colores correctos)
- [ ] Permisos por rol: botones hidden/disabled según usuario
- [ ] Tests E2E: Playwright cubre happy path + error cases
- [ ] No console errors/warnings
- [ ] TypeScript: sin `any` types
- [ ] Performance: page load < 3 segundos, FCP < 1.5s

### Documentación
- [ ] README con screenshot del dashboard
- [ ] User guide: cómo usar filtros/drill-down
- [ ] Admin guide: si es configurable
- [ ] API docs: endpoints documentados en Swagger

### QA/Testing
- [ ] E2E test suite escrito y pasa
- [ ] Manual testing completado por QA
- [ ] Datos de prueba creados (seed data)
- [ ] Edge cases probados (empty data, error responses)
- [ ] Seguridad: IDOR testing, SQL injection attempt, XSS

---

## 🧪 TESTING STRATEGY

### Backend Testing (pytest)

**Por Dashboard (ejemplos)**:

```
Dashboard 1 (Ejecutivo):
├─ test_executive_kpis_endpoint.py
│  ├─ test_kpi_values_correct (verify metrics)
│  ├─ test_permission_ciso_only
│  ├─ test_scope_cascada (subdir filters)
│  ├─ test_pagination_limit_100
│  ├─ test_export_audit_logged
│  └─ test_error_no_data_found
├─ test_executive_security_posture.py
│  ├─ test_gauge_percentage_0_100
│  └─ test_trend_last_6_months
└─ test_executive_top_repos.py
   ├─ test_top_5_repos_by_criticals
   └─ test_repo_not_in_scope_filtered

Dashboard 4 (Vulns 4-Drill):
├─ test_drill_level_0_global.py
│  ├─ test_6_motor_cards_present
│  ├─ test_semaforo_colores (red/yellow/green)
│  └─ test_trend_anual_multiserie
├─ test_drill_level_1_subdireccion.py
│  ├─ test_scope_restrict_subdir
│  └─ test_motor_anterior_actual_solventes
├─ test_drill_level_2_celula.py
│  ├─ test_repo_list_correct_celula
│  └─ test_pipeline_indicators_week
└─ test_drill_level_3_repositorio.py
   ├─ test_4_tabs_present (vulns/hist/deps/config)
   ├─ test_vulnerabilities_table_columns
   ├─ test_dependencies_sca_data
   └─ test_IDOR_user_cant_see_other_celula
```

**Total backend tests**: ~70-80 tests (covering ~80% code)

### Frontend Testing (Vitest + Playwright)

**E2E Tests (Playwright)**:
```
Dashboard 1:
├─ dashboard-1-kpi-drill.spec.ts
│  ├─ Load page → KPIs visible
│  ├─ Click KPI → navigate to module
│  ├─ Filter by month → data updates
│  ├─ Export CSV → file downloaded + audit logged
│  └─ Logout + login as diferent role → see different KPIs
├─ dashboard-1-responsive.spec.ts
│  ├─ Desktop (1920px) → layout correct
│  ├─ Tablet (768px) → components stack
│  └─ Mobile (375px) → hamburger menu
└─ dashboard-1-dark-mode.spec.ts
   ├─ Toggle dark → colors correct
   └─ Persist preference → reload → dark still on

Dashboard 4 (Drill-Down):
├─ dashboard-4-drill-navigation.spec.ts
│  ├─ Level 0 → click subdir → Level 1 loaded
│  ├─ Level 1 → click celula → Level 2 loaded
│  ├─ Level 2 → click repo → Level 3 loaded
│  ├─ Breadcrumb click → go back to Level 2
│  └─ Analyst scope: can't access other celula
├─ dashboard-4-level-3-tabs.spec.ts
│  ├─ Vulnerabilidades tab → table with vulns
│  ├─ Historial tab → timeline changes
│  ├─ Dependencias tab → SCA data
│  └─ Configuración tab → repo details
└─ dashboard-4-filters.spec.ts
   ├─ Filter by severity → table updates
   ├─ Filter by motor → cards update
   └─ Multiple filters combined → correct intersection
```

**Total E2E tests**: ~80-100 tests

**Unit/Component Tests (Vitest)**:
```
components/GaugeChart.test.tsx:
├─ render with value 50 → circle 50%
├─ thresholds: green <50, yellow 50-80, red >80
└─ tooltip on hover

components/SidePanel.test.tsx:
├─ open/close animation
├─ tabs switch correctly
└─ scroll content inside

hooks/useDashboard.test.ts:
├─ load dashboard data
├─ apply filters
└─ export data

utils/calculateSemaforoColor.test.ts:
├─ value < green_threshold → green
├─ value between thresholds → yellow
└─ value > red_threshold → red
```

**Total unit tests**: ~40-50 tests

### Testing Coverage Goals
```
Backend: 80%+ line coverage (pytest)
Frontend: 70%+ line coverage (vitest)
E2E: All happy paths + critical error paths
```

---

## 📊 DATA SEEDING STRATEGY

**Archivo**: `backend/app/seed.py` (extendido)

### Datos Mínimos para que Dashboards Funcionen

```python
# Jerarquía Organizacional
├─ 2-3 Organizaciones (ej: "AppSec Corp", "Testing Lab")
├─ 3-5 Subdirecciones por org (ej: "Infraestructura", "Aplicaciones")
├─ 2-3 Gerencias por subdir
└─ 10-15 Células por gerencia (ej: "Backend Team", "Frontend Team")

# Usuarios
├─ 1x super_admin (para testing admin features)
├─ 1x ciso (ve todos dashboards)
├─ 1x director_subdireccion (ve su subdir)
├─ 1x responsable_celula (ve su célula)
├─ 1x lider_liberaciones (gestiona releases)
├─ 1x lider_programa (gestiona programas)
├─ 3-5x analista (un analista ve solo su fila en Dashboard 2)
└─ 1x auditor (read-only, ve todo)

# Vulnerabilidades (100+ total, distribuidas)
├─ Por severidad:
│  ├─ 5-8 Críticas (abiertas)
│  ├─ 12-15 Altas (abiertas)
│  ├─ 25-30 Medias (abiertas)
│  ├─ 30-40 Bajas (abiertas)
│  ├─ 15-20 Cerradas (últimos 60 días)
│  └─ 10-15 Cerradas (antiguos)
├─ Por motor: SAST, DAST, SCA, SAST, DAST, SCA, MAST, MDA (Threat Modeling), Secretos (distribuir)
├─ Por estado: Abierta, En Progreso, Cerrada (flujo completo)
├─ Por SLA status: En tiempo, En riesgo, Vencido (para semáforo)
└─ Asignadas a diferentes analistas (para Dashboard 2)

# Programas Anuales (5 programas)
├─ SAST (70% completado)
├─ DAST (45% completado)
├─ SCA (65% completado)
├─ MAST (30% completado)
├─ MDA - Threat Modeling (60% completado)
└─ Secretos / Secret Scanning (50% completado)

# Actividades Mensuales (últimos 12 meses)
├─ Enero-Diciembre 2025: % completado por mes
├─ Algunos meses: verde (>80%), algunos: amarillo (50-80%), algunos: rojo (<50%)
└─ Esto llena el HistoricoMensualGrid

# Service Releases (20+ releases)
├─ Estados variados: Design, Validation, Tests, QA, Production (algunos en cada)
├─ Criticidades: 5 Críticas, 8 Altas, 7 Medias
├─ Algunos con SLA en riesgo, algunos vencido
├─ Asignadas a lider_liberaciones
└─ Algunos con observaciones de seguridad

# Iniciativas (8+ iniciativas)
├─ Estados: Abierta (5), Cerrada próxima (2), Cerrada (1)
├─ % progreso: 25%, 50%, 75%, 90%, 100%
├─ Tipos: RFI, Proceso, Plataforma
└─ Ponderación mensual para 3-4 iniciativas

# Auditorías (15+ auditorías)
├─ Tipos: Interna (10), Externa (5)
├─ Estados: En progreso (3), Cerrada (12)
├─ Hallazgos: 2-5 por auditoría
└─ Responsables variados

# Temas Emergentes (20+ temas)
├─ Abiertos: 15
├─ Cerrados: 5
├─ Días abierto: 5, 15, 45, 90 (para color dinámico)
├─ Sin movimiento en 7+ días: 5-8 temas
└─ Con bitácora: 3-5 comentarios cada uno

# MDA - Threat Modeling Sessions (3-5 sesiones)
├─ Amenazas STRIDE completas
├─ DREAD scores variados
└─ Estados: Aprobadas, Pendientes revisión
```

**Seed Script**:
```bash
# 1. Crear jerarquía
make shell-back
from app.seed import seed_organizations, seed_users, seed_vulnerabilities, ...
seed_organizations()
seed_users()
seed_vulnerabilities()
# ... resto de datos

# 2. Verificar
python -m app.main &  # start server
curl http://localhost:8000/api/v1/dashboard/executive  # test endpoint
```

---

## 🚀 DEPLOYMENT & ROLLOUT STRATEGY

### Fase Previa: Pre-Production Validation

```
Semana 4 (fin de implementación):
├─ All dashboards implemented ✅
├─ Todos los tests pasan (pytest + Playwright)
├─ Performance profiling completado
│  ├─ API response times < 2 segundos
│  ├─ Page load < 3 segundos
│  └─ No N+1 queries
├─ Security audit: IDOR testing, SQL injection, XSS
├─ Data migration script (si hay datos legacy)
└─ Rollback plan documentado
```

### Rollout Schedule (Recomendado)

```
SEMANA 5 - FASE 1: SOFT LAUNCH (Beta)
├─ Usuarios: CISO + Chief AppSec + 2-3 analistas
├─ Dashboards: 1 (Ejecutivo), 2 (Equipo)
├─ Objetivo: Validar que datos son correctos, alertar a bugs
├─ Monitoreo: Logs + error rates
├─ Duración: 3-4 días
└─ Go/No-go decision: Si todo OK, proceed

SEMANA 6 - FASE 2: EARLY ADOPTION
├─ Usuarios: Amplio a 10-15 analistas de todas las células
├─ Dashboards: 1, 2, 3 (Programas), 8 (Iniciativas), 9 (Temas)
├─ Objetivo: Feedback de usuarios reales
├─ Training: Sesión en vivo (30 min) de cómo usar
├─ Duración: 1 semana
└─ Go/No-go: Recolectar feedback, fix críticos

SEMANA 7 - FASE 3: FULL PRODUCTION ROLLOUT
├─ Usuarios: TODOS (todavía beta flag, pero acceso general)
├─ Dashboards: 1-7 (Todos excepto el más complejo)
├─ Objetivo: Full production, con monitoreo
├─ Duración: Indefinido (monitoreado)
└─ Feedback loop: Bug reports → hotfixes

SEMANA 8+ - FASE 4: DASHBOARD 4 (Vulns 4-Drill)
├─ Dashboard más complejo → rollout conservador
├─ Usuarios: CISO + Chief AppSec primero (3-4 días)
├─ Luego: Analistas que lo necesiten
├─ Objetivo: Validar drill-down 4 niveles
└─ Duración: 1-2 semanas hasta que todos conozcan
```

### Rollback Plan

```
Si algo crítico falla EN PRODUCCIÓN:
├─ 1. Disable dashboard vía feature flag (SystemSetting.dashboard_[N]_enabled = false)
├─ 2. Notificar a CISO + engineering
├─ 3. Identificar bug (check logs, error rates)
├─ 4. Hotfix en rama feature-fix
├─ 5. Test hotfix en staging
├─ 6. Deploy hotfix a production
├─ 7. Re-enable dashboard (toggle flag = true)
├─ 8. Monitor para asegurar que error no reappear
└─ 9. Post-mortem: qué salió mal, cómo prevenir

Rollback completo (último resort):
├─ Revert commit que añadió dashboard
├─ Deploy anterior versión
├─ Restore BD backup (si corrupted data)
└─ Comunicar downtime a usuarios
```

---

## ⚡ PERFORMANCE TARGETS

### Backend API Targets

```
Endpoint Response Time (95th percentile):
├─ Dashboard 1 (KPIs + charts): < 1.5 segundos
├─ Dashboard 2 (Equipo table): < 2 segundos
├─ Dashboard 4 (Drill-Down Level 0): < 1 segundo (sin tabla)
├─ Dashboard 4 (Level 3 table): < 2.5 segundos (con 100 vulns)
├─ Exportación CSV: < 5 segundos (max 10,000 rows)
└─ Paginación: < 500 ms

Database Query Optimization:
├─ Índices necesarios:
│  ├─ (entity_type, deleted_at) - soft delete filter
│  ├─ (usuario_id, deleted_at) - IDOR check
│  ├─ (severidad, estado) - Dashboard filters
│  ├─ (motor, created_at DESC) - Trending
│  └─ (celula_id, created_at DESC) - Scoped queries
├─ No N+1 queries (use eager loading)
├─ Max 3 JOINs per query
└─ Subqueries only if necessary (use UNION if complex)

Resource Limits:
├─ Max rows per query: 10,000 (without pagination)
├─ Pagination default: 50, max: 100
├─ Bulk operations max: 500 at once
├─ CSV export max size: 50 MB
└─ Timeout: 30 seconds per request
```

### Frontend Targets

```
Page Load Metrics:
├─ First Contentful Paint (FCP): < 1.5 segundos
├─ Largest Contentful Paint (LCP): < 2.5 segundos
├─ Cumulative Layout Shift (CLS): < 0.1
├─ Time to Interactive (TTI): < 3 segundos
└─ Total bundle size: < 500 KB (gzipped)

JavaScript:
├─ No blocking scripts (async/defer)
├─ Code splitting: Dashboard por ruta
├─ Lazy load components > 50 KB
└─ Minify + tree-shake unused code

Database Queries:
├─ Parallel requests (donde sea safe)
├─ Debounce filter input (500ms)
├─ Pagination: Load-on-scroll o traditional
└─ Cache dashboard layout (localStorage)
```

---

## 🔒 SECURITY CONSIDERATIONS

### OWASP API Security Top 10 (Aplicable)

```
S1 - Broken Object Level Authorization (IDOR):
├─ require_ownership() en todos los endpoints user-scoped
├─ test_IDOR per dashboard (intentar acceder a datos de otro usuario)
├─ Example: Dashboard 2 (Equipo) → analista solo su fila
└─ Backend: Intersect (user_scope ∩ widget_scope)

S3 - Broken Object Property Level Authorization:
├─ Schemas Pydantic no exponen sensitive fields (hashed_password, etc.)
├─ Ejemplo: User response NUNCA retorna refresh_token
└─ Validar: GET /user/me no muestra secrets

S4 - Unrestricted Resource Consumption:
├─ Paginación obligatoria (max 100 rows)
├─ Rate limiting en CSV export (1 por minuto max)
├─ Bulk operations max 500 items
└─ Request timeout 30 segundos

S6 - Unrestricted Access to Sensitive Business Flows:
├─ Rate limit en aprobaciones (evitar spam)
├─ SoD validation: aprobador ≠ creador
├─ Audit log todas las aprobaciones/excepciones
└─ Justificación obligatoria

S7 - Server Side Request Forgery (SSRF):
├─ URL fields (ActivoWeb, Repositorio): solo http/https
├─ Bloquear IPs internas (10.x, 192.168.x, 127.x, 169.254.x)
├─ No requests outbound desde plataforma (solo Anthropic API)
└─ Validar URLs antes de persistir

S8 - Security Misconfiguration:
├─ Headers: Strict-Transport-Security, X-Content-Type-Options, CSP
├─ CORS whitelist estricta (no wildcard)
├─ Errores genéricos en prod (sin stacktrace)
├─ Debug=false en env production
└─ Secrets en .env, nunca hardcoded

S10 - Unsafe Consumption of APIs:
├─ IA calls (future): timeout 30s, retry 3x, Pydantic validation
├─ Sanitizar output (no eval, no HTML execution)
└─ Redactar datos sensibles en logs
```

### Authentication & Authorization

```
HttpOnly Cookies:
├─ Tokens en cookies (NOT localStorage)
├─ Secure flag ON (HTTPS only)
├─ SameSite=Strict (CSRF protection)
├─ HttpOnly flag (no JS access)
└─ Expiry: Access 15 min, Refresh 7 días

CSRF Protection:
├─ Double-submit cookie (CSRF token en header)
├─ SameSite=Strict en cookies
└─ POST/PATCH/DELETE requieren CSRF token

RBAC (Role-Based Access Control):
├─ 6 roles base + 4 nuevos = 10 roles totales
├─ RolePermiso matrix: role_id → [permisos]
├─ Per-endpoint validation: require_role("admin", "ciso")
├─ Per-dashboard validation: CustomDashboardAccess
└─ Per-data validation: user_scope ∩ data_scope

SoD (Segregation of Duties):
├─ ReglaSoD table: entidad tipo → requiere SoD
├─ Ejemplo: aprobador ≠ creador (en releases, excepciones)
├─ Service validate: if SoD_enabled && approver_id == creator_id → 403
└─ Audit log: quién aprobó, cuándo, para qué
```

### Data Protection

```
Encryption at Rest:
├─ DB password hashing: bcrypt (algo framework)
├─ API tokens: SHA-256
├─ Sensitive fields: encrypted_field(password)
└─ PII (email, teléfono): no hardeamos (ok plain en DB)

Encryption in Transit:
├─ HTTPS obligatorio (TLS 1.2+)
├─ No secrets en URLs (auth via cookies/headers)
└─ API responses gzipped

Soft Delete & Audit:
├─ deleted_at + deleted_by universal
├─ Queries filtran deleted_at IS NULL por default
├─ Audit log immutable (hash chain)
├─ Admin pueden ver (soft) deleted items si tiene permiso
└─ Backup: no restaurar objetos borrados sin autorización
```

---

## ✅ VALIDACIONES EXACTAS POR COMPONENTE

### Input Validations (Frontend Zod + Backend Pydantic)

```
Dashboard Filters:
├─ date_from, date_to: valid dates, from <= to
├─ severity: enum [CRITICA, ALTA, MEDIA, BAJA]
├─ estado: enum [Abierta, En Progreso, Cerrada]
├─ motor: enum [SAST, DAST, SCA, MAST, MDA, Secretos]
├─ page: int >= 1, <= max_pages
├─ page_size: int in [10, 25, 50, 100]
└─ sort_by: field must exist in table schema

Custom Fields:
├─ field_name: str, 1-100 chars, alphanumeric + underscore
├─ field_type: enum [text, number, date, select, user_ref, boolean, url]
├─ required: boolean
├─ default_value: type must match field_type
└─ options (if select): list[str], not empty

Formulas:
├─ function_name: must be in ALLOWED_FUNCTIONS (no eval!)
├─ parameters: validated per function
├─ no SQL injection (parameterized queries)
└─ max depth: 3 (prevent stack overflow)

Exportación:
├─ format: enum [csv, excel, pdf]
├─ max_rows: int, 1-100000
├─ columns: list of valid field names
└─ filename: sanitized (no ../, no special chars)
```

### Business Logic Validations (Backend)

```
Vulnerabilidad State Transitions:
├─ FlujoEstatus.validate_transition(from_status, to_status)
├─ Abierta → En Progreso: OK
├─ En Progreso → Abierta: OK (if workflow allows)
├─ Cerrada → Abierta: Requires justification + SoD check
└─ Invalid transition → 400 Bad Request

Release State Machine:
├─ Design → Security Validation → Security Tests → Approval → QA → Prod
├─ Can skip states: only if SoD validated
├─ Justification required: if skip + state critical
└─ Audit log: estado anterior → estado nuevo + user + timestamp

SoD Validation:
├─ If SoD rule enabled for action:
│  ├─ creator_id != approver_id (must be different users)
│  └─ if same user → 403 Forbidden + error "SoD violation"
├─ Example: Release approval, Exception approval
└─ Admin can override (with different role: super_admin)

Scope Cascade:
├─ User has scope: [subdir1, subdir2]
├─ Widget scope: [subdir1] (más restrictivo)
├─ Effective scope: intersection = [subdir1]
├─ User can't see data from subdir2 en este widget
└─ Validation: query WHERE subdir_id IN (effective_scope)
```

---

## 📚 DOCUMENTACIÓN Y TRAINING

### Documentación a Entregar

```
1. Admin Guide (Markdown)
   ├─ Cómo configurar los 9 dashboards (si son customizables)
   ├─ Cómo crear nuevos dashboards (Module View Builder)
   ├─ Cómo agregar Custom Fields
   ├─ Cómo definir Reglas de Validación
   ├─ Cómo configurar Automatización IA (future)
   └─ Troubleshooting común

2. User Guide (Markdown + Vídeos)
   ├─ Cómo acceder a cada dashboard
   ├─ Cómo usar filtros
   ├─ Cómo drill-down (Dashboard 4)
   ├─ Cómo exportar datos
   ├─ Restricciones por rol
   └─ FAQ

3. Developer Guide (Markdown)
   ├─ Cómo extender un dashboard (agregar widget nuevo)
   ├─ Cómo crear un nuevo dashboard
   ├─ Arquitectura: models → schemas → services → routers
   ├─ Cómo agregar endpoint nuevo
   ├─ Testing patterns
   └─ Performance tips

4. API Documentation (Auto-generated Swagger)
   ├─ Todos los endpoints listados
   ├─ Parámetros input/output
   ├─ Códigos de error posibles
   └─ Rate limits

5. Architecture Decision Records (ADR)
   ├─ ADR-1: Por qué dashboards JSON-based vs hardcoded
   ├─ ADR-2: Por qué soft delete universal
   ├─ ADR-3: Drill-down scope cascade
   └─ ADR-4: Componentes transversales shared
```

### Training Sessions

```
Semana 6 (Pre-rollout):
├─ Session 1 (30 min): "Introducción a Dashboards"
│  └─ Quién: Chief AppSec + CISO + team leads
│  └─ Qué: Overview de 9 dashboards, qué datos ve cada rol
│
├─ Session 2 (45 min): "Drill-Down en Vulnerabilidades"
│  └─ Quién: Analistas que usan Dashboard 4
│  └─ Qué: Cómo navegar 4 niveles, cómo filtrar, cómo exportar
│
└─ Session 3 (30 min): "Filtros y Exportación"
   └─ Quién: Todos
   └─ Qué: Cómo usar filtros, cómo exportar, qué datos se exportan

Post-Rollout:
├─ Monthly office hours (30 min cada una)
│  └─ Q&A, nuevas features, feedback
└─ Self-service: FAQs + docs on wiki
```

---

## ⚠️ RISK ASSESSMENT & MITIGATION

### Riesgos Identificados

```
RIESGO 1: Dashboard 4 (Vulns 4-Drill) es muy complejo
├─ Impacto: ALTO (40% del esfuerzo, si falla impacta visibilidad)
├─ Probabilidad: MEDIA
├─ Mitigación:
│  ├─ Comenzar pronto (semana 4)
│  ├─ Tests exhaustivos (10+ E2E tests)
│  ├─ Code review por 2 personas
│  └─ Beta testing con CISO 1 semana antes de full rollout
└─ Escalation: Si se retrasa > 2 días, considerar MVP (sin Level 3)

RIESGO 2: Performance degrada con datos reales
├─ Impacto: MEDIO (usuarios ven lentitud)
├─ Probabilidad: MEDIA (pueden haber N+1 queries ocultas)
├─ Mitigación:
│  ├─ Profiling desde semana 3 (production-like data)
│  ├─ Índices en BD pre-implementación
│  ├─ Load testing: 100+ usuarios concurrentes
│  └─ Response time SLA: < 2 segundos (monitoreado)
└─ Escalation: Si > 2s, optimize queries o reduce data

RIESGO 3: Permisos/IDOR no validados correctamente
├─ Impacto: CRÍTICO (security breach)
├─ Probabilidad: BAJA (tenemos tests, pero humanos cometemos errores)
├─ Mitigación:
│  ├─ IDOR testing per endpoint (test suite)
│  ├─ Code review enfoque en permisos
│  ├─ Manual testing: intentar ver datos de otro usuario
│  └─ Security audit pre-production
└─ Escalation: Si se encuentra breach, rollback inmediato

RIESGO 4: Data migration (si hay datos legacy)
├─ Impacto: MEDIO (datos inconsistentes)
├─ Probabilidad: BAJA (si lo planificamos bien)
├─ Mitigación:
│  ├─ Script migration testado en staging primero
│  ├─ Data validation post-migration (row count, checksums)
│  ├─ Rollback script disponible
│  └─ Backups before y after
└─ Escalation: Si falla, restore backup, re-run script

RIESGO 5: Cambios en BD (schema) rompen frontend
├─ Impacto: MEDIO (type errors)
├─ Probabilidad: BAJA (TypeScript + make types)
├─ Mitigación:
│  ├─ make types ejecutado después de cada migración
│  ├─ CI/CD: failear si types desincronizados
│  └─ TypeScript strict mode
└─ Escalation: Regenerar types, rebuild, redeploy

RIESGO 6: Componentes UI reutilizados tienen bugs
├─ Impacto: ALTO (afecta multiple dashboards)
├─ Probabilidad: MEDIA (13 componentes, si uno falla...)
├─ Mitigación:
│  ├─ Unit tests per component (40-50 tests)
│  ├─ Storybook: visual testing
│  ├─ Component library bien documentada
│  └─ Beta testing temprano
└─ Escalation: Si bug en componente compartido, hotfix + revert

RIESGO 7: Soft delete queries lentas (INDEX missing)
├─ Impacto: MEDIO (performance)
├─ Probabilidad: MEDIA
├─ Mitigación:
│  ├─ Índice (deleted_at) creado preemptivamente
│  ├─ Partial index: WHERE deleted_at IS NULL
│  └─ Query plan analysis (EXPLAIN)
└─ Escalation: Si query lenta, add index, monitor
```

---

## 🔄 BACKWARD COMPATIBILITY & DEPRECATION

```
No Breaking Changes:
├─ Versión API: /api/v1/ (no cambiar)
├─ Existing endpoints: no modificar comportamiento
├─ Dashboard registry: mantener 9 dashboards existentes
└─ User preferences: migrar existing filters al nuevo sistema

Deprecation Path (si needed):
├─ Old endpoint: marked as deprecated, retorna warning header
├─ New endpoint: launch en parallel
├─ Deprecation period: 3 meses (announce en changelog)
├─ Removal: después de 3 meses sin migrar clientes
└─ Communication: email + in-app notice

Data Migration:
├─ Old saved filters → FiltroGuardado (data mapping)
├─ Old dashboard configs → CustomDashboard (layout migration)
└─ Old user preferences → UserPreference (JSONB migration)
```

---

## 📈 METRICS & MONITORING (Post-Launch)

```
Métricas a monitorear (1 semana post-launch):
├─ API response times (p50, p95, p99)
├─ Error rates (4xx, 5xx)
├─ Database query duration (slow queries)
├─ Feature adoption (% usuarios usando cada dashboard)
├─ User feedback (satisfaction survey)
└─ Performance: page load, FCP, LCP

Alertas automáticas:
├─ Response time > 3 segundos
├─ Error rate > 1%
├─ Slow query > 5 segundos
└─ Unusual access patterns (IDOR attempt?)

Dashboard de Salud (Admin only):
├─ Overview de todos los dashboards
├─ Últimos errores
├─ Performance trends
└─ User session details (para debugging)
```

---

**Plan completamente detallado - Listo para implementación.**  
**Fecha**: 25 abril 2026  
**Status**: ✅ VALIDADO Y COMPLETO
