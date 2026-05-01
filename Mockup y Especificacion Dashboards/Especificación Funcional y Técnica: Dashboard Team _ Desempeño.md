# Especificación Funcional y Técnica: Dashboard Team / Desempeño

## 1. Objetivo
Permitir a los Jefes de Célula y Coordinadores monitorear el desempeño individual de los analistas de su equipo, identificar cargas de trabajo desbalanceadas, detectar miembros con OKRs en riesgo y tomar decisiones de reasignación de tareas.

## 2. Audiencia y Permisos

| Rol | Pestaña disponible | Alcance |
|---|---|---|
| Analista | No tiene acceso a este dashboard | — |
| Jefe de Célula | Mi Equipo | Solo los analistas de su célula |
| Coordinador | Mi Equipo + Por Célula | Las células bajo su coordinación |
| Director / CISO | Todas las pestañas | Toda la jerarquía |

## 3. Estructura de la Pantalla

### Barra Superior
Contiene: **Selector de Mes** (por defecto el mes en curso), botón **Filtros** que abre un drawer con opciones de filtrado por Motor, Célula y Rango de Score, y botón **Exportar** que genera un reporte de desempeño del equipo en el período seleccionado.

### Pestañas de Navegación
Tres pestañas: **Mi Equipo**, **Por Célula** y **Por Subdirección**. La pestaña activa se indica con subrayado azul. Al cambiar de pestaña, el contenido se actualiza reactivamente.

### Bloque KPIs (5 tarjetas)
- **Miembros del Equipo**: cantidad de analistas activos en la célula/área seleccionada.
- **Score Promedio**: promedio del score de desempeño de todos los miembros del período, sobre 100.
- **Vulns Remediadas (mes)**: total de vulnerabilidades remediadas por el equipo en el mes, con tendencia vs. mes anterior.
- **Actividades Completadas**: cantidad de actividades de programa completadas vs. total asignadas.
- **OKRs en Riesgo**: cantidad de Key Results con avance < 40% en el equipo.

### Grid de Tarjetas de Miembro
Grid de 3 columnas (responsive a 2 en pantallas medianas) con una tarjeta por analista. Cada tarjeta contiene:

**Cabecera:** Avatar con iniciales y color único por analista, nombre, rol/especialización y score numérico con color según semáforo (Verde ≥ 75, Amarillo 50–74, Rojo < 50).

**Barra de Score:** Barra de progreso horizontal con gradiente de color según el rango del score.

**Grid de métricas (2×2):** Vulnerabilidades remediadas en el mes, porcentaje de SLA cumplido, actividades completadas vs. asignadas, y estado de OKRs (badge Verde/Amarillo/Rojo).

**Al hacer clic en la tarjeta:** Navega a la vista de detalle del analista (página completa) que muestra: todas sus vulnerabilidades asignadas con filtros, sus actividades de programa del mes, sus OKRs con avance, y su historial de score de los últimos 6 meses.

### Bloque de Gráficas (2 columnas)
**Gráfica izquierda — Score de Desempeño por Miembro:** Gráfica de barras horizontales con una barra por analista, coloreada según el semáforo del score. El eje X va de 0 a 100.

**Gráfica derecha — Vulnerabilidades Remediadas por Miembro:** Gráfica de barras verticales con el conteo de vulnerabilidades remediadas en el mes por cada analista, en color azul.

### Tabla de Carga de Trabajo
Tabla con las columnas: Analista, Motor principal, Vulnerabilidades asignadas, En Remediación, SLA Vencido, % SLA Cumplido y barra de Carga (porcentaje de capacidad utilizada). Las filas con carga > 80% se resaltan con fondo rojo tenue. Al hacer clic en una fila, navega a la vista de detalle del analista.

## 4. Vista de Detalle del Analista (página completa)
Al hacer clic en una tarjeta de miembro, se navega a una página de detalle con:

**Cabecera:** Nombre, avatar, rol, célula y período seleccionado.

**4 pestañas:** Vulnerabilidades Asignadas, Actividades de Programa, OKRs y Historial de Score.

**Pestaña Vulnerabilidades:** Tabla de todas las vulnerabilidades asignadas al analista con filtros por Motor, Severidad y Estatus. Incluye botón "Reasignar" que permite al Jefe transferir vulnerabilidades a otro analista.

**Pestaña Actividades:** Lista de actividades del programa anual asignadas al analista en el mes, con su estatus y evidencias adjuntas.

**Pestaña OKRs:** Lista de Key Results asignados al analista con su avance actual y semáforo.

**Pestaña Historial de Score:** Gráfica de línea con el score mensual del analista en los últimos 12 meses.

## 5. Cálculo del Score de Desempeño

El score se calcula automáticamente al cierre de cada mes con la siguiente fórmula ponderada:

| Componente | Peso | Descripción |
|---|---|---|
| % de SLA cumplido | 40% | Vulnerabilidades remediadas dentro del SLA / total asignadas |
| Actividades completadas | 30% | Actividades de programa completadas / total asignadas en el mes |
| Avance de OKRs | 20% | Promedio de avance de los KRs asignados al analista |
| Tasa de reincidencias | 10% | Inverso: 100% − % de reincidencias en sus remediaciones |

El score final es un número de 0 a 100. El semáforo se aplica: Verde ≥ 75, Amarillo 50–74, Rojo < 50.

## 6. Interacciones y Navegaciones

| Elemento | Acción | Resultado |
|---|---|---|
| Tarjetas KPI (Bloque KPIs) | Clic | Abre el Panel de Drill-down con la tabla de registros correspondientes al KPI |
| Barras de Gráficas | Clic | Abre el Panel de Drill-down con la tabla de registros correspondientes a la barra |
| Tarjeta de miembro | Clic | Navega a la vista de detalle del analista (página completa) |
| Pestaña de navegación | Clic | Cambia la vista (Mi Equipo / Por Célula / Por Subdirección) |
| Fila de tabla de carga | Clic | Navega a la vista de detalle del analista |
| Botón "Reasignar" en detalle | Clic | Abre modal de reasignación con selector de analista destino |
| Selector de Mes | Cambio | Recalcula todos los datos del mes seleccionado |
| Botón Exportar | Clic | Genera reporte de desempeño del equipo en PDF |

**Nota sobre Drill-down Universal:** Todos los elementos numéricos y gráficos del dashboard (KPIs, barras de gráficas) son interactivos. Al hacer clic en ellos, se abre un **Panel de Drill-down** (drawer lateral) que muestra la tabla detallada de los registros que componen ese número o gráfica, permitiendo una exploración profunda de los datos sin perder el contexto del dashboard.

## 7. Modal de Reasignación de Vulnerabilidades

Al hacer clic en el botón "Reasignar" (disponible en la pestaña de Vulnerabilidades Asignadas de la vista de detalle), se abre un modal para transferir la carga de trabajo:

- **Selección de Vulnerabilidades:** El usuario puede seleccionar una, varias o todas las vulnerabilidades de la tabla actual mediante checkboxes.
- **Analista Destino:** Dropdown que lista a todos los analistas activos de la misma célula o subdirección. Muestra la carga actual de cada analista (ej. "Juan Pérez - 45 asignadas") para ayudar en la decisión.
- **Comentario:** Textarea opcional para justificar la reasignación.
- **Acción:** Al confirmar, las vulnerabilidades cambian de responsable, se registra el evento en la bitácora de cada vulnerabilidad, y se envía una notificación automática al analista destino. Las gráficas y KPIs del dashboard se actualizan reactivamente.
| Selector de Mes | Cambio | Recalcula todos los datos del mes seleccionado |
| Botón Exportar | Clic | Genera reporte de desempeño del equipo en PDF |
