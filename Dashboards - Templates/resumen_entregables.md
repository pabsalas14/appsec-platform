# Entregables Dashboards AppSec — Resumen Ejecutivo

> Guardado: 25 Abril 2026 · Conversación: 94680f6b

## Contexto
Se revisaron las 9 imágenes de `Dashboards - Templates/` como estándar visual vinculante.
Todas las páginas actuales son esqueletos mínimos que necesitan **reescritura completa**.

---

## Entregables por Dashboard

### 1. Dashboard General Ejecutivo → REESCRIBIR
- 5 KPIs clickeables + Gauge "Postura Seguridad" + Semáforo SLAs + Gráfica tendencia + Top 5 repos + Tabla auditorías
- **Backend**: 4 nuevos endpoints

### 2. Dashboard Equipo → REESCRIBIR
- Tabla ordenable analistas + Panel lateral con historial + Dona "Distribución por Estatus" (reemplaza velocímetro eliminado)
- Analista solo ve su propia fila
- **Backend**: refactorizar + 1 nuevo endpoint

### 3. Dashboard Programas Anuales → REESCRIBIR
- 5 tarjetas con GaugeChart + Cuadritos mensuales color + Barras vs Meta + Panel lateral actividades
- **Backend**: refactorizar + 1 nuevo endpoint

### 4. Dashboard Vulnerabilidades Desarrollo → REESCRIBIR COMPLETO (~40% esfuerzo)
- 4 niveles drill-down secuenciales (Global→Subdirección→Célula→Repositorio)
- Nivel 3: 4 pestañas (Vulns activas, Historial, Dependencias SCA, Configuración repo)
- **Backend**: ~6 nuevos endpoints

### 5. Dashboard Concentrado Vulnerabilidades → CREAR DESDE CERO
- 6 tarjetas por motor + 4 recuadros por severidad + Toggle agrupada/plana + Filtros avanzados
- **Backend**: ~3 nuevos endpoints

### 6. Dashboard Operación → REESCRIBIR + UNIFICAR A DARK MODE
- 2 pestañas (Liberaciones + Terceros) + Tabla completa + Panel lateral flujo estatus
- **Backend**: refactorizar + 2 nuevos endpoints

### 7. Kanban de Liberaciones → REESCRIBIR COMPLETO
- Nuevo para `service_releases` (no tasks) + 8 columnas **configurables** por admin
- Drag & drop con validación reglas flujo + bitácora + toggle Kanban↔Tabla
- **Backend**: 3 nuevos endpoints + config columnas

### 8. Dashboard Iniciativas → REESCRIBIR
- Tabla filtrable + Barras semáforo + Panel lateral con ponderación mensual e historial
- **Backend**: refactorizar + 1 nuevo endpoint

### 9. Dashboard Temas Emergentes → REESCRIBIR
- Tabla + "Días abierto" color dinámico + Panel lateral con bitácora timeline/chat
- **Backend**: refactorizar + 1 nuevo endpoint

---

## 13 Componentes Transversales Nuevos
`GaugeChart`, `SemaforoSla`, `SidePanel`, `DrilldownBreadcrumb`, `AdvancedFilterBar`, `ProgressBarSemaforo`, `SeverityChip`, `StatusChip`, `HorizontalBarRanking`, `ReleaseKanbanBoard`, `TimelineBitacora`, `AreaLineChart`, `HistoricoMensualGrid`

## Permisos Granulares — 3 Niveles
1. **Dashboard**: tabla `role_dashboard_access` (qué rol ve qué pantalla)
2. **Widget**: tabla `dashboard_configs` (qué secciones dentro del dashboard)
3. **Datos**: tabla `user_organization_scopes` (filtrado por contexto org con cascada)

## Nuevos Roles Confirmados
`ciso`, `responsable_celula`, `director_subdireccion`, `lider_liberaciones`

## Decisiones Confirmadas por Usuario
- Velocímetro "Salud del Equipo" eliminado → reemplazado por dona distribución
- Dashboard Operación unificado a modo oscuro
- Columnas Kanban configurables (8 default)
- Pestañas Dependencias y Configuración son funcionalidad real
- Scope cascada: Subdirección→Gerencia→Organización→Célula
- Admin permisos: extender `/admin/roles` existente (no módulo separado)

---

## Archivos de Referencia Detallados
- `artifacts/gap_analysis.md` — Tabla elemento-por-elemento de cada dashboard
- `artifacts/implementation_plan.md` — Plan técnico con modelo de datos propuesto
- `/Dashboards - Templates/*.png` — 9 imágenes vinculantes
