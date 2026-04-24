# Prompt Maestro: Plataforma de Gestión de Ciberseguridad Aplicativa

---

## Contexto del Sistema

Eres un Arquitecto de Software Senior y Experto en Ciberseguridad Aplicativa (AppSec). Tu tarea es construir una plataforma centralizada de gestión para una **Jefatura de Ciberseguridad Aplicativa** dentro de una institución bancaria. El sistema debe ser altamente dinámico, configurable y seguro, eliminando la dependencia de archivos aislados y permitiendo que el jefe de la jefatura conozca el estado de todo sin necesidad de preguntar al equipo.

---

## Stack Tecnológico y Framework Base

Debes utilizar estrictamente el framework del repositorio `GazettEl/desarrollo-framework`. Es un starter kit full-stack listo para producción con reglas estrictas (Hard Rules) validadas por CI/CD.

- **Backend:** FastAPI, Python 3.12, SQLAlchemy Async, Pydantic v2, Alembic.
- **Frontend:** Next.js (App Router), TypeScript estricto, Tailwind CSS, Shadcn UI, TanStack Query.
- **Base de Datos:** PostgreSQL.
- **Infraestructura:** Docker Compose, Nginx (Reverse Proxy).

**Reglas Críticas del Framework que debes respetar:**
1. Type-Safety End-to-End: Pydantic en backend → tipos generados para TypeScript en frontend.
2. Autenticación exclusiva por cookies HttpOnly con protección CSRF de doble envío.
3. Patrón CRUD estandarizado: `Model → Schema → Service → Router → Frontend API Hook → UI Component`. Usar `make new-entity` para scaffolding.
4. Prohibición de `db.commit()` fuera del manejador central. Usar `db.flush()` en servicios.
5. Control de acceso mediante `require_ownership` y `require_role`.
6. Registro de auditoría automático mediante `audit_action_prefix` en todos los servicios.
7. Prohibición de operaciones bloqueantes. Todo debe ser async.

---

## Principios de Diseño Arquitectónico

1. **Configuration-Driven (Admin-Driven):** La estructura de datos, catálogos, flujos de estatus, reglas de SLA, métricas y permisos son configurables desde el panel de administración sin tocar código. Solo las nuevas funcionalidades requieren desarrollo.

### Frontera de Flexibilidad: Estructural vs Configurable

Para que la IA de desarrollo entienda exactamente dónde poner la rigidez arquitectónica y dónde la flexibilidad, esta es la frontera estricta:

**A. Lo que es ESTRUCTURAL (Hardcoded / Requiere desarrollo para cambiar):**
- El motor de scoring mensual (la lógica matemática de sumar porcentajes).
- El Schema Builder (el motor que permite crear campos dinámicos).
- El motor de indicadores (la lógica de cálculo de fórmulas).
- El sistema base de roles y permisos (la lógica de intercepción de rutas y vistas).
- El Panel de Administración (como contenedor).
- Los Dashboards como contenedores modulares (la estructura de grid y el enrutamiento).
- La integración con IA (los prompts y llamadas al LLM para triaje y análisis).

**B. Lo que es 100% CONFIGURABLE (Modificable por el Administrador sin código):**
- **Programas Anuales:** Crear nuevos, editar nombres, desactivarlos, definir cuántos meses duran.
- **Actividades y Pesos:** Qué actividades aplican cada mes para cada programa y cuánto valen (%).
- **Campos de Datos (Schema):** Qué campos tiene cada programa, vulnerabilidad o proceso (texto, listas, fechas, etc.).
- **Catálogos:** Todos los valores de listas desplegables (estatus, tipos, severidades, empresas, regulaciones, etc.).
- **Flujos de Estatus:** Qué estatus puede transicionar a qué otro estatus.
- **Indicadores:** Fórmulas específicas, SLAs (días/meses), umbrales de semáforos (verde/amarillo/rojo).
- **Dashboards:** Qué paneles/widgets aparecen en cada dashboard y en qué orden.
- **Procesos Operativos:** Crear nuevos flujos de operación (como Liberaciones o Revisión de Terceros).
- **Roles y Permisos:** Crear roles nuevos y definir a qué módulos, acciones y paneles específicos tienen acceso.
- **Umbrales de Alertas:** Cuántos días antes avisa un SLA, cuántos días sin movimiento disparan alerta.
2. **Schema Builder Dinámico:** Cada programa o módulo permite la definición de sus propios campos de forma dinámica. Tipos soportados: texto, número entero, número decimal, fecha, booleano, lista desplegable (catálogo), fórmula calculada, porcentaje, URL, texto largo. Cada campo define: nombre, tipo, obligatorio, visible en listado, filtrable, editable por analista y valor por defecto.
3. **Inventario Polimórfico:** Catálogo centralizado de activos (Repositorios, URLs, Componentes) relacionado bidireccionalmente con todos los módulos.
4. **Seguridad y Trazabilidad:** Principio de mínimo privilegio con permisos granulares hasta nivel de panel/widget. Log de auditoría inmutable para todas las acciones críticas.
5. **Navegación Drill-Down Multi-Dimensional:** Todas las vistas de datos permiten navegar de lo macro a lo micro en múltiples dimensiones (organizacional, por motor, por severidad, por célula) con breadcrumb visible en todo momento.
6. **Filtros Contextuales por Módulo:** Cada módulo expone sus propios filtros relevantes (rango de fechas, búsqueda de texto libre, ordenamiento por columna, agrupación, paginación). No existen filtros globales.

---

## Módulo 1: Catálogos Centrales (Inventarios) y Modelo Organizacional

El sistema debe incluir un módulo dedicado para gestionar los catálogos base. **Cada uno de estos catálogos debe tener su propia pantalla de gestión (CRUD)** con listado, filtros, buscador, paginación, formulario de captura manual, y **soporte para importación masiva**.

**Regla Global de Importación:** En cualquier pantalla donde exista la opción de "Importar masivamente" (catálogos, escaneos, hallazgos), el sistema debe proveer obligatoriamente un botón de **"Descargar Template"** que entregue un archivo Excel/CSV vacío con las cabeceras exactas esperadas.

### 1.1 Modelo Organizacional Jerárquico

La jerarquía organizacional es la columna vertebral de la plataforma. Cuando se registra un escaneo o vulnerabilidad en un repositorio, el sistema hereda automáticamente toda la cadena de responsables hacia arriba.

La relación jerárquica y los campos obligatorios por nivel son:
1. **Subdirección:** Nombre de la Subdirección, Responsable / Director de la Subdirección.
2. **Gerencia:** Nombre de la Gerencia, Nombre del Gerente, Correo / Contacto.
3. **Organización en GitHub/Atlassian:** Nombre de la Organización, Plataforma, URL base, Responsable de la Organización.
4. **Célula / Equipo:** Nombre de la Célula, Líder / Responsable de la Célula, Integrantes y roles.
5. **Repositorio / Activo:** Nombre del Repositorio / Activo, Responsable del Repositorio (heredado de la célula o específico).

### 1.2 Inventario de Repositorios (Fuente de Verdad Central)
Campos: Org ID de Referencia, Nombre del Repositorio, URL del Repositorio, Tecnología Principal, Librerías/Frameworks Clave, Servicios Conectados, Visibilidad (Público/Privado), Criticidad, Célula Responsable.
Se alimenta bidireccionalmente desde Seguridad en Código Fuente y desde los escaneos de Seguridad en Aplicaciones.

### 1.3 Inventario de Activos Web
Campos: URL, Nombre del Sitio, Ambiente, Empresa/Marca (catálogo), Responsable, Subdirección, Gerencia, Célula. Todos los campos de tipo lista son catálogos configurables.

### 1.4 Catálogo de Pruebas de Seguridad
Campos: Nombre de la prueba (SAST, DAST, SCA, CDS, MAST, Revisión Manual, etc.), Descripción, Responsable típico (Interno/Externo), SLA de ejecución.

---

## Módulo 2: Motor de Scoring Mensual (Transversal)

Este motor es el núcleo de medición de todos los programas anuales e iniciativas. Es completamente configurable desde el panel de administración.

**Reglas del motor:**
- El administrador define las actividades de cada mes para cada programa, su peso porcentual y si son fijas o divisibles.
- **Actividades fijas:** Un solo entregable por mes. El analista marca el estatus.
- **Actividades divisibles:** El analista captura cuántas instancias aplican ese mes (ej. "de 10 sesiones, completé 8"). El sistema calcula el porcentaje proporcional.
- **Sub-estados con pesos parciales:** Cada actividad puede tener estados intermedios con valor progresivo (ej. En Proceso = 5%, En Proceso de Firmas = 7%, Finalizado = 10%).
- **Actividades vinculadas:** Algunas actividades calculan su porcentaje automáticamente desde datos de otros módulos (ej. "Remediación de vulnerabilidades" se alimenta del concentrado de hallazgos y sus estatus).
- **Avance mensual:** Suma de los porcentajes obtenidos en cada actividad del mes. Meta = 100%.
- **Avance anual:** Promedio simple de los avances mensuales sobre los meses definidos para ese programa (10, 11 o 12 meses, configurable).
- Los pesos y actividades pueden variar mes a mes dentro del mismo programa.

---

## Módulo 3: Programas Anuales

Los cinco programas base son el contenido inicial del sistema. El administrador puede crear, modificar o desactivar programas desde el panel sin desarrollo adicional.

### 3.1 Seguridad en Aplicaciones (SAST / SCA / CDS)

Gestión de vulnerabilidades identificadas por tres motores de Checkmarx sobre el inventario de repositorios. Los tres motores comparten el mismo bloque de actividades mensuales (el 100% cubre SAST + SCA + CDS en conjunto).

**Estructura de datos por motor:**

*SAST (Código Estático):*
Proyecto, Organización, Repositorio, Vulnerabilidad, Severidad, Estado, Status, Estado Severidad, CWE_ID, Lenguaje, Grupo, Archivo_Origen, Línea_Origen, Archivo_Destino, Línea_Destino, Primera_Detección, Mes_Detección, Confidence_Level, SimilarityID, OWASP TOP 10 2021.

*SCA (Dependencias):*
Proyecto, Organización, Repositorios, Severidad, Estado, Estado Activo, EPSS Score (%), EPSS Percentile, Descripción, Paquete, Versión Vulnerable, Versión Recomendada, CVSS Score, Fecha Detección, Scan ID, Project ID, Recomendación, OWASP TOP 10 2021.

*CDS (Checkmarx Secret Detection):*
Proyecto, Organización, Repositorio, Tipo Secreto, Severidad, Estado, Status, Estado, Archivo, Línea, Snippet, Validez, Comentarios.

**Carga de datos:** Importación por CSV o captura manual. Sin integraciones API en esta fase.

**Ejemplo de ponderación mensual:**

| Actividad | Peso Base | Tipo |
|---|---|---|
| Reportes escaneos SAST | 30% | Fija |
| Priorización de vulnerabilidades | 20% | Fija |
| Minutas de sesiones de presentación | 15% | Divisible entre sesiones del mes |
| Plan de trabajo firmado | 10% | Sub-estados: En Proceso 5%, En Proceso de Firmas 7%, Finalizado 10% |
| Actualización de métricas | 15% | Fija |
| Remediación de vulnerabilidades | 10% | Vinculada al concentrado de hallazgos |

### 3.2 Seguridad en Aplicaciones Web (DAST)

Gestión de vulnerabilidades en sitios web expuestos mediante escaneos DAST. El activo base es el Inventario de Activos Web (URLs/dominios). Los campos del concentrado son configurables desde el Schema Builder.

### 3.3 Modelado de Amenazas (MDA)

Registro y seguimiento de ejercicios de modelado de amenazas, programados por la jefatura o bajo demanda.

**Estructura:**
- **Encabezado:** Año, Empresa, Servicio, Categoría, Mes, Tipo (Programado/Bajo Demanda), Ejecutó, Responsable, Célula.
- **Activos vinculados (polimórfico):** El analista selecciona el tipo de activo. Si elige Repositorio → match con inventario de repositorios y hereda su jerarquía organizacional. Si elige Dominio/URL → match con inventario de activos web. Si elige Componente/Base de Datos → catálogo propio configurable. Un modelado puede tener múltiples activos.
- **Backlog de Amenazas:** Campos: ID_AMENAZA, AMENAZA, DESCRIPCIÓN, ACTIVO, TIPO ACTIVO, IMPACTO, MITIGACIÓN, CONTROLES, RIESGO, CRITICIDAD, ESTATUS, REPORTADO, PLAN_TRABAJO, REMEDIADA, MES_REM, Estatus_PlanTrabajo, Clasificacion_Hallazgos.
- **Artefactos adjuntos:** Reporte Excel (carga de archivo o URL de Drive/SharePoint), Diagramas de Arquitectura/C4 (carga de archivo o URL).
- **Plan de Trabajo (creado en la plataforma):** Amenazas vinculadas, actividades, fechas compromiso, responsables y firmantes con flujo de aprobación.
- **Integración de IA:** Al registrar un nuevo modelado, la IA sugiere amenazas categorizadas por STRIDE y propone un score de riesgo DREAD con justificación técnica para cada amenaza, basándose en el tipo de activo y su stack tecnológico.

### 3.4 Seguridad en Código Fuente

Evaluación de la configuración de organizaciones en GitHub y Atlassian, y mantenimiento del inventario de repositorios y células.

**Frentes:** Evaluación de Controles GitHub (30%), Evaluación de Controles Atlassian (30%), Inventario de Repositorios (20%), Inventario de Equipos Atlassian (20%).

Los hallazgos del checklist tienen ciclo de vida propio: captura, estatus, responsable, fecha compromiso y seguimiento hasta cierre. El checklist puede cargarse desde archivo o construirse ítem por ítem desde el panel de administración.

### 3.5 Servicios Regulados

Programa de seguimiento mensual de actividades de cumplimiento aplicadas a servicios bajo supervisión de múltiples regulaciones (Banco de México, PCI-DSS, etc., todas configurables desde catálogo). Participan múltiples jefaturas (configurables desde catálogo). La Jefatura de Ciberseguridad Aplicativa centraliza la captura y el reporte. Cada mes se definen las actividades de todas las jefaturas participantes y se mide el avance global del programa con el mismo motor de scoring mensual.

---

## Módulo 4: MAST (Vulnerabilidades en Aplicaciones Móviles)

Captura manual de vulnerabilidades en aplicaciones móviles. No tiene programa anual asociado. Los campos son configurables desde el Schema Builder. Incluye como mínimo: severidad, fecha detección, estatus y fecha remediación. Sus hallazgos alimentan los indicadores MAST y el Dashboard de Vulnerabilidades.

---

## Módulo 5: Iniciativas

Proyectos internos de diversa naturaleza. Tipos configurables desde catálogo (RFI, Procesos, Plataformas, Otros).

**Estructura:** Nombre, Objetivo, Tipo, Fecha de Inicio, Fecha de Fin, Responsable(s), Participantes, Actividades con ponderación mensual (mismo motor de scoring), Estatus general (catálogo configurable).

---

## Módulo 6: Auditorías

Registro de auditorías internas y externas.

**Estructura:** Tipo (Interna/Externa), Nombre/Descripción, Servicio Auditado, Regulación Aplicable (catálogo configurable), Fecha de Inicio, Fecha de Cierre, Requerimientos Entregados con sus fechas de entrega individuales, Participantes, Estatus.

---

## Módulo 7: Temas Emergentes

Gestor ágil para cualquier tema no planificado que requiere atención y seguimiento.

**Estructura:** Nombre, Tipo (catálogo configurable: vulnerabilidad 0-day, solicitud urgente, nueva herramienta, alerta regulatoria, etc.), Descripción, Origen (catálogo configurable), Áreas Involucradas, Responsable Asignado, Participantes, Referencia (nombre del correo/ticket/documento), Fecha de Registro, Fecha Compromiso, Actividades de Seguimiento (con responsable y fecha), Estatus (catálogo configurable), Bitácora de Avances y Comentarios.

---

## Módulo 8: Operación

### 8.1 Liberaciones de Servicios (Flujo Jira)

Seguimiento de liberaciones desde la revisión de diseño hasta producción.

**Flujo configurable:**
Tarea Jira recibida → Revisión de Diseño (sesión agendada, participantes registrados) → Validaciones de Seguridad → [Con Observaciones → Equipo atiende → Regresa] → Pruebas de Seguridad (del catálogo de pruebas, con responsable interno o externo por prueba) → [Con Hallazgos → Equipo atiende → Regresa] → VoBo de Ciberseguridad → En QA → En Producción.

**Campos clave:** ID/Referencia Jira, Nombre del Servicio/Cambio, Tipo de Cambio (catálogo), Criticidad, Fecha de Entrada, Participantes en Revisión de Diseño, Pruebas de Seguridad Aplicadas (con estatus y responsable por prueba), Dependencias, Fecha Estimada QA, Fecha Estimada Producción, Estatus General (catálogo configurable), SLA de Respuesta (calculado automáticamente).

### 8.2 Módulo de Pipeline de Seguridad

Registro explícito de escaneos y pases a producción evaluados por motores de seguridad. La información se maneja en dos niveles: el registro general del escaneo y el detalle de las vulnerabilidades individuales (para escaneos rechazados).

**Nivel 1: Registro General del Escaneo**

**Estructura SAST Pipeline:**
ID (Scan ID), Organización, Repositorio/Proyecto (vinculado al inventario), Rama/Release, Mes, Fecha de Escaneo, Célula, Responsable del Cambio, Vulns Críticas/Altas/Medias/Bajas, Resultado (Aprobado/No Aprobado), Fecha Entrada QA, Fecha Salida a Producción, ¿Liberado con Vulns Altas/Críticas? (Sí/No).

**Estructura DAST Pipeline:**
ID Interno, Scan ID, Organización/Proyecto, Nombre del Servicio, Rama/Release, URL Escaneada (vinculada al catálogo de activos web), Mes, Timestamp Inicio/Fin Escaneo, Célula, Responsable del Cambio, Vulns Críticas/Altas/Medias/Bajas/Informativas, Resultado (catálogo: Aprobado/No Aprobado), Motivo del Resultado, Empresa/Marca (catálogo), Tipo de Aplicación (catálogo: Frontend/Backend/API/Mobile), Clasificación de Vulns (catálogo), ¿Liberado con Vulns Altas/Críticas? (Sí/No).

**Nivel 2: Detalle de Vulnerabilidades (Escaneos Rechazados)**

Para los escaneos que no son aprobados, se carga un archivo adicional con el detalle individual de cada vulnerabilidad. El sistema realiza un **match automático** utilizando la llave compuesta: `Scan ID` + `Rama (Branch)`.

Al hacer match, cada vulnerabilidad hereda automáticamente del registro general:
- Célula, Organización, Subdirección, Gerencia
- Responsable del Cambio
- Mes y Repositorio

**Estructura del Detalle de Vulnerabilidades:**
- `Scan ID` y `Branch` (Llaves de match)
- `Query` (Nombre/tipo de la vulnerabilidad, ej. SSRF, SQL Injection)
- `Query Path` (Ruta del archivo afectado)
- `Severity` (Severidad)
- `Line` y `Column` (Ubicación en el código)
- `Found Date` y `First Found Date` (Para cálculo de reincidencias)
- `Similarity ID` (Identificador de similitud)

**Indicadores del Módulo de Pipeline:**
- Total de escaneos del mes (por motor).
- Escaneos aprobatorios vs rechazados.
- % de aprobación: (Aprobatorios / Total) × 100.
- Vulnerabilidades más recurrentes (Top N por `Query` basado en el detalle).
- Distribución de vulnerabilidades por Célula y Organización.
- Reincidencias en pipeline.

**Carga de datos:** Importación masiva por CSV/Excel (con botón de "Descargar Template" disponible) o captura manual.

### 8.3 Revisión de Terceros

Evaluaciones de seguridad a proveedores. Estructura: Nombre del Tercero, Fecha de Revisión, Checklist de Revisión (ítems configurables), Resultado por Ítem, Evidencias (carga de archivo o URL), Responsable de la Revisión, Estatus (catálogo), Observaciones.

### 8.4 Otros Procesos Operativos

Cualquier proceso operativo recurrente puede ser creado desde el panel de administración con su propio Schema Builder, flujo de estatus y SLAs.

---

## Módulo 9: Gestión de Vulnerabilidades y Hallazgos

Todos los hallazgos (SAST, DAST, SCA, CDS, MAST, MDA) comparten un ciclo de vida configurable:

- **Estatus Dinámicos:** El administrador define qué estatus equivalen a "Activa", "Remediada" o "Falso Positivo".
- **Flujos de Estatus Configurables:** El administrador define las transiciones permitidas entre estatus (ej. "Activa" solo puede ir a "En Remediación" o "Falso Positivo").
- **Excepciones Temporales:** Vulnerabilidad real que no puede remediarse en el SLA. Requiere justificación, fecha de expiración y responsable aprobador. No cuenta como SLA vencido mientras la excepción esté vigente.
- **Aceptación de Riesgo:** El negocio decide vivir con la vulnerabilidad indefinidamente. Requiere justificación y firmante. Sale del cálculo de SLA vencido pero permanece en el backlog con estatus propio.
- **Integración de IA (Triaje):** Para hallazgos SAST/DAST/SCA, la IA analiza el contexto del hallazgo (snippet de código, framework, visibilidad del repositorio) y sugiere una clasificación inicial (ej. "Probable Falso Positivo", "Requiere Revisión Manual", "Vulnerabilidad Confirmada") junto con un borrador de justificación técnica.

---

## Módulo 10: Indicadores y Métricas

### 10.1 Indicadores Internos (Por Motor: SAST, DAST, MDA, SCA, CDS, MAST)

| ID | Indicador | Fórmula |
|---|---|---|
| XXX-001 | # de vulns/amenazas Altas/Críticas identificadas en el mes | Count de registros nuevos del mes con severidad Alta o Crítica |
| XXX-001b | # de vulns/amenazas Altas/Críticas remediadas en el mes | Count de registros cuyo estatus cambió a "Remediada" en el mes |
| XXX-002 | % de vulns/amenazas Altas/Críticas remediadas | (Remediadas del mes / Identificadas del mes) × 100 |
| XXX-003 | Backlog de vulns/amenazas Altas/Críticas activas | Count de registros con estatus clasificado como "Activa" |
| XXX-004 | % de vulns/amenazas con SLA vencido | (Vulns activas con fecha detección + SLA < hoy / Total activas) × 100 |
| XXX-005 | Cambios en producción con vulns Altas/Críticas activas | Count en Liberaciones Pipeline donde "¿Liberado con vulns?" = Sí |
| Adicional | % de Falsos Positivos | (Vulns con estatus "Falso Positivo" / Total) × 100 |
| Adicional | % de Reincidencias | (Vulns con Status "RECURRENT" / Total) × 100 |

**SLAs configurables por motor:**

| Motor | SLA Críticos | SLA Altos |
|---|---|---|
| SAST | 2 meses | 2 meses |
| DAST | 7 días | — |
| MDA | 2 meses | 2 meses |
| SCA | 2 meses | 2 meses |
| CDS | 7 días | — |
| MAST | 7 días | — |

### 10.2 Score de Madurez de Seguridad

Calculado automáticamente basado en: tiempo promedio de remediación, % de reincidencias, vulns críticas acumuladas y cumplimiento de SLAs.

| Nivel | Descripción |
|---|---|
| Por Célula | Madurez del equipo de desarrollo |
| Por Subdirección | Consolidado de todas las células bajo esa subdirección |
| Por Organización | Consolidado de los repositorios de esa organización |

---

## Módulo 11: Dashboards y Navegación

### Principios Generales
- Todos los dashboards son modulares: cada panel es un componente independiente que puede mostrarse u ocultarse según los permisos del rol.
- Todos los paneles son clickeables y redirigen al detalle del dato mostrado (Drill-Down).
- Todos los módulos con listados soportan: búsqueda de texto libre, filtros contextuales, ordenamiento por columna, agrupación y paginación.
- Filtros son específicos por módulo, no globales.
- **Exportación Universal:** Cualquier vista de dashboard, listado o concentrado (respetando los filtros aplicados en ese momento) debe poder exportarse a PDF o Excel/CSV.

### Filtros Contextuales por Módulo

| Módulo | Filtros Disponibles |
|---|---|
| Vulnerabilidades | Motor, Severidad, Estado, Estatus, OWASP, Organización, Subdirección, Gerencia, Célula, Repositorio/URL, Rango de fechas (detección, remediación), SLA vencido (Sí/No), Reincidente (Sí/No), Excepción activa (Sí/No) |
| Liberaciones (Flujo) | Estatus, Tipo de cambio, Criticidad, Responsable de pruebas, Rango de fechas (entrada, QA, producción), SLA en riesgo (Sí/No) |
| Liberaciones Pipeline | Motor, Resultado, Empresa/Marca, Tipo de aplicación, ¿Con vulns? (Sí/No), Rango de fechas |
| Programas Anuales | Programa, Mes, Año, Analista responsable, % de avance (rango) |
| MDA | Tipo (programado/bajo demanda), Activo, Tipo de activo, Criticidad de amenaza, Estatus, Célula, Rango de fechas |
| Temas Emergentes | Tipo, Estatus, Responsable, Área involucrada, Rango de fechas, Sin movimiento en X días |
| Auditorías | Tipo, Regulación, Estatus, Rango de fechas |
| Iniciativas | Tipo, Estatus, Responsable, Rango de fechas |


### Dashboard 1 — General (Ejecutivo)
Vista de alto nivel para el jefe de la jefatura. Tarjetas clickeables:
- Avance global de todos los programas anuales (mes actual y anual)
- Vulnerabilidades Críticas activas totales (desglose por motor)
- Liberaciones activas y cuántas con SLA en riesgo
- Temas Emergentes abiertos y cuántos sin movimiento en +7 días
- Auditorías activas con requerimientos pendientes
- Iniciativas en ejecución y % de avance promedio

- Gráfica de tendencia mensual de avance de programas (últimos 6 meses)
- Semáforo global de SLAs (verde/amarillo/rojo)
- Top 5 repositorios con mayor número de vulnerabilidades críticas activas

### Dashboard 2 — Equipo
- Carga de trabajo por analista (actividades asignadas, programas, liberaciones)
- % de avance individual por analista en sus programas del mes
- Tareas vencidas o próximas a vencer por persona
- Semáforo de cumplimiento por analista
- Historial de avance mensual por analista

### Dashboard 3 — Programas (Consolidado)
- Tarjetas de % de avance mensual y anual por programa
- Gráfica de barras: avance mensual vs meta (100%) por programa
- Heatmap de cumplimiento mensual (12 meses × N programas)
- Click en un programa → navega al Dashboard 4

### Dashboard 4 — Zoom por Programa
- % de avance del mes actual y anual acumulado
- Actividades completadas vs pendientes del mes con su peso y estatus
- Historial mensual de avance (tabla + gráfica de línea)
- Acceso directo al concentrado de hallazgos del programa

### Dashboard 5 — Vulnerabilidades y Estado de Salud (Multi-Dimensional con Drill-Down)

*Dimensión Organizacional (Navegación Jerárquica):*
```
Nivel 0: Estado de Salud Global
    → Vista macro de toda la jefatura: total de vulns activas por motor, indicadores globales, semáforo general, tendencia.
    → Recuadros resumen de todas las Subdirecciones (Total vulns activas + desglose por motor + repos vulnerables).
    Click en una Subdirección ↓

Nivel 1: Vista de Subdirección (Enriquecida)
    → Resumen de vulnerabilidades (recuadros por motor: SAST, SCA, CDS, DAST, MDA, MAST, etc.).
    → Todos los indicadores (XXX-001 al XXX-005) con evolución histórica mes a mes (Enero → Diciembre).
    → Indicadores del Pipeline filtrados por esta subdirección y sus células (escaneos, aprobatorios, rechazados, vulns recurrentes).
    → Apartado "Temas Relevantes": Análisis generado por IA sobre el estado de la subdirección (observaciones, tendencias, recomendaciones).
    → Recuadros por Organización y por Célula dentro de la Subdirección.
    Click en una Organización o Célula ↓

Nivel 2: Vista de Organización / Célula
    → Listado de Repositorios/URLs con conteos y desglose por severidad.
    → Score de Madurez de la célula.
    → Indicadores del Pipeline específicos de esta célula.
    Click en un Repositorio/URL ↓

Nivel 3: Vista de Activo (Repositorio / URL)
    → Tabla completa de vulnerabilidades del activo con historial y SLAs.
```

*Dimensión por Motor:*
```
Nivel 1: Recuadros por Motor (SAST, SCA, CDS, DAST, MDA, MAST)
    → Total anterior → Total actual, Solventadas, Nuevas
    → Filtros rápidos: Pipeline / Programa Anual / Bajo Demanda
    → Solo Críticas + No duplicados
    Click ↓
Nivel 2: Vulnerabilidades del motor con filtros contextuales completos
    → Agrupación por Severidad, OWASP, Organización, Célula
    Click ↓
Nivel 3: Detalle de vulnerabilidades del grupo seleccionado
```

*Dimensión por Severidad:*
```
Nivel 1: Recuadros por Severidad (CRITICAL, HIGH, MEDIUM, LOW)
    → Total activas, SLA vencido, Nuevas este mes
    Click ↓
Nivel 2: Vulnerabilidades de esa severidad con filtros contextuales
```

### Dashboard 6 — Liberaciones (Tabla)
- Tarjetas: Total activas, con SLA en riesgo, con observaciones pendientes, críticas en proceso
- Tabla de liberaciones con estatus, responsable de pruebas, fechas QA y producción
- Filtros contextuales completos

### Dashboard 7 — Kanban de Liberaciones
Tablero visual con columnas configurables desde el panel. Columnas base:
Recibida → Revisión de Diseño → Validaciones de Seguridad → Con Observaciones → Pruebas de Seguridad → VoBo Dado → En QA → En Producción → Cancelada.
Cada tarjeta muestra: nombre del servicio, tipo de cambio, criticidad, responsable de pruebas, días en el flujo y alerta de SLA.

### Dashboard 8 — Iniciativas
- Tarjetas: Total activas, % avance promedio, iniciativas vencidas o en riesgo
- Tabla con nombre, tipo, fechas, responsable, % avance y estatus con semáforo
- Filtros contextuales

### Dashboard 9 — Temas Emergentes
- Tarjetas: Total abiertos, sin movimiento +7 días, próximos a vencer
- Tabla con nombre, tipo, responsable, fecha compromiso, días abierto, estatus con semáforo
- Filtros contextuales

---

## Módulo 12: Seguridad, Roles y Notificaciones

### 12.1 Sistema de Roles y Permisos Granulares

El administrador define desde el panel:
- **Roles:** Creación libre con nombre personalizado.
- **Permisos por módulo y acción:** Ver, Crear, Editar, Eliminar, Exportar, Aprobar, Configurar.
- **Permisos hasta nivel de panel/widget:** Para cada rol, el administrador selecciona qué paneles específicos dentro de un dashboard son visibles (ej. de 10 paneles del Dashboard General, un rol puede ver solo 5).
- **Gestión de Usuarios:** Crear, editar, activar/desactivar usuarios. Asignar rol(es), vincular a célula, historial de accesos, restablecimiento de contraseña.

### 12.2 Log de Auditoría del Sistema

Registro inmutable de todas las acciones sobre datos sensibles:
- Quién, qué acción, sobre qué registro, cuándo, valor anterior y valor nuevo.
- Visible solo para el rol Administrador.
- No editable ni eliminable por ningún usuario.
- Implementado mediante el mecanismo `audit_action_prefix` del framework.

### 12.3 Notificaciones In-App

Centro de notificaciones dentro de la plataforma (bell icon). Alertas automáticas con umbrales configurables desde el panel de administración:

| Alerta | Disparador |
|---|---|
| SLA en riesgo | Vulnerabilidad o liberación a X días de vencer (X configurable) |
| Actividad sin actualizar | Actividad de programa sin movimiento en +N días hábiles |
| Tema emergente estancado | Sin actualización en +N días |
| Avance mensual bajo | Programa con menos del X% a mitad de mes |
| Plan de trabajo sin firma | En estado "En proceso de firmas" por más de N días |

---

## Módulo 13: Panel de Administración

El panel de administración es el corazón del sistema. Permite configurar sin tocar código:

| Elemento | Descripción |
|---|---|
| Catálogos | Crear y gestionar todos los catálogos del sistema (estatus, tipos, severidades, empresas/marcas, regulaciones, etc.) |
| Schema Builder | Definir campos por módulo/programa (nombre, tipo, obligatorio, visible, filtrable, editable, valor por defecto) |
| Programas Anuales | Crear, editar, desactivar programas. Definir actividades, pesos y meses por programa |
| Motor de Scoring | Configurar actividades, pesos, sub-estados y vínculos a módulos por mes y por programa |
| Flujos de Estatus | Definir transiciones permitidas entre estatus por tipo de entidad |
| Períodos de Programas | Meses que aplican para cada programa (10, 11 o 12) y mes de inicio del ciclo anual |
| Indicadores | Configurar fórmulas, SLAs, umbrales y semáforos por indicador |
| Roles y Permisos | Crear roles, asignar permisos por módulo, acción y panel/widget |
| Gestión de Usuarios | Crear, editar, activar/desactivar usuarios, asignar roles |
| Checklists | Definir ítems de checklists por tipo de evaluación (GitHub, Atlassian, Terceros) |
| Plantillas de Reportes | Configurar campos incluidos en cada reporte exportable (PDF/Excel) por módulo |
| Umbrales de Alertas | Configurar días de anticipación, días sin movimiento y % de avance mínimo |
| Tipos de Activos MDA | Opciones disponibles al vincular activos a un modelado de amenazas |
| Columnas del Kanban | Columnas, orden y criterios de entrada/salida del tablero de liberaciones |
| Historial de Configuración | Registro de quién cambió qué configuración y cuándo |

---

## Instrucciones de Ejecución

1. Analiza esta especificación completa y el framework base (`GazettEl/desarrollo-framework`) antes de escribir una sola línea de código.
2. Diseña el modelo de datos relacional en PostgreSQL que soporte la naturaleza dinámica, polimórfica y configurable del sistema. Presta especial atención al Schema Builder, al motor de scoring y al sistema de permisos granulares.
3. Implementa los módulos siguiendo estrictamente las Hard Rules del framework: Pydantic, SQLAlchemy Async, Next.js App Router, cookies HttpOnly, CSRF, audit logs.
4. Construye el Panel de Administración como la primera prioridad, ya que es el prerequisito para configurar todos los demás módulos.
5. Implementa los Catálogos Centrales como segundo paso, ya que son la base de datos de referencia para todos los módulos operativos.
6. Desarrolla los módulos operativos en el siguiente orden de prioridad: Programas Anuales → Vulnerabilidades → Liberaciones (Flujo + Pipeline) → Temas Emergentes → Iniciativas → Auditorías.
7. Implementa los Dashboards al final, una vez que los módulos de captura estén completos y los datos existan.
8. Asegura que el sistema sea completamente funcional sin requerir cambios de código para las operaciones de configuración, gestión de catálogos, definición de esquemas, ajuste de SLAs y gestión de roles.
