# Análisis de Gaps — 9 Dashboards vs Estado Actual

Consolidación de tu retroalimentación + auditoría completa del código existente.

---

## Resumen Ejecutivo

**Estado actual**: Existen 8 páginas de dashboard en el frontend, pero todas son **esqueletos mínimos** — solo muestran tarjetas `StatCard` con contadores básicos. **Ninguna** se acerca al diseño de las imágenes de referencia.

| Aspecto | Existe | Falta |
|---------|--------|-------|
| Páginas frontend | 8 rutas básicas | Rediseño total de las 8 + 1 nueva (Concentrado) |
| Endpoints backend | 10 endpoints agregados | ~20 endpoints nuevos para drill-down, tablas, paneles |
| Componentes UI | `StatCard`, `BarChart`, `LineChart`, `DonutChart` | Gauge, Semáforo SLA, Histórico Mensual, SidePanel, DrilldownNav, FilterBar completa |
| Kanban | Genérico para `tasks` | Rediseño completo para `service_releases` con 8 columnas configurables |
| Permisos | `require_permission(P.DASHBOARDS.VIEW)` genérico | 3 niveles (dashboard/widget/data scope) |
| Roles | 8 roles en `RolEnum` | Faltan: `ciso`, `responsable_celula`, `director_subdireccion`, `lider_liberaciones` |
| Scope org | No existe | Tabla `user_organization_scopes` + `resolve_data_scope()` |

---

## Gap por Dashboard

### 1. Dashboard General Ejecutivo

**Ruta actual**: `dashboards/executive/page.tsx` — **tablero “command center”** (KPIs, tendencia, top repos, SLA, auditorías, export, drill-down)

**Endpoint actual**: `GET /api/v1/dashboard/executive` — KPIs, `kpi_sub`, `kpi_trends`, `trend_data` (incl. `avance_cierre`, `kpi_activa_releases`, `kpi_temas_inventario`, `kpi_audits_inventario`, `pct_sla_*`), `sla_spark` (seríe histórica de %), `trend_mode` + `ref_month` (anclaje a meses calendario o ventanas deslizantes), `top_repos`, `sla_status`, `audits` paginados (`audits_offset`, `audits_limit`, `audits_solo_activas`, `audits_total`).

| Elemento (mock) | Estado |
|-----------------|--------|
| 5 KPIs con desglose y sparkline sobre datos reales de tendencia | **Hecho** — `ExecutiveKpiCard` + API |
| Gráfica avance cierre % vs meta 100% | **Hecho** — `AvanceVsMetaChart` (Recharts) |
| Top repos (lista con barra) | **Hecho** — `TopReposExecutiveList` |
| Semáforo SLA + minigráficas (histórico real) | **Hecho** — `SlaExecutiveCards` + `sla_spark` |
| Postura (anillo) | **Hecho** — `PostureRing` |
| Filtro mes calendario (`ref_month=YYYY-MM`) + ventanas N | **Hecho** (query + UI `input type="month"`) |
| Tabla auditorías con paginación y solo abiertas | **Hecho** (query + UI) |
| Drill-down sin salir (panel + enlace módulo) | **Hecho** — `ExecutiveDrilldownDialog` |
| Layout ancho fijo, tipografía, paleta dark | **Hecho** — `max-w-[1600px]`, afinado visual |
| Esquema Pydantic de contrato | **Ref.** — `app/schemas/executive_dashboard_read.py` (cuerpo `data` documentado) |

**Backend**: un solo `GET /dashboard/executive` (sin los 4 sub-endpoints citados con anterioridad; la agregación vive en `dashboard.py`).

---

### 2. Dashboard Equipo

**Ruta actual**: `dashboards/team/page.tsx` (72 líneas)
**Endpoint actual**: `GET /dashboard/team` — devuelve lista de `{user_id, total_vulns, open, closed, closure_rate}`

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| 4 KPIs (Analistas Activos, Actividades Asignadas, En Riesgo/Vencidas, Promedio Avance) | ❌ Solo "Resumen de equipo: N analistas" | **REESCRIBIR** |
| Tabla ordenable con columnas (Analista, Programas, Completadas/Pendientes, Avance%, Liberaciones, Tareas próximas) | ❌ Solo tarjetas con UUID | **REESCRIBIR** con tabla real + sort + nombres |
| Panel lateral al click en analista (Historial barras, Resumen, Actividades pendientes) | ❌ | **CREAR** componente `AnalystSidePanel` |
| Gráfico dona "Distribución Analistas por Estatus" (reemplaza velocímetro) | ❌ | **CREAR** (por tu feedback) |
| Barras de progreso con color semáforo por analista | ❌ | **CREAR** componente `ProgressBarSemaforo` |
| Filtro por mes | ❌ | **AGREGAR** |
| Restricción: analista solo ve su propia fila | ❌ | **IMPLEMENTAR** en backend + frontend |

**Backend**: Refactorizar `/dashboard/team` para devolver datos enriquecidos (nombre, programas, actividades). Nuevo sub-endpoint `/dashboard/team/{user_id}/detail` para panel lateral.

---

### 3. Dashboard Programas Anuales

**Ruta actual**: `dashboards/programs/page.tsx` (76 líneas)
**Endpoint actual**: `GET /dashboard/programs` — devuelve breakdown por `fuente` con `completion_percentage`

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| 5 tarjetas programa con gauge circular (Avance Anual Acumulado + Avance del Mes) | ❌ Solo StatCards planos | **REESCRIBIR** con `GaugeChart` |
| Histórico mensual por programa (cuadritos verde/amarillo/rojo por mes, Ene→Dic) | ❌ | **CREAR** componente `HistoricoMensualGrid` |
| Gráfica barras "Avance Mensual Actual vs Meta (100%) por Programa" | ❌ Solo texto "desglose" | **CREAR** |
| Panel lateral al click en tarjeta (Actividades del Mes con peso/estatus + Historial de Avance línea) | ❌ | **CREAR** componente `ProgramSidePanel` |
| CTA "Ir al Concentrado de Hallazgos del Programa" | ❌ | **AGREGAR** |

**Backend**: Refactorizar `/dashboard/programs` para 5 programas fijos del BRD. Nuevo endpoint `/dashboard/programs/{code}/detail` con actividades mensuales y scoring.

---

### 4. Dashboard Vulnerabilidades Desarrollo (Drill-Down 4 niveles)

**Ruta actual**: `dashboards/vulnerabilities/page.tsx` (110 líneas)
**Endpoint actual**: `GET /dashboard/vulnerabilities` — solo conteos por severidad y estado

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| **Nivel 0 (Global)**: Tarjetas por motor (SAST/SCA/CDS/DAST/MDA/MAST) con conteos | ❌ Solo 3 StatCards | **REESCRIBIR COMPLETO** |
| **Nivel 0**: Semáforo General (ALTO/MEDIO/BAJO) | ❌ | **CREAR** |
| **Nivel 0**: Tendencia Global anual (LineChart multi-serie) | ❌ | **CREAR** endpoint + chart |
| **Nivel 0**: Indicadores Pipeline Global (escaneos, aprobados, rechazados, % aprobación, Top 5) | ❌ | **CREAR** endpoint |
| **Nivel 0**: Recuadros de subdirecciones con mini-resumen | ❌ | **CREAR** endpoint + componente |
| **Nivel 1 (Subdirección)**: Tarjetas por motor (Anterior/Actual/Solventadas/Nuevas) | ❌ | **CREAR** endpoint parametrizado |
| **Nivel 1**: Indicadores Pipeline de subdirección + Top 3 vulns recurrentes | ❌ | **CREAR** |
| **Nivel 1**: Análisis IA | ❌ | **CREAR** (integrar con `ia_provider`) |
| **Nivel 1**: Recuadros de células/organizaciones | ❌ | **CREAR** |
| **Nivel 2 (Célula)**: Resumen Pipeline + gráfica mensual aprobados vs rechazados | ❌ | **CREAR** |
| **Nivel 2**: Tabla repositorios (vulns críticas, altas, score madurez, SLA, último escaneo) | ❌ | **CREAR** |
| **Nivel 3 (Repositorio)**: 4 pestañas (Vulns activas, Historial, Dependencias, Configuración) | ❌ | **CREAR** |
| **Nivel 3**: Tabla completa vulns con chips color severidad, paginación | ❌ | **CREAR** |
| Breadcrumb de navegación entre niveles | ❌ Solo `DashboardBreadcrumbs` genérico | **CREAR** `DrilldownBreadcrumb` |
| Navegación secuencial (click para bajar, ← para subir) | ❌ | **CREAR** state machine |

**Backend**: ~6 nuevos endpoints (`/dashboard/vuln-global`, `/dashboard/vuln-subdireccion/{id}`, `/dashboard/vuln-celula/{id}`, `/dashboard/vuln-repositorio/{id}`, `/dashboard/vuln-repositorio/{id}/dependencias`, `/dashboard/vuln-repositorio/{id}/config`).

> [!WARNING]
> Este es el dashboard más complejo. Requiere ~40% del esfuerzo total del frontend.

---

### 5. Dashboard Concentrado de Vulnerabilidades

**Ruta actual**: ❌ **NO EXISTE** — no hay página ni endpoint
**Endpoint actual**: Ninguno dedicado

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| Dimensión por Motor: 6 tarjetas (SAST/SCA/CDS/DAST/MDA/MAST) con Anterior/Actual/Solventadas/Nuevas + mini chart 3 meses | ❌ | **CREAR TODO** |
| Click en motor → tabla expandida con toggle Vista Agrupada / Vista Plana | ❌ | **CREAR** |
| Dimensión por Severidad: 4 recuadros (Crítica/Alta/Media/Baja) con activas, SLA vencido, nuevas este mes | ❌ | **CREAR** |
| Click en severidad → tabla plana con todas las vulns | ❌ | **CREAR** |
| Barra de filtros completa (Motor, Severidad, Estado, OWASP, Org, Célula, Fechas, SLA vencido) | ❌ | **CREAR** componente `AdvancedFilterBar` |
| Tabs Pipeline / Programa Anual / Bajo Demanda | ❌ | **CREAR** |

**Backend**: ~3 nuevos endpoints (`/dashboard/vuln-concentrated/by-motor`, `/dashboard/vuln-concentrated/by-severity`, `/dashboard/vuln-concentrated/table`).

---

### 6. Dashboard Operación

**Ruta actual**: `dashboards/releases/page.tsx` (117 líneas) — mezcla tabla y kanban básicos
**Endpoint actual**: `/dashboard/releases-table` + `/dashboard/releases-kanban`

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| 2 pestañas (Liberaciones de Servicios / Revisión de Terceros) | ❌ Solo una vista | **CREAR** tabs + endpoint terceros |
| 4 KPIs (Total activas, SLA en riesgo, Observaciones pendientes, Críticas en proceso) | ❌ | **CREAR** |
| Tabla con columnas completas (ID Jira, Servicio, Tipo Cambio, Criticidad chip color, Estatus, Responsable, Fechas, Días en flujo, Alerta SLA) | ❌ Solo `nombre, version, estado` | **REESCRIBIR** tabla con todas las columnas |
| Filtros (Estatus, Tipo cambio, Criticidad, Responsable, Rango fechas) | ❌ Solo `HierarchyFiltersBar` | **CREAR** filtros específicos |
| Panel lateral al click (Flujo estatus visual, Pruebas seguridad, Participantes, Observaciones) | ❌ | **CREAR** componente `ReleaseSidePanel` |
| Estilo visual: **unificar a modo oscuro** (tu feedback) | ❌ | **REDISEÑAR** |
| Paginación real | ❌ | **AGREGAR** |
| Botón "Exportar" | Existe `DashboardCsvExportButton` | ✅ OK |

**Backend**: Refactorizar `/dashboard/releases-table` para incluir todos los campos. Nuevo endpoint para terceros. Nuevo endpoint `/dashboard/release/{id}/detail` para panel lateral.

---

### 7. Kanban de Liberaciones

**Ruta actual**: `kanban/page.tsx` (41 líneas) — Kanban genérico de `tasks`, NO de liberaciones
**Componente**: `KanbanBoard.tsx` — 4 columnas fijas (todo/in_progress/review/done) para tasks

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| 8 columnas del flujo de liberación (configurables) | ❌ 4 columnas fijas de tasks | **REESCRIBIR COMPLETO** `ReleaseKanbanBoard` |
| Tarjetas con info rica (nombre servicio, tipo cambio, criticidad chip, responsable avatar, días en flujo, barra SLA, motores escaneo) | ❌ Solo `nombre · version` | **CREAR** `ReleaseKanbanCard` |
| Drag & drop con validación de reglas de flujo | ❌ D&D existe pero sin validación | **EXTENDER** con reglas configurables |
| Al soltar: actualizar estatus en BD + registrar en bitácora | ❌ Solo actualiza `task.status` | **IMPLEMENTAR** |
| Filtros (Criticidad, Responsable, Tipo cambio) + búsqueda | ❌ Solo selector de proyecto | **CREAR** |
| Toggle Kanban ↔ Tabla | ❌ | **CREAR** |
| Botón "+ Nueva Liberación" | ❌ | **AGREGAR** |
| Columnas configurables por admin | ❌ Hardcoded | **CREAR** endpoint admin + config |
| Contador de tarjetas por columna | ❌ | **AGREGAR** |

**Backend**: Nuevo endpoint `/dashboard/release-kanban-columns` (configurable). Refactorizar `/dashboard/releases-kanban` para datos ricos. Nuevo endpoint `PATCH /service-releases/{id}/move` con validación de reglas + audit log.

---

### 8. Dashboard Iniciativas

**Ruta actual**: `dashboards/initiatives/page.tsx` (81 líneas)
**Endpoint actual**: `GET /dashboard/initiatives` — solo `total`, `in_progress`, `completed`, `completion_percentage`

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| 4 KPIs (Total activas, Avance promedio, En riesgo, Próximas a cerrar) | ❌ Solo 4 StatCards básicos | **REESCRIBIR** con datos enriquecidos |
| Tabla con columnas completas (Nombre, Tipo chip, Responsable avatar, Fecha inicio/fin, % Avance barra semáforo, Estatus chip, Días restantes) | ❌ No hay tabla | **CREAR** tabla completa |
| Filtros (Tipo, Estatus, Responsable, Rango fechas) | ❌ | **CREAR** |
| Barras progreso con color semáforo dinámico | ❌ | **CREAR** componente |
| Panel lateral al click (Descripción, Info general, Ponderación mensual tabla, Historial avance línea, "Ver plan de trabajo") | ❌ | **CREAR** `InitiativeSidePanel` |
| Tabs en panel lateral (Resumen, Actividades, Documentos, Riesgos, Notas) | ❌ | **CREAR** |
| Botón "+ Nueva Iniciativa" | ❌ | **AGREGAR** |
| Paginación | ❌ | **AGREGAR** |

**Backend**: Refactorizar `/dashboard/initiatives` para datos completos. Nuevo endpoint `/dashboard/initiative/{id}/detail` con ponderación mensual e historial.

---

### 9. Dashboard Temas Emergentes

**Ruta actual**: `dashboards/emerging-themes/page.tsx` (64 líneas)
**Endpoint actual**: `GET /dashboard/emerging-themes` — solo `total_themes`, `unmoved_7_days`, `active`

| Elemento de la imagen | ¿Existe? | Acción |
|----------------------|----------|--------|
| 4 KPIs (Total abiertos, Sin movimiento >7 días, Próximos a vencer, Cerrados este mes) | ❌ Solo 3 StatCards | **REESCRIBIR** |
| Tabla con columnas (Nombre, Tipo chip color, Responsable avatar, Fecha registro, Fecha compromiso, Días abierto con color dinámico, Último movimiento, Estatus chip) | ❌ No hay tabla | **CREAR** tabla completa |
| Columna "Días abierto" cambia color al superar umbral | ❌ | **IMPLEMENTAR** lógica semáforo |
| Filtros (Tipo, Estatus, Responsable, Área, Rango fechas, Sin movimiento en X días) | ❌ | **CREAR** |
| Panel lateral al click con: Descripción, Bitácora timeline/chat, Actividades seguimiento tabla, Origen del tema (Ticket/Fuente/ID/Enlace) | ❌ | **CREAR** `EmergingThemeSidePanel` |
| Input "Escribe un comentario..." en bitácora | ❌ | **CREAR** componente de chat |
| Botón "+ Nuevo Tema Emergente" | ❌ | **AGREGAR** |
| Paginación | ❌ | **AGREGAR** |

**Backend**: Refactorizar `/dashboard/emerging-themes` para datos completos. Nuevo endpoint `/dashboard/tema/{id}/detail` con bitácora y actividades.

---

## Componentes Transversales a Crear

| Componente | Dashboards que lo usan |
|-----------|----------------------|
| `GaugeChart` (velocímetro circular) | 1, 3 |
| `SemaforoSla` (verde/amarillo/rojo con conteos) | 1, 4 |
| `HistoricoMensualGrid` (cuadritos color por mes) | 3 |
| `SidePanel` (panel deslizante derecha con tabs) | 2, 3, 6, 8, 9 |
| `DrilldownBreadcrumb` (navegación niveles) | 4 |
| `AdvancedFilterBar` (filtros múltiples tipo/estado/fechas) | 5, 6, 8, 9 |
| `ProgressBarSemaforo` (barra con color dinámico) | 2, 8 |
| `SeverityChip` (chip color por severidad) | 4, 5 |
| `StatusChip` (chip color por estatus) | 6, 7, 8, 9 |
| `HorizontalBarRanking` (top N con barras) | 1 |
| `ReleaseKanbanBoard` (nuevo kanban para releases) | 7 |
| `TimelineBitacora` (chat/timeline de comentarios) | 9 |
| `AreaLineChart` (área rellena + línea meta) | 1, 3, 4 |

---

## Cambios en Permisos (Consolidación de Feedback)

### Nuevos Roles a Crear

| Rol | Descripción |
|-----|-------------|
| `ciso` | Director de seguridad — ve todo, dashboard ejecutivo |
| `responsable_celula` | Gestiona datos de su célula |
| `director_subdireccion` | Ve todos los datos de su subdirección |
| `lider_liberaciones` | Gestiona flujo Kanban y liberaciones |

> `lider_programa` y `auditor` ya existen en `RolEnum`.

### Matriz de Acceso Confirmada (Nivel 1)

| Dashboard | admin | ciso | dir_sub | lider_prog | resp_cel | analista | lider_lib | auditor | readonly |
|-----------|-------|------|---------|------------|----------|----------|-----------|---------|----------|
| 1. General | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 2. Equipo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ |
| 3. Programas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 4. Vulns DD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 5. Concentrado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 6. Operación | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 7. Kanban | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 8. Iniciativas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 9. Temas Emerg | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> \* Analista en Equipo: solo ve su propia fila

### Reglas Confirmadas

- **Scope cascada**: Subdirección → Gerencia → Organización → Célula (herencia hacia abajo)
- **Columnas Kanban**: Configurables por admin (8 default, modificables sin código)
- **Dependencias (pestaña Nivel 3)**: Funcionalidad real — datos SCA
- **Configuración (pestaña Nivel 3)**: Funcionalidad real — ficha del repo (prioridad menor)
- **Admin de permisos**: Extender `/admin/roles` existente con los 3 niveles
