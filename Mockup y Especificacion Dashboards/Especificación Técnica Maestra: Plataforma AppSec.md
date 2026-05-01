# Especificación Técnica Maestra: Plataforma AppSec

**Versión:** 1.0  
**Fecha:** Abril 2026  
**Clasificación:** Confidencial — Uso Interno

Este documento es la especificación técnica y funcional única y definitiva de la plataforma AppSec. Consolida todos los módulos operativos, dashboards, el menú de navegación, el Builder No-Code, las funcionalidades de IA, los flujos de estatus, los templates de importación, la matriz de permisos y las reglas de negocio transversales. El equipo de desarrollo debe seguir estas instrucciones al pie de la letra.

---

## Tabla de Contenidos

| # | Sección |
|---|---|
| 1 | Principios Generales de Diseño y Arquitectura |
| 2 | Arquitectura del Menú Principal (Sidebar) |
| 3 | Módulo: Organización (Jerarquía) |
| 4 | Módulo: Inventario (Repositorios y Activos Web) |
| 5 | Módulo: Vulnerabilidades (SAST, DAST, SCA, CDS, MDA, MAST) |
| 6 | Módulo: Threat Modeling (MDA) |
| 7 | Módulo: MAST (Vulnerabilidades en Aplicaciones Móviles) |
| 8 | Módulo: Planes de Remediación |
| 9 | Módulo: Operación (Liberaciones y Pipeline) |
| 10 | Módulo: Revisión de Terceros |
| 11 | Módulo: Programas Anuales e Iniciativas |
| 12 | Motor de Scoring Mensual (Transversal) |
| 13 | Módulo: Seguridad en Código Fuente |
| 14 | Módulo: Servicios Regulados |
| 15 | Módulo: Temas Emergentes y Auditorías |
| 16 | Módulo: Iniciativas |
| 17 | Módulo: Desempeño (Compromisos OKR) |
| 18 | Módulo: Indicadores (KPIs) y Notificaciones |
| 19 | Módulo: Administración (Builder No-Code) |
| 20 | Matriz de Roles y Permisos Granulares |
| 21 | Dashboards (Vistas Analíticas) |
| 22 | Funcionalidades de Inteligencia Artificial (Transversales) |
| 23 | Templates de Importación Masiva |
| 24 | Flujos de Estatus Iniciales (Out-of-the-box) |
| 25 | Reglas de Negocio Transversales (SLAs) |
| 26 | Requisitos No Funcionales (Fase H) |
| 27 | Gestión del Ciclo de Vida de Programas e Iniciativas |
| 28 | Gestión del Ciclo de Vida de Indicadores (KPIs) |
| 29 | Gestión de Excepciones y Aceptación de Riesgo |
| 30 | Bitácora de Actualizaciones (Log de Actividad) |
| 31 | Búsqueda Global (Omnisearch) |
| 32 | Gestión de Usuarios y Reasignación |
| 33 | Catálogos Centrales (Valores Iniciales) |
| 34 | Gestión de Archivos Adjuntos |
| 35 | Modo de Cierre de Período (Freeze) |
| 36 | Estados de Pantalla (UX Transversal) |
| 37 | Acciones Masivas en Tablas |
| 38 | Columnas Configurables por Usuario |
| 39 | Builder de Inteligencia Artificial (AI Builder) |
| 40 | Dashboard Builder (Constructor de Vistas Analíticas) |

---

Este documento maestro consolida la especificación técnica y funcional exhaustiva de la plataforma AppSec. El equipo de desarrollo debe seguir estas instrucciones al pie de la letra para garantizar la correcta captura, visualización, edición y gestión de datos, cumpliendo con el principio de "100% No-Code Builder".

---

## 1. Principios Generales de Diseño y Arquitectura

1. **100% No-Code Builder:** Todos los formularios, catálogos, flujos de estatus, reglas de SLA, métricas, permisos y plantillas de exportación deben ser configurables desde la sección de Administración sin tocar código.
2. **Navegación Relacional:** No existen menús planos interminables. Las sub-entidades se gestionan dentro del detalle de su entidad padre (ej. las actividades se gestionan dentro del detalle del programa).
3. **Dashboards Contextuales:** Al entrar a cualquier módulo, la primera pantalla debe ser el Dashboard específico de ese módulo. Desde ahí se hace drill-down hacia las tablas de datos.
4. **Paneles Laterales (Drawers):** La creación, edición y visualización de detalles rápidos se realiza en paneles laterales que se deslizan desde la derecha, sin recargar la página ni perder el contexto de la tabla principal.
5. **Filtros Compactos:** Los filtros se ocultan en un panel lateral o popover, y los filtros activos se muestran como "chips" (etiquetas) debajo de la barra de búsqueda.
6. **Exportación WYSIWYG:** Todas las tablas tienen un botón de exportación (Excel/PDF) que respeta exactamente las columnas visibles, el orden y los filtros aplicados en ese momento.
7. **Importación Estandarizada:** Toda pantalla con importación masiva debe incluir un botón "Descargar Template" que provea un archivo Excel/CSV con las cabeceras exactas esperadas.
8. **Validaciones en Tiempo Real:** Los formularios validan campos obligatorios y formatos antes de permitir el envío.
9. **Prevención de Pérdida de Datos:** Alerta de confirmación al intentar cerrar un panel con cambios no guardados.
10. **Indicadores Automáticos:** Los KPIs se calculan en tiempo real mediante consultas a la base de datos. No existen botones de "Calcular".

---

## 2. Arquitectura del Menú Principal (Sidebar)

El menú principal se divide en 7 secciones colapsables. Las entidades hijas no existen como ítems independientes.

### 2.1 📊 Dashboards
- **Dashboard Ejecutivo:** Carga el Dashboard 1 (Visión global de la jefatura). Es la página de inicio (Home) por defecto. Visible para Jefe y Coordinadores.
- **Score de Madurez:** Carga la vista de evolución del score por célula/organización. Visible para Todos.

### 2.2 🏢 Organización & Inventario
- **Estructura Organizacional:** Carga la vista de árbol relacional (Dirección → Subdirección → Gerencia → Organización → Célula). Visible para Todos.
- **Repositorios:** Carga el inventario central de código fuente. Visible para Todos.
- **Activos Web:** Carga el inventario de URLs y dominios expuestos. Visible para Todos.

### 2.3 🛡️ Gestión de Vulnerabilidades
- **Concentrado de Hallazgos:** Carga el Dashboard 5 (Vulnerabilidades). Desde ahí se navega a la tabla unificada con filtros por motor. Visible para Todos.
- **Planes de Remediación:** Carga la vista de agrupación de hallazgos con fechas compromiso. Visible para Todos.
- **Threat Modeling:** Carga la vista de Programas TM. Al hacer clic en uno, se ven sus Sesiones y Amenazas anidadas. Visible para Todos.

### 2.4 ⚙️ Operación & Liberaciones
- **Kanban de Liberaciones:** Carga el Dashboard 7 (Vista visual del flujo de Jira). Visible para Todos.
- **Servicios y Liberaciones:** Carga el Dashboard 6 (Tabla). Al hacer clic en una liberación, se ven sus Etapas y Pipelines anidados. Visible para Todos.
- **Temas Emergentes:** Carga el Dashboard 8 (Parte A). Al hacer clic en un tema, se ven sus Actualizaciones y Cierres anidados. Visible para Todos.
- **Iniciativas:** Carga el Dashboard 3 (Parte B). Al hacer clic en una iniciativa, se ven sus Hitos y Actualizaciones anidados. Visible para Todos.

### 2.5 📅 Programas & Auditorías
- **Programas Anuales:** Carga el Dashboard 3 (Parte A). Al hacer clic en un programa, se ven y capturan sus Actividades mensuales anidadas. Visible para Todos.
- **Auditorías:** Carga el Dashboard 8 (Parte B). Al hacer clic en una auditoría, se ven sus Hallazgos y Evidencias anidadas. Visible para Todos.
- **Servicios Regulados:** Carga la vista de seguimiento de cumplimiento regulatorio. Visible para Todos.

### 2.6 🎯 Desempeño (OKR / MBO)
- **Mis Compromisos:** Carga la vista individual del analista para reportar avance y cargar evidencias. Visible para Todos.
- **Mi Equipo:** Carga el Dashboard 9 (Drill-down jerárquico) para validación y aprobación de Qs. Visible para Jefe y Coordinadores.

### 2.7 🛠️ Administración
- **Usuarios y Roles:** Gestión de accesos y permisos granulares. Solo Admin.
- **Catálogos Centrales:** Interfaz CRUD para todas las listas desplegables. Solo Admin.
- **Indicadores (KPIs):** Captura de indicadores manuales y configuración de fórmulas. Solo Admin.
- **Flujos de Estatus:** Definición de transiciones permitidas. Solo Admin.
- **Module Views & Builder:** Configuración de pantallas y campos dinámicos. Solo Admin.
- **Audit Logs:** Tabla inmutable de registro de acciones. Solo Admin.
- **Settings:** Configuraciones globales. Solo Admin.

---

## 3. Módulo: Organización (Jerarquía)

**Objetivo:** Gestionar la estructura organizacional de la empresa en 5 niveles.

### Vista Principal (Árbol Relacional)
- **Tipo de Vista:** Árbol colapsable (Tree View) o Tabla Jerárquica.
- **Columnas:** Nombre, Nivel, Responsable, Total Repositorios, Score de Madurez.
- **Interacción:** Al hacer clic en la flecha de expansión de una Dirección, se muestran sus Subdirecciones debajo, y así sucesivamente hasta llegar a las Células.

### Flujo de Captura / Edición (Panel Lateral)
- **Campos Base:**
  - `Nombre` (Texto, Obligatorio)
  - `Nivel` (Dropdown: Dirección, Subdirección, Gerencia, Organización, Célula, Obligatorio)
  - `Entidad Padre` (Dropdown filtrado por el nivel anterior, Obligatorio excepto para Dirección)
  - `Responsable` (Buscador de usuarios, Obligatorio)
  - `Plataforma` (Dropdown: GitHub, Atlassian, etc. Solo visible si Nivel = Organización)
  - `URL Base` (URL. Solo visible si Nivel = Organización)
- **Validación:** No se puede crear una entidad hija sin asignarle una entidad padre válida.

---

## 4. Módulo: Inventario (Repositorios y Activos Web)

**Objetivo:** Gestionar el catálogo de aplicaciones, repositorios de código y activos web.

### Vista Principal (Tabla)
- **Pestañas Superiores:** Repositorios | Activos Web.
- **Filtros (Repositorios):** Célula, Lenguaje principal, Criticidad, Estatus.
- **Filtros (Activos Web):** Ambiente, Empresa/Marca, Responsable, Célula.
- **Columnas (Repositorios):** Nombre, Célula Responsable, Criticidad, Lenguaje, Último Escaneo, Score de Madurez.
- **Columnas (Activos Web):** URL, Nombre del Sitio, Ambiente, Empresa/Marca, Responsable.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle del Activo (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos del activo, responsables, criticidad.
  2. **Vulnerabilidades:** Tabla filtrada con los hallazgos activos de este activo.
  3. **Historial de Escaneos:** Log de cuándo pasaron los motores por este activo.

### Flujo de Captura (Panel Lateral)
- **Campos Repositorio:**
  - `Org ID de Referencia` (Texto)
  - `Nombre del Repositorio` (Texto, Obligatorio)
  - `URL del Repositorio` (URL, Obligatorio)
  - `Tecnología Principal` (Dropdown, Obligatorio)
  - `Librerías/Frameworks Clave` (Texto Múltiple)
  - `Servicios Conectados` (Texto Múltiple)
  - `Visibilidad` (Dropdown: Público/Privado, Obligatorio)
  - `Criticidad` (Dropdown, Obligatorio)
  - `Célula Responsable` (Relación con Organización, Obligatorio)
- **Campos Activo Web:**
  - `URL` (URL, Obligatorio)
  - `Nombre del Sitio` (Texto, Obligatorio)
  - `Ambiente` (Dropdown, Obligatorio)
  - `Empresa/Marca` (Dropdown, Obligatorio)
  - `Responsable` (Buscador de usuarios, Obligatorio)
  - `Subdirección`, `Gerencia`, `Célula` (Relaciones organizacionales)

---

## 5. Módulo: Vulnerabilidades (SAST, DAST, SCA, CDS, MDA, MAST)

**Objetivo:** Concentrador unificado de todos los hallazgos de seguridad detectados por los motores.

### Vista Principal (Tabla Unificada)
- **Filtros:** Motor, Severidad, Estado, Estatus, OWASP, Organización, Subdirección, Gerencia, Célula, Repositorio/URL, Rango de fechas, SLA vencido, Reincidente, Excepción activa.
- **Columnas:** ID, Motor, Severidad (con icono de color), Nombre/Descripción, Repositorio/Activo, Fecha Detección, SLA (Días restantes o Vencido), Estatus.
- **Interacción:** Clic en una fila abre el panel lateral con el detalle técnico.

### Detalle de Vulnerabilidad (Panel Lateral)
- **Sección Superior:** ID, Severidad, Motor, Estatus actual.
- **Sección Media:** Descripción técnica, Evidencia (Request/Response, Línea de código, Snippet), Recomendación de remediación.
- **Sección Inferior (Acciones):** Botones para cambiar estatus (ej. Marcar como Falso Positivo, Solicitar Excepción), campo para agregar comentarios.

### Integración de IA (Triaje)
Para hallazgos SAST/DAST/SCA, la IA analiza el contexto del hallazgo (snippet de código, framework, visibilidad del repositorio) y sugiere una clasificación inicial (ej. "Probable Falso Positivo", "Requiere Revisión Manual", "Vulnerabilidad Confirmada") junto con un borrador de justificación técnica. El analista puede aceptar o rechazar la sugerencia, y la decisión se registra en el audit log.

---

## 6. Módulo: Threat Modeling (MDA)

**Objetivo:** Registro y seguimiento de ejercicios de modelado de amenazas, programados por la jefatura o bajo demanda.

### Vista Principal (Tabla)
- **Filtros:** Tipo (programado/bajo demanda), Activo, Tipo de activo, Criticidad de amenaza, Estatus, Célula, Rango de fechas.
- **Columnas:** Año, Empresa, Servicio, Categoría, Mes, Tipo, Ejecutó, Responsable, Célula.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle del Ejercicio (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos del ejercicio, activos vinculados, artefactos adjuntos.
  2. **Backlog de Amenazas:** Tabla con las amenazas identificadas.
  3. **Plan de Trabajo:** Amenazas vinculadas, actividades, fechas compromiso, responsables y firmantes con flujo de aprobación.

### Flujo de Captura (Panel Lateral)
- **Campos Encabezado:**
  - `Año` (Número, Obligatorio)
  - `Empresa` (Dropdown, Obligatorio)
  - `Servicio` (Texto, Obligatorio)
  - `Categoría` (Dropdown, Obligatorio)
  - `Mes` (Dropdown, Obligatorio)
  - `Tipo` (Dropdown: Programado/Bajo Demanda, Obligatorio)
  - `Ejecutó` (Buscador de usuarios, Obligatorio)
  - `Responsable` (Buscador de usuarios, Obligatorio)
  - `Célula` (Relación con Organización, Obligatorio)
- **Activos Vinculados (Polimórfico):**
  - `Tipo de Activo` (Dropdown: Repositorio, Dominio/URL, Componente/Base de Datos)
  - `Activo` (Buscador filtrado por el tipo seleccionado)
- **Artefactos Adjuntos:**
  - `Reporte Excel` (Carga de archivo o URL)
  - `Diagramas de Arquitectura/C4` (Carga de archivo o URL)

### Backlog de Amenazas (Campos)
- `ID_AMENAZA` (Texto, Autogenerado)
- `AMENAZA` (Texto, Obligatorio)
- `DESCRIPCIÓN` (Texto Largo, Obligatorio)
- `ACTIVO` (Relación, Obligatorio)
- `TIPO ACTIVO` (Dropdown, Obligatorio)
- `IMPACTO` (Texto)
- `MITIGACIÓN` (Texto Largo)
- `CONTROLES` (Texto Largo)
- `RIESGO` (Número)
- `CRITICIDAD` (Dropdown, Obligatorio)
- `ESTATUS` (Dropdown, Obligatorio)
- `REPORTADO` (Booleano)
- `PLAN_TRABAJO` (Relación)
- `REMEDIADA` (Booleano)
- `MES_REM` (Dropdown)
- `Estatus_PlanTrabajo` (Dropdown)
- `Clasificacion_Hallazgos` (Dropdown)

### Integración de IA (STRIDE/DREAD)
Al registrar un nuevo modelado, la IA sugiere amenazas categorizadas por STRIDE y propone un score de riesgo DREAD con justificación técnica para cada amenaza, basándose en el tipo de activo y su stack tecnológico. El analista puede aceptar, editar o rechazar las sugerencias.

---

## 7. Módulo: MAST (Vulnerabilidades en Aplicaciones Móviles)

**Objetivo:** Captura manual de vulnerabilidades identificadas en aplicaciones móviles.

### Vista Principal (Tabla)
- **Filtros:** Severidad, Estatus, Rango de fechas.
- **Columnas:** ID, Severidad, Fecha Detección, Estatus, Fecha Remediación.
- **Interacción:** Clic en una fila abre el panel lateral con el detalle técnico.

### Flujo de Captura (Panel Lateral)
- **Campos Base:**
  - `Severidad` (Dropdown, Obligatorio)
  - `Fecha Detección` (Fecha, Obligatorio)
  - `Estatus` (Dropdown, Obligatorio)
  - `Fecha Remediación` (Fecha)
  - Otros campos configurables desde el Schema Builder.

---

## 8. Módulo: Planes de Remediación

**Objetivo:** Agrupación de hallazgos con fechas compromiso para su remediación.

### Vista Principal (Tabla)
- **Filtros:** Estatus, Responsable, Rango de fechas.
- **Columnas:** Nombre del Plan, Responsable, Fecha Compromiso, Total Hallazgos, Estatus.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle del Plan (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos del plan, responsable, fecha compromiso.
  2. **Hallazgos Vinculados:** Tabla con los hallazgos asociados al plan.

### Flujo de Captura (Panel Lateral)
- **Campos Base:**
  - `Nombre del Plan` (Texto, Obligatorio)
  - `Responsable` (Buscador de usuarios, Obligatorio)
  - `Fecha Compromiso` (Fecha, Obligatorio)
  - `Estatus` (Dropdown, Obligatorio)
  - `Hallazgos` (Buscador múltiple de vulnerabilidades activas)

---

## 9. Módulo: Operación (Liberaciones y Pipeline)

**Objetivo:** Gestionar el flujo de pases a producción y registrar los escaneos de pipeline.

### 9.1 Liberaciones de Servicios (Flujo Jira)
- **Vista Principal:** Toggle entre Tabla y Kanban.
- **Filtros:** Estatus, Tipo de cambio, Criticidad, Responsable de pruebas, Rango de fechas, SLA en riesgo.
- **Campos de Captura:**
  - `ID/Referencia Jira` (Texto, Obligatorio)
  - `Nombre del Servicio/Cambio` (Texto, Obligatorio)
  - `Tipo de Cambio` (Catálogo, Obligatorio)
  - `Criticidad` (Dropdown, Obligatorio)
  - `Fecha de Entrada` (Fecha, Obligatorio)
  - `Participantes en Revisión de Diseño` (Buscador múltiple de usuarios)
  - `Pruebas de Seguridad Aplicadas` (Buscador múltiple de pruebas del catálogo)
  - `Dependencias` (Texto Múltiple)
  - `Fecha Estimada QA` (Fecha)
  - `Fecha Estimada Producción` (Fecha)
  - `Estatus General` (Catálogo, Obligatorio)

### 9.2 Liberaciones Pipeline (SAST / DAST)
- **Vista Principal:** Tabla de escaneos generales.
- **Filtros:** Motor, Resultado, Empresa/Marca, Tipo de aplicación, ¿Con vulns?, Rango de fechas.
- **Campos Registro General (SAST):**
  - `Scan ID` (Texto, Obligatorio)
  - `Organización` (Relación, Obligatorio)
  - `Repositorio` (Relación, Obligatorio)
  - `Rama/Release` (Texto, Obligatorio)
  - `Mes` (Dropdown, Obligatorio)
  - `Fecha de Escaneo` (Fecha, Obligatorio)
  - `Célula` (Relación, Obligatorio)
  - `Responsable del Cambio` (Buscador de usuarios, Obligatorio)
  - `Vulns Críticas/Altas/Medias/Bajas` (Números)
  - `Resultado` (Dropdown: Aprobado/No Aprobado, Obligatorio)
  - `Fecha Entrada QA` (Fecha)
  - `Fecha Salida a Producción` (Fecha)
  - `¿Liberado con Vulns Altas/Críticas?` (Booleano)
- **Match Automático:** Para escaneos rechazados, se carga un archivo de detalle que hace match por `Scan ID` + `Rama (Branch)` para heredar datos organizacionales.

---

## 10. Módulo: Revisión de Terceros

**Objetivo:** Evaluaciones de seguridad a proveedores.

### Vista Principal (Tabla)
- **Filtros:** Estatus, Responsable, Rango de fechas.
- **Columnas:** Nombre del Tercero, Fecha de Revisión, Responsable, Estatus.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle de la Revisión (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos del tercero, responsable, fecha de revisión.
  2. **Checklist de Revisión:** Tabla con los ítems evaluados, resultado y evidencias.

### Flujo de Captura (Panel Lateral)
- **Campos Base:**
  - `Nombre del Tercero` (Texto, Obligatorio)
  - `Fecha de Revisión` (Fecha, Obligatorio)
  - `Responsable de la Revisión` (Buscador de usuarios, Obligatorio)
  - `Estatus` (Dropdown, Obligatorio)
  - `Observaciones` (Texto Largo)
- **Checklist de Revisión:**
  - `Ítem` (Texto, Obligatorio)
  - `Resultado` (Dropdown: Cumple/No Cumple/No Aplica, Obligatorio)
  - `Evidencias` (Carga de archivo o URL)

---

## 11. Módulo: Programas Anuales e Iniciativas

**Objetivo:** Gestionar los planes de trabajo anuales y proyectos especiales mediante el motor de scoring mensual.

### Vista Principal (Tabla)
- **Pestañas Superiores:** Programas Operativos | Iniciativas.
- **Filtros:** Programa, Mes, Año, Analista responsable, % de avance.
- **Columnas:** Nombre, Responsable, Fecha Inicio, Fecha Fin, % Avance (Barra de progreso), Estatus.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle del Programa (Página Completa)
- **Sección Superior:** Resumen del programa, % de avance global.
- **Sección Media (Actividades):** Tabla con las actividades del programa. Columnas: Nombre, Mes, Peso (%), Estatus, Valor Obtenido.
- **Interacción:** Clic en "Agregar Actividad" abre un panel lateral. Clic en una actividad existente abre el panel lateral para editar o cargar evidencia.

### Flujo de Captura de Actividad (Panel Lateral)
- **Campos Base:**
  - `Nombre` (Texto, Obligatorio)
  - `Mes correspondiente` (Dropdown, Obligatorio)
  - `Peso relativo (%)` (Porcentaje, Obligatorio)
  - `Descripción` (Texto Largo)
  - `Tipo` (Dropdown: Fija/Divisible, Obligatorio)
- **Carga de Avance:**
  - `Valor obtenido` (Número o Porcentaje)
  - `Evidencia` (Carga de archivo o URL)
  - `Comentarios` (Texto Largo)

---

## 12. Motor de Scoring Mensual (Transversal)

**Objetivo:** Motor de cálculo que automatiza la medición de todos los programas anuales e iniciativas.

### Configuración del Motor (Panel de Administración)
- **Actividades por mes:** El administrador define las actividades de cada mes para cada programa, su peso porcentual y si son fijas o divisibles.
- **Actividades fijas:** Un solo entregable por mes. El analista marca el estatus.
- **Actividades divisibles:** El analista captura cuántas instancias aplican ese mes (ej. "de 10 sesiones, completé 8"). El sistema calcula el porcentaje proporcional.
- **Sub-estados con pesos parciales:** Cada actividad puede tener estados intermedios con valor progresivo (ej. En Proceso = 5%, En Proceso de Firmas = 7%, Finalizado = 10%).
- **Actividades vinculadas:** Algunas actividades calculan su porcentaje automáticamente desde datos de otros módulos (ej. "Remediación de vulnerabilidades" se alimenta del concentrado de hallazgos y sus estatus).
- **Avance mensual:** Suma de los porcentajes obtenidos en cada actividad del mes. Meta = 100%.
- **Avance anual:** Promedio simple de los avances mensuales sobre los meses definidos para ese programa (10, 11 o 12 meses, configurable).
- **Variabilidad:** Los pesos y actividades pueden variar mes a mes dentro del mismo programa.

---

## 13. Módulo: Seguridad en Código Fuente

**Objetivo:** Evaluación de la configuración de organizaciones en GitHub y Atlassian, y mantenimiento del inventario de repositorios y células.

### Vista Principal (Tabla)
- **Filtros:** Frente de trabajo, Organización, Estatus, Rango de fechas.
- **Columnas:** Frente de trabajo, Organización, % Avance, Estatus.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle de la Evaluación (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos de la evaluación, organización, responsable.
  2. **Checklist de Controles:** Tabla con los ítems evaluados, resultado y evidencias.
  3. **Hallazgos:** Tabla con los hallazgos identificados durante la evaluación.

### Flujo de Captura (Panel Lateral)
- **Campos Base:**
  - `Frente de trabajo` (Dropdown: Evaluación GitHub, Evaluación Atlassian, Inventario Repositorios, Inventario Equipos, Obligatorio)
  - `Organización` (Relación, Obligatorio)
  - `Responsable` (Buscador de usuarios, Obligatorio)
  - `Estatus` (Dropdown, Obligatorio)
- **Checklist de Controles:**
  - `Ítem` (Texto, Obligatorio)
  - `Resultado` (Dropdown: Cumple/No Cumple/No Aplica, Obligatorio)
  - `Evidencias` (Carga de archivo o URL)
- **Hallazgos:**
  - `Descripción` (Texto Largo, Obligatorio)
  - `Criticidad` (Dropdown, Obligatorio)
  - `Fecha Compromiso` (Fecha)
  - `Estatus` (Dropdown, Obligatorio)

---

## 14. Módulo: Servicios Regulados

**Objetivo:** Programa de seguimiento mensual de actividades de cumplimiento aplicadas a servicios bajo supervisión de múltiples regulaciones.

### Vista Principal (Tabla)
- **Filtros:** Regulación, Jefatura participante, Mes, Año, % de avance.
- **Columnas:** Regulación, Jefatura, Mes, % Avance, Estatus.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle del Seguimiento (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos del seguimiento, regulación, jefaturas participantes.
  2. **Actividades de Cumplimiento:** Tabla con las actividades definidas para el mes, peso, estatus y valor obtenido.

### Flujo de Captura (Panel Lateral)
- **Campos Base:**
  - `Regulación` (Catálogo, Obligatorio)
  - `Jefatura participante` (Catálogo, Obligatorio)
  - `Mes` (Dropdown, Obligatorio)
  - `Año` (Número, Obligatorio)
  - `Estatus` (Dropdown, Obligatorio)
- **Actividades de Cumplimiento:**
  - `Nombre` (Texto, Obligatorio)
  - `Peso relativo (%)` (Porcentaje, Obligatorio)
  - `Valor obtenido` (Número o Porcentaje)
  - `Evidencia` (Carga de archivo o URL)
  - `Comentarios` (Texto Largo)

---

## 15. Módulo: Temas Emergentes y Auditorías

**Objetivo:** Gestionar requerimientos especiales y hallazgos de auditoría externa.

### Vista Principal (Tabla)
- **Pestañas Superiores:** Temas Emergentes | Auditorías.
- **Filtros (Temas):** Tipo, Estatus, Responsable, Área involucrada, Rango de fechas, Sin movimiento en X días.
- **Filtros (Auditorías):** Tipo, Regulación, Estatus, Rango de fechas.

### Campos de Captura (Temas Emergentes)
- `Nombre` (Texto, Obligatorio)
- `Tipo` (Dropdown: 0-day, Solicitud urgente, etc., Obligatorio)
- `Descripción` (Texto Largo)
- `Origen` (Dropdown)
- `Áreas Involucradas` (Texto Múltiple)
- `Responsable Asignado` (Buscador de usuarios, Obligatorio)
- `Referencia` (Texto)
- `Fecha de Registro` (Fecha, Obligatorio)
- `Fecha Compromiso` (Fecha)
- `Estatus` (Dropdown, Obligatorio)

### Campos de Captura (Auditorías)
- `Tipo` (Dropdown: Interna/Externa, Obligatorio)
- `Nombre/Descripción` (Texto, Obligatorio)
- `Servicio Auditado` (Texto)
- `Regulación Aplicable` (Dropdown)
- `Fecha de Inicio` (Fecha, Obligatorio)
- `Fecha de Cierre` (Fecha)
- `Estatus` (Dropdown, Obligatorio)

---

## 16. Módulo: Iniciativas

**Objetivo:** Proyectos internos de diversa naturaleza.

### Vista Principal (Tabla)
- **Filtros:** Tipo, Estatus, Responsable, Rango de fechas.
- **Columnas:** Nombre, Tipo, Fecha Inicio, Fecha Fin, Responsable, % Avance, Estatus.
- **Interacción:** Clic en una fila abre el detalle completo en una nueva página.

### Detalle de la Iniciativa (Página Completa)
- **Pestañas (Tabs):**
  1. **Información General:** Datos de la iniciativa, responsable, fechas.
  2. **Hitos y Actualizaciones:** Tabla con los hitos del proyecto, % de avance y comentarios.

### Flujo de Captura (Panel Lateral)
- **Campos Base:**
  - `Nombre` (Texto, Obligatorio)
  - `Objetivo` (Texto Largo)
  - `Tipo` (Dropdown: RFI, Procesos, Plataformas, Otros, Obligatorio)
  - `Fecha de Inicio` (Fecha, Obligatorio)
  - `Fecha de Fin` (Fecha)
  - `Responsable(s)` (Buscador múltiple de usuarios, Obligatorio)
  - `Participantes` (Buscador múltiple de usuarios)
  - `Estatus general` (Catálogo, Obligatorio)
- **Hitos y Actualizaciones:**
  - `Nombre del Hito` (Texto, Obligatorio)
  - `Peso relativo (%)` (Porcentaje, Obligatorio)
  - `Valor obtenido` (Número o Porcentaje)
  - `Evidencia` (Carga de archivo o URL)
  - `Comentarios` (Texto Largo)

---

## 17. Módulo: Desempeño (Compromisos OKR)

**Objetivo:** Evaluar el desempeño del equipo mediante un motor de cascada sincrónico y modelo Padre-Hijo.

### Vista Principal (Tabla)
- **Pestañas Superiores:** Mis Compromisos | Mi Equipo.
- **Columnas:** Nombre del Colaborador, Rol, % Avance Q1, % Avance Q2, % Avance Q3, % Avance Q4, Promedio Anual.
- **Interacción:** Clic en una fila abre el detalle de los compromisos de esa persona.

### Estructura de Datos (Modelo Padre-Hijo)
- **Nivel 1: Compromiso (Padre)**
  - `Colaborador` (Relación)
  - `Categoría` (Catálogo)
  - `Nombre del Objetivo` (Texto)
  - `Descripción` (Texto Largo)
  - `Peso Global (%)` (Porcentaje, la suma de todos los padres debe ser 100%)
  - `Fecha Inicio / Fin` (Fechas)
  - `Tipo de Medición` (Manual, Automática, Por Sub-ítems)
- **Nivel 2: Sub-Compromiso (Hijo)**
  - `Compromiso Padre` (Relación)
  - `Nombre del Sub-ítem` (Texto)
  - `Resultado Esperado` (Texto)
  - `Peso Interno (%)` (Porcentaje, la suma de los hijos debe ser 100%)
  - `Evidencia Requerida` (Booleano)

### Flujo de Evaluación (Q-Review)
1. **Carga del Colaborador:** Registra % de avance, adjunta evidencias obligatorias (usando `/api/v1/uploads`), agrega comentarios y envía a revisión.
2. **Validación del Evaluador:** Revisa y decide: Aprobar, Editar (ajusta el %) o Rechazar (devuelve con feedback).
3. **Cálculo en Cascada:** Sincrónico al guardar. El avance del hijo calcula el del padre, el del padre calcula el global del colaborador, y el global del colaborador alimenta el compromiso automático de su líder.
4. **Semáforos:** Verde (≥85%), Amarillo (70-84.9%), Rojo (<70%).

---

## 18. Módulo: Indicadores (KPIs) y Notificaciones

**Objetivo:** Centralizar la configuración de métricas y alertas del sistema.

### 18.1 Gestión de Indicadores (KPIs)
- **Vista Principal:** Tabla con todos los indicadores definidos en el sistema.
- **Columnas:** ID, Nombre, Tipo (Automático/Manual), Frecuencia, Motor asociado, Estatus.
- **Captura Manual:** Formulario para ingresar el valor de los indicadores manuales mes a mes.
- **Configuración de Fórmulas (Builder):**
  - `ID Indicador` (Texto, ej. IND-001)
  - `Nombre` (Texto)
  - `Descripción` (Texto Largo)
  - `Tipo` (Dropdown: Automático/Manual)
  - `Fórmula` (Editor de texto con autocompletado de variables del sistema, ej. `(Total_Vulns_Cerradas / Total_Vulns_Detectadas) * 100`)
  - `Umbrales` (Verde: >X, Amarillo: Y-Z, Rojo: <W)
  - `Motor Asociado` (Dropdown: SAST, DAST, etc.)

### 18.2 Centro de Notificaciones In-App
- **Ubicación:** Icono de campana en la barra superior de navegación.
- **Configuración de Alertas (Builder):**
  - `Evento Disparador` (Dropdown: SLA próximo a vencer, Actividad sin movimiento, Tema estancado, etc.)
  - `Umbral de Tiempo` (Número de días)
  - `Destinatarios` (Dropdown: Responsable directo, Coordinador, Jefe, Todos)
  - `Plantilla de Mensaje` (Texto con variables, ej. "La vulnerabilidad {{ID}} vence en {{Dias}} días.")
  - `Canal` (Checkbox: In-App, Email)

---

## 19. Módulo: Administración (Builder No-Code)

**Objetivo:** Configurar el comportamiento de la plataforma sin necesidad de desarrollo adicional.

### 19.1 Schema Builder (Campos Dinámicos)
Permite agregar campos personalizados a cualquier módulo operativo (Vulnerabilidades, Programas, Iniciativas, etc.).
- **Tipos de Campo Soportados:** Texto Corto, Texto Largo, Número Entero, Número Decimal, Fecha, Booleano, Lista Desplegable (Catálogo), Porcentaje, URL, Fórmula Calculada.
- **Propiedades por Campo:**
  - `Nombre del Campo` (Etiqueta visible)
  - `Obligatorio` (Booleano)
  - `Visible en Tabla` (Booleano)
  - `Filtrable` (Booleano)
  - `Editable` (Booleano)
  - `Valor por Defecto` (Texto/Número)

### 19.2 Flujos de Estatus
Define el ciclo de vida de las entidades.
- **Configuración:**
  - `Entidad` (Dropdown: Vulnerabilidad, Liberación, Tema Emergente, etc.)
  - `Estatus Origen` (Catálogo)
  - `Estatus Destino Permitidos` (Selección múltiple del catálogo)
  - `Rol Requerido para Transición` (Selección múltiple de roles)

### 19.3 Plantillas de Exportación
Configura qué datos se incluyen al exportar.
- **Configuración:**
  - `Módulo` (Dropdown)
  - `Formato` (Dropdown: Excel, PDF)
  - `Columnas a Incluir` (Selección múltiple de campos base y dinámicos)
  - `Orden de Columnas` (Drag & Drop)

### 19.4 Audit Logs
Registro inmutable de todas las acciones del sistema.
- **Vista:** Tabla de solo lectura.
- **Columnas:** Timestamp, Usuario, Acción (Crear/Editar/Eliminar), Entidad Afectada, ID Registro, Valor Anterior (JSON), Valor Nuevo (JSON).
- **Filtros:** Rango de fechas, Usuario, Entidad, Acción.

---

## 20. Matriz de Roles y Permisos Granulares

El sistema implementa control de acceso basado en roles (RBAC) con permisos a nivel de módulo, acción y panel.

### 20.1 Roles Base
1. **Administrador:** Acceso total a la configuración del sistema (Builder, Catálogos, Usuarios).
2. **Jefe de Ciberseguridad:** Visión global. Acceso a todos los dashboards ejecutivos y aprobación de planes OKR.
3. **Coordinador:** Visión de su equipo. Acceso a dashboards de equipo y validación de Q-Reviews de sus analistas.
4. **Analista:** Visión operativa. Acceso a sus módulos asignados, captura de hallazgos y reporte de sus propios compromisos.

### 20.2 Configuración de Permisos (Builder)
El Administrador puede crear nuevos roles y configurar:
- **Permisos por Módulo:** Ver, Crear, Editar, Eliminar, Exportar, Aprobar.
- **Permisos por Dashboard:** Selección de qué paneles/widgets específicos son visibles para el rol.
- **Permisos de Datos:** Ver todos los registros vs. Ver solo los registros asignados al usuario o a su célula.

---

## 21. Dashboards (Vistas Analíticas)

La plataforma cuenta con 10 dashboards interactivos. Todos comparten las siguientes reglas:
- **Exportación WYSIWYG:** Botones de "Exportar a PDF" y "Exportar a Excel" que respetan los filtros aplicados.
- **Estados de Carga:** Skeleton loaders durante la obtención de datos.
- **Tooltips:** Todas las gráficas muestran tooltips nativos al pasar el mouse.
- **Sin Datos (Empty States):** Mensajes claros cuando no hay información para los filtros seleccionados.
- **Filtros Compactos:** Ocultos en panel lateral o popover, con "chips" para los filtros activos.
- **Indicadores Automáticos:** Calculados en tiempo real.
- **Selector por Motor:** Dropdown para filtrar indicadores por motor (SAST, DAST, etc.).
- **Histórico:** Vista de tabla/gráfica para ver la evolución de cada indicador en los últimos 12 meses.

### 21.1 Dashboard Ejecutivo (Global)
Vista de alto nivel para la jefatura.
- **Fila 1 (KPI Cards):** Avance Programas Anuales, Vulnerabilidades Críticas Activas, Liberaciones Activas, Liberaciones con SLA en Riesgo, Temas Emergentes Abiertos, Auditorías Activas.
- **Fila 2:** Score de Madurez Global (Gauge Chart), Tendencia de Vulnerabilidades (Line Chart).
- **Fila 3:** Top 5 Repositorios con Críticas (Bar Chart), Estado SLA Vulnerabilidades (Donut Chart).

### 21.2 Dashboard Equipo
Carga de trabajo y desempeño individual.
- **Fila 1 (KPI Cards):** Total Analistas Activos, Tareas Vencidas Globales, Promedio de Avance Individual, Carga Máxima Individual.
- **Fila 2:** Tabla de Desempeño Individual (Avance, Liberaciones, Temas, Tareas Vencidas).
- **Fila 3:** Distribución de Liberaciones (Pie Chart), Distribución de Temas Emergentes (Bar Chart).

### 21.3 Dashboard Programas Anuales e Iniciativas
Vista consolidada con drill-down.
- **Parte A (Programas):** KPI Cards, Heatmap de Cumplimiento (meses x programas). Drill-down a Nivel 2 (Resumen, Desglose por Motor, Tabla de Actividades) y Nivel 3 (Detalle de Actividad).
- **Parte B (Iniciativas):** KPI Cards, Tabla de Iniciativas.

### 21.4 Dashboard Vulnerabilidades — Organizacional
Drill-down profundo de 7 niveles.
- **Niveles:** Global → Dirección → Subdirección → Gerencia → Organización → Célula → Repositorio.
- **Contenido por Nivel:** KPI Cards (Total, Críticas, Altas, SLA Vencido), Tabla/Grid de la entidad hija con conteos y desglose por severidad.

### 21.5 Dashboard Vulnerabilidades — Por Motor
Vista técnica y operativa.
- **Fila 1 (KPI Cards):** SAST, DAST, SCA, CDS, MDA (Total, Críticas, Altas, Tendencia).
- **Fila 2:** Distribución por Severidad y Motor (Stacked Bar Chart), Tendencia de Detección vs Remediación (Line Chart).
- **Fila 3:** Top 10 Vulnerabilidades más comunes (Bar Chart), Tabla de Vulnerabilidades Vencidas.

### 21.6 Dashboard Liberaciones (Tabla)
Monitoreo del flujo de pases a producción.
- **Fila 1 (KPI Cards):** Liberaciones Activas, Con SLA en Riesgo, Con Observaciones Pendientes, Críticas en Proceso.
- **Fila 2:** Tabla Detallada (ID, Tipo, Criticidad, Responsable, Fechas, Estatus, Alerta SLA).

### 21.7 Dashboard Kanban de Liberaciones
Visualización ágil del flujo.
- **Tablero:** Columnas configurables (Recibida, Revisión, Validaciones, QA, Producción, etc.).
- **Tarjetas:** Nombre, Tipo, Criticidad, Responsable, Días en columna, Alerta SLA. Drag & Drop soportado.

### 21.8 Dashboard Temas Emergentes y Auditorías
Monitoreo de requerimientos especiales.
- **Parte A (Temas):** KPI Cards (Abiertos, Sin Movimiento, Próximos a Vencer), Tabla de Temas.
- **Parte B (Auditorías):** KPI Cards (Activas, Cerradas, Hallazgos Pendientes), Tendencia (Line Chart), Tabla de Auditorías.

### 21.9 Dashboard Compromisos OKR
Evaluación jerárquica con drill-down de 4 niveles.
- **Niveles:** Jefatura (Global) → Perfil del Colaborador → Detalle del Compromiso → Action Center.
- **Contenido:** KPI Cards, Heatmap de Jefatura, Simulador de Cascada, Radar Chart de desempeño, Tablas de compromisos y sub-ítems.

### 21.10 Dashboard Release de Plataforma
Monitoreo de actualizaciones de AppSec.
- **Fila 1 (KPI Cards):** Versión Actual, Última Actualización, Releases en Desarrollo, Bugs Reportados.
- **Fila 2:** Línea de Tiempo (Timeline), Tabla de Changelog.

---

## 22. Funcionalidades de Inteligencia Artificial (Transversales)

La plataforma es "AI Provider Ready" (configurable por variables de entorno). El administrador puede habilitar/deshabilitar la IA globalmente y configurar las credenciales del LLM (ej. OpenAI).

### 22.1 Modelado de Amenazas Asistido (STRIDE / DREAD)
- **Ubicación:** Módulo de Threat Modeling (MDA).
- **Funcionalidad:** Al crear un nuevo modelado y vincular activos, aparece un botón "Sugerir Amenazas con IA".
- **Resultado Esperado:** La IA analiza el tipo de activo y su stack tecnológico, y devuelve una lista de amenazas categorizadas por STRIDE. Para cada amenaza, propone un score DREAD y controles mitigantes.
- **Interacción:** El analista revisa la lista en un modal, selecciona cuáles agregar al backlog y puede editar los scores propuestos.

### 22.2 Triaje y Análisis de Falsos Positivos
- **Ubicación:** Panel lateral de detalle de vulnerabilidades (SAST, DAST, SCA).
- **Funcionalidad:** Botón "Analizar Contexto con IA".
- **Resultado Esperado:** La IA analiza el snippet de código, payload o dependencia afectada junto con el contexto del repositorio (framework, visibilidad). Sugiere una clasificación (ej. "Probable Falso Positivo") y genera un borrador de justificación técnica.
- **Interacción:** El analista puede aceptar la sugerencia (lo que cambia el estatus y guarda la justificación) o rechazarla. La decisión se registra en el Audit Log.

---

## 23. Templates de Importación Masiva

Toda pantalla con importación masiva debe incluir un botón "Descargar Template" que provea un archivo Excel/CSV vacío con las cabeceras exactas. El sistema aplica una regla de **rechazo estricto**: si una fila no cumple el formato o no hace match con el inventario, se rechaza esa fila específica y se muestra un log de errores.

### 23.1 Template SAST (Checkmarx)
- **Columnas Obligatorias:** `Project`, `Organization`, `Repository`, `Vulnerability`, `Severity`, `State`, `Status`, `Severity State`, `CWE_ID`, `Language`, `Group`, `Source/Dest File/Line`, `First Detection`, `Detection Month`, `Confidence Level`, `SimilarityID`, `OWASP TOP 10 2021`.

### 23.2 Template SCA (Checkmarx)
- **Columnas Obligatorias:** `Project`, `Organization`, `Repositories`, `Severity`, `State`, `Active State`, `EPSS Score`, `EPSS Percentile`, `Description`, `Package`, `Vulnerable Version`, `Recommended Version`, `CVSS Score`, `Detection Date`, `Scan ID`, `Project ID`, `Recommendation`, `OWASP TOP 10 2021`.

### 23.3 Template CDS (Secretos)
- **Columnas Obligatorias:** `Project`, `Organization`, `Repository`, `Secret Type`, `Severity`, `State`, `Status`, `State`, `File`, `Line`, `Snippet`, `Validity`, `Comments`.

### 23.4 Template Pipeline SAST/DAST
- **Columnas Obligatorias:** `Scan ID`, `Organization`, `Repository`, `Branch`, `Month`, `Scan Date`, `Cell`, `Responsible`, `Critical Vulns`, `High Vulns`, `Medium Vulns`, `Low Vulns`, `Result`.

### 23.5 Template Inventario de Repositorios
- **Columnas Obligatorias:** `Org ID`, `Repository Name`, `URL`, `Main Technology`, `Visibility`, `Criticality`, `Cell`.

---

## 24. Flujos de Estatus Iniciales (Out-of-the-box)

El sistema debe precargar los siguientes flujos de estatus, los cuales podrán ser modificados posteriormente desde el Builder.

### 24.1 Vulnerabilidades (SAST/SCA/CDS/DAST/MAST)
- **Estatus Base:** `Nueva`, `Activa`, `En Remediación`, `Remediada`, `Falso Positivo`, `Riesgo Aceptado`, `Excepción Temporal`.
- **Transiciones:**
  - `Nueva` → `Activa`, `Falso Positivo`
  - `Activa` → `En Remediación`, `Riesgo Aceptado`, `Excepción Temporal`
  - `En Remediación` → `Remediada`, `Activa`

### 24.2 Liberaciones (Servicios)
- **Estatus Base:** `Recibida`, `Revisión de Diseño`, `Validaciones de Seguridad`, `Con Observaciones`, `Pruebas de Seguridad`, `VoBo Dado`, `En QA`, `En Producción`, `Cancelada`.
- **Transiciones:** Flujo lineal secuencial, con posibilidad de regresar a `Con Observaciones` desde cualquier punto antes de `VoBo Dado`.

### 24.3 Temas Emergentes
- **Estatus Base:** `Abierto`, `En Análisis`, `En Ejecución`, `En Espera de Tercero`, `Cerrado`, `Cancelado`.

### 24.4 Auditorías
- **Estatus Base:** `Planificada`, `En Ejecución`, `En Revisión de Hallazgos`, `Cerrada con Hallazgos`, `Cerrada sin Hallazgos`.

---

## 25. Reglas de Negocio Transversales (SLAs)

El sistema calcula automáticamente los SLAs y genera alertas basadas en las siguientes reglas base (configurables desde el Builder):

### 25.1 SLAs de Remediación de Vulnerabilidades
- **Críticas / Altas (SAST, SCA, MDA):** 60 días (2 meses) desde la fecha de detección.
- **Críticas / Altas (DAST, CDS):** 7 días desde la fecha de detección.
- **Cálculo:** El sistema resta la fecha actual de la fecha límite. Si el resultado es ≤ 7 días, el estatus del SLA cambia a "En Riesgo" (Amarillo). Si es < 0, cambia a "Vencido" (Rojo).

### 25.2 Excepciones y Aceptación de Riesgo
- Si una vulnerabilidad pasa a estatus `Excepción Temporal`, el SLA se pausa hasta la fecha de vencimiento de la excepción.
- Si pasa a `Riesgo Aceptado`, el SLA se desactiva permanentemente.

### 25.3 Alertas de Inactividad
- **Temas Emergentes:** Si no hay una nueva entrada en la bitácora de actualizaciones en 7 días, el sistema dispara la alerta "Tema estancado".
- **Actividades de Programa:** Si una actividad no tiene actualizaciones en 15 días hábiles, se dispara alerta al responsable.

---

## 26. Requisitos No Funcionales (Fase H)

- **Cobertura y Performance:** La plataforma debe procesar la importación de un archivo CSV con 10,000 filas (ej. escaneos SAST) sin dar timeout.
- **Tiempos de Carga:** Los dashboards principales deben cargar en menos de 3 segundos.
- **Seguridad:** Implementación estricta de cookies HttpOnly, protección CSRF y logs de auditoría inmutables mediante el mecanismo `audit_action_prefix` del framework base.
## 27. Gestión del Ciclo de Vida de Programas e Iniciativas

**Objetivo:** Definir las reglas de negocio para la creación, modificación y cierre de programas anuales.

### 27.1 Versionado Anual (Cierre de Ciclo)
- **Flujo de Cierre:** Al finalizar el año fiscal, el Administrador ejecuta la acción "Cerrar Ciclo". El sistema congela el programa actual (pasa a estatus `Histórico`) y bloquea cualquier edición de sus actividades.
- **Clonación para Nuevo Ciclo:** El sistema permite "Clonar" un programa histórico. Esto crea un nuevo programa en estatus `Borrador`, copiando la estructura de actividades y pesos, pero reseteando todos los valores obtenidos y evidencias a cero.
- **Comparativa Histórica:** Los dashboards permiten seleccionar el "Año" en los filtros globales para comparar el desempeño del programa actual contra sus versiones históricas.

### 27.2 Modificación de Programas Activos
- **Cambios Permitidos:** Durante el año, el Administrador puede agregar nuevas actividades, eliminar actividades futuras o modificar los pesos relativos de los meses restantes.
- **Recálculo:** Si se modifica el peso de una actividad en un mes ya cerrado, el sistema recalcula automáticamente el avance de ese mes y el avance anual global.
- **Trazabilidad:** Cualquier modificación estructural a un programa activo genera un registro detallado en el Audit Log, indicando el usuario, el cambio de pesos y el impacto en el score global.

---

## 28. Gestión del Ciclo de Vida de Indicadores (KPIs)

**Objetivo:** Mantener la integridad de las métricas históricas cuando cambian las fórmulas de cálculo.

### 28.1 Modificación de Fórmulas
- **Congelamiento Histórico:** Cuando se modifica la fórmula de un indicador automático (ej. se agrega un nuevo motor al cálculo), el sistema **no** recalcula los meses anteriores por defecto. Los valores históricos se congelan para mantener la integridad de los reportes pasados.
- **Recálculo Retroactivo (Opcional):** El Administrador tiene la opción explícita de ejecutar un "Recálculo Retroactivo" si el cambio de fórmula debe aplicar a todo el año en curso.
- **Deprecación:** Si un indicador ya no es relevante, no se elimina. Se cambia su estatus a `Deprecado`, lo que lo oculta de los dashboards actuales pero lo mantiene disponible en las vistas históricas.

---

## 29. Gestión de Excepciones y Aceptación de Riesgo

**Objetivo:** Estandarizar el flujo de aprobación para vulnerabilidades que no pueden ser remediadas en tiempo.

### 29.1 Flujo de Solicitud
- El analista o responsable de la célula solicita una excepción desde el panel de detalle de la vulnerabilidad.
- **Campos Requeridos:** `Tipo` (Excepción Temporal / Aceptación de Riesgo), `Justificación Técnica` (Texto Largo), `Fecha de Vencimiento Solicitada` (Solo para temporales), `Controles Compensatorios` (Texto Largo), `Evidencia` (Archivo adjunto).

### 29.2 Flujo de Aprobación
- La solicitud cambia el estatus de la vulnerabilidad a `Excepción Solicitada` y pausa el reloj del SLA.
- Se notifica al Jefe de Ciberseguridad o al Comité de Riesgos (según la criticidad).
- **Aprobación:** Si se aprueba, el estatus cambia a `Excepción Temporal` o `Riesgo Aceptado`. El SLA se ajusta a la nueva fecha o se desactiva.
- **Rechazo:** Si se rechaza, la vulnerabilidad regresa a su estatus anterior y el reloj del SLA se reanuda, sumando los días que estuvo en pausa.

---

## 30. Bitácora de Actualizaciones (Log de Actividad)

**Objetivo:** Mantener un historial conversacional y de cambios de estado en entidades colaborativas.

### 30.1 Entidades Soportadas
Aplica para: Vulnerabilidades, Liberaciones, Temas Emergentes, Auditorías e Iniciativas.

### 30.2 Funcionamiento
- En el panel lateral de estas entidades, existe una pestaña "Bitácora".
- **Registro Automático:** El sistema inserta automáticamente una entrada cuando cambia el estatus, el responsable o la fecha compromiso.
- **Registro Manual:** Los usuarios pueden agregar comentarios de texto enriquecido, etiquetar a otros usuarios (con `@usuario`, lo que dispara una notificación in-app) y adjuntar archivos.
- **Inmutabilidad:** Los comentarios no pueden ser editados ni eliminados una vez publicados.

---

## 31. Búsqueda Global (Omnisearch)

**Objetivo:** Facilitar la localización rápida de cualquier registro en la plataforma.

### 31.1 Interfaz
- Barra de búsqueda persistente en la cabecera superior (Header) de la aplicación.
- Soporta atajo de teclado (`Ctrl + K` o `Cmd + K`).

### 31.2 Alcance de Búsqueda
- Busca coincidencias en: IDs de vulnerabilidades, nombres de repositorios, nombres de aplicaciones, títulos de liberaciones, nombres de temas emergentes y nombres de usuarios.
- **Resultados Agrupados:** El dropdown de resultados agrupa las coincidencias por módulo (ej. "3 Vulnerabilidades encontradas", "1 Repositorio encontrado").
- Al hacer clic en un resultado, navega directamente al panel de detalle de ese registro.

---

## 32. Gestión de Usuarios y Reasignación

**Objetivo:** Manejar el ciclo de vida de los colaboradores y la propiedad de los registros.

### 32.1 Alta y Baja
- **Alta:** Integración con el Directorio Activo (SSO/SAML) o creación manual. Se le asigna un Rol y una Célula/Organización.
- **Baja (Offboarding):** Cuando un usuario es desactivado, el sistema no elimina su cuenta (para mantener la integridad de los logs). Su estatus cambia a `Inactivo`.

### 32.2 Reasignación de Registros
- Al desactivar un usuario, el sistema detecta si tiene registros activos asignados (Vulnerabilidades, Liberaciones, Temas Emergentes, Compromisos OKR).
- El Administrador debe usar la herramienta de "Reasignación Masiva" para transferir la propiedad de esos registros a un nuevo usuario o al líder de la célula, asegurando que ninguna tarea quede huérfana.

---

## 33. Catálogos Centrales (Valores Iniciales)

**Objetivo:** Definir los valores base para las listas desplegables del sistema.

### 33.1 Catálogos Requeridos
- **Motores de Seguridad:** `SAST`, `DAST`, `SCA`, `CDS`, `MDA`, `MAST`, `Pentest Manual`.
- **Severidad:** `Crítica`, `Alta`, `Media`, `Baja`, `Informativa`.
- **Tipos de Cambio (Liberaciones):** `Pase a Producción`, `Hotfix`, `Rollback`, `Cambio de Infraestructura`.
- **Criticidad de Activos:** `Tier 1 (Misión Crítica)`, `Tier 2 (Core Business)`, `Tier 3 (Soporte)`, `Tier 4 (Interno)`.
- **Categorías OKR:** `Operación`, `Innovación`, `Cumplimiento`, `Desarrollo de Equipo`.

---

## 34. Gestión de Archivos Adjuntos

**Objetivo:** Estandarizar la carga y almacenamiento de evidencias.

### 34.1 Reglas de Carga
- **Tamaño Máximo:** 25 MB por archivo.
- **Formatos Permitidos:** `.pdf`, `.xlsx`, `.csv`, `.docx`, `.png`, `.jpg`, `.jpeg`, `.zip`.
- **Formatos Bloqueados:** Ejecutables y scripts (`.exe`, `.sh`, `.bat`, `.js`, etc.).
- **Almacenamiento:** Los archivos se almacenan en un bucket S3 (o equivalente) con URLs firmadas temporalmente. No se guardan en la base de datos relacional.
- **Escaneo Antivirus:** Todo archivo subido pasa por un escaneo automático antes de estar disponible para descarga.

---

## 35. Modo de Cierre de Período (Freeze)

**Objetivo:** Proteger la integridad de los datos reportados a la dirección.

### 35.1 Bloqueo Mensual
- El día 5 de cada mes, el sistema ejecuta un "Cierre de Período" automático para el mes anterior.
- **Efecto:** Se bloquea la edición de avances de programas, captura de indicadores manuales y evaluación de OKRs del mes cerrado.
- **Desbloqueo Excepcional:** Solo el Administrador puede abrir temporalmente un mes cerrado para correcciones, lo cual genera una alerta crítica en el Audit Log.

## 36. Estados de Pantalla (UX Transversal)

**Objetivo:** Garantizar una experiencia de usuario fluida y comunicativa en todos los escenarios posibles.

### 36.1 Empty States (Estados Vacíos)
- Cuando una tabla o dashboard no tiene datos (ya sea por primera vez o por filtros muy restrictivos), no se debe mostrar una tabla vacía.
- **Componentes:** Ilustración o icono representativo del módulo, título claro (ej. "No hay vulnerabilidades activas"), subtítulo explicativo, y un botón de llamada a la acción (Call to Action) primario (ej. "Importar Escaneo" o "Limpiar Filtros").

### 36.2 Loading States (Estados de Carga)
- **Carga Inicial:** Uso de Skeleton Loaders (bloques grises animados) que imitan la estructura de la tabla o dashboard mientras se obtienen los datos. No usar spinners genéricos a pantalla completa.
- **Acciones Asíncronas:** Al guardar un formulario o cambiar un estatus, el botón presionado debe mostrar un spinner interno y deshabilitarse para prevenir doble envío.

### 36.3 Error States (Manejo de Errores)
- **Errores de Red/API:** Mostrar un "Toast" (notificación flotante) rojo en la esquina superior derecha con un mensaje amigable (ej. "No se pudo guardar el cambio. Verifica tu conexión e intenta de nuevo.").
- **Errores de Validación:** Resaltar el campo específico en rojo con un mensaje de ayuda debajo del input antes de enviar el formulario.

---

## 37. Acciones Masivas en Tablas

**Objetivo:** Permitir la gestión eficiente de grandes volúmenes de registros, especialmente en el módulo de Vulnerabilidades.

### 37.1 Interfaz
- Todas las tablas principales incluyen un checkbox en la cabecera para "Seleccionar Todos" (los visibles en la página actual) y checkboxes individuales por fila.
- Al seleccionar al menos una fila, aparece una barra de herramientas flotante (Bulk Actions Bar) en la parte inferior o superior de la tabla.

### 37.2 Acciones Soportadas
- **Cambio de Estatus Masivo:** Permite mover múltiples registros al mismo estatus (ej. marcar 50 vulnerabilidades como "Falso Positivo" simultáneamente). Requiere confirmación y permite agregar un comentario global.
- **Reasignación Masiva:** Cambiar el responsable de múltiples registros a un nuevo usuario.
- **Exportar Selección:** Generar un Excel/PDF solo con las filas seleccionadas.
- **Eliminación Masiva:** Solo disponible para el rol Administrador. Requiere confirmación explícita (escribir "ELIMINAR").

---

## 38. Columnas Configurables por Usuario

**Objetivo:** Permitir a cada analista personalizar su vista de trabajo.

### 38.1 Interfaz
- Botón de "Configurar Columnas" (icono de engranaje) en la barra de herramientas de cada tabla.
- Abre un popover con la lista de todas las columnas disponibles (base y dinámicas del Builder).
- El usuario puede marcar/desmarcar columnas y arrastrarlas para cambiar su orden.

### 38.2 Persistencia
- Las preferencias de columnas se guardan en el Local Storage del navegador o en las preferencias del perfil del usuario en la base de datos, para que la vista se mantenga igual en futuras sesiones.

---

## 39. Builder de Inteligencia Artificial (AI Builder)

**Objetivo:** Permitir al Administrador configurar, afinar y expandir los casos de uso de IA sin tocar código.

### 42.1 Configuración Global del Provider
- **Panel de Settings:** Selección del proveedor (OpenAI, Azure OpenAI, Anthropic, AWS Bedrock).
- **Credenciales:** API Key, Base URL, Versión de API.
- **Modelo por Defecto:** Selección del modelo a usar (ej. `gpt-4o`, `claude-3-5-sonnet`).

### 42.2 Gestión de Prompts (Prompt Engineering UI)
El sistema no tiene los prompts "hardcodeados". El Administrador puede editarlos desde la interfaz.
- **Lista de Casos de Uso Activos:**
  1. Sugerencia de Amenazas STRIDE (MDA)
  2. Ponderación de Riesgo DREAD (MDA)
  3. Triaje de Falsos Positivos (Vulnerabilidades)
  4. Asistente de Redacción de Justificaciones
  5. Detección de Duplicados
- **Editor de Prompt:** Para cada caso de uso, el Administrador ve un editor de texto donde puede modificar el "System Prompt" y el "User Prompt".
- **Variables de Contexto:** El editor soporta variables dinámicas (ej. `{{snippet_codigo}}`, `{{framework_repositorio}}`, `{{historial_bitacora}}`) que el sistema inyecta en tiempo de ejecución.
- **Temperatura y Max Tokens:** Controles deslizantes para ajustar la creatividad y longitud de la respuesta de la IA.

### 42.3 Nuevos Casos de Uso de IA (Expandidos)
Además de STRIDE/DREAD y Triaje, el AI Builder habilita:
- **Asistente de Redacción:** En cualquier campo de "Justificación" o "Comentarios" de la Bitácora, un botón "Mejorar redacción con IA" que toma las notas crudas del analista y las convierte en un texto profesional y técnico.
- **Detección de Duplicados:** Al importar un escaneo, la IA analiza las vulnerabilidades nuevas contra las existentes (comparando similitud semántica del snippet y la ruta, no solo el ID exacto) y sugiere agruparlas si detecta que son la misma vulnerabilidad reportada de forma ligeramente distinta.

---

## 40. Dashboard Builder (Constructor de Vistas Analíticas)

**Objetivo:** Permitir al Administrador crear, modificar y personalizar los dashboards de la plataforma sin necesidad de escribir código, cumpliendo con el principio "100% No-Code Builder".

### 40.1 Gestión de Dashboards
- **Lista de Dashboards:** El Administrador puede ver todos los dashboards existentes (los 10 out-of-the-box y los personalizados).
- **Creación:** Al crear un nuevo dashboard, se define:
  - `Nombre del Dashboard` (Texto)
  - `Módulo Asociado` (Dropdown: Vulnerabilidades, Liberaciones, etc. Define de dónde sacará los datos por defecto).
  - `Icono` (Selector de iconos).
  - `Visibilidad` (Dropdown: Todos, Solo Jefe/Coordinadores, Solo Admin, o Roles Específicos).

### 40.2 Layout y Cuadrícula (Grid System)
- El constructor utiliza un sistema de cuadrícula (Grid) de 12 columnas.
- **Drag & Drop:** El Administrador puede arrastrar widgets desde un panel lateral hacia el lienzo (canvas) del dashboard.
- **Redimensionamiento:** Cada widget puede ser redimensionado arrastrando sus esquinas (ej. ocupar 3, 6 o 12 columnas).
- **Filas (Rows):** Los widgets se agrupan en filas lógicas para mantener la alineación visual.

### 40.3 Tipos de Widgets Soportados
Al agregar un widget, el Administrador selecciona el tipo de visualización:
1. **KPI Card (Tarjeta de Métrica):** Muestra un número único (ej. "Total Vulnerabilidades"). Soporta un subtítulo con tendencia (ej. "+5% vs mes anterior") y un color semafórico condicional.
2. **Bar Chart (Gráfica de Barras):** Vertical u horizontal. Útil para "Top 10 Repositorios" o "Vulnerabilidades por Célula".
3. **Line Chart (Gráfica de Líneas):** Para series de tiempo (ej. "Tendencia de Detección vs Remediación en los últimos 12 meses").
4. **Pie / Donut Chart (Gráfica Circular):** Para distribuciones porcentuales (ej. "Distribución por Severidad").
5. **Gauge Chart (Medidor):** Para scores que tienen un límite conocido (ej. "Score de Madurez de 0 a 100").
6. **Heatmap (Mapa de Calor):** Matriz de doble entrada (ej. "Meses vs Programas" para cumplimiento).
7. **Data Table (Tabla de Datos):** Una vista resumida de registros (ej. "Últimas 5 Liberaciones Críticas").

### 40.4 Configuración de Datos del Widget
Para cada widget, el Administrador configura de dónde provienen los datos:
- **Fuente de Datos (Data Source):** Selecciona la entidad base (ej. `Vulnerabilidades`).
- **Métrica (Agregación):** Selecciona la operación matemática: `Conteo (Count)`, `Suma (Sum)`, `Promedio (Avg)`, `Máximo (Max)`, `Mínimo (Min)`.
- **Dimensión (Agrupación):** Selecciona el campo por el cual agrupar los datos (ej. agrupar por `Severidad` o por `Motor`).
- **Filtros Base:** Condiciones predefinidas que siempre aplican a este widget (ej. `Estatus != Cerrado`).

### 40.5 Configuración de Interacciones (Drill-down)
- **Acción al Clic:** El Administrador define qué pasa cuando el usuario hace clic en un elemento del widget (ej. clic en la barra "Críticas").
- **Opciones de Drill-down:**
  - `Ninguna` (Solo lectura).
  - `Filtrar Dashboard` (Aplica el valor seleccionado como filtro global para el resto de los widgets).
  - `Abrir Tabla` (Navega a la vista de tabla del módulo, pre-filtrada con el valor seleccionado).
  - `Navegar a URL` (Redirección personalizada).

### 40.6 Filtros Globales del Dashboard
- El Administrador puede agregar "Controles de Filtro" en la parte superior del dashboard.
- **Tipos de Filtro:** Selector de Fecha (Rango), Dropdown simple (ej. Motor), Dropdown múltiple (ej. Células), Buscador de texto.
- **Mapeo:** Cada filtro global se mapea automáticamente a los campos correspondientes de los widgets del dashboard.
