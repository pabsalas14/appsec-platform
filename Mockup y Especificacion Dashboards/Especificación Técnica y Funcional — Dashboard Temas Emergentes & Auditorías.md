# Especificación Técnica y Funcional — Dashboard Temas Emergentes & Auditorías

**Versión:** 1.0  
**Módulo:** Seguimiento › Temas Emergentes & Auditorías  
**Acceso:** Analista AppSec, Coordinador, Jefe de AppSec

---

## 1. Propósito

Centralizar el seguimiento de dos tipos de eventos de seguridad que requieren atención especial:

- **Temas Emergentes:** Vulnerabilidades 0-Day, amenazas APT, incidentes de seguridad, alertas regulatorias y cualquier evento de seguridad no planificado que requiera respuesta inmediata del equipo AppSec.
- **Auditorías:** Procesos de revisión formal realizados por auditores internos o externos (CNBV, Deloitte, PwC, Auditoría Interna) con hallazgos que deben ser remediados en plazos definidos.

---

## 2. Estructura General de la Pantalla

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: Breadcrumb | Selector de Año | Exportar | + Nuevo Tema  │
├─────────────────────────────────────────────────────────────────┤
│ TABS: [ Temas Emergentes ]  [ Auditorías ]                      │
├─────────────────────────────────────────────────────────────────┤
│ FILTER BAR: Búsqueda | Chips de Estatus | Célula | Tipo         │
├─────────────────────────────────────────────────────────────────┤
│ KPI ROW (5 tarjetas clickeables)                                │
├──────────────────────────────┬──────────────────────────────────┤
│ Gráfica: Por Tipo (barras)   │ Donut: Por Estatus               │
├──────────────────────────────┴──────────────────────────────────┤
│ TABLA: Lista de Temas / Auditorías                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Topbar

**Posición:** Barra superior fija (sticky), altura 44px.

**Elementos:**
- **Breadcrumb:** `Inicio › Temas Emergentes & Auditorías`. "Inicio" navega al Dashboard Ejecutivo.
- **Selector de Año:** Dropdown con años disponibles (por defecto el año en curso).
- **Botón Exportar:** Descarga la vista activa (pestaña activa) como CSV o PDF con los filtros aplicados.
- **Botón "+ Nuevo Tema":** Abre el modal de creación de Tema Emergente. Solo visible en la pestaña de Temas Emergentes.

---

## 4. Pestañas

El dashboard tiene dos pestañas que comparten el mismo layout pero muestran datos distintos:

| Pestaña | Entidad | Botón de Creación |
|---|---|---|
| **Temas Emergentes** | Eventos de seguridad no planificados | "+ Nuevo Tema" |
| **Auditorías** | Procesos de auditoría formal | "+ Nueva Auditoría" |

Al cambiar de pestaña, los KPIs, gráficas y tabla se actualizan en tiempo real sin recargar la página.

---

## 5. Filter Bar

**Posición:** Barra secundaria debajo de las pestañas, altura 38px.

**Componentes:**
- **Campo de Búsqueda:** Filtra en tiempo real por ID, nombre del tema/auditoría o responsable.
- **Chips de Estatus (Temas):** `Todos` | `Abierto` | `En Proceso` | `Cerrado`. Selección única.
- **Chips de Estatus (Auditorías):** `Todos` | `Planificada` | `En Proceso` | `Cerrada`. Selección única.
- **Selector de Célula:** Dropdown con todas las células de la organización.
- **Selector de Tipo (Temas):** Dropdown con tipos: Vulnerabilidad 0-Day, Amenaza APT, Incidente, Alerta Regulatoria, Otro.
- **Selector de Auditor (Auditorías):** Dropdown con los auditores registrados.

Todos los filtros son acumulativos y se aplican simultáneamente.

---

## 6. KPI Cards — Pestaña Temas Emergentes

Fila de 5 tarjetas. Cada tarjeta es **clickeable** y abre el Panel de Drill-down con la lista de temas que componen ese número.

| Tarjeta | Descripción | Color |
|---|---|---|
| Total Temas | Count total del año | Azul |
| Abiertos | Temas sin plan de acción activo | Rojo |
| En Proceso | Temas con plan de acción en ejecución | Amarillo |
| Cerrados | Temas resueltos | Verde |
| Críticos Activos | Temas con severidad Crítica y estatus Abierto o En Proceso | Rojo con ícono ⚠ |

---

## 7. KPI Cards — Pestaña Auditorías

| Tarjeta | Descripción | Color |
|---|---|---|
| Total Auditorías | Count total del año | Azul |
| En Proceso | Auditorías activas | Amarillo |
| Hallazgos Abiertos | Count de hallazgos sin remediar | Rojo |
| Hallazgos Cerrados | Count de hallazgos remediados | Verde |
| SLA Vencido | Hallazgos cuyo plazo de remediación venció | Rojo |

---

## 8. Gráficas

### 8.1 Gráfica: Por Tipo (Temas) / Por Auditor (Auditorías)
**Tipo:** Bar chart horizontal.
**Posición:** Fila 2, columna izquierda (2/3 del ancho).
**Interacción:** Clic en cualquier barra → Panel de Drill-down con los registros de ese tipo/auditor.

### 8.2 Donut: Por Estatus
**Tipo:** Doughnut chart.
**Posición:** Fila 2, columna derecha (1/3 del ancho).
**Interacción:** Clic en cualquier segmento → Panel de Drill-down con los registros de ese estatus.

---

## 9. Tabla de Temas Emergentes

**Posición:** Fila 3, ancho completo.

**Columnas:**

| Columna | Tipo | Descripción |
|---|---|---|
| ID | Texto | Identificador único (ej. TE-2025-024) |
| Tema | Texto negrita | Nombre descriptivo del tema |
| Tipo | Badge color | Vulnerabilidad 0-Day / APT / Incidente / Regulatoria / Otro |
| Severidad | Badge color | Crítica (rojo) / Alta (naranja) / Media (azul) |
| Célula Afectada | Texto | Célula(s) impactada(s) |
| Responsable | Texto | Analista asignado |
| Estatus | Badge color | Abierto / En Proceso / Cerrado |
| Fecha | Texto | Fecha de detección |
| SLA | Texto color | Días restantes o "Vencido" en rojo |

**Interacciones:**
- **Clic en fila** → Abre el Drawer de Detalle del Tema.
- **Ordenamiento:** Clic en encabezado de columna.
- **Selección múltiple:** Checkbox para acciones masivas (Cambiar estatus, Exportar selección).

---

## 10. Tabla de Auditorías

**Columnas:**

| Columna | Tipo | Descripción |
|---|---|---|
| ID | Texto | Identificador único (ej. AUD-2025-008) |
| Nombre | Texto negrita | Nombre de la auditoría |
| Auditor | Texto | Entidad auditora |
| Tipo | Badge | Regulatoria / Interna / Externa |
| Hallazgos | Número | Total de hallazgos identificados |
| Abiertos | Número rojo | Hallazgos pendientes de remediar |
| Estatus | Badge color | Planificada / En Proceso / Cerrada |
| Fecha Inicio | Texto | Fecha de inicio de la auditoría |
| Fecha Cierre | Texto | Fecha de cierre programada o real |

**Interacciones:**
- **Clic en fila** → Abre el Drawer de Detalle de Auditoría.

---

## 11. Drawer de Detalle — Tema Emergente

**Activación:** Clic en cualquier fila de la tabla de Temas.
**Posición:** Panel lateral derecho, ancho 560px, desliza desde la derecha.

### 11.1 Cabecera
- **Título:** ID del Tema (ej. `TE-2025-024`).
- **Subtítulo:** Nombre descriptivo del tema.

### 11.2 KPIs del Drawer (3 tarjetas)
| KPI | Descripción |
|---|---|
| Estatus | Badge con color según estatus actual |
| Severidad | Badge con color según severidad |
| SLA | Días restantes o "Vencido" en rojo |

### 11.3 Información del Tema
Tabla de pares clave-valor:
- Tipo, Célula Afectada, Responsable, Fecha de Detección, Fuente (CISA KEV / CNBV / Interno / Otro).

### 11.4 Plan de Acción
Campo de texto editable donde el responsable documenta las acciones a tomar. Incluye botón "Guardar" para persistir los cambios.

### 11.5 Historial (Timeline)
Registro cronológico de todos los cambios de estatus y comentarios, con fecha, hora y usuario que realizó el cambio.

### 11.6 Botones de Acción
- **Actualizar Avance:** Abre un modal para cambiar el estatus y agregar un comentario de progreso.
- **Escalar:** Cambia el estatus a "Escalado" y envía notificación al Jefe de AppSec.

---

## 12. Drawer de Detalle — Auditoría

**Activación:** Clic en cualquier fila de la tabla de Auditorías.

### 12.1 Cabecera
- **Título:** ID de la Auditoría.
- **Subtítulo:** Nombre de la auditoría.

### 12.2 KPIs del Drawer (4 tarjetas)
| KPI | Descripción |
|---|---|
| Estatus | Planificada / En Proceso / Cerrada |
| Total Hallazgos | Count total |
| Hallazgos Abiertos | Count en rojo |
| Días para Cierre | Días restantes hasta la fecha de cierre |

### 12.3 Información de la Auditoría
- Auditor, Tipo, Fecha Inicio, Fecha Cierre, Responsable AppSec, Alcance.

### 12.4 Tabla de Hallazgos
Lista de todos los hallazgos de esta auditoría con columnas: ID Hallazgo, Descripción, Severidad, Responsable de Remediación, Estatus, Fecha Límite.

**Interacción:** Clic en un hallazgo → Abre un sub-drawer con el detalle del hallazgo individual, incluyendo la evidencia de remediación y el historial.

---

## 13. Panel de Drill-down

**Activación:** Clic en cualquier KPI card, barra de gráfica o segmento del donut.
**Posición:** Panel lateral derecho, ancho 480px.
**Contenido:** Tabla filtrada de los registros que componen el número seleccionado, con las mismas columnas de la tabla principal. Cada fila abre el Drawer de Detalle correspondiente.

---

## 14. Modal de Creación — Tema Emergente

**Activación:** Botón "+ Nuevo Tema" en el Topbar.
**Tipo:** Modal centrado, ancho 560px.

**Campos del formulario:**

| Campo | Tipo | Obligatorio |
|---|---|---|
| Nombre del Tema | Texto libre | Sí |
| Tipo | Dropdown | Sí |
| Severidad | Dropdown (Crítica/Alta/Media) | Sí |
| Célula(s) Afectada(s) | Multi-select | Sí |
| Responsable | Dropdown de usuarios | Sí |
| Fecha de Detección | Date picker | Sí |
| Fuente | Dropdown (CISA KEV/CNBV/Interno/Otro) | Sí |
| SLA (días) | Número | Sí |
| Descripción | Textarea | No |
| Plan de Acción Inicial | Textarea | No |

---

## 15. Reglas de Negocio

1. **SLA de Temas Críticos:** Un tema con severidad Crítica debe tener un plan de acción documentado en un máximo de 24 horas desde su creación. Si no lo tiene, el sistema muestra una alerta visual en la tarjeta.
2. **SLA de Temas Altos:** Máximo 7 días hábiles para documentar el plan de acción.
3. **Cierre de Tema:** Solo puede cerrarse si el responsable adjunta evidencia de resolución (archivo o comentario de cierre).
4. **Cierre de Auditoría:** Solo puede cerrarse si todos sus hallazgos tienen estatus "Cerrado" o "Aceptado con Riesgo".
5. **Notificaciones:** Al crear un tema Crítico, el sistema notifica automáticamente al Jefe de AppSec y al Coordinador de la célula afectada.

---

## 16. Permisos por Rol

| Acción | Analista | Coordinador | Jefe | Admin |
|---|---|---|---|---|
| Ver dashboard | ✓ | ✓ | ✓ | ✓ |
| Crear tema emergente | ✓ | ✓ | ✓ | ✓ |
| Actualizar avance | ✓ | ✓ | ✓ | ✓ |
| Cerrar tema | ✗ | ✓ | ✓ | ✓ |
| Crear auditoría | ✗ | ✓ | ✓ | ✓ |
| Cerrar auditoría | ✗ | ✗ | ✓ | ✓ |
| Exportar | ✓ | ✓ | ✓ | ✓ |
