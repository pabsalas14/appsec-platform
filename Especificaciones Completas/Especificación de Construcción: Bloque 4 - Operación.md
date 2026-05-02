# Especificación de Construcción: Bloque 4 - Operación

Este documento define a nivel de construcción el módulo de Operación de la plataforma AppSec. Describe el flujo de Liberaciones de Servicios (Jira), el registro de escaneos de Pipeline (Nivel 1 y Nivel 2 con lógica de cruce) y la Revisión de Terceros.

---

## 1. Catálogos Requeridos (Base de Datos)

Antes de construir las pantallas, deben existir los siguientes catálogos en el sistema:

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_TipoCambio` | Mayor, Menor, Estándar, Emergente | Clasifica la naturaleza de la liberación. |
| `Cat_EstatusLiberacion` | Backlog, En Análisis, En Pruebas, Aprobado, Rechazado, Liberado, Cancelado | Controla las columnas del Kanban. |
| `Cat_EstatusPipeline` | Aprobado, No Aprobado | Registra el resultado de la ejecución del CI/CD. |
| `Cat_TipoAppPipeline` | Frontend, Backend, API, Mobile | Clasifica el tipo de aplicación escaneada en DAST. |
| `Cat_TipoRevisionTerceros` | Pentest Externo, Auditoría de Código, Revisión de Arquitectura | Clasifica el tipo de servicio contratado. |

---

## 2. Pantalla 1: Liberaciones de Servicios (Flujo Jira)

**Ubicación en Menú:** `Operación > Liberaciones`

### 2.1 Vista Principal (Kanban y Tabla)
- **Componente:** Toggle para alternar entre DataGrid y Tablero Kanban.
- **Columnas Kanban:** Generadas dinámicamente desde `Cat_EstatusLiberacion`.
- **Botón Principal:** `+ Nueva Liberación`.

### 2.2 Formulario de Captura (Drawer Lateral)
- **Campo 1: ID/Referencia Jira**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 2: Nombre del Servicio/Cambio**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Tipo de Cambio**
  - Tipo: Dropdown (Lee de `Cat_TipoCambio`).
  - Obligatorio: Sí.
- **Campo 4: Criticidad**
  - Tipo: Dropdown (Lee de `Cat_CriticidadActivo`).
  - Obligatorio: Sí.
- **Campo 5: Fecha de Entrada a AppSec**
  - Tipo: Datepicker.
  - Obligatorio: Sí (Por defecto: Hoy).
- **Campo 6: Fecha Objetivo a Producción**
  - Tipo: Datepicker.
  - Obligatorio: Sí.
- **Campo 7: Responsable de Pruebas (AppSec)**
  - Tipo: Buscador con autocompletado (Usuarios).
  - Obligatorio: Sí.
- **Campo 8: Estatus**
  - Tipo: Dropdown (Lee de `Cat_EstatusLiberacion`).
  - Obligatorio: Sí (Por defecto: Backlog).
- **Campo 9: Pruebas de Seguridad Aplicadas**
  - Tipo: Multi-select Dropdown (SAST, DAST, SCA, Revisión Manual).
  - Obligatorio: No.
- **Campo 10: Evidencia de Pruebas**
  - Tipo: File Upload.
  - Obligatorio: Sí (Solo si Estatus = Aprobado).
- **Campo 11: Comentarios de Rechazo**
  - Tipo: Textarea.
  - Obligatorio: Sí (Solo si Estatus = Rechazado).

**Botón: Guardar**
- **Acción:** `POST /api/v1/operacion/liberaciones`.
- **Validaciones:** Verifica campos obligatorios condicionales (Evidencia si es Aprobado, Comentarios si es Rechazado).
- **Resultado:** Actualiza la tarjeta en el Kanban y recalcula el SLA de respuesta.

---

## 3. Pantalla 2: Liberaciones Pipeline (SAST / DAST)

Este módulo registra los escaneos ejecutados en el CI/CD. Se divide en dos niveles: el registro general del escaneo (Nivel 1) y el detalle de vulnerabilidades para escaneos rechazados (Nivel 2).

**Ubicación en Menú:** `Operación > Liberaciones Pipeline`

### 3.1 Vista Principal (Tabla Nivel 1)
- **Componente:** DataGrid.
- **Columnas:** Scan ID, Motor, Repositorio/URL, Rama, Fecha Escaneo, Resultado, ¿Liberado con Vulns?.
- **Botones Principales:** `Importar Escaneo SAST`, `Importar Escaneo DAST`.

### 3.2 Importación Nivel 1: Registro General SAST
**Trigger:** Clic en `Importar Escaneo SAST`.

- **Paso 1:** Abre modal con input File Upload (CSV).
- **Paso 2:** El sistema lee el CSV. Campos esperados:
  - `Scan ID` (Texto, Llave primaria).
  - `Organización` (Texto).
  - `Repositorio` (Texto).
  - `Rama` (Texto).
  - `Mes` (Texto).
  - `Fecha de escaneo` (Timestamp).
  - `Responsable del Cambio` (Texto).
  - `Vulns Críticas`, `Altas`, `Medias`, `Bajas` (Números).
  - `Resultado` (Aprobado / No Aprobado).
  - `Fecha entrada QA`, `Fecha salida a Producción` (Timestamps).
- **Paso 3 (Lógica de Cruce):** El sistema busca el `Repositorio` en la tabla de **Inventario de Repositorios**.
  - Si lo encuentra, hereda automáticamente la `Célula Responsable`.
  - Si no lo encuentra, inserta el registro pero deja la Célula en blanco y marca un flag de advertencia.
- **Paso 4:** Inserta los registros en la tabla `Pipeline_SAST`.

### 3.3 Importación Nivel 1: Registro General DAST
**Trigger:** Clic en `Importar Escaneo DAST`.

- **Paso 1:** Abre modal con input File Upload (CSV).
- **Paso 2:** El sistema lee el CSV. Campos esperados:
  - `Scan ID` (Texto, Llave primaria).
  - `Organización` (Texto).
  - `Nombre del servicio / Rama` (Texto).
  - `URL escaneada` (Texto).
  - `Mes` (Texto).
  - `Timestamps de escaneo` (Inicio y fin).
  - `Responsable del Cambio` (Texto).
  - `Vulns Críticas`, `Altas`, `Medias`, `Bajas`, `Informativas` (Números).
  - `Resultado` (Aprobado / No Aprobado).
  - `Motivo del resultado` (Texto).
  - `Empresa / Marca` (Texto, cruza con `Cat_EmpresaMarca`).
  - `Tipo de aplicación` (Texto, cruza con `Cat_TipoAppPipeline`).
- **Paso 3 (Lógica de Cruce):** El sistema busca la `URL escaneada` en la tabla de **Inventario de Activos Web**.
  - Si la encuentra, hereda automáticamente la `Célula Responsable`.
- **Paso 4:** Inserta los registros en la tabla `Pipeline_DAST`.

---

## 4. Lógica de Cruce Nivel 2: Detalle de Vulnerabilidades

Para los escaneos que resultaron "No Aprobados", se debe cargar el detalle de las vulnerabilidades que causaron el rechazo.

**Trigger:** Clic en el botón `Cargar Detalle de Vulnerabilidades` dentro del Drawer de un escaneo Nivel 1 No Aprobado.

**Paso 1: Carga de Archivo**
- El usuario sube un CSV con el detalle de los hallazgos.
- Campos esperados: `Scan ID`, `Branch`, `Query` (Nombre vuln), `Query Path` (Ruta), `Severity`, `Line`, `Column`, `Found Date`, `Similarity ID`.

**Paso 2: Match Automático (Lógica Core)**
- El sistema toma cada fila del CSV y busca en la tabla de Nivel 1 usando la llave compuesta: `Scan ID` + `Branch`.
- **Si hace match:**
  1. El sistema crea un nuevo registro en la **Tabla Unificada de Vulnerabilidades** (Módulo 2).
  2. Hereda automáticamente del Nivel 1: `Repositorio`, `Célula`, `Organización`, `Gerencia`, `Subdirección`, `Responsable del Cambio` y `Mes`.
  3. Rellena los datos técnicos (`Query`, `Severity`, `Path`, `Line`, `Similarity ID`) desde el CSV de Nivel 2.
- **Si no hace match:**
  - Rechaza la fila y la muestra en el log de errores del modal de importación: "Error: Scan ID y Branch no encontrados en registros de Nivel 1".

---

## 5. Pantalla 3: Revisión de Terceros

Gestiona las auditorías y pruebas de penetración realizadas por proveedores externos.

**Ubicación en Menú:** `Operación > Revisión de Terceros`

### 5.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Nombre del Proyecto** (Text Input, Obligatorio).
- **Campo 2: Proveedor** (Text Input, Obligatorio).
- **Campo 3: Tipo de Revisión** (Dropdown, lee de `Cat_TipoRevisionTerceros`, Obligatorio).
- **Campo 4: Fecha Inicio y Fecha Fin** (Datepickers, Obligatorio).
- **Campo 5: Checklist de Revisión (Grid Editable)**
  - Tipo: Tabla con Checkboxes.
  - Columnas: Ítem a evaluar, Resultado (Cumple/No Cumple/NA), Observaciones.
  - Fuente: Los ítems se cargan dinámicamente según el `Tipo de Revisión` seleccionado.
- **Campo 6: Reporte Final** (File Upload, PDF).
- **Campo 7: Estatus** (Dropdown: Planeado, En Ejecución, Entregado, Cerrado).

**Botón: Importar Hallazgos del Reporte**
- **Estado:** Habilitado solo si Estatus = Entregado.
- **Acción:** Abre un modal para subir un CSV con los hallazgos del pentest.
- **Resultado:** Inyecta los hallazgos en la Tabla Unificada de Vulnerabilidades con el Motor marcado como "Terceros" y los vincula a este proyecto.
