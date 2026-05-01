# Especificación Funcional y Técnica: Dashboard Programas Anuales

**Versión:** 2.0  
**Módulo:** Programas Anuales  
**Acceso:** Analista AppSec, Coordinador, Jefe de AppSec, Director

---

## 1. Propósito

Proveer a los Jefes de Célula, Coordinadores y Directores una vista consolidada del avance de todos los programas de seguridad del ciclo anual en curso. Permite identificar programas en riesgo, ver el detalle de actividades por programa, desglosar el avance mes a mes, y cargar evidencias directamente desde el dashboard.

---

## 2. Estructura General de la Pantalla

El dashboard tiene dos vistas principales: la **Vista Global** (todos los programas) y la **Vista de Detalle** (un programa específico con desglose mensual).

### Vista Global (Pantalla Inicial)
```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: Breadcrumb | Selector de Año | Filtros | Exportar       │
├─────────────────────────────────────────────────────────────────┤
│ KPI ROW (5 tarjetas):                                           │
│ Programas Activos | Avance Promedio | Actividades Completadas | │
│ Actividades en Riesgo | Score de Madurez Promedio               │
├─────────────────────────────────────────────────────────────────┤
│ GRID DE PROGRAMAS (Tarjetas clickeables):                       │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐  │
│ │ Programa 1       │ │ Programa 2       │ │ Programa 3       │  │
│ │ Avance: 85%      │ │ Avance: 62%      │ │ Avance: 40%      │  │
│ │ [E F M A M J...] │ │ [E F M A M J...] │ │ [E F M A M J...] │  │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘  │
├──────────────────────────────┬──────────────────────────────────┤
│ Gráfica: Tendencia de Avance │ Donut: Distribución de           │
│ Mensual por Programa         │ Actividades por Estatus          │
└──────────────────────────────┴──────────────────────────────────┘
```

### Vista de Detalle (Al hacer clic en un Programa)
```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: Inicio › Programas Anuales › [Nombre del Programa]      │
├─────────────────────────────────────────────────────────────────┤
│ HEADER DEL PROGRAMA:                                            │
│ Título | Avance Global: 85% | Score: 92 | Responsable           │
├─────────────────────────────────────────────────────────────────┤
│ TIMELINE MENSUAL (Clickeable):                                  │
│ (Ene) ─ (Feb) ─ (Mar) ─ (Abr) ─ (May) ─ (Jun) ─ (Jul) ...       │
├──────────────────────────────┬──────────────────────────────────┤
│ Gráfica: Avance vs Meta      │ Gráfica: Actividades por Estatus │
│ (Mes seleccionado)           │ (Mes seleccionado)               │
├──────────────────────────────┴──────────────────────────────────┤
│ TABLA DE ACTIVIDADES DEL MES SELECCIONADO:                      │
│ Actividad | Tipo | Meta Mes | Avance Mes | Evidencia | Estatus  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Detallados — Vista Global

### 3.1 Topbar y Filtros
- **Selector de Año:** Dropdown para cambiar entre ciclos anuales (ej. 2024, 2025). Al cambiar, recarga todos los datos.
- **Filtros:** Drawer lateral con filtros por Célula, Responsable y Estado del Programa.

### 3.2 KPI Cards (Drill-down Universal)
Cinco tarjetas numéricas. **Todas son clickeables** y abren el Panel de Drill-down lateral con la lista de registros correspondientes.
- **Programas Activos:** Total de programas en el ciclo.
- **Avance Promedio:** Promedio ponderado del avance de todos los programas.
- **Actividades Completadas:** Fracción (ej. 45/120) y porcentaje.
- **Actividades en Riesgo:** Actividades con avance menor al esperado para la fecha actual.
- **Score de Madurez Promedio:** Promedio del score de todos los programas (0-100).

### 3.3 Grid de Tarjetas de Programas
Cada tarjeta representa un programa y contiene:
- **Cabecera:** Nombre, Tipo y Badge de estado (Verde = En Tiempo, Amarillo = En Progreso, Rojo = En Riesgo).
- **Avance:** Porcentaje grande y barra de progreso.
- **Timeline Anual Mini:** 12 puntos (Ene-Dic) con código de color (Verde = completado, Amarillo = parcial, Gris = pendiente).
- **Interacción:** Clic en cualquier parte de la tarjeta navega a la **Vista de Detalle** de ese programa.

### 3.4 Gráficas Globales
- **Tendencia de Avance Mensual:** Line chart comparativo. Eje X: 12 meses. Eje Y: % de avance. Una línea por programa.
- **Distribución de Actividades:** Donut chart (Completadas, En Progreso, En Riesgo, Pendientes). Clic en un segmento abre el Panel de Drill-down con esas actividades.

---

## 4. Componentes Detallados — Vista de Detalle (Desglose Mensual)

Al hacer clic en un programa, la pantalla cambia a esta vista.

### 4.1 Header y Timeline Mensual Interactivo
- **Header:** Muestra los KPIs globales del programa seleccionado (Avance total, Score, Responsable).
- **Timeline Mensual:** Una barra horizontal con 12 nodos (Ene a Dic).
  - Cada nodo muestra el % de avance logrado en ese mes.
  - **Interacción:** Al hacer clic en un mes (ej. "Marzo"), las gráficas inferiores y la tabla se actualizan para mostrar **únicamente los datos de ese mes**.

### 4.2 Gráficas del Mes Seleccionado
- **Avance vs Meta:** Bar chart comparando el avance real logrado en el mes seleccionado vs. la meta planificada para ese mes.
- **Actividades por Estatus:** Donut chart del estado de las actividades en el mes seleccionado.

### 4.3 Tabla de Actividades del Mes
Muestra solo las actividades que tienen entregables o metas programadas para el mes seleccionado en el timeline.

| Columna | Descripción |
|---|---|
| Actividad | Nombre descriptivo |
| Tipo | Fija (entregable único) o Divisible (avance progresivo) |
| Meta Mes | % de avance que se esperaba lograr en este mes |
| Avance Mes | % de avance real reportado en este mes |
| Evidencia | Ícono de clip. Clic abre el documento adjunto. |
| Estatus | Badge (Completado / En Progreso / En Riesgo) |
| Acción | Botón "Actualizar" (abre el Drawer de Carga de Evidencia) |

---

## 5. Drawer de Carga de Evidencia

Panel lateral derecho que se abre al hacer clic en "Actualizar" en cualquier fila de actividad.

**Campos:**
- **Actividad:** Nombre (solo lectura).
- **Mes a reportar:** Dropdown (por defecto el mes seleccionado en el timeline). Permite reportar avance retroactivo de meses anteriores.
- **% de Avance Alcanzado en el mes:** Input numérico (0-100).
- **Comentario / Justificación:** Textarea obligatorio si el avance es menor a la meta.
- **Evidencia:** Zona de Drag & Drop para subir archivos (PDF, XLSX, PNG, máx 25MB).

**Acción "Guardar":**
Actualiza el avance de la actividad para ese mes, recalcula automáticamente el avance global del programa y actualiza las gráficas. Registra la acción en el Audit Log.

---

## 6. Panel de Drill-down Universal

Panel lateral derecho que se abre al hacer clic en cualquier KPI global, segmento de donut o barra de gráfica.

- **Contenido:** Tabla con la lista de registros que componen el número clickeado.
- **Ejemplo:** Si se hace clic en el KPI "12 Actividades en Riesgo", el panel muestra una tabla con esas 12 actividades, indicando a qué programa pertenecen y su responsable. Cada fila tiene un botón para ir directo al detalle de esa actividad.

---

## 7. Reglas de Negocio

1. **Cálculo de Avance de Actividad Divisible:** El avance total de la actividad es la suma de los avances reportados en cada mes, topado al 100%.
2. **Cálculo de Avance del Programa:** Promedio ponderado del avance total de todas sus actividades. Los pesos se configuran en el Motor de Scoring.
3. **Actualización Retroactiva:** Si un usuario carga evidencia para un mes pasado (ej. estamos en Mayo y carga evidencia para Marzo), el sistema recalcula el histórico y actualiza la gráfica de tendencia global para reflejar el cambio en Marzo.
4. **Estado "En Riesgo":** Una actividad se marca en riesgo automáticamente si llega el último día del mes y su avance reportado es menor a la meta planificada para ese mes.
