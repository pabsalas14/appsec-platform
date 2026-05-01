# Especificación Funcional y Técnica: Dashboard Vulnerabilidades por Motor

## 1. Objetivo
Proveer a los analistas y jefes de célula una vista técnica y operativa del estado de vulnerabilidades desglosada por motor de análisis (SAST, DAST, SCA, CDS, MDA, MAST). A diferencia del Dashboard Organizacional (que navega por jerarquía), este dashboard permite comparar el comportamiento de cada motor, identificar las vulnerabilidades más recurrentes y gestionar las que tienen SLA vencido.

## 2. Audiencia y Permisos

| Rol | Alcance |
|---|---|
| Analista | Solo los motores y repositorios asignados a su célula |
| Jefe de Célula | Todos los motores de su célula |
| Coordinador / Director | Todos los motores de las células bajo su jerarquía |
| Admin / CISO | Toda la organización |

## 3. Estructura de la Pantalla

### Barra Superior
Contiene: **Selector de Rango de Fechas** (por defecto el año en curso), botón **Filtros** que abre un drawer con opciones de filtrado por Célula, Organización, Severidad y Estatus, y botón **Exportar** que genera un reporte del motor actualmente seleccionado.

### Selector de Motor
Fila de 6 botones posicionada debajo de la barra superior, uno por motor (SAST, DAST, SCA, CDS/Secretos, MDA/Threat Modeling, MAST). Cada botón tiene un punto de color identificador del motor. Al hacer clic en un motor, todos los componentes del dashboard se actualizan reactivamente para mostrar los datos de ese motor. El motor activo se resalta con borde de color y fondo ligeramente diferenciado. El breadcrumb también se actualiza para reflejar el motor seleccionado.

### Bloque KPIs (6 tarjetas)
Seis tarjetas en fila horizontal, actualizadas reactivamente al cambiar el motor:
- **Activas (A+C)**: total de vulnerabilidades Altas y Críticas activas del motor seleccionado, con tendencia vs. mes anterior.
- **Críticas**: total de vulnerabilidades Críticas activas. Muestra "Acción inmediata" como subtexto.
- **Altas**: total de vulnerabilidades Altas activas. Muestra el SLA aplicable como subtexto.
- **Remediadas (mes)**: cantidad de vulnerabilidades cuyo estatus cambió a "Remediada" en el mes actual, con tendencia vs. mes anterior.
- **SLA Vencido**: cantidad de vulnerabilidades activas cuyo SLA ha expirado, con el porcentaje que representan del backlog total.
- **Falsos Positivos**: porcentaje de vulnerabilidades marcadas como Falso Positivo sobre el total importado, con tendencia vs. mes anterior.

### Bloque Gráficas — Fila 1 (proporción 2:1)
**Gráfica izquierda — Tendencia Mensual:** Gráfica de líneas con 3 series: Activas (área sombreada con el color del motor), Remediadas (verde) y Nuevas (rojo punteado). El eje X muestra los 12 meses del período seleccionado. Al pasar el cursor sobre un punto, el tooltip muestra los valores exactos de las 3 series en ese mes.

**Gráfica derecha — Distribución por Severidad:** Gráfica de donut con 4 segmentos (Críticas, Altas, Medias, Bajas). Al hacer clic en un segmento, el sistema navega al módulo de Vulnerabilidades con el filtro de motor y severidad correspondiente preseleccionado.

### Bloque Gráficas — Fila 2 (proporción 1:1)
**Gráfica izquierda — SLA: Días Promedio de Remediación por Severidad:** Gráfica de barras agrupadas que compara el tiempo promedio real de remediación contra el SLA objetivo, por severidad (Crítica 7d, Alta 30d, Media 60d, Baja 90d). Las barras que superan el SLA se muestran en rojo.

**Gráfica derecha — Reincidencias vs Nuevas (últimos 6 meses):** Gráfica de barras apiladas que muestra, mes a mes, cuántas vulnerabilidades son nuevas vs. cuántas son reincidentes (misma vulnerabilidad que ya fue remediada y volvió a aparecer).

### Bloque Top 10 Vulnerabilidades más Frecuentes
Lista de 10 ítems con: número de ranking, nombre de la vulnerabilidad, badge de severidad, barra de progreso proporcional al conteo y conteo numérico. Al hacer clic en cualquier ítem, se abre el **Drawer de Detalle** de esa vulnerabilidad.

### Bloque Tabla de Vulnerabilidades con SLA Vencido
Tabla con las columnas: ID, Hallazgo, Repositorio/Activo, Severidad, SLA Vencido (días en negativo), Responsable y Estatus. Las filas se ordenan por días de vencimiento de mayor a menor. Al hacer clic en cualquier fila, se abre el **Drawer de Detalle** de esa vulnerabilidad.

## 4. Drawer de Detalle de Vulnerabilidad
Panel lateral derecho (ancho 460px) que se desliza desde la derecha. Contiene:

**Cabecera:** Nombre de la vulnerabilidad y botón de cierre.

**Metadatos en grid:** Motor, Severidad, SLA (días restantes o vencidos), Repositorio/Activo, Archivo/Endpoint afectado.

**Evidencia de Código:** Bloque de código con el snippet del código vulnerable (solo para SAST y SCA). Fondo oscuro con sintaxis resaltada.

**Recomendación IA:** Panel con borde azul que muestra la recomendación generada por IA usando el modelo configurado en el AI Builder. Incluye el código de remediación sugerido cuando aplica.

**Bitácora de Actividad:** Lista cronológica de todos los cambios de estatus, asignaciones y comentarios del registro, con fecha, usuario y descripción de la acción.

**Acciones:** Tres botones en la parte inferior: "Cambiar Estatus" (abre selector de estatus), "Solicitar Excepción" (abre formulario de excepción) y "Marcar Remediada" (cambia el estatus directamente a Remediada con confirmación).

## 5. Interacciones y Navegaciones

| Elemento | Acción | Resultado |
|---|---|---|
| Botón de motor | Clic | Actualiza todos los componentes reactivamente para el motor seleccionado |
| Tarjetas KPI (Bloque KPIs) | Clic | Abre el Panel de Drill-down con la tabla de vulnerabilidades correspondientes al KPI |
| Puntos de Gráfica de Tendencia | Clic | Abre el Panel de Drill-down con la tabla de vulnerabilidades del mes y serie seleccionada |
| Barras de Gráfica SLA/Reincidencias | Clic | Abre el Panel de Drill-down con la tabla de vulnerabilidades correspondientes a la barra |
| Segmento del donut | Clic | Navega al módulo de Vulnerabilidades con filtros de motor y severidad aplicados |
| Ítem del Top 10 | Clic | Abre el Drawer de Detalle de esa vulnerabilidad |
| Fila de tabla SLA vencido | Clic | Abre el Drawer de Detalle de esa vulnerabilidad |
| Botón "Cambiar Estatus" en drawer | Clic | Abre un selector inline de estatus |
| Botón "Solicitar Excepción" en drawer | Clic | Abre formulario de excepción con campos de justificación y fecha de revisión |
| Botón "Marcar Remediada" en drawer | Clic | Muestra confirmación y cambia el estatus; actualiza los KPIs reactivamente |
| Selector de Fechas | Cambio | Recalcula todos los datos del período seleccionado |
| Botón Exportar | Clic | Genera reporte del motor activo con todos los datos visibles |

## 6. Reglas de Negocio

Los datos de cada motor se calculan de forma independiente. El selector de motor no filtra una vista global; cada motor tiene su propio conjunto de registros en la base de datos. El **SLA vencido** se calcula como la diferencia entre la fecha actual y la fecha límite de remediación (fecha de detección + días de SLA según severidad). Los **Falsos Positivos** solo pueden ser marcados por usuarios con rol Analista o superior y quedan registrados en el Audit Log. Las **Reincidencias** se detectan automáticamente cuando una vulnerabilidad con el mismo identificador (CWE + archivo + línea) es importada después de haber sido marcada como Remediada.
