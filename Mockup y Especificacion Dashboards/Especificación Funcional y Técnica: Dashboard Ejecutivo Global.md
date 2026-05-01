# Especificación Funcional y Técnica: Dashboard Ejecutivo Global

## 1. Objetivo
Proveer al CISO, Directores y Subdirectores una vista de alto nivel del estado de seguridad aplicativa de toda la organización. Es el primer dashboard que se muestra al iniciar sesión para perfiles ejecutivos. No requiere interacción para entregar valor; toda la información crítica es visible sin hacer clic.

## 2. Audiencia y Permisos de Visualización

| Rol | Alcance de los datos mostrados |
|---|---|
| Admin / CISO | Toda la organización sin filtros |
| Director | Solo las Subdirecciones bajo su dirección |
| Subdirector | Solo sus Gerencias y Organizaciones |
| Jefe de Célula | Solo sus repositorios y activos asignados |

## 3. Estructura de la Pantalla

La pantalla se organiza en 6 bloques verticales en el siguiente orden de arriba hacia abajo.

### Bloque 1 — Barra Superior (Filtros Globales)
Posicionada en la parte superior de la pantalla, contiene tres controles que afectan a todos los componentes del dashboard de forma reactiva. El **Selector de Rango de Fechas** muestra por defecto el año en curso y permite seleccionar rangos personalizados o períodos predefinidos (Último mes, Último trimestre, Año en curso). El botón **Filtros** abre un drawer lateral con opciones de filtrado por Dirección, Subdirección y Motor. El botón **Exportar PDF** genera un reporte ejecutivo en PDF con todos los componentes visibles en ese momento.

### Bloque 2 — Semáforo de Riesgo Global + Score de Madurez
Se compone de dos tarjetas en una fila de dos columnas (proporción 3:1).

La tarjeta izquierda muestra el **Semáforo de Riesgo Global**: un círculo grande de color (Rojo/Amarillo/Verde) con su estado en texto (ALTO/MEDIO/BAJO), el total de vulnerabilidades activas Altas y Críticas en número grande, la tendencia vs. mes anterior, y un resumen de 5 métricas clave en columna derecha (Críticas activas, Altas activas, SLA Vencido, Remediadas este mes, Identificadas este mes).

La tarjeta derecha muestra el **Score de Madurez Global**: un número de 0 a 100 en tipografía grande, una barra de progreso con gradiente de color (rojo → amarillo → verde), y la variación vs. trimestre anterior.

**Regla del Semáforo:**
- Verde: SLA vencido < 5% Y tendencia de backlog negativa.
- Amarillo: SLA vencido entre 5% y 15% O tendencia de backlog positiva moderada.
- Rojo: SLA vencido > 15% O incremento de backlog > 10% en el mes.

### Bloque 3 — Vulnerabilidades Activas por Motor
Seis tarjetas en una fila horizontal (una por motor: SAST, SCA, CDS, DAST, MDA, MAST). Cada tarjeta muestra el nombre del motor como badge de color, un semáforo individual (punto de color), el total de vulnerabilidades activas Altas y Críticas, y la tendencia porcentual vs. mes anterior. Al hacer clic en cualquier tarjeta, el sistema navega al **Dashboard de Vulnerabilidades por Motor** con ese motor preseleccionado.

### Bloque 4 — Tendencia Global + Top 5 Vulnerabilidades
Dos componentes en fila (proporción 2:1).

El componente izquierdo es una **Gráfica de Líneas** con 4 series: Activas (azul, área sombreada), Solventadas (verde), Nuevas (rojo) y Críticas+Altas (naranja punteado). El eje X muestra los 12 meses del período seleccionado. Al pasar el cursor sobre un punto, aparece un tooltip con los valores exactos de las 4 series en ese mes.

El componente derecho muestra el **Top 5 de Vulnerabilidades más Recurrentes en Pipeline**: lista numerada con nombre de la vulnerabilidad y su conteo de ocurrencias. Los datos provienen del log de Liberaciones Pipeline donde se detectaron vulnerabilidades.

### Bloque 5 — Pipeline Global + Distribución por Severidad
Dos componentes en fila (proporción 1:1).

El componente izquierdo muestra los **Indicadores de Pipeline Global**: 4 KPIs en grid (Total Escaneos, Aprobados, Rechazados, % Aprobación) y una mini gráfica de barras con los escaneos aprobados vs. rechazados por mes del año.

El componente derecho muestra una **Gráfica Donut** con la distribución del backlog total por severidad (Críticas, Altas, Medias, Bajas). Al hacer clic en un segmento del donut, el sistema navega al módulo de Vulnerabilidades con el filtro de severidad correspondiente preseleccionado.

### Bloque 6 — Panel de Análisis IA
Un panel de ancho completo con fondo ligeramente diferenciado y borde azul sutil. Muestra el resumen narrativo generado por IA con los hallazgos más relevantes del período y una recomendación de acción priorizada. El texto se regenera automáticamente al cambiar el rango de fechas o los filtros. Incluye un botón "Regenerar" para solicitar un nuevo análisis.

### Bloque 7 — Cards de Subdirecciones
Grid de 4 columnas (una card por subdirección). Cada card muestra: nombre de la subdirección, semáforo individual, total de vulnerabilidades activas, desglose por motor (chips de color con el conteo), y los indicadores de pipeline (aprobados vs. rechazados). Al hacer clic en una card, el sistema navega al **Dashboard de Vulnerabilidades Organizacional** con esa subdirección como nivel de entrada.

## 4. Interacciones y Navegaciones

| Elemento | Acción del usuario | Resultado |
|---|---|---|
| Tarjeta de Motor (Bloque 3) | Clic | Navega al Dashboard de Vulnerabilidades por Motor con ese motor preseleccionado |
| Segmento del Donut (Bloque 5) | Clic | Navega al módulo de Vulnerabilidades con filtro de severidad aplicado |
| Card de Subdirección (Bloque 7) | Clic | Navega al Dashboard Organizacional en el nivel de esa Subdirección |
| Números del Semáforo (Bloque 2) | Clic | Abre el Panel de Drill-down con la tabla de vulnerabilidades correspondientes (ej. Críticas activas) |
| Puntos de Gráfica de Tendencia (Bloque 4) | Clic | Abre el Panel de Drill-down con la tabla de vulnerabilidades del mes y serie seleccionada |
| KPIs de Pipeline (Bloque 5) | Clic | Abre el Panel de Drill-down con la tabla de escaneos correspondientes |
| Selector de Fechas | Cambio | Todos los componentes se recalculan y re-renderizan reactivamente |
| Botón Filtros | Clic | Abre drawer lateral con filtros de Dirección, Subdirección y Motor |
| Botón Exportar PDF | Clic | Genera PDF del dashboard completo con fecha y hora de generación |

## 5. Reglas de Negocio

Todos los datos se calculan en tiempo real al cargar la página. No existe un botón de "Calcular" o "Actualizar". El Score de Madurez se calcula con base en: tiempo promedio de remediación (30%), porcentaje de reincidencias (20%), vulnerabilidades críticas acumuladas (30%) y cumplimiento de SLAs (20%). Los valores del semáforo se evalúan al momento de la carga y se almacenan en caché por 15 minutos para optimizar el rendimiento.
