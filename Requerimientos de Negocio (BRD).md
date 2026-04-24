# Documento de Requerimientos de Negocio (BRD)
## Plataforma Centralizada de Gestión — Jefatura de Ciberseguridad Aplicativa

---

## 1. Objetivo del Proyecto

Desarrollar una plataforma centralizada, dinámica y altamente configurable para la Jefatura de Ciberseguridad Aplicativa. El sistema permitirá gestionar, medir y reportar el ciclo de vida completo de programas anuales, iniciativas, auditorías, temas emergentes y operaciones diarias (liberaciones), eliminando la dependencia de archivos aislados y automatizando el cálculo de indicadores operativos. El jefe de la jefatura debe poder conocer el estado de todo sin necesidad de preguntar al equipo.

---

## 2. Principios de Diseño del Sistema

1. **Configuration-Driven (Admin-Driven):** La estructura de datos, catálogos, flujos de estatus, reglas de SLA, métricas y permisos son configurables desde el panel de administración sin tocar código.
2. **Schema Builder Dinámico:** Cada programa o módulo permite la definición de sus propios campos (texto, número entero, número decimal, fecha, booleano, lista desplegable, fórmula calculada, porcentaje, URL, texto largo) de forma dinámica.
3. **Inventario Polimórfico:** Catálogo centralizado de activos (Repositorios, URLs, Componentes) relacionado bidireccionalmente con todos los módulos.
4. **Seguridad y Trazabilidad:** Principio de mínimo privilegio con permisos granulares hasta nivel de panel/widget y log de auditoría inmutable.
5. **Navegación Drill-Down Multi-Dimensional:** Todas las vistas de datos permiten navegar de lo macro a lo micro en múltiples dimensiones (organizacional, por motor, por severidad, por célula, etc.) con breadcrumb visible en todo momento.
6. **Filtros Contextuales por Módulo:** Cada módulo y vista expone sus propios filtros relevantes (rango de fechas, búsqueda de texto libre, ordenamiento por columna, agrupación, paginación), diseñados específicamente para los datos que maneja. No existen filtros globales.
7. **Importación Estandarizada (Regla Global):** En cualquier pantalla de la plataforma donde exista la opción de "Importar masivamente" (catálogos, escaneos, hallazgos, etc.), el sistema debe proveer obligatoriamente un botón de **"Descargar Template"**. Este botón entregará un archivo Excel/CSV vacío con las cabeceras exactas y formatos esperados por el sistema para asegurar la integridad de los datos cargados.

---

## 3. Catálogos Centrales (Inventarios) y Modelo Organizacional

El sistema cuenta con un módulo dedicado para la gestión de todos los catálogos e inventarios. **Cada uno de estos catálogos tiene su propia pantalla de gestión (CRUD)** donde el usuario puede:
- Ver el listado completo con filtros, buscador y paginación.
- Capturar nuevos registros manualmente mediante un formulario.
- Editar o eliminar registros existentes.
- **Importar masivamente** desde archivos Excel/CSV (incluyendo siempre la opción de "Descargar Template" para asegurar el formato correcto).
- Exportar el catálogo actual a Excel/CSV.

### 3.1 Modelo Organizacional Jerárquico

La jerarquía organizacional es la columna vertebral de la plataforma. Cuando se registra un escaneo o vulnerabilidad en un repositorio, el sistema hereda automáticamente toda la cadena de responsables hacia arriba.

La relación jerárquica y los campos obligatorios por nivel son:

1. **Subdirección**
   - Nombre de la Subdirección
   - Responsable / Director de la Subdirección
2. **Gerencia** (N por Subdirección)
   - Nombre de la Gerencia
   - Nombre del Gerente
   - Correo / Contacto
3. **Organización en GitHub/Atlassian** (N por Gerencia)
   - Nombre de la Organización
   - Plataforma (GitHub, Atlassian, etc.)
   - URL base
   - Responsable de la Organización
4. **Célula / Equipo** (N por Organización)
   - Nombre de la Célula
   - Líder / Responsable de la Célula
   - Integrantes y roles
5. **Repositorio / Activo** (N por Célula)
   - Nombre del Repositorio / Activo
   - Responsable del Repositorio (heredado de la célula o específico)

### 3.2 Inventario de Repositorios (Fuente de Verdad Central)
Org ID de referencia, nombre del repositorio, URL, tecnología principal, librerías/frameworks clave, servicios conectados, visibilidad (público/privado), criticidad y célula responsable. Se alimenta bidireccionalmente desde Seguridad en Código Fuente y desde los escaneos de Seguridad en Aplicaciones.

### 3.3 Inventario de Activos Web
URLs y dominios expuestos, nombre del servicio, ambiente, empresa/marca, responsable, subdirección, gerencia y célula.

### 3.4 Catálogo de Pruebas de Seguridad
Tipos de pruebas (SAST, DAST, SCA, CDS, MAST, Revisión Manual, etc.), descripción, responsable típico (interno/externo) y SLA de ejecución.

---

## 4. Motor de Scoring Mensual (Transversal a todos los Programas)

Cada programa anual e iniciativa utiliza un motor de scoring configurable desde el panel de administración:

- **Actividades por mes:** El administrador define las actividades de cada mes, su peso porcentual y si son fijas o divisibles (el analista captura cuántas instancias aplican ese mes).
- **Sub-estados con pesos parciales:** Cada actividad puede tener estados intermedios con valor progresivo (ej. En Proceso = 5%, En Proceso de Firmas = 7%, Finalizado = 10%).
- **Actividades vinculadas a objetos del sistema:** Algunas actividades calculan su porcentaje automáticamente en función de datos de otros módulos (ej. "Remediación de vulnerabilidades" se alimenta del concentrado de hallazgos).
- **Avance mensual:** Suma de los porcentajes obtenidos en cada actividad del mes (meta = 100%).
- **Avance anual:** Promedio simple de los avances mensuales sobre los meses definidos para ese programa (10, 11 o 12 meses, configurable).
- **Variabilidad:** Los pesos y actividades pueden variar mes a mes dentro del mismo programa.

---

## 5. Programas Anuales

### 5.1 Seguridad en Aplicaciones (SAST / SCA / CDS)

**Descripción:** Gestión de vulnerabilidades identificadas por tres motores de escaneo de Checkmarx sobre el inventario de repositorios.

**Motores y estructura de datos:**

| Motor | Campos Clave |
|---|---|
| **SAST** (Código Estático) | Proyecto, Organización, Repositorio, Vulnerabilidad, Severidad, Estado, Status, Estado Severidad, CWE_ID, Lenguaje, Grupo, Archivo/Línea Origen-Destino, Primera Detección, Mes Detección, Confidence Level, SimilarityID, OWASP TOP 10 2021 |
| **SCA** (Dependencias) | Proyecto, Organización, Repositorios, Severidad, Estado, Estado Activo, EPSS Score, EPSS Percentile, Descripción, Paquete, Versión Vulnerable, Versión Recomendada, CVSS Score, Fecha Detección, Scan ID, Project ID, Recomendación, OWASP TOP 10 2021 |
| **CDS** (Secretos) | Proyecto, Organización, Repositorio, Tipo Secreto, Severidad, Estado, Status, Estado, Archivo, Línea, Snippet, Validez, Comentarios |

**Carga de datos:** Importación por CSV o captura manual. Sin integraciones API en esta fase.

**Actividades mensuales (ejemplo de ponderación):**

| Actividad | Peso Base | Tipo |
|---|---|---|
| Reportes escaneos SAST | 30% | Fija |
| Priorización de vulnerabilidades | 20% | Fija |
| Minutas de sesiones de presentación | 15% | Divisible entre sesiones del mes |
| Plan de trabajo firmado | 10% | Divisible; sub-estados: En Proceso 5%, En Proceso de Firmas 7%, Finalizado 10% |
| Actualización de métricas | 15% | Fija |
| Remediación de vulnerabilidades | 10% | Vinculada al concentrado de hallazgos |

Los tres motores comparten el mismo bloque de actividades mensuales (el 100% cubre SAST + SCA + CDS en conjunto).

### 5.2 Seguridad en Aplicaciones Web (DAST)

**Descripción:** Gestión de vulnerabilidades identificadas mediante escaneos DAST sobre el inventario de activos web (URLs/dominios expuestos).

**Activo base:** Catálogo de Activos Web (independiente del inventario de repositorios).

**Estructura de datos:** Campos configurables desde el Schema Builder. Incluye URL escaneada, severidad, estado, OWASP TOP 10 2021, responsable y empresa/marca.

### 5.3 Modelado de Amenazas (MDA)

**Descripción:** Registro y seguimiento de ejercicios de modelado de amenazas, programados por la jefatura o bajo demanda.

**Estructura del ejercicio:**

- **Encabezado:** Año, empresa, servicio, categoría, mes, tipo (programado/bajo demanda), ejecutó, responsable, célula.
- **Activos vinculados (polimórfico):** El analista selecciona el tipo de activo (Repositorio → match con inventario de repositorios; Dominio/URL → match con inventario de activos web; Componente/Base de Datos → catálogo propio). Un modelado puede tener múltiples activos.
- **Backlog de Amenazas:** ID Amenaza, Amenaza, Descripción, Activo, Tipo Activo, Impacto, Mitigación, Controles, Riesgo, Criticidad, Estatus, Reportado, Plan de Trabajo, Remediada, Mes Remediación, Estatus Plan de Trabajo, Clasificación de Hallazgos.
- **Artefactos adjuntos:** Reporte Excel (carga de archivo o URL de Drive), Diagramas de Arquitectura/C4 (carga de archivo o URL).
- **Plan de Trabajo:** Creado directamente en la plataforma. Incluye amenazas vinculadas, actividades, fechas compromiso, responsables y firmantes (flujo de aprobación).

**Integración de IA:** Sugerencia automática de amenazas (STRIDE) y ponderación de riesgo (DREAD) basada en los activos y arquitectura del servicio.

### 5.4 Seguridad en Código Fuente

**Descripción:** Evaluación de la configuración de organizaciones en GitHub y Atlassian, y construcción/mantenimiento del inventario de repositorios y células.

**Frentes de trabajo:**

| Frente | Descripción |
|---|---|
| **Evaluación de Controles GitHub** | Checklist configurable de controles de seguridad por organización |
| **Evaluación de Controles Atlassian** | Checklist configurable de controles de seguridad |
| **Inventario de Repositorios** | Descubrimiento y registro de repositorios en el catálogo central |
| **Inventario de Equipos Atlassian** | Descubrimiento y registro de equipos |

**Ponderación mensual (ejemplo):**

| Actividad | Peso |
|---|---|
| Evaluación de Controles GitHub | 30% |
| Evaluación de Controles Atlassian | 30% |
| Inventario de Repositorios | 20% |
| Inventario de Equipos Atlassian | 20% |

**Hallazgos del checklist:** Ciclo de vida propio (captura, estatus, responsable, fecha compromiso, seguimiento hasta cierre). El checklist puede cargarse desde archivo o construirse desde el panel de administración.

### 5.5 Servicios Regulados

**Descripción:** Programa de seguimiento mensual de actividades de cumplimiento aplicadas a servicios bajo supervisión de múltiples regulaciones (Banco de México, PCI-DSS, etc., configurables desde catálogo). Participan múltiples jefaturas (configurables desde catálogo). La Jefatura de Ciberseguridad Aplicativa centraliza la captura y el reporte. Cada mes se definen las actividades de todas las jefaturas participantes y se mide el avance global del programa.

---

## 6. Módulo MAST (Vulnerabilidades en Aplicaciones Móviles)

**Descripción:** Captura manual de vulnerabilidades identificadas en aplicaciones móviles. No tiene programa anual asociado, pero sus hallazgos alimentan los indicadores MAST y el Dashboard de Vulnerabilidades.

**Campos:** Configurables desde el Schema Builder. Incluye severidad, fecha detección, estatus y fecha remediación.

---

## 7. Iniciativas

**Tipos (configurables desde catálogo):** RFI, Procesos, Plataformas, Otros.

**Estructura:** Nombre, objetivo, tipo, fecha de inicio, fecha de fin, responsable(s), participantes, actividades con ponderación mensual (mismo motor de scoring), estatus general.

---

## 8. Auditorías

**Tipos:** Internas y externas (configurable desde catálogo).

**Estructura:** Tipo, nombre/descripción, servicio auditado, regulación aplicable (catálogo configurable), fecha de inicio, fecha de cierre, requerimientos entregados con sus fechas de entrega individuales, participantes y estatus.

---

## 9. Temas Emergentes

**Descripción:** Gestor ágil para cualquier tema no planificado que requiere atención, seguimiento y cierre (vulnerabilidades 0-day, solicitudes urgentes, nuevas herramientas, alertas regulatorias, etc.).

**Estructura:** Nombre, tipo (catálogo configurable), descripción, origen (catálogo configurable), áreas involucradas, responsable asignado, participantes, referencia (nombre del correo, ticket, documento), fecha de registro, fecha compromiso, actividades de seguimiento con responsable y fecha, estatus (catálogo configurable), bitácora de avances y comentarios.

---

## 10. Operación

### 10.1 Liberaciones de Servicios (Flujo Jira)

**Flujo de atención:**
```
Tarea Jira recibida
    → Revisión de Diseño (sesión agendada, participantes registrados)
        → Validaciones de Seguridad
            → ¿Observaciones?
                SÍ → Equipo de desarrollo atiende → Regresa al flujo
                NO → Pruebas de Seguridad (catálogo de pruebas aplicables)
                        → ¿Pasan pruebas?
                            SÍ → VoBo de Ciberseguridad → QA → Producción
                            NO → Equipo atiende hallazgos → Regresa a pruebas
```

**Campos clave:** ID/Referencia Jira, nombre del servicio/cambio, tipo de cambio (catálogo), criticidad, fecha de entrada, participantes en revisión de diseño, pruebas de seguridad aplicadas con su estatus y responsable (interno o externo), dependencias, fecha estimada QA, fecha estimada producción, estatus general (catálogo configurable), SLA de respuesta calculado automáticamente.

### 10.2 Liberaciones Pipeline (SAST / DAST)

Este módulo registra los escaneos y pases a producción evaluados por motores de seguridad. La información se maneja en dos niveles: el registro general del escaneo y el detalle de las vulnerabilidades individuales (para escaneos rechazados).

**Nivel 1: Registro General del Escaneo**

**Estructura SAST Pipeline:**

| Campo | Descripción |
|---|---|
| ID (Scan ID) | Identificador único del escaneo |
| Organización | Organización en GitHub/Atlassian |
| Repositorio / Proyecto | Vinculado al inventario de repositorios |
| Rama / Release | Branch o versión liberada |
| Mes | Mes al que pertenece el escaneo (ej. February) |
| Fecha de escaneo | Cuándo se ejecutó |
| Célula | Célula responsable (heredada del inventario) |
| Responsable del Cambio | Persona que solicitó/ejecutó el cambio (Nombre y Correo) |
| Vulns Críticas / Altas / Medias / Bajas | Conteo por severidad al momento de la liberación |
| Resultado | Aprobado / No Aprobado |
| Fecha entrada QA | Timestamp |
| Fecha salida a Producción | Timestamp |
| ¿Liberado con vulns Altas/Críticas? | Sí / No (marcado por el analista) |

**Estructura DAST Pipeline:**

| Campo | Descripción |
|---|---|
| ID interno / Scan ID | Identificadores |
| Organización / Proyecto | Referencia organizacional |
| Nombre del servicio / Rama | Qué se liberó |
| URL escaneada | Vinculada al catálogo de activos web |
| Mes | Mes al que pertenece el escaneo |
| Timestamps de escaneo | Inicio y fin |
| Célula | Célula responsable |
| Responsable del Cambio | Persona que solicitó/ejecutó el cambio |
| Vulns Críticas / Altas / Medias / Bajas / Informativas | Conteo por severidad |
| Resultado | Aprobado / No Aprobado (catálogo configurable) |
| Motivo del resultado | Texto libre |
| Empresa / Marca | Catálogo configurable (Banregio, Hey, etc.) |
| Tipo de aplicación | Catálogo configurable (Frontend, Backend, API, Mobile) |
| Clasificación de vulns | Catálogo configurable |
| ¿Liberado con vulns Altas/Críticas? | Sí / No |

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

**Carga de datos:** Importación masiva por CSV/Excel (con botón de "Descargar Template" disponible) o captura manual.

### 10.3 Revisión de Terceros

**Estructura:** Nombre del tercero, fecha de revisión, checklist de revisión (ítems configurables por tipo de evaluación), resultado por ítem, evidencias (carga de archivo o URL), responsable de la revisión, estatus (catálogo configurable), observaciones.

### 10.4 Otros Procesos Operativos

Cualquier proceso operativo recurrente puede ser creado y configurado desde el panel de administración con su propio Schema Builder, flujo de estatus y SLAs.

---

## 11. Gestión de Vulnerabilidades y Hallazgos

Todos los hallazgos (SAST, DAST, SCA, CDS, MAST, MDA) comparten un ciclo de vida configurable:

- **Estatus Dinámicos:** El administrador define qué estatus equivalen a "Activa", "Remediada" o "Falso Positivo".
- **Excepciones Temporales:** Vulnerabilidad real que no puede remediarse en el SLA. Requiere justificación, fecha de expiración y responsable aprobador. No cuenta como SLA vencido mientras la excepción esté vigente.
- **Aceptación de Riesgo:** El negocio decide vivir con la vulnerabilidad indefinidamente. Requiere justificación y firmante. Sale del cálculo de SLA vencido pero permanece en el backlog con estatus propio.
- **Flujos de Estatus Configurables:** El administrador define qué transiciones de estatus son permitidas (ej. "Activa" solo puede ir a "En Remediación" o "Falso Positivo").

---

## 12. Indicadores y Métricas

### 12.1 Indicadores Internos (Por Motor: SAST, DAST, MDA, SCA, CDS, MAST)

| ID | Indicador | Fórmula / Fuente |
|---|---|---|
| XXX-001 | # de vulnerabilidades/amenazas Altas/Críticas identificadas en el mes | Count de registros nuevos del mes con severidad Alta o Crítica |
| XXX-001b | # de vulnerabilidades/amenazas Altas/Críticas remediadas en el mes | Count de registros cuyo estatus cambió a "Remediada" en el mes |
| XXX-002 | % de vulnerabilidades/amenazas Altas/Críticas remediadas | (Remediadas del mes / Identificadas del mes) × 100 |
| XXX-003 | Backlog de vulnerabilidades/amenazas Altas/Críticas activas | Count de registros con estatus clasificado como "Activa" |
| XXX-004 | % de vulnerabilidades/amenazas con SLA vencido | (Vulns activas con fecha detección + SLA < hoy / Total activas) × 100 |
| XXX-005 | Cambios en producción con vulns Altas/Críticas activas | Count de registros en Liberaciones Pipeline donde "¿Liberado con vulns?" = Sí |
| Adicional | % de Falsos Positivos | (Vulns con estatus "Falso Positivo" / Total) × 100 |
| Adicional | % de Reincidencias | (Vulns con Status "RECURRENT" / Total) × 100 |

**SLAs por motor (configurables desde el panel):**

| Motor | SLA Críticos | SLA Altos |
|---|---|---|
| SAST | 2 meses | 2 meses |
| DAST | 7 días | — |
| MDA | 2 meses | 2 meses |
| SCA | 2 meses | 2 meses |
| CDS | 7 días | — |
| MAST | 7 días | — |

### 12.2 Score de Madurez de Seguridad

Calculado automáticamente y visible en los dashboards. Basado en: tiempo promedio de remediación, % de reincidencias, vulns críticas acumuladas y cumplimiento de SLAs.

| Nivel de Agrupación | Descripción |
|---|---|
| Por Célula | Madurez del equipo de desarrollo |
| Por Subdirección | Consolidado de todas las células bajo esa subdirección |
| Por Organización | Consolidado de los repositorios de esa organización en GitHub |



---

## 13. Dashboards y Navegación

### 13.1 Principios de los Dashboards

- Todos los dashboards son **modulares**: cada panel es un componente independiente que puede mostrarse u ocultarse según los permisos del rol del usuario.
- Todos los paneles son **clickeables** y redirigen al detalle del dato mostrado.
- Todos los módulos con listados soportan: **búsqueda de texto libre, filtros contextuales, ordenamiento por columna, agrupación y paginación**.
- Los filtros son **específicos por módulo**, diseñados para los datos que maneja cada vista.

### 13.2 Filtros Contextuales por Módulo

| Módulo | Filtros Disponibles |
|---|---|
| Vulnerabilidades | Motor, Severidad, Estado, Estatus, OWASP, Organización, Subdirección, Gerencia, Célula, Repositorio/URL, Rango de fechas (detección, remediación), SLA vencido (Sí/No), Reincidente (Sí/No) |
| Liberaciones (Flujo) | Estatus, Tipo de cambio, Criticidad, Responsable de pruebas, Rango de fechas (entrada, QA, producción), SLA en riesgo |
| Liberaciones Pipeline | Motor, Resultado, Empresa/Marca, Tipo de aplicación, ¿Con vulns?, Rango de fechas |
| Programas Anuales | Programa, Mes, Año, Analista responsable |
| MDA | Tipo (programado/bajo demanda), Activo, Tipo de activo, Criticidad de amenaza, Estatus, Célula, Rango de fechas |
| Temas Emergentes | Tipo, Estatus, Responsable, Área involucrada, Rango de fechas, Sin movimiento en X días |
| Auditorías | Tipo, Regulación, Estatus, Rango de fechas |
| Iniciativas | Tipo, Estatus, Responsable, Rango de fechas |


### 13.3 Dashboards

**Dashboard 1 — General (Ejecutivo)**

Vista de alto nivel para el jefe de la jefatura. Tarjetas clickeables con:
- Avance global de todos los programas anuales (mes actual y anual)
- Vulnerabilidades Críticas activas totales (desglose por motor)
- Liberaciones activas y cuántas con SLA en riesgo
- Temas Emergentes abiertos y cuántos sin movimiento en +7 días
- Auditorías activas con requerimientos pendientes
- Iniciativas en ejecución y % de avance promedio

- Gráfica de tendencia mensual de avance de programas (últimos 6 meses)
- Semáforo global de SLAs (verde/amarillo/rojo)

**Dashboard 2 — Equipo**

- Carga de trabajo por analista (actividades asignadas, programas, liberaciones)
- % de avance individual por analista en sus programas del mes
- Tareas vencidas o próximas a vencer por persona
- Semáforo de cumplimiento por analista

**Dashboard 3 — Programas (Consolidado)**

- Tarjetas de % de avance mensual y anual por programa (una por programa)
- Gráfica de barras: avance mensual vs meta (100%) por programa
- Heatmap de cumplimiento mensual (12 meses × N programas)
- Click en un programa → navega al Dashboard 4

**Dashboard 4 — Zoom por Programa**

- % de avance del mes actual y anual acumulado
- Actividades completadas vs pendientes del mes con su peso y estatus
- Historial mensual de avance (tabla + gráfica de línea)
- Acceso directo al concentrado de hallazgos/vulnerabilidades del programa

**Dashboard 5 — Vulnerabilidades (Multi-Dimensional con Drill-Down)**

Vista principal con navegación drill-down en múltiples dimensiones:

*Dimensión Organizacional:*
```
Nivel 1: Recuadros por Subdirección
    → Vulns activas totales + desglose por motor (SAST, SCA, CDS, DAST, MDA)
    → Repos vulnerables por motor + total de repos

    Click en Subdirección ↓

Nivel 2: Recuadros por Organización y por Célula dentro de la Subdirección
    → Panel por Motor con tendencia (total anterior → total actual, solventadas, nuevas)

    Click en Organización o Célula ↓

Nivel 3: Listado de Repositorios o URLs con conteos de vulns y desglose por severidad
    → Score de Madurez de la célula

    Click en Repositorio o URL ↓

Nivel 4: Tabla completa de vulnerabilidades activas del activo
    → Historial, SLAs, acceso al detalle de cada vulnerabilidad
```

*Dimensión por Motor:*
```
Nivel 1: Recuadros por Motor (SAST, SCA, CDS, DAST, MDA, MAST)
    → Total anterior → Total actual, Solventadas, Nuevas
    → Filtros rápidos: Pipeline / Programa Anual / Bajo Demanda
    → Solo Críticas + No duplicados

    Click en Motor ↓

Nivel 2: Vista de vulnerabilidades del motor con filtros contextuales completos
    → Agrupación por Severidad, OWASP, Organización, Célula

    Click en Agrupación ↓

Nivel 3: Detalle de vulnerabilidades del grupo seleccionado
```

*Dimensión por Severidad:*
```
Nivel 1: Recuadros por Severidad (CRITICAL, HIGH, MEDIUM, LOW)
    → Total activas, SLA vencido, Nuevas este mes

    Click en Severidad ↓

Nivel 2: Vulnerabilidades de esa severidad con filtros contextuales
```

**Dashboard 6 — Liberaciones (Tabla)**

- Total de liberaciones activas, con SLA en riesgo, con observaciones pendientes, críticas en proceso
- Tabla de liberaciones con estatus, responsable de pruebas, fechas QA y producción
- Filtros contextuales completos

**Dashboard 7 — Kanban de Liberaciones**

Tablero visual con columnas configurables desde el panel de administración. Columnas base:
Recibida → Revisión de Diseño → Validaciones de Seguridad → Con Observaciones → Pruebas de Seguridad → VoBo Dado → En QA → En Producción → Cancelada.

Cada tarjeta muestra: nombre del servicio, tipo de cambio, criticidad, responsable de pruebas, días en el flujo y alerta de SLA.

**Dashboard 8 — Iniciativas**

- Tarjetas: Total activas, % avance promedio, iniciativas vencidas o en riesgo
- Tabla con nombre, tipo, fechas, responsable, % avance y estatus con semáforo
- Filtros contextuales

**Dashboard 9 — Temas Emergentes**

- Tarjetas: Total abiertos, sin movimiento +7 días, próximos a vencer
- Tabla con nombre, tipo, responsable, fecha compromiso, días abierto, estatus con semáforo
- Filtros contextuales

---

## 14. Seguridad, Roles y Notificaciones

### 14.1 Sistema de Roles y Permisos Granulares

El administrador define desde el panel:

- **Roles:** Creación libre con nombre personalizado.
- **Permisos por módulo y acción:** Ver, Crear, Editar, Eliminar, Exportar, Aprobar, Configurar.
- **Permisos hasta nivel de panel/widget:** Para cada rol, el administrador selecciona qué paneles específicos dentro de un dashboard son visibles (ej. de 10 paneles del Dashboard General, un rol puede ver solo 5).
- **Gestión de Usuarios:** Crear, editar, activar/desactivar usuarios. Asignar rol(es), vincular a célula, historial de accesos, restablecimiento de contraseña.

### 14.2 Log de Auditoría del Sistema

Registro inmutable de todas las acciones sobre datos sensibles:
- Quién, qué acción, sobre qué registro, cuándo, valor anterior y valor nuevo.
- Visible solo para el rol Administrador.
- No editable ni eliminable por ningún usuario.

### 14.3 Notificaciones In-App

Centro de notificaciones dentro de la plataforma (bell icon). Alertas automáticas configurables:

| Alerta | Disparador Configurable |
|---|---|
| SLA en riesgo | Vulnerabilidad o liberación a X días de vencer |
| Actividad sin actualizar | Actividad de programa sin movimiento en +N días hábiles |
| Tema emergente estancado | Sin actualización en +N días |
| Avance mensual bajo | Programa con menos del X% a mitad de mes |
| Plan de trabajo sin firma | En estado "En proceso de firmas" por más de N días |

---

## 15. Configuración Avanzada del Panel de Administración

Además de los catálogos, el administrador puede configurar:

| Elemento | Descripción |
|---|---|
| Flujos de estatus | Transiciones permitidas entre estatus por tipo de entidad |
| Períodos de programas | Meses que aplican para cada programa (10, 11 o 12) y mes de inicio del ciclo anual |
| Plantillas de reportes exportables | Campos incluidos en cada reporte (PDF/Excel) por módulo |
| Umbrales de alertas y notificaciones | Días de anticipación, días sin movimiento, % de avance mínimo |
| Tipos de activos para MDA | Opciones disponibles al vincular activos a un modelado |
| Columnas del Kanban de Liberaciones | Columnas, orden y criterios de entrada/salida |
| Historial de cambios de configuración | Registro de quién cambió qué configuración y cuándo (para integridad de datos históricos) |

---

## 16. Integración de Inteligencia Artificial

La plataforma integrará IA (aprovechando la capacidad "AI Provider Ready" del framework) en dos casos de uso iniciales:

1. **Modelado de Amenazas Asistido (STRIDE/DREAD):** Sugerencia automática de amenazas y ponderación de riesgo basada en la arquitectura del servicio.
2. **Triaje y Análisis de Falsos Positivos:** Análisis contextual de hallazgos para sugerir clasificaciones y generar borradores de justificación técnica.
