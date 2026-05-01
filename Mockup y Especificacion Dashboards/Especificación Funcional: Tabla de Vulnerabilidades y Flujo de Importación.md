# Especificación Funcional: Tabla de Vulnerabilidades y Flujo de Importación

## 1. Objetivo del Módulo
La Tabla de Vulnerabilidades es la pantalla operativa central de la plataforma AppSec. Actúa como el "Concentrado de Hallazgos" donde los analistas visualizan, filtran, gestionan y cierran las vulnerabilidades provenientes de todos los motores (SAST, DAST, SCA, CDS, MDA, MAST). Además, incluye el flujo crítico de importación masiva de escaneos.

## 2. Arquitectura de la Pantalla
La interfaz se compone de tres elementos principales:
- **Vista Principal (Tabla Unificada):** Un grid de datos de alto rendimiento con filtros avanzados, búsqueda global y soporte para acciones masivas.
- **Panel Lateral (Drawer de Detalle):** Se abre al hacer clic en una fila. Muestra el detalle técnico del hallazgo, el código afectado, el análisis de IA y la bitácora de seguimiento.
- **Modal de Importación:** Un flujo paso a paso (Wizard) para cargar archivos de escaneo (CSV/Excel), validar datos y procesar la ingesta.

## 3. Vista Principal (Tabla Unificada)

### 3.1 Controles Superiores
- **Buscador Global:** Búsqueda de texto libre sobre ID, Nombre de Vulnerabilidad, Repositorio o Descripción.
- **Botón "Filtros":** Abre un popover con filtros contextuales (Motor, Severidad, Estatus, SLA Vencido, Célula, Rango de Fechas). Los filtros activos se muestran como "chips" debajo de la barra de búsqueda.
- **Botón "Importar Escaneo":** Lanza el modal de importación.
- **Botón "Exportar":** Descarga la vista actual (respetando filtros y columnas visibles) en Excel o PDF.

### 3.2 Columnas de la Tabla
- `Checkbox` (Para selección múltiple)
- `ID` (Identificador único autogenerado)
- `Motor` (Badge con color: SAST, DAST, SCA, etc.)
- `Severidad` (Badge semafórico: Crítica, Alta, Media, Baja)
- `Vulnerabilidad` (Nombre técnico / Regla violada)
- `Activo / Repositorio` (Dónde se encontró)
- `Estatus` (Activa, En Remediación, Falso Positivo, Solventada)
- `SLA` (Días restantes o vencidos, con color semafórico)
- `Responsable` (Usuario asignado)

### 3.3 Acciones Masivas
Al seleccionar una o más filas mediante los checkboxes, aparece una barra flotante en la parte inferior con las opciones:
- **Reasignar:** Cambiar el responsable de las vulnerabilidades seleccionadas.
- **Cambiar Estatus:** Mover múltiples hallazgos a un nuevo estatus (ej. "En Remediación").
- **Agrupar en Plan:** Crear un nuevo Plan de Remediación con los hallazgos seleccionados.

## 4. Panel Lateral (Detalle de Vulnerabilidad)
Al hacer clic en cualquier fila, se desliza un panel desde la derecha sin recargar la página.

### 4.1 Encabezado del Panel
- ID, Motor y Severidad.
- Botón de "Cambiar Estatus" (Dropdown con transiciones permitidas).
- Botón "Solicitar Excepción" (Abre modal de justificación).

### 4.2 Pestañas de Información
1. **Detalle Técnico:**
   - Descripción de la vulnerabilidad.
   - Activo afectado (con link al inventario).
   - Fechas (Detección, Límite SLA).
   - Snippet de código afectado (con syntax highlighting) o Payload (para DAST).
2. **Análisis IA (Triaje):**
   - Clasificación sugerida por la IA (ej. "Probable Falso Positivo").
   - Justificación técnica generada automáticamente basada en el contexto del framework.
   - Botón "Aceptar Sugerencia" (Aplica el estatus y guarda la justificación en la bitácora).
3. **Bitácora (Log de Actividad):**
   - Historial inmutable de cambios de estatus, reasignaciones y comentarios de los analistas.

## 5. Flujo de Importación de Escaneo (Wizard)
El proceso de carga de resultados de herramientas externas se realiza mediante un modal de 3 pasos:

### Paso 1: Carga de Archivo
- Selección del Motor (SAST, DAST, SCA, CDS).
- Área de Drag & Drop para subir el archivo (CSV/Excel).
- Enlace para "Descargar Template" con las cabeceras esperadas para el motor seleccionado.

### Paso 2: Validación y Preview
- El sistema procesa el archivo y muestra un resumen: "Se encontraron 145 registros".
- **Detección de Duplicados (IA):** El sistema indica cuántos registros son nuevos y cuántos parecen ser duplicados de vulnerabilidades ya activas (basado en similitud de ruta y regla).
- Tabla de previsualización con los primeros 5 registros.
- Alertas de validación (ej. "Faltan datos obligatorios en la fila 12").

### Paso 3: Confirmación
- Barra de progreso de ingesta.
- Resumen final: "120 vulnerabilidades creadas, 25 actualizadas".
- Botón "Ir al Concentrado" para ver los nuevos registros.

## 6. Interacciones del Prototipo HTML (Mockup)
El prototipo `13_tabla_vulnerabilidades.html` implementa:
1. **Tabla Interactiva:** Filas clickeables que abren el panel lateral.
2. **Filtros (Chips):** Simulación visual de filtros activos.
3. **Acciones Masivas:** Al marcar un checkbox, aparece la barra flotante inferior.
4. **Panel Lateral (Drawer):** Navegación entre las pestañas "Detalle Técnico", "Análisis IA" y "Bitácora".
5. **Modal de Importación:** Flujo paso a paso simulado al hacer clic en "Importar Escaneo".
