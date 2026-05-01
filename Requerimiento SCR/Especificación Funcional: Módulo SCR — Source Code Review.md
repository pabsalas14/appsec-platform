# Especificación Funcional: Módulo SCR — Source Code Review

**Versión:** 1.0  
**Clasificación:** Confidencial — Uso Interno  
**Complementa:** Especificación Maestra AppSec, Especificación de Menú V3  
**Nota:** Este documento es un complemento a la documentación existente de la plataforma AppSec. Todos los patrones de diseño (drawer lateral, drill-down, ciclo de vida de hallazgos, roles, alertas, notificaciones, exportaciones) siguen las mismas reglas establecidas en la Especificación Maestra y en la Especificación del Menú V3. Se reutilizan los componentes de: Tabla con Filtros, Panel Lateral (Drawer), Ciclo de Vida de Hallazgos, Bitácora de Actualizaciones, Exportación PDF/CSV/JSON, Sistema de Alertas, Gestión de Usuarios y Roles, y Centro de Notificaciones.

---

## 1. Objetivo del Módulo

El módulo **SCR (Source Code Review)** es un motor de análisis forense de código que utiliza tres agentes de Inteligencia Artificial para detectar **funcionalidades maliciosas intencionales** en repositorios Git. A diferencia de los motores SAST, DAST y SCA que identifican vulnerabilidades técnicas conocidas (CVEs) o secretos expuestos, el SCR se especializa en:

- Detección de código malicioso deliberado: backdoors, bombas lógicas, exfiltración de datos.
- Análisis forense del historial de commits para identificar comportamientos anómalos de autores.
- Generación de reportes ejecutivos con narrativa de ataque y recomendaciones accionables.

Los hallazgos del SCR son **independientes** del Concentrado de Hallazgos de los motores SAST/DAST/SCA/MDA/MAST. Tienen su propia tabla, su propio ciclo de vida y sus propios dashboards, pero comparten la infraestructura de usuarios, roles, alertas y notificaciones de la plataforma.

---

## 2. Integración en el Menú Principal

Se agrega una nueva **SECCIÓN 7 — SCR** en el sidebar de la plataforma, entre la Sección 5 (Desempeño OKR) y la Sección 6 (Configuración). La sección es colapsable y contiene los siguientes ítems:

| Ítem | Ícono | Descripción |
|---|---|---|
| **7.1 Dashboard SCR** | 📊 | Primera pantalla del módulo. KPIs, tendencias y costos. |
| **7.2 Nuevo Escaneo** | 🔍 | Wizard para iniciar un análisis de repositorio. |
| **7.3 Hallazgos SCR** | 🚨 | Tabla concentrado de hallazgos detectados por los agentes. |
| **7.4 Historial de Escaneos** | 📋 | Registro de todos los análisis ejecutados. |
| **7.5 Investigación Forense** | 🕵️ | Módulo de búsqueda y consulta forense histórica. |
| **7.6 Agentes** | 🤖 | Configuración, estadísticas y personalización de los 3 agentes. |

**Reglas de navegación que aplican (heredadas del Menú V3):**
- Al hacer clic en cualquier ítem de la sección SCR, la primera pantalla que carga es el dashboard o la tabla principal de ese ítem.
- Ninguna sub-entidad (Hallazgos de un escaneo específico, Eventos forenses de un commit) aparece como ítem independiente en el sidebar.
- La configuración del LLM y del token de GitHub se integra en **Administración → Pestaña 8 (SCR)**, no como ítem separado.

---

## 3. Configuración del Módulo SCR

### 3.1 Ubicación
La configuración del SCR se integra como una nueva **Pestaña 8 — SCR** dentro del ítem de **Administración** (Sección 6 del menú). Esta pestaña solo es visible para usuarios con rol Administrador.

### 3.2 Sub-pestaña: Proveedor LLM

**Campos:**

| Campo | Tipo | Validación | Descripción |
|---|---|---|---|
| Proveedor | Dropdown | Requerido | Anthropic, OpenRouter, LiteLLM, Local (LM Studio) |
| API Key | Texto (password) | Requerido | Se muestra enmascarado. Botón "Mostrar/Ocultar". |
| Modelo | Dropdown dinámico | Requerido | Se carga según el proveedor seleccionado. Ej: claude-3-5-sonnet, gpt-4o, qwen2.5-coder |
| Temperatura | Slider (0.0–1.0) | Opcional | Controla la creatividad del modelo. Default: 0.2 |
| Max Tokens por Chunk | Número | Requerido | Límite de tokens por fragmento de código analizado. Default: 4096 |
| Timeout (segundos) | Número | Requerido | Tiempo máximo de espera por respuesta del LLM. Default: 60 |

**Interacciones:**
1. Al cambiar el **Proveedor**, el campo **Modelo** se limpia y se recarga con las opciones disponibles para ese proveedor.
2. Al hacer clic en **"Probar Conexión"**, el sistema envía un prompt de prueba al LLM configurado y muestra el resultado (éxito con latencia en ms, o error con mensaje técnico).
3. Al hacer clic en **"Guardar"**, se validan todos los campos requeridos. Si alguno falta, se resalta en rojo con mensaje de error inline. Si todo es válido, se muestra un toast de confirmación verde.

### 3.3 Sub-pestaña: Integración GitHub / GitLab

**Campos:**

| Campo | Tipo | Validación | Descripción |
|---|---|---|---|
| Plataforma | Dropdown | Requerido | GitHub, GitLab |
| Token de Acceso | Texto (password) | Requerido | Personal Access Token (PAT) o GitHub App Token |
| Nombre descriptivo | Texto | Requerido | Ej: "Token Org Banregio" |

**Interacciones:**
1. Al hacer clic en **"Validar Token"**, el sistema llama a la API de GitHub/GitLab con el token ingresado y muestra:
   - Si es válido: Un panel verde con el nombre del usuario autenticado, fecha de expiración del token, y la lista de organizaciones y repositorios accesibles (con conteo: "3 organizaciones, 47 repositorios").
   - Si es inválido: Un panel rojo con el mensaje de error de la API.
2. Al hacer clic en **"Guardar"**, se persiste el token de forma encriptada.
3. Se pueden configurar múltiples tokens (uno por organización). La tabla de tokens muestra: Nombre, Plataforma, Usuario Autenticado, Repos Accesibles, Fecha Expiración, Estatus (Activo/Expirado).
4. Al hacer clic en el ícono de papelera de un token, aparece un modal de confirmación antes de eliminarlo.

---

## 4. Ítem 7.1 — Dashboard SCR

### 4.1 Comportamiento al hacer clic en el menú
Navega a la página principal del módulo SCR. Esta es la primera pantalla que carga al entrar a la sección SCR.

### 4.2 Estructura de la página
La página tiene dos pestañas horizontales en la parte superior:

---

#### Pestaña A — Actividad y Riesgo

**Fila 1 — KPI Cards (5 tarjetas):**

| KPI | Descripción | Drill-down al hacer clic |
|---|---|---|
| Total Escaneos | Número de escaneos ejecutados en el período | Navega a Historial de Escaneos con filtro del período |
| Hallazgos Críticos | Hallazgos activos con severidad CRITICAL | Navega a Hallazgos SCR con filtro Severidad=CRITICAL y Estatus=Activo |
| Hallazgos Altos | Hallazgos activos con severidad HIGH | Navega a Hallazgos SCR con filtro Severidad=HIGH y Estatus=Activo |
| Repositorios Escaneados | Repos únicos analizados en el período | Navega a Historial de Escaneos agrupado por repositorio |
| Tiempo Promedio de Remediación | Días promedio entre detección y cierre | Navega a Hallazgos SCR con filtro Estatus=CERTIFICADO |

**Filtro de período:** Selector de rango de fechas en la barra superior (Últimos 7 días / 30 días / 90 días / Personalizado). Al cambiar el período, todos los KPIs y gráficas se actualizan sin recargar la página.

**Fila 2 — Gráficas:**

- **Izquierda (60% del ancho): Tendencia de Hallazgos** — Gráfica de líneas con dos series: "Detectados" y "Resueltos" por semana. Al hacer clic en un punto de la gráfica, se abre un panel lateral con la lista de hallazgos de esa semana.
- **Derecha (40% del ancho): Distribución por Patrón** — Gráfica de dona mostrando los 10 patrones del Inspector. Al hacer clic en un segmento, navega a Hallazgos SCR filtrado por ese patrón.

**Fila 3 — Gráficas:**

- **Izquierda (50% del ancho): Heatmap de Actividad** — Mapa de calor con repositorios en el eje Y y semanas en el eje X. El color de cada celda indica la cantidad de hallazgos (verde=0, amarillo=1-3, rojo=4+). Al hacer clic en una celda, navega a Hallazgos SCR filtrado por ese repositorio y esa semana.
- **Derecha (50% del ancho): Anomalías del Detective** — Gráfica de barras apiladas con los 6 patrones forenses del Detective por semana. Al hacer clic en una barra, se abre el panel lateral con los eventos forenses de esa semana.

**Fila 4 — Tabla: Top 5 Repositorios con más Hallazgos Activos:**

Columnas: Repositorio, Organización, Críticos, Altos, Medios, Bajos, Último Escaneo. Al hacer clic en una fila, navega a Hallazgos SCR filtrado por ese repositorio.

---

#### Pestaña B — Análisis de Costos

**Fila 1 — KPI Cards (4 tarjetas):**

| KPI | Descripción |
|---|---|
| Gasto Total (USD) | Costo monetario acumulado en el período |
| Tokens Consumidos | Total de tokens (input + output) en el período |
| Costo por Escaneo (Promedio) | Gasto promedio por análisis ejecutado |
| Ahorro por Análisis Incremental | Estimado de tokens ahorrados vs. escaneo completo |

**Fila 2 — Gráficas:**

- **Izquierda (60%): Gasto por Escaneo (Barras)** — Cada barra representa un escaneo. Color por proveedor LLM. Al hacer clic en una barra, se abre un panel lateral con el desglose de tokens: Inspector (input/output), Detective (input/output), Fiscal (input/output), Total, Costo USD calculado.
- **Derecha (40%): Distribución por Agente (Dona)** — Porcentaje de tokens consumidos por Inspector vs. Detective vs. Fiscal.

**Fila 3 — Tabla: Detalle de Costos por Escaneo:**

Columnas: Fecha, Repositorio, Proveedor, Modelo, Tokens Input, Tokens Output, Tokens Total, Costo USD. Ordenable por cualquier columna. Botón "Exportar CSV" en la barra superior.

**Nota de cálculo:** El costo en USD se calcula multiplicando los tokens por el precio por millón de tokens del proveedor configurado. Los precios se mantienen actualizados en un catálogo interno (Administración → Catálogos → Precios LLM).

---

## 5. Ítem 7.2 — Nuevo Escaneo

### 5.1 Comportamiento al hacer clic en el menú
Abre un **Wizard de 3 pasos** en una página completa (no drawer). El wizard tiene un indicador de progreso en la parte superior mostrando los 3 pasos: `1. Configuración` → `2. Alcance` → `3. Confirmación`.

### 5.2 Paso 1 — Configuración del Escaneo

**Campos:**

| Campo | Tipo | Validación | Descripción |
|---|---|---|---|
| Nombre del Escaneo | Texto | Requerido | Identificador descriptivo. Ej: "Auditoría Q2 - ios-banking" |
| Token a Utilizar | Dropdown | Requerido | Lista de tokens configurados en Administración. Muestra: Nombre, Plataforma, Usuario |
| Proveedor LLM | Dropdown | Requerido | Pre-cargado con el proveedor configurado en Administración. Editable para este escaneo. |
| Modelo | Dropdown | Requerido | Modelos disponibles del proveedor seleccionado |
| Análisis Incremental | Toggle (On/Off) | Opcional | Si está On y el repo ya fue escaneado, solo analiza commits nuevos. Default: On |
| Prioridad | Dropdown | Requerido | Alta / Media / Baja. Afecta la posición en la cola de análisis. |

**Interacciones:**
1. Al cambiar el **Token**, el sistema valida automáticamente que el token sigue activo y muestra el nombre del usuario autenticado debajo del campo.
2. Al cambiar el **Proveedor LLM**, el campo **Modelo** se recarga.
3. Si **Análisis Incremental = On** y el repositorio que se seleccionará en el Paso 2 ya tiene escaneos previos, se mostrará un aviso informativo: "Se analizarán X commits nuevos desde el último escaneo (fecha). Ahorro estimado: Y%".
4. Botón **"Siguiente"** en la parte inferior derecha. Solo se habilita cuando todos los campos requeridos están completos.

### 5.3 Paso 2 — Alcance del Escaneo

**Selector de Modalidad:** 4 tarjetas de selección (radio buttons visuales). Al hacer clic en una tarjeta, se resalta y aparece el formulario correspondiente debajo.

---

**Modalidad A — Repositorio Público**

Descripción: Analiza cualquier repositorio público sin necesidad de autenticación.

| Campo | Tipo | Validación |
|---|---|---|
| URL del Repositorio | Texto (URL) | Requerido. Debe ser una URL válida de GitHub/GitLab. |
| Rama | Texto | Opcional. Si se deja vacío, se usa la rama por defecto (main/master). |

Interacción: Al salir del campo URL (blur), el sistema valida que la URL sea accesible y muestra el nombre del repositorio, la descripción y el número de commits. Si la URL no es válida o el repo no existe, muestra un error inline rojo.

---

**Modalidad B — Repositorio Privado**

Descripción: Analiza un repositorio privado al que tiene acceso el token seleccionado.

| Campo | Tipo | Validación |
|---|---|---|
| Repositorio | Dropdown con búsqueda | Requerido. Lista cargada dinámicamente desde la API de GitHub con el token seleccionado. |
| Rama | Dropdown | Requerido. Se carga dinámicamente al seleccionar el repositorio. |

Interacción: Al abrir el dropdown de Repositorio, se muestra un campo de búsqueda interno. Al escribir, filtra la lista en tiempo real. Al seleccionar un repositorio, el dropdown de Rama se carga automáticamente con las ramas disponibles.

---

**Modalidad C — Rama Específica**

Descripción: Idéntica a la Modalidad B pero con énfasis en el análisis de una rama específica (útil para analizar una feature branch antes de un merge).

| Campo | Tipo | Validación |
|---|---|---|
| Repositorio | Dropdown con búsqueda | Requerido. |
| Rama | Dropdown | Requerido. Se carga al seleccionar el repositorio. |
| Rango de Commits | Selector de fechas | Opcional. Limita el análisis a commits dentro de un rango de fechas. |

---

**Modalidad D — Organización**

Descripción: Analiza uno o múltiples repositorios de una organización en un solo escaneo en lote.

| Campo | Tipo | Validación |
|---|---|---|
| Organización | Dropdown | Requerido. Lista de organizaciones accesibles con el token. |
| Repositorios | Lista con checkboxes | Requerido. Mínimo 1 seleccionado. |
| Rama (para todos) | Dropdown | Opcional. Si se selecciona, aplica la misma rama a todos los repos. Si se deja vacío, usa la rama por defecto de cada repo. |

Interacción: Al seleccionar la Organización, la lista de repositorios se carga dinámicamente. Hay botones de "Seleccionar Todos" y "Deseleccionar Todos". Cada repositorio en la lista muestra: Nombre, Visibilidad (Público/Privado), Lenguaje principal, Fecha del último commit. Al seleccionar múltiples repositorios, aparece un aviso: "Se ejecutarán X escaneos en paralelo. Costo estimado: ~$Y USD".

---

**Botones de navegación:**
- **"Anterior"** (izquierda): Regresa al Paso 1 sin perder los datos ingresados.
- **"Siguiente"** (derecha): Avanza al Paso 3. Solo se habilita cuando el alcance está completo.

### 5.4 Paso 3 — Confirmación

Muestra un resumen de todo lo configurado en los pasos anteriores:
- Nombre del escaneo, Token, Proveedor LLM, Modelo.
- Modalidad seleccionada y repositorios/ramas a analizar.
- Estimado de tiempo de análisis (calculado en base al tamaño del repo y el modelo).
- Estimado de costo en tokens y USD.
- Si Análisis Incremental está activo: número de commits nuevos a analizar.

**Botones:**
- **"Anterior"**: Regresa al Paso 2.
- **"Iniciar Escaneo"** (botón primario azul): Encola el análisis y navega automáticamente a la **Vista de Progreso en Tiempo Real**.

### 5.5 Vista de Progreso en Tiempo Real

Al iniciar el escaneo, la página muestra el estado del pipeline en tiempo real mediante WebSocket:

**Estructura de la vista:**
- Encabezado: Nombre del escaneo, repositorio(s), fecha/hora de inicio.
- **Barra de progreso general** (0–100%) con el porcentaje calculado en base al avance de los 3 agentes.
- **Panel del Inspector Agent:**
  - Barra de progreso propia (X de N archivos analizados).
  - Log en tiempo real: cada archivo analizado aparece como una línea con su nombre y el resultado (✅ Sin hallazgos / ⚠️ N hallazgos encontrados).
  - Contador de hallazgos detectados hasta el momento, desglosado por severidad.
- **Panel del Detective Agent** (se activa cuando el Inspector termina):
  - Barra de progreso propia (X de N commits analizados).
  - Log en tiempo real: cada evento forense detectado aparece como una línea con el tipo de patrón y el commit hash.
- **Panel del Fiscal Agent** (se activa cuando el Detective termina):
  - Indicador de estado: "Generando reporte ejecutivo..."
  - Al terminar: "✅ Reporte generado".
- **Botón "Cancelar Escaneo"** (disponible durante la ejecución): Muestra un modal de confirmación. Si se confirma, detiene el pipeline y guarda los hallazgos parciales con estatus "CANCELADO".

Al finalizar los 3 agentes, aparece un banner verde: **"Análisis completado. X hallazgos detectados."** con dos botones: **"Ver Hallazgos"** (navega a Hallazgos SCR filtrado por este escaneo) y **"Ver Reporte Ejecutivo"** (abre el reporte del Fiscal en un modal de pantalla completa).

---

## 6. Ítem 7.3 — Hallazgos SCR

### 6.1 Comportamiento al hacer clic en el menú
Navega a la página de Hallazgos SCR. La primera pantalla que carga es el **mini-dashboard** en la parte superior seguido de la tabla de hallazgos.

### 6.2 Mini-Dashboard Superior

4 KPI Cards: Total Activos, Críticos, Altos, Falsos Positivos del período. Al hacer clic en cualquier KPI, aplica el filtro correspondiente en la tabla inferior.

### 6.3 Tabla de Hallazgos

**Barra de herramientas:**
- Botón **"Filtros"** (izquierda): Abre el panel lateral de filtros.
- Pestañas de agente: `Todos` | `Inspector` | `Detective`. Al cambiar de pestaña, la tabla muestra solo los hallazgos del agente seleccionado.
- Botón **"Exportar"** (derecha): Dropdown con opciones CSV, JSON, PDF Ejecutivo.
- Buscador de texto libre (busca en nombre del hallazgo, archivo, descripción).

**Columnas de la tabla:**

| Columna | Descripción | Ordenable |
|---|---|---|
| ID | Identificador único del hallazgo | Sí |
| Agente | Inspector o Detective (chip de color) | Sí |
| Patrón | Tipo de patrón detectado (chip de color por severidad) | Sí |
| Severidad | CRITICAL / HIGH / MEDIUM / LOW (chip de color) | Sí |
| Repositorio | Nombre del repositorio analizado | Sí |
| Archivo / Commit | Ruta del archivo (Inspector) o hash del commit (Detective) | No |
| Confianza | Porcentaje de confianza del LLM (ej. 94%) | Sí |
| Fecha Detección | Fecha y hora del escaneo | Sí |
| SLA | Días restantes hasta el vencimiento (semáforo Verde/Amarillo/Rojo) | Sí |
| Estatus | Chip de color con el estatus actual del ciclo de vida | Sí |
| Asignado a | Avatar + nombre del analista responsable | No |

**Panel lateral de filtros (se abre al hacer clic en "Filtros"):**

| Filtro | Tipo |
|---|---|
| Agente | Checkboxes: Inspector, Detective |
| Patrón | Multi-select con todos los patrones |
| Severidad | Checkboxes: CRITICAL, HIGH, MEDIUM, LOW |
| Estatus | Multi-select con todos los estatus del ciclo de vida |
| Repositorio | Dropdown con búsqueda |
| Organización | Dropdown |
| Asignado a | Dropdown con usuarios |
| Escaneo | Dropdown con historial de escaneos |
| Confianza mínima | Slider (0–100%) |
| Rango de Fechas | Selector de fechas (Desde / Hasta) |
| Solo Falsos Positivos | Toggle |

Al aplicar filtros, aparecen como **chips activos** en la barra de herramientas. Cada chip tiene un botón "×" para eliminarlo individualmente. Botón "Limpiar Todos" al final de los chips.

**Acciones masivas:** Al seleccionar una o más filas con el checkbox de la primera columna, aparece una barra flotante en la parte inferior de la pantalla con las opciones:
- **Cambiar Estatus:** Dropdown con los estatus disponibles. Al seleccionar, muestra un modal de confirmación con campo de comentario obligatorio.
- **Reasignar:** Dropdown con usuarios. Al seleccionar, aplica la reasignación a todos los hallazgos seleccionados.
- **Exportar Selección:** Descarga solo los hallazgos seleccionados en CSV.
- **Marcar como Falso Positivo:** Abre un modal con campo de justificación obligatorio (mínimo 50 caracteres) y checkbox "Aprender este patrón para futuros escaneos de este repositorio".

### 6.4 Drawer de Detalle de Hallazgo

Al hacer clic en cualquier fila de la tabla, se abre un **Panel Lateral (Drawer)** deslizable desde la derecha. El drawer ocupa el 45% del ancho de la pantalla. La tabla permanece visible y funcional detrás del drawer.

**Encabezado del Drawer:**
- ID del hallazgo, chip de Agente, chip de Severidad, chip de Estatus.
- Botón **"Cambiar Estatus"**: Abre un dropdown inline con los estatus disponibles según el ciclo de vida actual.
- Botón **"Asignar"**: Abre un dropdown con los usuarios disponibles.
- Botón **"×"** para cerrar el drawer.

**Cuerpo del Drawer (3 pestañas):**

**Pestaña 1 — Detalle Técnico:**
- **Patrón detectado:** Nombre del patrón con su descripción completa.
- **Archivo afectado** (Inspector): Ruta completa del archivo, con enlace al repositorio en GitHub/GitLab.
- **Fragmento de código** (Inspector): Bloque de código con resaltado de sintaxis. Las líneas sospechosas se resaltan en amarillo. Botón "Copiar" en la esquina superior derecha.
- **Líneas afectadas** (Inspector): Rango de líneas (ej. L45–L67).
- **Commit afectado** (Detective): Hash del commit con enlace, mensaje del commit, autor, fecha y hora.
- **Explicación técnica:** Texto generado por el LLM explicando por qué este código/commit es sospechoso.
- **Nivel de confianza:** Barra de progreso con el porcentaje (ej. 94%).
- **Recomendación de remediación:** Texto con los pasos técnicos sugeridos.

**Pestaña 2 — Análisis IA:**
- Botón **"Solicitar Análisis Adicional"**: Envía el hallazgo al LLM para obtener un análisis más profundo. Muestra un spinner mientras procesa y luego el resultado en un bloque de texto.
- **Contexto del Repositorio:** Información del repositorio (lenguaje, criticidad, última actividad).
- **Hallazgos Relacionados:** Lista de otros hallazgos del mismo archivo o del mismo autor (si aplica).

**Pestaña 3 — Bitácora:**
- Historial cronológico de todos los cambios de estatus, reasignaciones y comentarios. Cada entrada muestra: Avatar del usuario, nombre, acción realizada, fecha/hora y comentario (si aplica).
- **Campo de nuevo comentario** en la parte inferior: Texto libre con botón "Agregar Comentario". Soporte para @menciones de usuarios.

### 6.5 Ciclo de Vida de los Hallazgos SCR

Los hallazgos del SCR siguen el mismo patrón de ciclo de vida que el resto de la plataforma, adaptado a la naturaleza forense del módulo:

| Estatus | Color | Descripción | Quién puede transicionar |
|---|---|---|---|
| **NUEVO** | Azul | Hallazgo recién detectado por un agente. | Sistema (automático) |
| **ASIGNADO** | Morado | Se ha designado un analista responsable. | Admin, Coordinador |
| **EN REVISIÓN** | Amarillo | El analista está evaluando el hallazgo. | Analista asignado |
| **VALIDADO** | Naranja | Se confirma que es un riesgo real. | Analista, Coordinador |
| **EN REMEDIACIÓN** | Azul oscuro | El equipo de desarrollo está aplicando la solución. | Analista, Coordinador |
| **RESUELTO** | Verde claro | La solución ha sido implementada. | Analista asignado |
| **CERTIFICADO** | Verde oscuro | Un auditor o Coordinador verifica y cierra el hallazgo. | Coordinador, Admin |
| **FALSO POSITIVO** | Gris | Se descarta el hallazgo con justificación. | Analista, Coordinador |

**Reglas de transición:**
- De NUEVO a ASIGNADO: Requiere seleccionar un analista.
- De cualquier estatus a FALSO POSITIVO: Requiere justificación escrita (mínimo 50 caracteres).
- De RESUELTO a CERTIFICADO: Requiere que el usuario tenga rol Coordinador o Admin.
- De CERTIFICADO a cualquier otro: No permitido. El hallazgo certificado es inmutable.

---

## 7. Ítem 7.4 — Historial de Escaneos

### 7.1 Comportamiento al hacer clic en el menú
Navega a la tabla de todos los escaneos ejecutados en la plataforma.

### 7.2 Tabla de Escaneos

**Barra de herramientas:**
- Botón **"Nuevo Escaneo"** (acceso directo al Wizard del Ítem 7.2).
- Botón **"Filtros"**.
- Buscador de texto libre (busca por nombre del escaneo o repositorio).
- Botón **"Exportar CSV"**.

**Columnas:**

| Columna | Descripción |
|---|---|
| ID | Identificador único del escaneo |
| Nombre | Nombre descriptivo del escaneo |
| Repositorio(s) | Nombre(s) del repositorio analizado. Si son múltiples (Org), muestra "N repositorios" |
| Modalidad | Chip: Público / Privado / Rama / Organización |
| Agente LLM | Proveedor y modelo utilizado |
| Estatus | Chip: EN COLA / EN PROCESO / COMPLETADO / CANCELADO / ERROR |
| Hallazgos | Conteo por severidad: 🔴 N CRITICAL 🟠 N HIGH 🟡 N MEDIUM 🟢 N LOW |
| Duración | Tiempo total del análisis (mm:ss) |
| Costo USD | Costo estimado del escaneo |
| Fecha | Fecha y hora de inicio |
| Ejecutado por | Avatar + nombre del usuario |

**Panel de filtros:**
- Estatus (multi-select), Modalidad (multi-select), Repositorio (dropdown), Ejecutado por (dropdown), Rango de Fechas.

### 7.3 Drawer de Detalle del Escaneo

Al hacer clic en una fila, se abre un **Panel Lateral (Drawer)** con:
- **Encabezado:** Nombre, Estatus, Fecha, Duración, Costo USD.
- **Resumen de Hallazgos:** Tabla con conteo por agente y severidad.
- **Desglose de Costos:** Tokens Input/Output por agente, costo total.
- **Botones de acción:**
  - **"Ver Hallazgos"**: Navega a Hallazgos SCR filtrado por este escaneo.
  - **"Descargar Reporte PDF"**: Genera y descarga el reporte ejecutivo del Fiscal Agent.
  - **"Descargar CSV"**: Descarga los hallazgos de este escaneo en CSV.
  - **"Comparar con otro escaneo"**: Abre el módulo de Comparación (ver sección 7.4).
  - **"Re-escanear"**: Pre-llena el Wizard del Nuevo Escaneo con la misma configuración de este escaneo.

### 7.4 Comparación de Escaneos

Al hacer clic en **"Comparar con otro escaneo"**, se abre una página de comparación de pantalla completa:
- **Selector del escaneo base** (pre-cargado con el escaneo desde el que se inició la comparación).
- **Selector del escaneo a comparar** (dropdown con todos los escaneos del mismo repositorio).
- **Candado de seguridad:** Solo usuarios con rol Coordinador o Admin pueden comparar escaneos de repositorios marcados como "Críticos".

**Vista de comparación (3 columnas):**
- Columna izquierda: Hallazgos del Escaneo Base (con chip "BASE").
- Columna central: Indicadores de cambio (✅ Resuelto / 🆕 Nuevo / ⚠️ Persistente).
- Columna derecha: Hallazgos del Escaneo a Comparar (con chip "COMPARAR").

**Resumen de la comparación (parte superior):**
- N hallazgos resueltos desde el escaneo base.
- N hallazgos nuevos introducidos.
- N hallazgos persistentes sin cambio.
- Variación de costo entre escaneos.

---

## 8. Ítem 7.5 — Investigación Forense

### 8.1 Comportamiento al hacer clic en el menú
Navega al módulo de Investigación Forense. Este módulo capitaliza toda la data histórica generada por el Detective Agent a través de todos los escaneos.

### 8.2 Estructura de la página

**Barra de búsqueda principal (prominente, al centro de la pantalla):**
Campo de texto con placeholder: "Buscar por usuario, repositorio, archivo, commit hash, patrón..." Botón "Buscar". Debajo de la barra, chips de búsqueda rápida: "Commits fuera de horario", "Nuevos autores en rutas críticas", "Cambios masivos", "Autores con más anomalías".

**Panel de filtros avanzados (colapsable, debajo de la barra):**

| Filtro | Tipo |
|---|---|
| Tipo de Evento | Multi-select: HIDDEN_COMMITS, TIMING_ANOMALIES, RAPID_SUCCESSION, CRITICAL_FILES, MASS_CHANGES, AUTHOR_ANOMALIES |
| Autor | Texto libre (busca por nombre o email del autor del commit) |
| Repositorio | Dropdown con búsqueda |
| Organización | Dropdown |
| Rango de Fechas | Selector de fechas (Desde / Hasta) |
| Nivel de Riesgo | Checkboxes: HIGH, MEDIUM |
| Solo Eventos sin Hallazgo Asociado | Toggle |

### 8.3 Resultados de la Búsqueda

Los resultados se muestran en una **tabla con dos vistas** (toggle en la barra de herramientas):

**Vista Tabla:**

| Columna | Descripción |
|---|---|
| Tipo de Evento | Chip de color con el patrón del Detective |
| Nivel | HIGH / MEDIUM |
| Autor | Nombre y email del autor del commit |
| Repositorio | Nombre del repositorio |
| Commit | Hash abreviado con enlace al commit en GitHub/GitLab |
| Archivo(s) Afectado(s) | Ruta(s) del archivo modificado |
| Fecha del Commit | Fecha y hora del commit |
| Hallazgo Asociado | ID del hallazgo SCR si el Inspector también detectó algo en el mismo commit |

Al hacer clic en una fila, se abre un **Panel Lateral (Drawer)** con el detalle completo del evento forense: descripción del patrón, fragmento del diff del commit, contexto del repositorio, y enlace al hallazgo SCR asociado (si existe).

**Vista Timeline:**

Línea de tiempo vertical ordenada cronológicamente. Cada evento es un nodo en la línea de tiempo con: ícono del tipo de patrón, autor, repositorio, descripción breve. Al hacer clic en un nodo, se expande para mostrar el detalle completo.

### 8.4 Casos de Uso Predefinidos (Búsquedas Rápidas)

Al hacer clic en los chips de búsqueda rápida, se pre-configuran los filtros automáticamente:

| Chip | Filtros que aplica |
|---|---|
| "Commits fuera de horario" | Tipo=TIMING_ANOMALIES, Rango=Últimos 90 días |
| "Nuevos autores en rutas críticas" | Tipo=AUTHOR_ANOMALIES, Rango=Últimos 30 días |
| "Cambios masivos" | Tipo=MASS_CHANGES, Rango=Últimos 90 días |
| "Autores con más anomalías" | Agrupa por Autor, ordena por conteo de eventos DESC |

---

## 9. Ítem 7.6 — Agentes

### 9.1 Comportamiento al hacer clic en el menú
Navega a la página de gestión de los 3 agentes IA del SCR.

### 9.2 Estructura de la página

La página tiene 3 tarjetas grandes, una por agente (Inspector, Detective, Fiscal), seguidas de una sección de estadísticas globales.

**Tarjeta de cada Agente:**
- **Encabezado:** Nombre del agente, ícono, descripción de su función.
- **Estatus:** Chip verde "Activo" o rojo "Inactivo" con toggle para activar/desactivar.
- **Estadísticas del agente** (período seleccionable):
  - Inspector: Archivos analizados, Hallazgos detectados, Tasa de falsos positivos, Tokens consumidos.
  - Detective: Commits analizados, Eventos forenses detectados, Patrones más frecuentes, Tokens consumidos.
  - Fiscal: Reportes generados, Tiempo promedio de generación, Tokens consumidos.
- **Botón "Configurar Prompts"**: Abre un drawer de configuración de prompts.

### 9.3 Drawer de Configuración de Prompts

Al hacer clic en "Configurar Prompts" de cualquier agente, se abre un **Panel Lateral (Drawer)** con:

**Pestañas:**
- **System Prompt:** Editor de texto enriquecido con el prompt del sistema. Muestra las variables de contexto disponibles como chips clicables (ej. `{{codigo_fuente}}`, `{{nombre_repositorio}}`, `{{historial_commits}}`). Al hacer clic en una variable, se inserta en la posición del cursor.
- **User Prompt:** Editor del prompt de usuario con las mismas variables disponibles.
- **Parámetros:** Sliders para Temperatura (0.0–1.0), Max Tokens (512–8192), Top P (0.0–1.0).

**Botones del Drawer:**
- **"Restaurar Defaults"**: Muestra un modal de confirmación. Si se confirma, restaura los prompts originales del sistema.
- **"Probar Prompt"**: Abre un sub-panel con un campo para pegar un fragmento de código de prueba. Al hacer clic en "Ejecutar Prueba", envía el prompt al LLM y muestra el resultado en tiempo real. Muestra también el conteo de tokens consumidos en la prueba.
- **"Guardar"**: Persiste los cambios. Muestra un toast de confirmación.

### 9.4 Sección: Biblioteca de Patrones

Debajo de las tarjetas de agentes, una sección con dos sub-tablas:

**Tabla A — Patrones del Inspector (10 patrones base):**

| Columna | Descripción |
|---|---|
| Patrón | Nombre del patrón (ej. LOGIC_BOMB) |
| Descripción | Descripción de la amenaza |
| Severidad Default | CRITICAL / HIGH / MEDIUM / LOW |
| Activo | Toggle para activar/desactivar el patrón |
| Falsos Positivos | Conteo histórico de FP para este patrón |

Al hacer clic en una fila, se abre un drawer con la descripción completa del patrón, ejemplos de código que lo disparan, y el historial de detecciones.

**Tabla B — Patrones del Detective (6 patrones base):**

Misma estructura que la Tabla A, con los 6 patrones forenses.

**Botón "Agregar Patrón Personalizado"** (solo Admin): Abre un drawer con campos para definir un nuevo patrón: Nombre, Descripción, Agente (Inspector/Detective), Severidad, Instrucción para el LLM (texto que se inyecta en el prompt para que el LLM busque este patrón específico).

---

## 10. Integración con Módulos Existentes

El módulo SCR reutiliza los siguientes componentes ya existentes en la plataforma:

| Componente Reutilizado | Módulo Origen | Cómo se reutiliza en SCR |
|---|---|---|
| **Gestión de Usuarios y Roles** | Administración → Pestaña 1 | Los roles existentes (Admin, Coordinador, Analista) aplican al SCR. Se agregan permisos específicos: "Ejecutar Escaneo", "Ver Hallazgos SCR", "Certificar Hallazgo SCR". |
| **Sistema de Alertas** | Módulo de Alertas | Se agregan reglas de alerta para SCR: "Notificar cuando se detecte un hallazgo CRITICAL", "Notificar cuando un escaneo falle", "Notificar cuando un hallazgo lleve más de X días sin movimiento". |
| **Centro de Notificaciones** | Notificaciones In-App | Las notificaciones del SCR (nuevo hallazgo asignado, cambio de estatus, escaneo completado) aparecen en el mismo centro de notificaciones de la plataforma. |
| **Audit Logs** | Administración → Pestaña 6 | Todas las acciones del SCR (iniciar escaneo, cambiar estatus de hallazgo, modificar prompts) quedan registradas en el Audit Log global. |
| **Exportación PDF/CSV/JSON** | Concentrado de Hallazgos | El mismo motor de exportación se usa para los reportes del SCR. |
| **Bitácora de Actualizaciones** | Concentrado de Hallazgos | El componente de bitácora conversacional (con @menciones) se reutiliza en el drawer de detalle de hallazgo SCR. |
| **Drawer Lateral (Panel de Detalle)** | Todos los módulos | El mismo componente de drawer deslizable se usa en Hallazgos SCR, Historial de Escaneos e Investigación Forense. |
| **Inventario de Activos** | Sección 2 | Los repositorios configurados en el Inventario de Activos aparecen como opciones en el selector de repositorios del Nuevo Escaneo (Modalidad B y C). |

---

## 11. Roadmap Futuro (Fases Posteriores al MVP)

Las siguientes funcionalidades están planificadas para versiones futuras del módulo SCR. Se documentan aquí para guiar las decisiones de arquitectura del MVP (ej. el modelo de datos debe soportar estas capacidades desde el inicio):

**1. Score de Riesgo por Repositorio (Risk Score)**
Implementación de una calificación única (0–100) por repositorio, calculada en base a: cantidad y severidad de hallazgos activos, reincidencia del mismo patrón en múltiples escaneos, criticidad del repositorio (configurada en Inventario de Activos), y tiempo promedio de remediación histórico. El score aparecerá en el Dashboard SCR, en el Inventario de Activos y en el Dashboard Ejecutivo global.

**2. Políticas de Escaneo Automático (Scan Policies)**
Capacidad de configurar políticas de escaneo recurrente o basado en eventos: "Escanear el repositorio X cada lunes a las 8am", "Escanear cuando se detecte un nuevo colaborador en la organización", "Escanear cualquier PR dirigido a la rama main". Las políticas se configurarán en Administración → Pestaña 8 (SCR) → Sub-pestaña "Políticas".

**3. Modo Diff / PR Analysis**
Integración en pipelines CI/CD para analizar únicamente el diff de un Pull Request. El SCR recibirá un webhook de GitHub/GitLab cuando se abra un PR, analizará solo los cambios del PR (no el repositorio completo), y publicará el resultado como un comentario en el PR. Si se detectan hallazgos CRITICAL, el sistema puede bloquear el merge automáticamente (configurable).

**4. Certificación de Repositorio (Repo Health Certificate)**
Una vez que todos los hallazgos activos de un repositorio han sido certificados, el sistema emitirá un "Certificado de Salud" con: fecha del último escaneo limpio, nombre del analista certificador, hash del último commit analizado, y firma digital. El certificado tendrá una vigencia configurable (ej. 30 días). Aparecerá en el Inventario de Activos como un badge de estado.

**5. Perfil de Riesgo por Autor (Contributor Risk Profile)**
Creación de un perfil histórico acumulado por autor de commits basado en todos los escaneos. El perfil incluirá: total de eventos forenses atribuidos, tasa de hallazgos por commit, patrones más frecuentes, y un score de riesgo individual. Este perfil será consultable desde la Investigación Forense y será utilizado por el Detective Agent como contexto adicional para ponderar la sospecha de nuevos commits.

**6. Correlación Multi-Repo (Cross-Repo Intelligence)**
Capacidad de detectar cuando el mismo fragmento de código sospechoso o el mismo patrón malicioso aparece en múltiples repositorios de la organización dentro de un período de tiempo. El Fiscal Agent generará una alerta especial de "Posible Ataque Coordinado" con la lista de repositorios afectados, los autores involucrados y la línea de tiempo del ataque.

**7. Análisis de Dependencias Maliciosas (Dependency Threat Intel)**
Enriquecimiento del patrón SUPPLY_CHAIN_ATTACK mediante el cruce de las dependencias declaradas en `package.json`, `requirements.txt`, `pom.xml`, `go.mod`, etc., contra bases de datos de inteligencia de amenazas (OSV, Socket.dev) para detectar paquetes que son malware disfrazado de librería legítima. Esta funcionalidad es distinta de la detección de CVEs (que es territorio de SCA) — se enfoca en paquetes maliciosos intencionales, no en vulnerabilidades conocidas.
