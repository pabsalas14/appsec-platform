# REQ_11: Complementos Transversales y Reglas de Negocio Base

**Documento Complementario a REQ_01 - REQ_10**
**Plataforma:** AppSec (Application Security Platform)
**Arquitectura:** No-Code / Configuration-Driven

Este documento especifica las 8 brechas funcionales y técnicas identificadas en la auditoría de cobertura contra el Documento Maestro (Secciones 18, 23, 24, 26, 27, 28, 33 y 39). Todos los elementos descritos aquí deben ser implementados siguiendo el principio de "Cero Hardcoding", permitiendo su modificación futura desde el Builder.

---

## 1. Flujos de Estatus Iniciales (Out-of-the-box)

El sistema debe inicializar la base de datos (Seed) con los siguientes flujos de estatus preconfigurados. Estos flujos rigen el ciclo de vida de las entidades principales y pueden ser modificados posteriormente desde el módulo de Administración (REQ_09).

### 1.1 Flujo de Vulnerabilidades (SAST, SCA, CDS, DAST, MAST)
- **Estatus Base:** `Nueva`, `Activa`, `En Remediación`, `Remediada`, `Falso Positivo`, `Riesgo Aceptado`, `Excepción Temporal`.
- **Transiciones Permitidas (Matriz de Cambio):**
  - De `Nueva` → `Activa`, `Falso Positivo`.
  - De `Activa` → `En Remediación`, `Riesgo Aceptado`, `Excepción Temporal`.
  - De `En Remediación` → `Remediada`, `Activa` (si la remediación falla).
  - De `Excepción Temporal` → `Activa` (automático al vencer la fecha), `Riesgo Aceptado`.
- **Comportamiento del SLA:**
  - `En Remediación`: El reloj del SLA sigue corriendo.
  - `Excepción Temporal`: El reloj del SLA se pausa.
  - `Riesgo Aceptado` / `Falso Positivo` / `Remediada`: El SLA se detiene y se marca como cumplido/cerrado.

### 1.2 Flujo de Liberaciones (Servicios)
- **Estatus Base:** `Recibida`, `Revisión de Diseño`, `Validaciones de Seguridad`, `Con Observaciones`, `Pruebas de Seguridad`, `VoBo Dado`, `En QA`, `En Producción`, `Cancelada`.
- **Transiciones Permitidas:**
  - Flujo lineal secuencial: `Recibida` → `Revisión de Diseño` → `Validaciones de Seguridad` → `Pruebas de Seguridad` → `VoBo Dado` → `En QA` → `En Producción`.
  - Transición de retroceso: Desde cualquier estatus antes de `VoBo Dado` → `Con Observaciones`.
  - Desde `Con Observaciones` → Regresa al estatus anterior una vez solventadas.
  - Desde cualquier estatus → `Cancelada`.

### 1.3 Flujo de Temas Emergentes
- **Estatus Base:** `Abierto`, `En Análisis`, `En Ejecución`, `En Espera de Tercero`, `Cerrado`, `Cancelado`.
- **Transiciones Permitidas:**
  - De `Abierto` → `En Análisis`, `Cancelado`.
  - De `En Análisis` → `En Ejecución`, `En Espera de Tercero`.
  - De `En Ejecución` → `Cerrado`, `En Espera de Tercero`.
  - De `En Espera de Tercero` → `En Ejecución`.

### 1.4 Flujo de Auditorías
- **Estatus Base:** `Planificada`, `En Ejecución`, `En Revisión de Hallazgos`, `Cerrada con Hallazgos`, `Cerrada sin Hallazgos`.
- **Transiciones Permitidas:**
  - De `Planificada` → `En Ejecución`.
  - De `En Ejecución` → `En Revisión de Hallazgos`.
  - De `En Revisión de Hallazgos` → `Cerrada con Hallazgos`, `Cerrada sin Hallazgos`.

---

## 2. Versionado Anual de Programas (Ciclo de Vida)

Define las reglas de negocio para la creación, modificación y cierre de programas anuales e iniciativas.

### 2.1 Cierre de Ciclo (Fin de Año Fiscal)
- **Trigger:** Clic en el botón `Cerrar Ciclo Anual` en el panel de administración de Programas.
- **Validación:** El sistema solicita confirmación explícita mediante un modal de advertencia ("¿Está seguro de cerrar el ciclo? Esta acción congelará todos los programas activos.").
- **Acción:**
  1. Cambia el estatus de todos los programas activos del año en curso a `Histórico`.
  2. Bloquea (Disable) todos los campos de captura, edición de fórmulas y carga de evidencias para estos programas.
  3. Genera un snapshot inmutable de los scores finales en la base de datos.
- **Resultado:** Los programas históricos solo son visibles en modo lectura y en las comparativas de dashboards.

### 2.2 Clonación para Nuevo Ciclo
- **Trigger:** Clic en el botón `Clonar Programa` en la vista de detalle de un programa `Histórico`.
- **Acción:**
  1. Crea un nuevo registro de programa en estatus `Borrador`.
  2. Copia la estructura exacta: Actividades, Fórmulas Dinámicas, Pesos Relativos (`Cat_PesoComponente`) y SLAs.
  3. **Resetea a cero:** Todos los valores de avance mensual, evidencias adjuntas, comentarios de bitácora y scores calculados.
- **Resultado:** El Administrador es redirigido a la pantalla de edición del nuevo programa borrador para ajustar pesos del nuevo año antes de publicarlo.

### 2.3 Modificación de Programas Activos y Recálculo
- **Trigger:** Edición de pesos o fórmulas de un programa en estatus `Activo`.
- **Validación:** Si se modifica el peso de una actividad en un mes que ya pasó el "Freeze" (Día 5 del mes siguiente).
- **Acción:**
  1. El sistema recalcula automáticamente el avance de ese mes histórico utilizando la nueva fórmula/peso.
  2. Recalcula el avance anual global y el Score de la Célula afectada.
  3. Registra en el Audit Log: "Recálculo de programa [ID] por modificación de pesos. Score anterior: [X], Score nuevo: [Y]".

---

## 3. Ciclo de Vida de Indicadores (KPIs)

Garantiza la integridad de las métricas históricas cuando cambian las fórmulas de cálculo de los KPIs.

### 3.1 Congelamiento Histórico vs Recálculo Retroactivo
- **Trigger:** Modificación de la fórmula de un indicador automático en el Builder.
- **Comportamiento por Defecto (Congelamiento):** El sistema **NO** recalcula los meses anteriores. Los valores históricos se mantienen intactos. La nueva fórmula solo aplica para el mes en curso y futuros.
- **Botón: `Aplicar Recálculo Retroactivo`**
  - **Ubicación:** Modal de confirmación al guardar una nueva fórmula.
  - **Acción:** Si el Administrador marca esta opción, el sistema recalcula el valor del KPI para todos los meses del año fiscal en curso utilizando la nueva fórmula.
  - **Resultado:** Actualiza la base de datos y los dashboards históricos del año actual. Registra la acción en el Audit Log.

### 3.2 Deprecación de Indicadores
- **Trigger:** Clic en el botón `Deprecar Indicador` en la configuración del KPI.
- **Acción:** Cambia el estatus del KPI a `Deprecado`.
- **Resultado:**
  1. El KPI desaparece de las pantallas de captura manual y de los dashboards del mes actual.
  2. El KPI **se mantiene visible** si el usuario filtra un dashboard por un mes histórico donde el KPI estaba activo.
  3. No se elimina de la base de datos (Soft Delete lógico).

---

## 4. Templates de Importación Masiva (Columnas Exactas)

El sistema debe proveer plantillas CSV/Excel descargables para la importación masiva de datos. El parser de importación validará estrictamente la presencia de estas columnas.

### 4.1 Template SAST (Checkmarx / SonarQube)
- **Columnas Obligatorias:**
  1. `Project` (Texto)
  2. `Organization` (Texto, mapea a Nivel 4)
  3. `Repository` (Texto, mapea a Nivel 6)
  4. `Vulnerability` (Texto, nombre del hallazgo)
  5. `Severity` (Catálogo: Crítica, Alta, Media, Baja, Informativa)
  6. `State` (Texto)
  7. `Status` (Texto)
  8. `Severity State` (Texto)
  9. `CWE_ID` (Texto, ej. CWE-79)
  10. `Language` (Texto, ej. Java, Python)
  11. `Group` (Texto)
  12. `Source/Dest File/Line` (Texto, ruta del archivo y línea)
  13. `First Detection` (Fecha, formato YYYY-MM-DD)
  14. `Detection Month` (Texto, ej. 2023-10)
  15. `Confidence Level` (Porcentaje o Texto)
  16. `SimilarityID` (Texto/Hash, identificador único de similitud para IA)
  17. `OWASP TOP 10 2021` (Texto, categoría OWASP)

### 4.2 Template SCA (Checkmarx / Snyk)
- **Columnas Obligatorias:**
  1. `Project` (Texto)
  2. `Organization` (Texto)
  3. `Repositories` (Texto)
  4. `Severity` (Catálogo)
  5. `State` (Texto)
  6. `Active State` (Texto)
  7. `EPSS Score` (Decimal, ej. 0.85)
  8. `EPSS Percentile` (Decimal, ej. 0.92)
  9. `Description` (Texto Largo)
  10. `Package` (Texto, nombre de la librería vulnerable)
  11. `Vulnerable Version` (Texto, ej. 1.2.3)
  12. `Recommended Version` (Texto, ej. 1.2.4)
  13. `CVSS Score` (Decimal, ej. 9.8)
  14. `Detection Date` (Fecha)
  15. `Scan ID` (Texto)
  16. `Project ID` (Texto)
  17. `Recommendation` (Texto Largo)
  18. `OWASP TOP 10 2021` (Texto)

### 4.3 Template CDS (Secretos)
- **Columnas Obligatorias:** `Project`, `Organization`, `Repository`, `Secret Type` (ej. AWS Key, RSA Private Key), `Severity`, `State`, `Status`, `File`, `Line`, `Snippet` (Fragmento de código ofuscado), `Validity`, `Comments`.

### 4.4 Template Pipeline SAST/DAST (Métricas Agregadas)
- **Columnas Obligatorias:** `Scan ID`, `Organization`, `Repository`, `Branch`, `Month`, `Scan Date`, `Cell`, `Responsible`, `Critical Vulns` (Entero), `High Vulns` (Entero), `Medium Vulns` (Entero), `Low Vulns` (Entero), `Result` (Pass/Fail).

### 4.5 Template Inventario de Repositorios
- **Columnas Obligatorias:** `Org ID`, `Repository Name`, `URL`, `Main Technology`, `Visibility` (Public/Private), `Criticality` (Tier 1 a 4), `Cell` (Mapeo a Nivel 5).

---

## 5. Requisitos No Funcionales (Criterios de Aceptación)

### 5.1 Performance y Rendimiento
- **Procesamiento Masivo:** El parser de importación debe ser capaz de procesar y validar un archivo CSV de hasta **10,000 filas** (ej. escaneos SAST masivos) en un solo hilo sin generar errores de `Timeout` (HTTP 504). Se debe implementar procesamiento asíncrono (Background Jobs) con barra de progreso en UI para archivos mayores a 5MB.
- **Tiempos de Carga (Dashboards):** Las consultas a la base de datos para los dashboards analíticos (incluyendo agregaciones de 7 niveles organizacionales) deben resolverse y renderizar la vista en **menos de 3 segundos** (`< 3s`) bajo condiciones de carga normal.

### 5.2 Seguridad Aplicativa
- **Gestión de Sesiones:** Todas las cookies de sesión y tokens de autenticación deben configurarse estrictamente con los flags `HttpOnly`, `Secure` y `SameSite=Strict`.
- **Protección CSRF:** Implementación obligatoria de tokens Anti-CSRF en todas las peticiones POST, PUT, PATCH y DELETE.
- **Trazabilidad Inmutable:** El sistema de Audit Logs (REQ_06) debe utilizar un mecanismo a nivel de base de datos o framework (ej. `audit_action_prefix`) que garantice que los registros de auditoría son de solo inserción (Append-only) y no pueden ser modificados ni eliminados ni siquiera por el rol Super Admin.

---

## 6. Casos de Uso de Inteligencia Artificial (AI Builder)

Complemento a las capacidades de IA descritas en el módulo SCR y MDA.

### 6.1 Asistente de Redacción (Mejora de Textos)
- **Ubicación:** Disponible en todos los campos de texto largo tipo "Justificación", "Controles Compensatorios" y "Comentarios de Bitácora".
- **Botón: `✨ Mejorar redacción con IA`** (Icono de destellos).
- **Trigger:** Clic en el botón situado en la esquina inferior derecha del campo de texto.
- **Acción:**
  1. Toma el texto crudo ingresado por el usuario.
  2. Envía el texto al LLM configurado en el AI Builder junto con el System Prompt: *"Eres un experto en ciberseguridad. Mejora la redacción del siguiente texto para que sea profesional, técnico, claro y conciso, corrigiendo ortografía y gramática, sin alterar el significado original."*
  3. Muestra un estado de carga (Spinner) dentro del botón.
- **Resultado:** Reemplaza el texto crudo en el input con la versión mejorada generada por la IA.

### 6.2 Detección de Duplicados por Similitud Semántica
- **Ubicación:** Proceso de Importación Masiva de Vulnerabilidades (SAST/SCA).
- **Trigger:** Automático durante el procesamiento del CSV.
- **Acción:**
  1. El sistema no solo compara IDs exactos, sino que utiliza el campo `SimilarityID`, `CWE_ID`, `File/Line` y el `Snippet` de código.
  2. Si detecta una vulnerabilidad nueva que tiene una similitud semántica alta (>90%) con una vulnerabilidad ya existente (ej. mismo problema reportado en una línea adyacente debido a un refactor de código), la marca como "Posible Duplicado".
- **Resultado:** En la pantalla de revisión post-importación, muestra una alerta: *"Se detectaron X posibles duplicados"*. Permite al usuario revisar la comparación lado a lado y decidir si agruparlas bajo un mismo ID padre o tratarlas como hallazgos separados.

---

## 7. Centro de Notificaciones In-App (Pantalla de Usuario)

Especificación de la interfaz de usuario para el consumo de notificaciones (la configuración de reglas ya está cubierta en REQ_06).

### 7.1 Interfaz del Panel de Notificaciones
- **Trigger:** Clic en el icono de `Campana` en la barra de navegación superior (Top Bar). El icono debe mostrar un "Badge" rojo con el número de notificaciones no leídas (ej. `3`).
- **Vista:** Se despliega un Panel Lateral (Drawer) o un Popover ancho desde la derecha.
- **Estructura del Panel:**
  - **Cabecera:** Título "Notificaciones", contador de no leídas, y botón `Marcar todas como leídas`.
  - **Filtros (Pestañas):** `Todas`, `No Leídas`, `Menciones (@)`, `Alertas SLA`.
  - **Lista de Notificaciones (Scrollable):**
    - Cada item muestra: Icono representativo (ej. Reloj para SLA, Persona para mención), Título en negrita, Cuerpo del mensaje (generado por la plantilla del Builder), y Tiempo transcurrido (ej. "Hace 2 horas").
    - Fondo ligeramente sombreado para las "No Leídas".
- **Interacciones por Item:**
  - **Clic en la notificación:** Redirige al usuario directamente al registro específico (ej. abre el Drawer de la vulnerabilidad a punto de vencer) y marca la notificación como leída automáticamente.
  - **Botón `X` o `Marcar como leída`:** Icono pequeño al pasar el mouse (hover) sobre el item para marcarla como leída sin navegar.

---

## 8. Catálogos Centrales (Valores Iniciales / Seed Data)

El sistema debe inicializarse con los siguientes valores en sus catálogos centrales. Todos son administrables posteriormente desde el Builder.

### 8.1 Catálogo de Motores de Seguridad (`Cat_MotorSeguridad`)
- `SAST` (Static Application Security Testing)
- `DAST` (Dynamic Application Security Testing)
- `SCA` (Software Composition Analysis)
- `CDS` (Detección de Secretos)
- `MDA` (Modelado de Amenazas / Threat Modeling)
- `MAST` (Mobile Application Security Testing)
- `Pentest Manual`
- `SCR` (Source Code Review - IA)

### 8.2 Catálogo de Severidad (`Cat_Severidad`)
- `Crítica` (Color asociado: Rojo Oscuro / #DC2626)
- `Alta` (Color asociado: Rojo / #EF4444)
- `Media` (Color asociado: Naranja / #F59E0B)
- `Baja` (Color asociado: Amarillo / #FBBF24)
- `Informativa` (Color asociado: Azul / #3B82F6)

### 8.3 Catálogo de Tipos de Cambio para Liberaciones (`Cat_TipoCambio`)
- `Pase a Producción` (Nuevo feature o release mayor)
- `Hotfix` (Parche de emergencia)
- `Rollback` (Reversión de versión)
- `Cambio de Infraestructura` (Modificación en servidores/red)

### 8.4 Catálogo de Criticidad de Activos (`Cat_CriticidadActivo`)
- `Tier 1 (Misión Crítica)`: Afectación directa a ingresos o regulatorio.
- `Tier 2 (Core Business)`: Operación principal del negocio.
- `Tier 3 (Soporte)`: Herramientas internas de uso general.
- `Tier 4 (Interno)`: Herramientas de bajo impacto.

### 8.5 Catálogo de Categorías OKR (`Cat_CategoriaOKR`)
- `Operación` (Métricas de BAU, SLAs)
- `Innovación` (Nuevas herramientas, automatización)
- `Cumplimiento` (Auditorías, regulaciones)
- `Desarrollo de Equipo` (Capacitaciones, certificaciones)

---
**Fin del Documento REQ_11**
