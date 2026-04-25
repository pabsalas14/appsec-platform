# Propuesta Técnica: Dashboard Builder + Personalización Global

## 1. Dashboard Builder — Arquitectura

### 1.1 Librerías Frontend Recomendadas

| Librería | Versión | Propósito | ¿Ya en el proyecto? |
|----------|---------|-----------|---------------------|
| **react-grid-layout** | ^1.4 | Grid drag & drop para posicionar widgets, resize handles, layouts responsivos | ❌ Instalar |
| **recharts** | ≥2.x | Gráficas (barras, línea, donut, área) — tema-aware via CSS vars | ✅ Ya instalado |
| **@dnd-kit/core** | ≥6.x | Drag & drop del panel de widgets al canvas | ✅ Ya instalado |
| **next-themes** | ≥0.3 | Dark mode | ✅ Ya instalado |
| **sonner** | ≥1.x | Toasts para feedback | ✅ Ya instalado |
| **zod** | ≥3.x | Validación del JSON de layout | ✅ Ya instalado |

> **¿Por qué `react-grid-layout`?** Es el estándar de facto para dashboards editables en React. Soporta: grid configurable, drag para reposicionar, resize por esquinas, breakpoints responsivos, serialización a JSON. Lo usan Grafana, Metabase y Kibana en sus builders.

### 1.2 Estructura JSON del Layout (Backend)

Cada dashboard custom se almacena como un registro en `custom_dashboards` con su layout en JSONB:

```jsonc
{
  "version": 1,
  "grid": {
    "cols": 12,                    // columnas del grid
    "rowHeight": 80,               // px por fila
    "compactType": "vertical"      // auto-compactar
  },
  "widgets": [
    {
      "id": "w1",                  // UUID corto interno
      "type": "kpi_card",          // tipo de widget (catálogo fijo)
      "layout": {                  // posición en el grid (react-grid-layout format)
        "x": 0, "y": 0,
        "w": 3, "h": 2,
        "minW": 2, "minH": 2
      },
      "config": {                  // configuración específica del widget
        "title": "Vulnerabilidades Críticas",
        "dataSource": "vulnerabilidades",
        "metric": "count",
        "filters": {
          "severidad": "CRITICA",
          "estado": ["Abierta", "En Progreso"]
        },
        "orgScope": {              // filtro org independiente por widget
          "subdireccion_id": null,
          "celula_id": "uuid-xxx"
        },
        "display": {
          "color": "#ef4444",
          "icon": "shield-alert",
          "showTrend": true,
          "trendPeriod": "month"
        }
      }
    },
    {
      "id": "w2",
      "type": "bar_chart",
      "layout": { "x": 3, "y": 0, "w": 6, "h": 4 },
      "config": {
        "title": "Vulnerabilidades por Motor",
        "dataSource": "vulnerabilidades",
        "metric": "count",
        "groupBy": "fuente",
        "filters": {},
        "orgScope": {},
        "display": {
          "orientation": "vertical",
          "showLegend": true
        }
      }
    },
    {
      "id": "w3",
      "type": "data_table",
      "layout": { "x": 0, "y": 4, "w": 12, "h": 5 },
      "config": {
        "title": "Liberaciones Activas",
        "dataSource": "liberaciones",
        "columns": ["nombre", "version", "estado_actual", "criticidad", "created_at"],
        "filters": { "estado_actual": "En progreso" },
        "orgScope": {},
        "sortBy": "created_at",
        "sortDir": "desc",
        "pageSize": 10
      }
    }
  ]
}
```

### 1.3 Catálogo de Tipos de Widget

| `type` | Nombre UI | Config Específica |
|--------|-----------|-------------------|
| `kpi_card` | Tarjeta KPI | `metric` (count/sum/avg), `showTrend`, `trendPeriod`, `color`, `icon` |
| `bar_chart` | Gráfica de Barras | `groupBy`, `orientation` (vertical/horizontal), `stacked` |
| `line_chart` | Gráfica de Línea | `timePeriod`, `granularity` (day/week/month), `multiSeries` |
| `donut_gauge` | Velocímetro / Donut | `metric`, `maxValue`, `thresholds: {green, yellow, red}` |
| `data_table` | Tabla de Datos | `columns[]`, `sortBy`, `sortDir`, `pageSize`, `rowClickAction` |
| `heatmap` | Mapa de Calor | `xAxis`, `yAxis`, `valueMetric`, `colorScale` |
| `alert_list` | Lista de Alertas | `priority` (critical/warning/info), `maxItems`, `autoRefresh` |

### 1.4 Catálogo de Fuentes de Datos (`dataSource`)

| `dataSource` | Modelo Backend | Métricas Disponibles | Campos para `groupBy` |
|-------------|---------------|---------------------|----------------------|
| `vulnerabilidades` | Vulnerabilidad | count, count_by_severity, count_by_state, sla_overdue | fuente, severidad, estado, owasp_categoria |
| `liberaciones` | ServiceRelease | count, count_by_status, avg_days_in_flow | estado_actual, criticidad, tipo_cambio |
| `programas` | ProgramaSast + VulnsBySource | completion_%, count_by_source | fuente |
| `pipeline` | HallazgoPipeline | total_scans, approved, rejected, approval_rate | resultado, motor |
| `iniciativas` | Iniciativa | count, avg_progress, at_risk_count | tipo, estado |
| `temas_emergentes` | TemaEmergente | count, unmoved_7d, avg_days_open | tipo, estado, area |
| `equipo` | User + Vulns assigned | analyst_count, avg_closure_rate | role |

### 1.5 Cómo se Conectan los Widgets a las Fuentes de Datos

```
┌─────────────────────────────────────────────────────┐
│  Frontend: Dashboard Builder Canvas                  │
│                                                      │
│  Widget Config Panel                                 │
│  ┌──────────────────────────────────┐               │
│  │ 1. Seleccionar tipo de widget    │               │
│  │ 2. Seleccionar fuente de datos   │───┐           │
│  │ 3. Configurar filtros            │   │           │
│  │ 4. Configurar scope org          │   │           │
│  │ 5. Configurar display            │   │           │
│  └──────────────────────────────────┘   │           │
│                                          ▼           │
│  POST /api/v1/widget-data/query                      │
│  Body: { dataSource, metric, groupBy, filters,       │
│          orgScope, timePeriod }                       │
│                                          │           │
└──────────────────────────────────────────┼───────────┘
                                           ▼
┌─────────────────────────────────────────────────────┐
│  Backend: WidgetDataRouter                           │
│                                                      │
│  1. Validar permisos (require_dashboard_access)      │
│  2. Resolver data scope del usuario                  │
│  3. Intersectar scope del usuario con scope widget   │
│  4. Despachar a DataSourceAdapter(dataSource)        │
│  5. Aplicar filtros, groupBy, metric                 │
│  6. Retornar { labels[], values[], meta }            │
└─────────────────────────────────────────────────────┘
```

**Endpoint genérico**: `POST /api/v1/widget-data/query`

```python
@router.post("/query")
async def query_widget_data(
    payload: WidgetDataQuery,         # dataSource, metric, groupBy, filters, orgScope
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_scope: DataScope = Depends(get_data_scope),
):
    adapter = DATA_SOURCE_REGISTRY[payload.data_source]
    # Intersectar scope del usuario con scope del widget
    effective_scope = intersect_scopes(user_scope, payload.org_scope)
    result = await adapter.query(db, payload, effective_scope)
    return success(result)
```

### 1.6 Modelo de Datos Backend

```python
class CustomDashboard(SoftDeleteMixin, Base):
    __tablename__ = "custom_dashboards"

    id: UUID (PK)
    nombre: str(255)
    descripcion: str|None
    created_by: UUID → FK(users.id)     # quién lo creó
    layout_json: dict (JSONB)           # el JSON de §1.2
    is_system: bool = False             # True = los 9 dashboards fijos
    is_template: bool = False           # plantilla clonable
    orden: int = 0                      # orden en sidebar
    icono: str(64)|None
    activo: bool = True
    created_at: datetime
    updated_at: datetime

class CustomDashboardAccess(Base):
    __tablename__ = "custom_dashboard_access"

    id: UUID (PK)
    dashboard_id: UUID → FK(custom_dashboards.id)
    role_id: UUID|None → FK(roles.id)      # acceso por rol
    user_id: UUID|None → FK(users.id)      # O acceso directo a usuario
    puede_ver: bool = True
    puede_editar: bool = False
```

---

## 2. Personalización Global — Todos los Módulos

**Confirmo explícitamente**: la personalización aplica a **todos los módulos** de la plataforma, no solo a los dashboards.

### 2.1 Inventario de lo que YA existe

| Capacidad | Estado Actual | Dónde |
|-----------|--------------|-------|
| Filtros por URL (compartibles) | ✅ Funcional | `useUrlFilters.ts` — sync state ↔ URL params |
| Filtros guardados (BD) | ✅ Funcional | `FiltroGuardado` model + `useFiltrosGuardados` hook |
| Sort columnas client-side | ✅ Funcional | `useTableSort.ts` + `SortableDataTableTh` |
| Exportar CSV | ✅ Funcional | `DashboardCsvExportButton` + `CatalogCsvToolbar` (export+import+template) |
| Importar CSV | ✅ Funcional | `CatalogCsvToolbar` con import masivo |
| Selección múltiple filas | ✅ Funcional | `useRowSelection.ts` |
| DataTable glassmorphism | ✅ Funcional | `data-table.tsx` con FilterBar, Search |
| Widget visibility por rol | ✅ Funcional | `dashboard_configs` + `useMyDashboardVisibility` |

### 2.2 Lo que FALTA y se debe implementar

| Capacidad | Aplica a | Implementación |
|-----------|----------|----------------|
| **Ocultar/mostrar columnas** | Todas las tablas | Nuevo componente `ColumnToggle` + preferencia guardada en `user_preferences` (JSONB) |
| **Reordenar columnas por D&D** | Todas las tablas | Extender `DataTable` con `@dnd-kit` para drag de `<th>` + persistir orden en `user_preferences` |
| **Vistas guardadas** (filtros + columnas + orden como preset) | Todos los módulos | Extender `FiltroGuardado` con campos `columnas_visibles`, `columnas_orden`, `sort_key`, `sort_dir` |
| **Campos visibles por rol** (admin controla qué campos ve cada rol) | Todos los módulos | Nueva tabla `module_field_visibility` por (módulo, campo, rol_id → visible) |
| **Exportar vista actual** (respetando columnas y filtros activos) | Todas las tablas | Extender endpoint `/export.csv` con parámetros `columns` y filtros actuales |

### 2.3 Modelo de Datos para Personalización Global

```python
# Preferencias por usuario (columnas, orden) — una fila por usuario
class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: UUID (PK)
    user_id: UUID → FK(users.id) (UNIQUE)
    preferences: dict (JSONB)
    # Estructura:
    # {
    #   "tables": {
    #     "vulnerabilidads": {
    #       "visibleColumns": ["titulo", "severidad", "estado", "fuente"],
    #       "columnOrder": ["severidad", "titulo", "estado", "fuente"],
    #       "defaultSort": { "key": "created_at", "dir": "desc" },
    #       "pageSize": 20
    #     },
    #     "service_releases": { ... }
    #   },
    #   "sidebar": {
    #     "collapsed": false,
    #     "pinnedDashboards": ["uuid-1", "uuid-2"]
    #   }
    # }

# Visibilidad de campos por rol (admin configura)
class ModuleFieldVisibility(Base):
    __tablename__ = "module_field_visibility"

    id: UUID (PK)
    module: str(100)         # "vulnerabilidads", "service_releases", etc.
    field_name: str(100)     # "cvss_score", "responsable", etc.
    role_id: UUID → FK(roles.id)
    visible: bool = True
```

### 2.4 Hook Unificado para Tablas Personalizables

```typescript
// usePersonalizedTable.ts — combina todas las capacidades
function usePersonalizedTable<T>(moduleName: string, allColumns: ColumnDef[]) {
  const { preferences, updatePreferences } = useUserPreferences();
  const { roleFieldVisibility } = useModuleFieldVisibility(moduleName);
  const { savedViews, saveView, deleteView } = useSavedViews(moduleName);
  const { sortedData, sortKey, sortDirection, onSort } = useTableSort(data, getters);
  const { getParam, setParam } = useUrlFilters();

  // 1. Filtrar columnas por rol (admin-controlled)
  // 2. Filtrar columnas por preferencia usuario (self-service)
  // 3. Aplicar orden de columnas del usuario
  // 4. Retornar todo empaquetado

  return {
    visibleColumns,      // columnas finales visibles
    columnOrder,         // orden actual
    toggleColumn,        // mostrar/ocultar columna
    reorderColumns,      // callback para D&D reorder
    sortKey, sortDirection, onSort,
    savedViews, saveCurrentView, loadView,
    exportCurrentView,   // exportar con columnas y filtros actuales
  };
}
```

---

## 3. Gestión de Visibilidad de Dashboards (Admin)

### 3.1 Extensión de `/admin/roles`

Se extiende el panel existente con 3 nuevas pestañas:

| Pestaña | Funcionalidad |
|---------|---------------|
| **Dashboards** | Toggle on/off por dashboard (fijos + customs) para cada rol. Drag & drop para reordenar menú por rol |
| **Widgets** | Por dashboard seleccionado, toggle de visibilidad de cada widget/sección por rol |
| **Scope Org** | Asignar a cada usuario su(s) nodo(s) organizacional(es) (subdirección, célula, etc.) |

### 3.2 Asignar Dashboards Custom a Grupos

Los dashboards del Builder se asignan via `custom_dashboard_access`:
- **Por rol**: todos los usuarios con rol X ven el dashboard
- **Por usuario**: asignación directa a usuarios específicos

### 3.3 Sidebar Dinámico

El sidebar se construye dinámicamente basándose en:
1. Dashboards del sistema (los 9 fijos) filtrados por `role_dashboard_access`
2. Dashboards custom filtrados por `custom_dashboard_access`
3. Orden personalizado por rol (desde admin)
4. Dashboards "pinneados" por el usuario (desde `user_preferences`)

Endpoint: `GET /api/v1/dashboard/my-menu` — retorna la lista ordenada de dashboards visibles para el usuario actual.

---

## Resumen de Tablas Nuevas

| Tabla | Propósito |
|-------|-----------|
| `custom_dashboards` | Dashboards creados con el Builder (layout JSON) |
| `custom_dashboard_access` | Permisos de acceso (por rol o por usuario) |
| `user_preferences` | Preferencias de tabla/sidebar por usuario (JSONB) |
| `module_field_visibility` | Visibilidad de campos por módulo y rol (admin) |

> Las tablas de permisos del Prompt 1 (`dashboard_registry`, `role_dashboard_access`, `user_organization_scopes`) se mantienen para los 9 dashboards fijos.
