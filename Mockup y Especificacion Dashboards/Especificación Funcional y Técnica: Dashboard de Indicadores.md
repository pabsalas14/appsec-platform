# Especificación Funcional y Técnica: Dashboard de Indicadores

## 1. Objetivo del Dashboard
Proveer una vista centralizada y en tiempo real de los Key Performance Indicators (KPIs) de seguridad aplicativa, divididos en dos grandes bloques: **Indicadores por Motor de Escaneo** e **Indicadores de Pipeline CI/CD**. Permite a los líderes de AppSec monitorear el cumplimiento de SLAs, la tasa de remediación y la tendencia histórica de detección de vulnerabilidades.

## 2. Estructura General y Navegación
El dashboard opera bajo un modelo de **"Tarjetas Resumen → Drill-down de Detalle"**.

### 2.1. Vista Principal (Nivel 0)
La pantalla inicial no muestra gráficas complejas, sino un grid de tarjetas de alto nivel.
- **Sección Superior (Filtros Globales):**
  - Selector de Rango de Fechas (por defecto: Año en curso).
  - Botón "Filtros" (abre un drawer lateral para filtrar por Dirección o Subdirección).
  - Botón "Exportar" (descarga un PDF del dashboard actual).
- **Bloque 1: Indicadores por Motor:** 6 tarjetas interactivas (SAST, DAST, SCA, CDS, MDA, MAST).
- **Bloque 2: Indicadores de Pipeline:** 2 tarjetas interactivas (Pipeline SAST, Pipeline DAST).

### 2.2. Comportamiento de Navegación (Drill-down)
- Al hacer **clic en cualquier tarjeta**, la vista principal se oculta y se renderiza un panel de detalle (`detail-panel`) específico para esa tarjeta.
- El breadcrumb superior se actualiza (ej. `Inicio › Indicadores SAST`).
- Un botón `← Volver` permite regresar a la vista principal sin perder el estado de los filtros.

---

## 3. Especificación de Tarjetas (Vista Principal)

### 3.1. Tarjeta de Motor (Ej. SAST)
Cada una de las 6 tarjetas de motor debe contener exactamente los siguientes elementos:
1. **Cabecera:** Icono del motor, Nombre del motor y un **Semáforo Global** (Verde/Amarillo/Rojo) calculado en base al % de SLA vencido.
2. **KPI Principal:** "Backlog Activo (Altas/Críticas)". Muestra el número total y la tendencia vs. mes anterior (ej. `▲ 12%`).
3. **Grid de 4 Mini-KPIs:**
   - Identificadas (en el mes actual).
   - Remediadas (en el mes actual).
   - % Remediación (Remediadas / Identificadas).
   - SLA Vencido (% del backlog activo que superó el tiempo límite).
4. **Barra de Progreso SLA:** Una barra visual horizontal que representa el % de SLA vencido, coloreada dinámicamente (Verde < 5%, Amarillo 5-15%, Rojo > 15%).

### 3.2. Tarjeta de Pipeline (Ej. Pipeline SAST)
Las 2 tarjetas de pipeline deben contener:
1. **Cabecera:** Título, subtítulo descriptivo y Semáforo Global basado en el % de aprobación.
2. **Grid de 4 KPIs:**
   - Total Escaneos (color azul).
   - Aprobados (color verde).
   - Rechazados (color rojo).
   - % Aprobación (color verde/rojo según umbral).
3. **Footer de Métricas Secundarias:**
   - Escaneos con vulns detectadas.
   - Liberados con vulns (excepciones aprobadas).
   - % de Reincidentes.

---

## 4. Especificación de Vistas de Detalle (Drill-down)

### 4.1. Detalle de Motor (Al hacer clic en tarjeta de motor)
Esta vista desglosa la información del motor seleccionado.
1. **Cabecera de Detalle:** Título del motor y botón **"Capturar valor manual"** (abre modal).
2. **Grid de 5 KPIs Oficiales:** Muestra los 5 indicadores definidos en el BRD para cada motor (XXX-001, XXX-001b, XXX-002, XXX-003, XXX-004). Cada KPI muestra su ID, nombre, valor en grande, tendencia y la fórmula en texto pequeño.
3. **Gráfica de Tendencia Histórica (Line Chart):**
   - Eje X: Meses del año seleccionado.
   - Eje Y: Cantidad de vulnerabilidades.
   - Series: Identificadas (línea roja), Remediadas (línea verde), Backlog Activo (línea punteada del color del motor).
4. **Gráfica de Distribución (Donut Chart):**
   - Muestra la distribución del backlog activo por severidad (Críticas, Altas, Medias, Bajas).
5. **Tabla de Configuración de SLAs:**
   - Columnas: Severidad, SLA Configurado (ej. 2 meses), Vulns con SLA Vencido, % del Total, Estado (Badge).

### 4.2. Detalle de Pipeline (Al hacer clic en tarjeta de pipeline)
Esta vista desglosa la telemetría de CI/CD.
1. **Grid de 5 KPIs:** Total Escaneos, Aprobados, Rechazados, % Aprobación, Liberados con Vulns.
2. **Gráfica de Escaneos por Mes (Stacked Bar Chart):**
   - Eje X: Meses.
   - Eje Y: Cantidad de escaneos.
   - Series apiladas: Aprobados (verde) y Rechazados (rojo).
3. **Gráfica de Tendencia de Aprobación (Line Chart):**
   - Muestra la evolución del % de aprobación a lo largo del año.
4. **Tabla Top 10 Vulnerabilidades:**
   - Columnas: #, Vulnerabilidad (Nombre CWE), Ocurrencias, Severidad.
5. **Tablas de Desglose Organizacional:**
   - **Por Subdirección:** Total escaneos, Aprobados, % Aprobación.
   - **Por Célula (Top 5 con más rechazos):** Total escaneos, Con Vulns, % Aprobación.

---

## 5. Funcionalidades Interactivas y Modales

### 5.1. Modal de Captura Manual
Para indicadores que no se calculan automáticamente (ej. % de Falsos Positivos), el usuario puede ingresar el valor manualmente.
- **Trigger:** Botón "Capturar valor manual" en la vista de detalle de motor.
- **Campos del Formulario:**
  - **Indicador:** Dropdown (solo muestra indicadores configurados como "Manuales" para ese motor).
  - **Mes de Captura:** Dropdown (meses del año actual).
  - **Valor:** Input numérico (acepta decimales).
  - **Nota Justificativa:** Textarea obligatorio para explicar el cálculo o contexto.
- **Acción:** Al guardar, el valor se inserta en la base de datos y la gráfica histórica se actualiza en tiempo real.

### 5.2. Exportación
- El botón "Exportar" en la barra superior genera un archivo PDF.
- Si el usuario está en la vista principal, exporta el resumen de tarjetas.
- Si el usuario está en una vista de detalle, exporta el reporte completo de ese motor/pipeline incluyendo las gráficas y tablas.

## 6. Reglas de Negocio y Permisos
- **Cálculo en Tiempo Real:** Todos los KPIs automáticos se recalculan al cargar la página consultando el Concentrado de Vulnerabilidades y el log de Liberaciones.
- **Visibilidad por Rol:**
  - **Admin / CISO:** Ve datos globales de toda la organización.
  - **Director / Subdirector:** Las tarjetas y gráficas se filtran automáticamente para mostrar solo los datos de su área de responsabilidad.
  - **Líder de Célula:** Solo ve los datos de los repositorios asignados a su célula.
- **Congelamiento Histórico:** Los valores de meses anteriores (ej. Enero a Noviembre cuando se consulta en Diciembre) son estáticos y no cambian aunque se modifiquen vulnerabilidades pasadas, para mantener la integridad del reporte histórico.
