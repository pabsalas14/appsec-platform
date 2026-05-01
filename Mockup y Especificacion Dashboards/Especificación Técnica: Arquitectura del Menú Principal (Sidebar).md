# Especificación Técnica: Arquitectura del Menú Principal (Sidebar)

**Versión:** 3.0
**Clasificación:** Confidencial — Uso Interno

---

## 1. Principios de Navegación

La plataforma AppSec opera bajo tres reglas de navegación que el equipo de desarrollo debe respetar en todos los módulos:

**Regla 1 — Navegación Relacional:** Ninguna sub-entidad (Etapas, Pipelines, Actividades, Sesiones TM, Hallazgos por motor) debe existir como un ítem independiente en el sidebar. Se accede a ellas únicamente desde el detalle de su entidad padre. El sidebar es siempre el punto de entrada al módulo, no al registro.

**Regla 2 — Dashboard como Primera Pantalla:** Al hacer clic en cualquier ítem del menú, la primera pantalla que carga es el dashboard contextual de ese módulo. Desde el dashboard, el usuario puede hacer drill-down hacia las tablas de datos mediante botones, gráficas interactivas o un botón "Ver Todos" explícito.

**Regla 3 — Administración Unificada:** Todas las configuraciones del sistema se agrupan bajo un único ítem "Administración" con pestañas horizontales internas. No existe ningún ítem de configuración granular en el sidebar.

---

## 2. Estructura del Sidebar

El sidebar tiene **6 secciones** con un total de **14 ítems**. Cada sección es colapsable. El ítem activo se resalta con el color de acento de la plataforma.

---

### SECCIÓN 1 — PRINCIPAL

Esta sección siempre está visible y expandida. No es colapsable. Contiene las vistas de resumen ejecutivo de toda la jefatura.

---

#### Ítem 1.1 — Dashboard Ejecutivo

**Comportamiento al hacer clic:** Navega a la página de inicio de la plataforma. Esta es la pantalla que carga por defecto al iniciar sesión.

**Tipo de vista:** Página completa (full-page dashboard).

**Contenido que debe renderizar:**
- Fila 1: Seis KPI Cards con los indicadores globales más críticos (Avance Programas Anuales, Vulnerabilidades Críticas Activas, Liberaciones Activas, Liberaciones con SLA en Riesgo, Temas Emergentes Abiertos, Auditorías Activas).
- Fila 2: Score de Madurez Global (Gauge Chart) y Tendencia de Vulnerabilidades de los últimos 12 meses (Line Chart).
- Fila 3: Top 5 Repositorios con Vulnerabilidades Críticas (Bar Chart horizontal) y Estado SLA de Vulnerabilidades (Donut Chart).

**Interacciones:** Cada KPI Card y cada elemento de las gráficas es clickeable. Al hacer clic, navega directamente al módulo correspondiente con el filtro aplicado (ej. clic en "Vulnerabilidades Críticas Activas" navega a Concentrado de Hallazgos con filtro Severidad=Crítica y Estatus=Activa).

**Visibilidad:** Jefe de Ciberseguridad y Coordinadores.

---

#### Ítem 1.2 — Score de Madurez

**Comportamiento al hacer clic:** Navega a la vista de evolución histórica del score de madurez.

**Tipo de vista:** Página completa con dos secciones.

**Contenido que debe renderizar:**
- Sección Superior: Gauge Chart con el score global actual (0–100), desglosado por dimensión (Vulnerabilidades, Programas, Operación, Cumplimiento).
- Sección Inferior: Tabla jerárquica con el score por Dirección → Subdirección → Gerencia → Célula. Cada fila muestra el score del mes actual, el del mes anterior y la variación (flecha arriba/abajo en color).

**Interacciones:** Al hacer clic en una fila de la tabla jerárquica, se expande para mostrar el nivel siguiente. Al hacer clic en el nombre de una Célula, navega al perfil de esa célula con el detalle de sus vulnerabilidades y programas.

**Visibilidad:** Todos los roles.

---

### SECCIÓN 2 — ORGANIZACIÓN E INVENTARIO

Gestión de la estructura de la empresa y sus activos tecnológicos.

---

#### Ítem 2.1 — Estructura Organizacional

**Comportamiento al hacer clic:** Navega a la vista de árbol relacional de la organización.

**Tipo de vista:** Página completa con un árbol interactivo (Tree View).

**Contenido que debe renderizar:**
- Árbol colapsable de 5 niveles: Dirección → Subdirección → Gerencia → Organización → Célula.
- Cada nodo del árbol muestra: Nombre, Responsable, Total de Repositorios asociados y Score de Madurez actual.
- Barra de herramientas superior con botón "Agregar Entidad" y campo de búsqueda para filtrar nodos por nombre.

**Flujo de creación/edición:** Al hacer clic en "Agregar Entidad" o en el ícono de edición de un nodo existente, se abre un **Panel Lateral (Drawer)** deslizable desde la derecha. El drawer no cierra el árbol ni recarga la página. Contiene el formulario de captura con los campos: Nombre, Nivel, Entidad Padre, Responsable, Plataforma (solo si Nivel = Organización) y URL Base (solo si Nivel = Organización).

**Flujo de eliminación:** Solo disponible para entidades sin hijos. Muestra un modal de confirmación antes de eliminar.

**Visibilidad:** Todos los roles. Solo Administrador puede crear, editar o eliminar.

---

#### Ítem 2.2 — Inventario de Activos

**Comportamiento al hacer clic:** Navega a la vista unificada del inventario tecnológico.

**Tipo de vista:** Página completa con dos pestañas horizontales en la parte superior.

**Pestaña A — Repositorios de Código:**
- Tabla con columnas: Nombre del Repositorio, Célula Responsable, Tecnología Principal, Criticidad, Visibilidad (Público/Privado), Fecha Último Escaneo, Score de Madurez.
- Filtros disponibles (panel lateral): Célula, Tecnología, Criticidad, Visibilidad.
- Botones de acción en la barra superior: "Agregar Repositorio", "Importar CSV", "Descargar Template", "Exportar".

**Pestaña B — Activos Web:**
- Tabla con columnas: URL, Nombre del Sitio, Ambiente (Producción/QA/Desarrollo), Empresa/Marca, Responsable, Célula.
- Filtros disponibles (panel lateral): Ambiente, Empresa/Marca, Célula, Responsable.
- Botones de acción: "Agregar Activo Web", "Importar CSV", "Descargar Template", "Exportar".

**Flujo de creación/edición:** Al hacer clic en "Agregar" o en una fila existente, se abre un **Panel Lateral (Drawer)** con el formulario correspondiente (campos de Repositorio o Activo Web según la pestaña activa). El drawer tiene dos secciones: "Información General" y "Campos Adicionales" (colapsable).

**Flujo de detalle:** Al hacer clic en el nombre de un repositorio o activo web, navega a su **Página de Detalle Completa** (no drawer). Esta página contiene tres pestañas internas:
1. `Información General`: Todos los campos del registro.
2. `Vulnerabilidades Activas`: Tabla filtrada con los hallazgos activos de este activo específico.
3. `Historial de Escaneos`: Log cronológico de cuándo pasaron los motores por este activo y cuántos hallazgos generó cada escaneo.

**Visibilidad:** Todos los roles.

---

### SECCIÓN 3 — GESTIÓN DE VULNERABILIDADES

Concentrador de todos los hallazgos de seguridad y modelado de amenazas.

---

#### Ítem 3.1 — Concentrado de Hallazgos

**Comportamiento al hacer clic:** Navega al Dashboard de Vulnerabilidades como primera pantalla.

**Tipo de vista:** Página completa. El dashboard ocupa la parte superior y la tabla de hallazgos vive debajo, accesible con scroll o mediante el botón "Ver Tabla Completa".

**Dashboard (parte superior):**
- Fila 1: KPI Cards por motor (SAST, DAST, SCA, CDS, MDA, MAST) con totales de Críticas y Altas.
- Fila 2: Distribución por Severidad y Motor (Stacked Bar Chart) y Tendencia de Detección vs. Remediación (Line Chart).
- Fila 3: Top 10 Vulnerabilidades más comunes (Bar Chart) y Tabla de Vulnerabilidades con SLA Vencido.

**Tabla de Hallazgos (parte inferior):**
- Pestañas horizontales para filtrar por motor: `Todos` | `SAST` | `DAST` | `SCA` | `CDS` | `MDA` | `MAST`. Al cambiar de pestaña, la tabla se actualiza sin recargar la página.
- Columnas de la tabla: ID, Motor (chip de color), Severidad (chip de color), Nombre/Descripción, Repositorio o Activo, Fecha Detección, Días al Vencimiento SLA (con semáforo Verde/Amarillo/Rojo), Estatus.
- Filtros adicionales (panel lateral): Organización, Subdirección, Gerencia, Célula, OWASP Top 10, Estado (Activa/Remediada/etc.), Reincidente, Excepción Activa, Rango de Fechas.
- Acciones masivas: Al seleccionar filas con el checkbox, aparece la barra de acciones masivas con opciones de Cambiar Estatus, Reasignar Responsable y Exportar Selección.

**Flujo de detalle:** Al hacer clic en cualquier fila, se abre un **Panel Lateral (Drawer)** con el detalle técnico completo. El drawer no cierra la tabla. Contiene:
- Encabezado: ID, Severidad, Motor, Estatus actual con botón de cambio de estatus.
- Cuerpo: Descripción técnica, Evidencia (snippet de código, request/response o dependencia), Recomendación de remediación.
- Pie: Botón "Analizar con IA" (sugiere clasificación y justificación), campo para agregar comentario a la Bitácora, historial de la Bitácora de Actualizaciones.

**Visibilidad:** Todos los roles.

---

#### Ítem 3.2 — Planes de Remediación

**Comportamiento al hacer clic:** Navega a la vista de agrupación de hallazgos con fechas compromiso.

**Tipo de vista:** Página completa con tabla de planes.

**Contenido que debe renderizar:**
- Tabla con columnas: Nombre del Plan, Repositorio/Activo Asociado, Total de Hallazgos Agrupados, Responsable, Fecha Compromiso, % de Avance (barra de progreso), Estatus.
- Filtros (panel lateral): Responsable, Célula, Estatus, Rango de Fechas.

**Flujo de creación:** Al hacer clic en "Crear Plan", se abre un **Panel Lateral (Drawer)** donde se define el nombre del plan, el responsable, la fecha compromiso y se seleccionan los hallazgos del Concentrado que se agrupan en este plan.

**Flujo de detalle:** Al hacer clic en un plan, navega a su **Página de Detalle Completa** con dos pestañas: `Información General` y `Hallazgos Incluidos` (tabla de los hallazgos agrupados con su estatus individual).

**Visibilidad:** Todos los roles.

---

#### Ítem 3.3 — Threat Modeling

**Comportamiento al hacer clic:** Navega a la tabla de Programas TM.

**Tipo de vista:** Página completa con tabla de programas.

**Contenido que debe renderizar:**
- Tabla con columnas: Nombre del Programa, Tipo (Programado/Bajo Demanda), Activo Evaluado, Criticidad, Responsable, Fecha, Estatus.
- Filtros (panel lateral): Tipo, Activo, Criticidad, Estatus, Célula, Rango de Fechas.
- Botón "Nuevo Programa TM".

**Flujo de creación:** Al hacer clic en "Nuevo Programa TM", se abre un **Panel Lateral (Drawer)** con los campos del encabezado del programa (Nombre, Tipo, Activo Evaluado, Responsable, Fecha).

**Flujo de detalle:** Al hacer clic en un programa, navega a su **Página de Detalle Completa**. Esta página contiene cuatro pestañas internas:
1. `Información General`: Datos del programa, responsable, activos evaluados.
2. `Sesiones TM`: Tabla con las sesiones de trabajo realizadas (Fecha, Participantes, Notas). Desde aquí se agregan nuevas sesiones mediante un drawer.
3. `Backlog de Amenazas`: Tabla con las amenazas identificadas (Categoría STRIDE, Descripción, Score DREAD, Control Mitigante, Estatus). Botón "Sugerir Amenazas con IA" que abre un modal con las sugerencias de la IA para aceptar, editar o rechazar.
4. `Plan de Trabajo`: Tabla con las tareas de remediación derivadas del backlog, con responsable y fecha compromiso.

**Visibilidad:** Todos los roles.

---

### SECCIÓN 4 — OPERACIÓN Y SEGUIMIENTO

Gestión del flujo de trabajo diario, liberaciones y proyectos especiales.

---

#### Ítem 4.1 — Liberaciones de Servicio

**Comportamiento al hacer clic:** Navega al Dashboard de Liberaciones como primera pantalla.

**Tipo de vista:** Página completa. El dashboard ocupa la parte superior y la tabla/kanban vive debajo.

**Dashboard (parte superior):**
- KPI Cards: Liberaciones Activas, Con SLA en Riesgo, Con Observaciones Pendientes, Críticas en Proceso.

**Vista de tabla/kanban (parte inferior):**
- Dos sub-vistas accesibles mediante un toggle (botones de icono) en la barra de herramientas: `Vista Tabla` y `Vista Kanban`.
- **Vista Tabla:** Columnas: ID, Nombre/Descripción, Tipo de Cambio, Criticidad, Responsable, Fecha Solicitud, Fecha Compromiso, Estatus, Alerta SLA (semáforo).
- **Vista Kanban:** Tablero con columnas configurables (Recibida, Revisión de Diseño, Validaciones, Con Observaciones, Pruebas, VoBo Dado, En QA, En Producción). Cada tarjeta muestra: Nombre, Tipo, Criticidad, Responsable, Días en la columna actual, indicador de alerta SLA.

**Flujo de creación:** Al hacer clic en "Nueva Liberación", se abre un **Panel Lateral (Drawer)** con los campos del encabezado de la liberación.

**Flujo de detalle:** Al hacer clic en una fila o tarjeta, navega a su **Página de Detalle Completa** con tres pestañas internas:
1. `Información General`: Todos los campos del registro, historial de cambios de estatus.
2. `Etapas de Liberación`: Tabla con las etapas del proceso (Nombre, Responsable, Fecha Inicio, Fecha Fin, Estatus, Observaciones). Cada etapa se agrega o edita desde un drawer.
3. `Pipelines`: Tabla con los resultados de los pipelines SAST/DAST asociados a esta liberación (Scan ID, Motor, Branch, Fecha, Resultado, Vulnerabilidades Críticas/Altas). El match entre un pipeline y una liberación se realiza automáticamente por Scan ID + Branch.
4. `Bitácora`: Historial conversacional de comentarios y cambios de estatus con soporte para @menciones.

**Visibilidad:** Todos los roles.

---

#### Ítem 4.2 — Programas Anuales

**Comportamiento al hacer clic:** Navega al Dashboard de Programas como primera pantalla.

**Tipo de vista:** Página completa. El dashboard ocupa la parte superior y la tabla de programas vive debajo.

**Dashboard (parte superior):**
- KPI Cards: Programas Activos, Promedio de Avance Global, Programas con Avance < 70%, Actividades Vencidas.
- Heatmap de Cumplimiento: Matriz de meses (columnas) vs. programas (filas) con el porcentaje de avance de cada celda en color semafórico.

**Tabla de programas (parte inferior):**
- Columnas: Nombre del Programa, Responsable, Año, Meses Activos, Avance Actual (%), Estatus.
- Filtros (panel lateral): Año, Responsable, Estatus, % de Avance.
- Botón "Nuevo Programa".

**Flujo de detalle:** Al hacer clic en un programa, navega a su **Página de Detalle Completa** con dos secciones:
- Sección Superior: Resumen del programa (% de avance global, avance por mes en un Line Chart).
- Sección Inferior (Actividades): Tabla con las actividades del programa. Columnas: Nombre, Mes, Peso (%), Tipo (Fija/Divisible), Estatus, Valor Obtenido, Evidencia. Al hacer clic en "Agregar Actividad" o en una actividad existente, se abre un **Panel Lateral (Drawer)** para capturar o editar la actividad y cargar su evidencia.

**Visibilidad:** Todos los roles.

---

#### Ítem 4.3 — Temas Emergentes y Auditorías

**Comportamiento al hacer clic:** Navega a una página con dos pestañas horizontales.

**Tipo de vista:** Página completa con dos pestañas en la parte superior.

**Pestaña A — Temas Emergentes:**
- Dashboard superior: KPI Cards (Abiertos, Sin Movimiento en 7 días, Próximos a Vencer).
- Tabla inferior: Columnas: ID, Título, Solicitante, Responsable, Fecha Apertura, Fecha Compromiso, Estatus, Días sin Movimiento.
- Filtros (panel lateral): Responsable, Célula, Estatus, Rango de Fechas.
- Al hacer clic en un tema, se abre un **Panel Lateral (Drawer)** con su detalle completo y la Bitácora de Actualizaciones en la parte inferior.

**Pestaña B — Auditorías:**
- Dashboard superior: KPI Cards (Activas, Cerradas, Hallazgos Pendientes de Cierre).
- Tabla inferior: Columnas: ID, Nombre de la Auditoría, Tipo, Responsable, Fecha Inicio, Fecha Fin, Estatus, Total Hallazgos.
- Al hacer clic en una auditoría, navega a su **Página de Detalle Completa** con tres pestañas: `Información General`, `Hallazgos` (tabla de hallazgos con su estatus y evidencias) y `Bitácora`.

**Visibilidad:** Todos los roles.

---

#### Ítem 4.4 — Iniciativas

**Comportamiento al hacer clic:** Navega a la tabla de iniciativas.

**Tipo de vista:** Página completa con tabla.

**Contenido que debe renderizar:**
- KPI Cards superiores: Iniciativas Activas, En Riesgo, Completadas en el año.
- Tabla: Columnas: Nombre, Responsable, Fecha Inicio, Fecha Fin, % Avance (barra de progreso), Estatus.
- Filtros (panel lateral): Responsable, Estatus, Rango de Fechas.

**Flujo de detalle:** Al hacer clic en una iniciativa, navega a su **Página de Detalle Completa** con tres pestañas: `Información General`, `Hitos` (tabla de hitos con fecha compromiso y estatus, editables desde un drawer) y `Bitácora`.

**Visibilidad:** Todos los roles.

---

#### Ítem 4.5 — Revisión de Terceros

**Comportamiento al hacer clic:** Navega a la tabla de revisiones de proveedores.

**Tipo de vista:** Página completa con tabla.

**Contenido que debe renderizar:**
- Tabla: Columnas: Nombre del Tercero, Fecha de Revisión, Responsable, Estatus.
- Filtros (panel lateral): Responsable, Estatus, Rango de Fechas.

**Flujo de creación:** Al hacer clic en "Nueva Revisión", se abre un **Panel Lateral (Drawer)** con los campos del encabezado.

**Flujo de detalle:** Al hacer clic en una revisión, navega a su **Página de Detalle Completa** con dos pestañas: `Información General` y `Checklist de Revisión` (tabla con ítems evaluados, resultado por ítem y evidencias adjuntas).

**Visibilidad:** Todos los roles.

---

### SECCIÓN 5 — DESEMPEÑO (OKR)

Evaluación del rendimiento individual y del equipo.

---

#### Ítem 5.1 — Mis Compromisos

**Comportamiento al hacer clic:** Navega a la vista personal del colaborador.

**Tipo de vista:** Página completa con dos secciones.

**Contenido que debe renderizar:**
- Sección Superior: Resumen personal del colaborador (% de avance global del trimestre actual, semáforo de desempeño, botón "Cargar Avance Q-Review").
- Sección Inferior: Tabla de compromisos propios con columnas: Nombre del Compromiso, Categoría, Peso (%), Valor Meta, Valor Actual, % Cumplimiento, Estatus (semáforo).
- Al hacer clic en un compromiso, se abre un **Panel Lateral (Drawer)** para ver el detalle, cargar evidencia y registrar el avance del trimestre.

**Visibilidad:** Todos los roles (cada usuario ve solo sus propios compromisos).

---

#### Ítem 5.2 — Mi Equipo

**Comportamiento al hacer clic:** Navega al Dashboard de Desempeño del equipo.

**Tipo de vista:** Página completa con drill-down de 4 niveles.

**Nivel 1 — Vista Global de Jefatura:**
- KPI Cards: Promedio de Cumplimiento del Equipo, Colaboradores en Verde/Amarillo/Rojo, Compromisos Pendientes de Validación.
- Heatmap de Jefatura: Matriz de colaboradores vs. trimestres.
- Tabla de colaboradores con su % de cumplimiento y estatus semafórico.

**Nivel 2 — Perfil del Colaborador (al hacer clic en un colaborador):**
- Radar Chart de desempeño por categoría OKR.
- Tabla de sus compromisos con avance y estatus.
- Botón "Validar Q-Review" (disponible para Coordinador y Jefe).

**Nivel 3 — Detalle del Compromiso (al hacer clic en un compromiso):**
- Detalle completo: Meta, Evidencias cargadas, Historial de avances por trimestre.

**Nivel 4 — Action Center:**
- Panel de aprobación/rechazo del Q-Review con campo de comentarios y botones "Aprobar" / "Rechazar con Observaciones".

**Visibilidad:** Jefe de Ciberseguridad y Coordinadores.

---

### SECCIÓN 6 — CONFIGURACIÓN

Acceso exclusivo para administradores del sistema. Esta sección contiene un único ítem en el sidebar.

---

#### Ítem 6.1 — Administración

**Comportamiento al hacer clic:** Navega al panel de control central de la plataforma.

**Tipo de vista:** Página completa con pestañas horizontales en la parte superior. Cada pestaña carga su contenido sin recargar la página.

**Pestaña 1 — Usuarios y Roles:**
- Sub-pestaña `Usuarios`: Tabla de usuarios con columnas Nombre, Correo, Rol, Célula, Estatus (Activo/Inactivo). Acciones: Crear usuario (drawer), Editar, Desactivar, Reasignar Registros.
- Sub-pestaña `Roles`: Tabla de roles con su descripción. Al hacer clic en un rol, se abre la matriz de permisos granulares (Ver, Crear, Editar, Eliminar, Exportar, Aprobar) por módulo.

**Pestaña 2 — Module Builder:**
- Sub-pestaña `Vistas de Módulo`: Lista de módulos configurables. Al seleccionar uno, se muestra el listado de campos base y campos dinámicos.
- Sub-pestaña `Campos Personalizados`: Formulario para agregar campos dinámicos a cualquier módulo. Tipos de campo: Texto, Número, Fecha, Dropdown, Multi-select, Booleano, URL, Archivo, Relación, Fórmula.
- Sub-pestaña `Reglas de Validación`: Configuración de validaciones condicionales (ej. "Si Severidad = Crítica, entonces Fecha Compromiso es obligatoria").
- Sub-pestaña `Fórmulas`: Editor de fórmulas para campos calculados automáticamente.

**Pestaña 3 — Catálogos:**
- Lista de todos los catálogos del sistema (Motores, Severidades, Tipos de Cambio, Criticidad, etc.). Al hacer clic en un catálogo, se muestra su tabla de valores con opciones para agregar, editar o desactivar valores.

**Pestaña 4 — AI Builder:**
- Sub-pestaña `Configuración del Provider`: Selección del proveedor de IA (OpenAI, Azure, Anthropic), API Key, modelo por defecto.
- Sub-pestaña `Casos de Uso`: Lista de los casos de uso de IA disponibles (STRIDE, DREAD, Triaje, Asistente de Redacción, Detección de Duplicados) con toggle para activar/desactivar cada uno.
- Sub-pestaña `Editor de Prompts`: Al seleccionar un caso de uso, se muestra el editor de System Prompt y User Prompt con soporte para variables de contexto (ej. `{{snippet_codigo}}`), y controles deslizantes para Temperatura y Max Tokens.

**Pestaña 5 — Dashboard Builder:**
- Lista de dashboards existentes (10 out-of-the-box + personalizados). Al hacer clic en uno, abre el editor visual con lienzo de cuadrícula de 12 columnas, panel lateral de widgets disponibles (KPI Card, Bar Chart, Line Chart, Pie/Donut, Gauge, Heatmap, Data Table) y configuración de fuente de datos, métrica, dimensión y drill-down por widget.

**Pestaña 6 — Audit Logs:**
- Tabla de solo lectura con registro inmutable de todas las acciones. Columnas: Timestamp, Usuario, Acción (Crear/Editar/Eliminar/Cambio de Estatus), Módulo, ID del Registro, Valor Anterior, Valor Nuevo. Filtros: Rango de Fechas, Usuario, Módulo, Tipo de Acción.

**Pestaña 7 — Settings:**
- Configuraciones globales de la plataforma: Nombre de la plataforma, Logo, Colores de marca, Zona horaria, Idioma por defecto, Configuración de SLAs base (días por severidad y motor), Configuración de Cierre de Período (día del mes).

**Visibilidad:** Solo Administradores.

---

## 3. Tabla de Ítems Eliminados del Sidebar Anterior

| Ítem eliminado del sidebar | Dónde vive en la nueva arquitectura |
|---|---|
| `Repositorios` | Pestaña A dentro de **Inventario de Activos** |
| `Activos Web` | Pestaña B dentro de **Inventario de Activos** |
| `Etapas de Liberación` | Pestaña interna dentro del detalle de cada registro en **Liberaciones de Servicio** |
| `Pipelines` | Pestaña interna dentro del detalle de cada registro en **Liberaciones de Servicio** |
| `Hallazgos SAST` | Pestaña SAST dentro de **Concentrado de Hallazgos** |
| `Hallazgos DAST` | Pestaña DAST dentro de **Concentrado de Hallazgos** |
| `Hallazgos MAST` | Pestaña MAST dentro de **Concentrado de Hallazgos** |
| `Hallazgos Pipeline` | Pestaña CDS dentro de **Concentrado de Hallazgos** |
| `Hallazgos Tercero` | Módulo independiente **Revisión de Terceros** |
| `Hallazgos Auditoría` | Pestaña interna dentro del detalle de cada auditoría en **Temas Emergentes y Auditorías** |
| `Sesiones TM` | Pestaña interna dentro del detalle de cada programa en **Threat Modeling** |
| `Programas TM` | Tabla principal del ítem **Threat Modeling** |
| `Dashboard Ejecutivo` | Primera pantalla del ítem **Dashboard Ejecutivo** |
| `Dashboard Vulnerabilidades` | Primera pantalla del ítem **Concentrado de Hallazgos** |
| `Dashboard Team` | Primera pantalla del ítem **Mi Equipo** |
| `Dashboard Programas` | Primera pantalla del ítem **Programas Anuales** |
| `Dashboard Concentrado` | Primera pantalla del ítem **Concentrado de Hallazgos** |
| `Dashboard Releases` | Primera pantalla del ítem **Liberaciones de Servicio** |
| `Dashboard Iniciativas` | Primera pantalla del ítem **Iniciativas** |
| `Dashboard Tendencias` | Sección dentro del **Dashboard Ejecutivo** |
| `Release Plataforma (V2)` | Pestaña dentro de **Administración → Settings** |
| `Users`, `Roles` | Pestaña 1 dentro de **Administración** |
| `Module Views`, `Custom Fields`, `Validation Rules`, `Formulas` | Pestaña 2 (Module Builder) dentro de **Administración** |
| `Catalogs` | Pestaña 3 dentro de **Administración** |
| `AI Builder`, `IA Config` | Pestaña 4 (AI Builder) dentro de **Administración** |
| `Dashboard Builder` | Pestaña 5 dentro de **Administración** |
| `Audit Logs` | Pestaña 6 dentro de **Administración** |
| `Settings` | Pestaña 7 dentro de **Administración** |
| `Operación (BRD)` | Distribuido entre **Liberaciones de Servicio** y **Programas Anuales** |
| `Kitchen Sink`, `Profile` | Eliminados de producción (solo entorno Developer) |
