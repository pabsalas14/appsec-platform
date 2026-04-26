# Dashboards Frontend

Catálogo **10 tableros BRD** (rutas reales: `/dashboards/executive`, `/dashboards/team`, …) — el mapa vive en `hub/page.tsx`. Las peticiones al API deben usar rutas **relativas al `baseURL` de `@/lib/api`** (`/api/v1` ya está incluido), por ejemplo `apiClient.get('/dashboard/executive')` y no `...get('/api/v1/dashboard/executive')` (dobla el prefijo y devuelve 404).

Los dashboards bajo `dashboards/*` conectan con datos reales del backend.

## Dashboards Implementados

### 1. Dashboard Ejecutivo (`executive/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/executive`
- **Componentes**: 5 KPI Cards, Gauge Chart, Area/Line Chart, Bar Ranking, Semáforo SLA, Tabla Auditorías
- **Features**: 
  - Carga datos reales en tiempo real
  - Selector de período (mes actual, anterior, últimos 3/6 meses)
  - Data-testid para E2E tests
  - Loading states y error handling

### 2. Dashboard de Equipo (`team/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/team`
- **Componentes**: KPI Summary (tamaño equipo, vulns abiertas, tasa promedio cierre), Tabla de Analistas
- **Features**:
  - Vista de carga de trabajo por analista
  - Métricas de tasa de cierre
  - Agregación en tiempo real

### 3. Dashboard de Programas (`programs/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/programs`
- **Componentes**: KPI Summary (total programas, completitud promedio, programas en riesgo), Tabla desglose
- **Features**:
  - Seguimiento de programas de seguridad
  - Indicador de riesgo
  - Porcentaje de completitud

### 4. Dashboard de Vulnerabilidades (`vulnerabilities/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/vulnerabilities`
- **Componentes**: 
  - Breadcrumb navegable (Global → Subdirección → Célula → Repositorio)
  - Tabs: Por Severidad, Por Motor, Tendencia
  - KPI Cards por nivel
- **Features**:
  - Drill-down jerárquico en 4 niveles
  - Distribución por severidad y motor
  - Data-testid para cada nivel

### 5. Dashboard Concentrado (`concentrado/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/vulnerabilities`
- **Componentes**: 
  - KPI Total
  - Tabs: Por Motor, Por Severidad
  - Gráficos de distribución con gradientes
- **Features**:
  - Vista agregada global
  - Porcentajes visuales con barras de gradiente
  - Orden descendente automático

### 6. Dashboard de Operación (`operacion/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/releases-table`
- **Componentes**:
  - KPI Summary (total liberaciones, estados únicos, última actualización)
  - Tabs: Liberaciones, Por Estado
  - Tabla de liberaciones con paginación
- **Features**:
  - Gestión de liberaciones
  - Seguimiento por estado
  - Distribución visual de estados

### 7. Dashboard Kanban (`kanban/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/releases-kanban`
- **Componentes**: 
  - Kanban Board con dnd-kit (arrastra y suelta)
  - Columnas dinámicas por estado
  - KPI Total de tarjetas
- **Features**:
  - Drag-and-drop entre columnas
  - Actualización en tiempo real
  - Integración con PATCH `/api/v1/service-releases/{id}/move`
  - Data-testid para cada tarjeta

### 8. Dashboard de Iniciativas (`iniciativas/page.tsx`)
- **Endpoint**: `/api/v1/dashboard/initiatives`
- **Componentes**:
  - KPI Summary (total, progreso promedio, en riesgo)
  - Cards de iniciativas con progreso visual
  - Detalles de fechas de inicio/fin
- **Features**:
  - Barra de progreso visual
  - Indicadores de riesgo
  - Información de plazos

### 9. Dashboard de Temas Emergentes (`temas/page.tsx`)
- **Endpoint**: `GET /api/v1/dashboard/emerging-themes-summary`, `GET /api/v1/dashboard/tema/{id}/detail` (vía `apiClient` sin duplicar `/api/v1`)
- **Componentes**:
  - KPI Summary (total temas, alto impacto, recientes)
  - Cards expandibles con bitácora de comentarios
  - Categorización por impacto
- **Features**:
  - Expandible para ver bitácora
  - Comentarios timestamped
  - Filtro visual por impacto (Alto/Medio/Bajo)
  - Bitácora: `POST /api/v1/actualizacion_temas/`

### 10. Dashboard Releases — tabla y filtros org (`releases/page.tsx`)
- **Endpoints** (mismo criterio de ruta relativa al cliente HTTP): `GET /api/v1/dashboard/releases-table` y KPIs vinculados
- Filtro jerárquico dirección → repositorio; tabla y métricas alineadas al BRD

### Hub de los 10 tableros (`hub/page.tsx`)
- Solo navegación: enlaces a los 10 anteriores con mismos `HierarchyFilters` en querystring

## Patrones Comunes

### Hooks Utilizados
- `useQuery` (TanStack Query) para data fetching
- `useMutation` para operaciones del Kanban

### Componentes Reutilizados
- `Card` / `CardHeader` / `CardContent` / `CardTitle` de shadcn/ui
- `Skeleton` para loading states
- `Tabs` / `TabsContent` / `TabsList` / `TabsTrigger` para navegación
- Componentes de gráficos: `KPICard`, `GaugeChart`, `AreaLineChart`, `HorizontalBarRanking`, `SemaforoSla`, `DataTable`

### Logging
Todos los dashboards registran eventos estructurados con `logger.info()`:
```typescript
logger.info('dashboard.{name}.fetch', { /* params */ });
```

### Data-testid
Cada elemento interactivo tiene data-testid para E2E tests:
- `error-state`: estado de error
- `{component}-card`: componentes principales
- `{component}-table`: tablas
- `kanban-card-{id}`: tarjetas kanban
- `tema-card-{id}`: cards de temas
- `comentario-{tema_id}-{idx}`: comentarios

### Responsive Design
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3+`: layouts responsive
- TailwindCSS para mobile-first approach
- Dark mode con CSS variables (next-themes)

## Requisitos Cumplidos

✅ Cargar datos de endpoints reales (NO mock)
✅ useQuery para data fetching
✅ Manejo de loading, error, empty states con Skeleton
✅ Permisos por rol (require_permission en backend)
✅ Responsive (mobile/tablet/desktop)
✅ Dark mode (next-themes + CSS variables)
✅ Paginación (max 100 rows en backend)
✅ Filtros (donde aplica)
✅ Logs estructurados con logger.info
✅ Data-testid para E2E tests
✅ TypeScript SIN `any`, tipos generados de @/types/api

## Testing E2E

Ver: `frontend/src/__tests__/e2e/dashboard-1-executive.spec.ts` para ejemplo de tests Playwright
