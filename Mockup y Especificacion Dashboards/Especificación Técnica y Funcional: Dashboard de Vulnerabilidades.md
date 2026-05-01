# Especificación Técnica y Funcional: Dashboard de Vulnerabilidades
**Plataforma AppSec — Banregio / Hey Banco / Regional Tecnología**
**Versión:** 1.0 | **Fecha:** Abril 2026 | **Clasificación:** Confidencial

---

## Tabla de Contenidos

1. [Descripción General y Principios de Diseño](#1-descripción-general-y-principios-de-diseño)
2. [Barra Superior (Topbar)](#2-barra-superior-topbar)
3. [Navegación por Niveles (Drill-Down)](#3-navegación-por-niveles-drill-down)
4. [Nivel 1 — Global](#4-nivel-1--global)
5. [Nivel 2 — Dirección](#5-nivel-2--dirección)
6. [Nivel 3 — Subdirección](#6-nivel-3--subdirección)
7. [Nivel 4 — Gerencia](#7-nivel-4--gerencia)
8. [Nivel 5 — Organización](#8-nivel-5--organización)
9. [Nivel 6 — Célula](#9-nivel-6--célula)
10. [Nivel 7 — Repositorio](#10-nivel-7--repositorio)
11. [Drawer de Detalle de Hallazgo](#11-drawer-de-detalle-de-hallazgo)
12. [Componentes Reutilizables](#12-componentes-reutilizables)
13. [Reglas de Negocio Transversales](#13-reglas-de-negocio-transversales)

---

## 1. Descripción General y Principios de Diseño

El Dashboard de Vulnerabilidades es la pantalla principal del módulo de Vulnerabilidades. Implementa un modelo de **drill-down jerárquico de 7 niveles** que permite al usuario navegar desde una vista global consolidada hasta el detalle técnico de un hallazgo individual en un repositorio específico.

La jerarquía de navegación es la siguiente:

| Nivel | Nombre | Descripción |
|---|---|---|
| 1 | **Global** | Vista consolidada de toda la organización |
| 2 | **Dirección** | Vista de una dirección corporativa |
| 3 | **Subdirección** | Vista de una subdirección dentro de una dirección |
| 4 | **Gerencia** | Vista de una gerencia dentro de una subdirección |
| 5 | **Organización** | Vista de una organización (equipo) dentro de una gerencia |
| 6 | **Célula** | Vista de una célula de desarrollo dentro de una organización |
| 7 | **Repositorio** | Vista de los hallazgos individuales de un repositorio |

**Principios de diseño:**

El dashboard utiliza un fondo oscuro (`#0d0f1a`) con tarjetas en `#141728` y bordes en `#252a45`. El color de acento principal es rojo-rosa (`#e8365d`). Cada nivel tiene un **layout diferente** que muestra información progresivamente más granular: los niveles superiores muestran tendencias y comparativas entre entidades hijas, mientras que los niveles inferiores muestran datos operativos detallados.

---

## 2. Barra Superior (Topbar)

La barra superior es **fija (sticky)** y permanece visible al hacer scroll. Contiene los siguientes elementos de izquierda a derecha:

### 2.1 Breadcrumb de Navegación

**Posición:** Extremo izquierdo de la topbar.

**Comportamiento:** Muestra la ruta de navegación completa desde el nivel Global hasta el nivel actual. Cada ítem del breadcrumb es un enlace clicable que permite saltar directamente a ese nivel sin necesidad de retroceder paso a paso.

**Formato visual:** Los ítems anteriores al nivel actual se muestran en color gris (`#6b7280`) y el ítem del nivel actual se muestra en blanco con peso 700. Los separadores entre ítems son el carácter `›` en color `#252a45`.

**Ejemplo de breadcrumb en nivel 7:**
```
Global › CORE-BANCARIO › Pagos y Transferencias › pagos-transferencias-api
```

**Interacción:** Al hacer clic en cualquier ítem del breadcrumb que no sea el actual, el dashboard navega directamente a ese nivel, descartando todos los niveles intermedios posteriores al seleccionado. La transición es instantánea sin animación de carga.

### 2.2 Selector de Rango de Fechas

**Posición:** Centro-derecha de la topbar, antes de los botones de acción.

**Apariencia:** Recuadro con fondo `#1c2035`, borde `#252a45`, ícono de calendario y texto con el rango activo (ej. `01 Ene 2025 — 31 Dic 2025`).

**Comportamiento:** Al hacer clic, se despliega un **date picker de rango** en formato modal flotante. El usuario selecciona fecha de inicio y fecha de fin. Al confirmar, todos los indicadores, gráficas y tablas del dashboard se recalculan automáticamente para el rango seleccionado. El rango seleccionado persiste mientras el usuario navega entre niveles del mismo dashboard.

**Rangos predefinidos disponibles en el picker:**
- Mes actual
- Mes anterior
- Trimestre actual
- Año actual
- Últimos 12 meses
- Rango personalizado

### 2.3 Botón de Filtros Globales

**Posición:** A la derecha del selector de fechas.

**Apariencia:** Botón con etiqueta `▼ Filtros Globales`, fondo `#1c2035`, borde `#252a45`.

**Comportamiento:** Al hacer clic, se abre un **drawer lateral** desde el lado derecho de la pantalla (ancho: 320px) con los siguientes filtros aplicables a todos los niveles:

| Filtro | Tipo de control | Opciones |
|---|---|---|
| Motor | Checkboxes múltiples | SAST, SCA, CDS, DAST, MDA, MAST |
| Severidad | Checkboxes múltiples | Crítica, Alta, Media, Baja |
| Estatus | Checkboxes múltiples | Activa, En Remediación, En Revisión, Solventada, Aceptada |
| SLA | Radio buttons | Todos, Vencido, En tiempo, Por vencer (≤7 días) |

Al aplicar filtros, todos los KPIs, gráficas y tablas del nivel actual se actualizan en tiempo real. Los filtros activos se muestran como **chips** debajo de la topbar. Cada chip tiene un botón `✕` para eliminarlo individualmente. Existe un botón `Limpiar todos` que elimina todos los filtros activos.

### 2.4 Botón de Opciones (⋯)

**Posición:** A la derecha del botón de Filtros Globales.

**Comportamiento:** Al hacer clic, se despliega un menú contextual con las siguientes opciones:
- **Exportar vista actual** — Genera un PDF del dashboard en el nivel actual con todos los componentes visibles.
- **Compartir enlace** — Copia al portapapeles una URL con el estado actual del dashboard (nivel, filtros y rango de fechas codificados en query params).
- **Configurar dashboard** — Redirige a la pantalla del Dashboard Builder para editar el layout del nivel actual.

### 2.5 Badge de Nivel

**Posición:** Extremo derecho de la topbar.

**Apariencia:** Pastilla con fondo `rgba(232,54,93,0.15)`, borde `rgba(232,54,93,0.3)` y texto en color acento.

**Contenido:** Muestra el nivel actual y el nombre del tipo de entidad. Ejemplo: `Nivel 3 / 7 — Subdirección`.

---

## 3. Navegación por Niveles (Drill-Down)

### 3.1 Mecanismo de Navegación

La navegación entre niveles se realiza exclusivamente mediante **clic en tarjetas de entidades hijas** (cards en la parte inferior de cada nivel). No existen botones de "Ver detalle" separados; el clic en la card completa activa la navegación.

Al hacer clic en una card, el sistema:
1. Guarda el estado del nivel actual en la pila de navegación (navStack).
2. Carga los datos del nivel siguiente para la entidad seleccionada.
3. Actualiza el breadcrumb con el nuevo nivel.
4. Actualiza el badge de nivel.
5. Renderiza el layout correspondiente al nuevo nivel.

La transición entre niveles no tiene animación de carga; el cambio es inmediato.

### 3.2 Navegación hacia Atrás

El usuario puede regresar al nivel anterior de tres formas:
- Haciendo clic en cualquier ítem del breadcrumb.
- Usando el botón de retroceso del navegador (el estado se mantiene en el historial del navegador).
- No existe botón de "Regresar" explícito en el dashboard.

### 3.3 Persistencia de Filtros

Los filtros globales (Motor, Severidad, Estatus, SLA) y el rango de fechas persisten al navegar entre niveles. Si el usuario aplica un filtro de Motor = SAST en el nivel Global y luego navega a una Dirección, el filtro sigue activo y los datos del nivel de Dirección se muestran filtrados por SAST.

---

## 4. Nivel 1 — Global

**Descripción:** Vista consolidada de todas las vulnerabilidades activas en toda la organización. Es la pantalla de inicio del dashboard.

### 4.1 Layout

El layout del nivel Global se organiza en **4 filas verticales**:

```
FILA 1: [SAST card] [SCA card] [CDS card] [DAST card] [MDA card] [MAST card] [Semáforo General]
FILA 2: [Gráfica de Tendencia Global — ancho completo]
FILA 3: [Indicadores de Pipeline Global — 2/3 ancho] [Top 3 Vulns Recurrentes — 1/3 ancho]
FILA 4: [Cards de Direcciones — grid 4 columnas]
```

### 4.2 Fila 1: Cards de Motores + Semáforo General

**Descripción:** 6 tarjetas de motores + 1 tarjeta de Semáforo General dispuestas en una cuadrícula de 7 columnas.

**Tarjeta de Motor (×6):**

Cada tarjeta de motor muestra:
- **Encabezado:** Ícono del motor (cuadrado redondeado con color único por motor) + Nombre del motor en texto.
- **Grid de 4 métricas:** Anterior | Actual | Solventadas | Nuevas — cada una con su etiqueta en 9px y valor en 14px bold.
- **Tendencia:** Texto en la parte inferior con flecha y porcentaje de cambio vs. mes anterior. Si el cambio es positivo (más vulnerabilidades), el texto es rojo con flecha ▲. Si es negativo (menos vulnerabilidades), el texto es verde con flecha ▼.

**Colores por motor:**

| Motor | Color del ícono | Color del chip |
|---|---|---|
| SAST | `#7c3aed` (violeta) | `rgba(124,58,237,0.15)` |
| SCA | `#10b981` (verde esmeralda) | `rgba(16,185,129,0.15)` |
| CDS | `#f59e0b` (ámbar) | `rgba(245,158,11,0.15)` |
| DAST | `#3b82f6` (azul) | `rgba(59,130,246,0.15)` |
| MDA | `#ec4899` (rosa) | `rgba(236,72,153,0.15)` |
| MAST | `#06b6d4` (cian) | `rgba(6,182,212,0.15)` |

**Interacción:** Al hacer clic en cualquier métrica numérica dentro de la tarjeta (Anterior, Actual, Solventadas, Nuevas), se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla con las vulnerabilidades correspondientes a ese motor y métrica.

**Tarjeta de Semáforo General:**

La tarjeta de Semáforo General ocupa la séptima columna de la fila 1. Muestra:
- Título `SEMÁFORO GENERAL` en 9px mayúsculas.
- Círculo de semáforo (48px) con color dinámico según el estado.
- Etiqueta del estado en 16px bold (ALTO / MEDIO / BAJO).
- Total de vulnerabilidades activas en 22px bold.
- Subtítulo `Vulnerabilidades activas` en 10px gris.
- Tendencia vs. mes anterior en 10px.

**Lógica del semáforo:**

| Estado | Color | Condición |
|---|---|---|
| ALTO | Rojo `#ef4444` con glow | Total > 5,000 vulnerabilidades activas |
| MEDIO | Amarillo `#eab308` con glow | Total entre 1,000 y 5,000 |
| BAJO | Verde `#22c55e` con glow | Total < 1,000 |

**Interacción:** Al hacer clic en el círculo del semáforo o en el número total, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla con todas las vulnerabilidades activas que componen ese número.

**Nota de diseño:** El Semáforo General aparece **una sola vez** en la Fila 1, integrado como la séptima tarjeta del grid de motores. No se repite en ninguna otra sección del nivel Global.

### 4.3 Fila 2: Gráfica de Tendencia Global

**Descripción:** Gráfica de líneas que muestra la evolución mensual de las vulnerabilidades durante el período seleccionado.

**Posición:** Ancho completo del área de contenido.

**Tipo de gráfica:** Line chart (Chart.js) con 4 series de datos:

| Serie | Color | Estilo |
|---|---|---|
| Activas | `#3b82f6` (azul) | Línea sólida |
| Solventadas | `#22c55e` (verde) | Línea sólida |
| Nuevas | `#f59e0b` (ámbar) | Línea sólida |
| Críticas + Altas | `#ef4444` (rojo) | Línea punteada |

**Eje X:** Meses del período seleccionado (etiquetas abreviadas: Ene, Feb, Mar...).
**Eje Y:** Número de vulnerabilidades.
**Altura:** 180px.
**Leyenda:** Posicionada en la parte superior de la gráfica, en una sola fila.

**Interacción:** Al pasar el cursor sobre la gráfica, se muestra un tooltip con los valores exactos de las 4 series para ese mes. Al hacer clic en cualquier punto de la gráfica, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla de vulnerabilidades correspondientes a ese mes y a la serie seleccionada (ej. clic en el punto de "Nuevas" de Marzo muestra todas las vulnerabilidades nuevas detectadas en Marzo).

### 4.4 Fila 3: Indicadores de Pipeline + Top Vulnerabilidades

**Descripción:** Dos tarjetas en proporción 2:1.

**Tarjeta de Indicadores de Pipeline (2/3 del ancho):**

Muestra 4 métricas en una cuadrícula de 4 columnas:
- **Total escaneos del mes:** Número grande en blanco.
- **Escaneos aprobados:** Número en verde con porcentaje entre paréntesis.
- **Escaneos rechazados:** Número en rojo con porcentaje entre paréntesis.
- **% de aprobación global:** Gauge semicircular (doughnut chart de 180°) con el porcentaje en grande a su derecha. El color del gauge es verde si ≥70%, amarillo si entre 50-69%, rojo si <50%.

**Interacción:** Al hacer clic en cualquiera de las métricas numéricas o en el gauge, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla con el detalle de los escaneos correspondientes (ej. clic en "Escaneos rechazados" muestra la lista de todos los pipelines que fallaron por vulnerabilidades).

**Tarjeta de Top 3 Vulnerabilidades Recurrentes (1/3 del ancho):**

Lista de las 3 vulnerabilidades más frecuentes en los rechazos de pipeline. Cada ítem muestra:
- Número de posición en gris.
- Nombre de la vulnerabilidad.
- Conteo total en color acento (`#e8365d`).

Los ítems están separados por una línea divisoria.

**Interacción:** Al hacer clic en cualquier ítem de la lista, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla con todos los hallazgos de esa vulnerabilidad específica.

### 4.5 Fila 4: Cards de Direcciones

**Descripción:** Grid de 4 columnas con una tarjeta por cada Dirección de la organización.

**Contenido de cada tarjeta:**
- **Nombre de la Dirección** en 13px bold.
- **Total de vulnerabilidades activas** en 24px bold.
- **Etiqueta** `Vulnerabilidades activas` en 10px gris.
- **Chips de motores:** 6 chips (SAST, SCA, CDS, DAST, MDA, MAST) con el conteo de cada motor. Cada chip tiene el color de fondo correspondiente al motor.
- **Indicadores de Pipeline:** Dos valores en la parte inferior: Aprobados (verde) y Rechazados (rojo) con sus porcentajes.

**Interacción:** Al hacer clic en cualquier parte de la tarjeta (no solo en el nombre), el dashboard navega al **Nivel 2 — Dirección** para esa entidad. Al pasar el cursor sobre la tarjeta, el borde cambia a color acento (`#e8365d`) y la tarjeta sube 2px (transform translateY(-2px)) con una sombra de color acento.

---

## 5. Nivel 2 — Dirección

**Descripción:** Vista de las vulnerabilidades de una dirección específica, con desglose por subdirecciones.

### 5.1 Layout

```
FILA 1: [SAST card] [SCA card] [CDS card] [DAST card] [MDA card] [MAST card] [Semáforo Dirección]
FILA 2: [Gráfica de Tendencia Mensual — 2/3 ancho] [Top 3 Vulns — 1/3 ancho]
FILA 3: [Cards de Subdirecciones — grid 4 columnas]
```

### 5.2 Diferencias respecto al Nivel 1

- El título de la Fila 1 cambia a `INDICADORES POR MOTOR (NOMBRE_DIRECCIÓN)`.
- El Semáforo en la séptima columna muestra el estado de la Dirección, no el global.
- La gráfica de tendencia es mensual (no anual) y muestra datos de la dirección seleccionada.
- No hay sección de Indicadores de Pipeline en esta fila; el pipeline se mueve a la Fila 2 dentro de la tarjeta de tendencia.
- Las cards de la Fila 3 muestran Subdirecciones en lugar de Direcciones.

---

## 6. Nivel 3 — Subdirección

**Descripción:** Vista de las vulnerabilidades de una subdirección, con análisis de IA y desglose por gerencias.

### 6.1 Layout

```
FILA 1: [SAST card] [SCA card] [CDS card] [DAST card] [MDA card] [MAST card]
FILA 2: [Indicadores de Pipeline — 1/2 ancho] [Análisis IA — 1/2 ancho]
FILA 3: [Gráfica de Tendencia Mensual — 2/3 ancho] [Top 3 Vulns — 1/3 ancho]
FILA 4: [Cards de Gerencias — grid 4 columnas]
```

### 6.2 Diferencias respecto al Nivel 2

- **Aparece el Análisis IA** en la Fila 2. El panel de IA muestra un análisis en texto generado automáticamente con el contexto de la subdirección y una recomendación de acción.
- Los 6 motores se muestran en una cuadrícula de 6 columnas **sin el Semáforo** (el semáforo solo aparece en los niveles 1 y 2).
- Las cards de la Fila 4 muestran Gerencias.

### 6.3 Panel de Análisis IA

**Posición:** Mitad derecha de la Fila 2, junto a los Indicadores de Pipeline.

**Apariencia:** Tarjeta con gradiente de fondo `linear-gradient(135deg, rgba(124,58,237,0.1), rgba(232,54,93,0.1))` y borde `rgba(124,58,237,0.3)`.

**Contenido:**
- Encabezado con ícono de robot, texto `ANÁLISIS IA` y badge `GPT-4`.
- Párrafo de análisis en 12px con altura de línea 1.7.
- Bloque de recomendación con borde izquierdo en color acento y fondo `rgba(232,54,93,0.1)`.

**Comportamiento:** El análisis se genera automáticamente al cargar el nivel. No requiere acción del usuario. El texto es generado por el modelo de IA configurado en el AI Builder y tiene acceso al contexto de la subdirección (nombre, totales por motor, tendencia del mes).

---

## 7. Nivel 4 — Gerencia

**Descripción:** Vista de las vulnerabilidades de una gerencia, con desglose por organizaciones.

### 7.1 Layout

```
FILA 1: [SAST card] [SCA card] [CDS card] [DAST card] [MDA card] [MAST card]
FILA 2: [Indicadores de Pipeline — 1/2 ancho] [Análisis IA — 1/2 ancho]
FILA 3: [Cards de Organizaciones — grid 4 columnas]
```

### 7.2 Diferencias respecto al Nivel 3

- La gráfica de tendencia mensual **no aparece** en este nivel para mantener la vista compacta.
- Las cards de la Fila 3 muestran Organizaciones.

---

## 8. Nivel 5 — Organización

**Descripción:** Vista de las vulnerabilidades de una organización (equipo), con desglose por células.

### 8.1 Layout

```
FILA 1: [SAST card] [SCA card] [CDS card] [DAST card] [MDA card] [MAST card]
FILA 2: [Indicadores de Pipeline — 1/2 ancho] [Análisis IA — 1/2 ancho]
FILA 3: [Cards de Células — grid 4 columnas]
```

El layout es idéntico al Nivel 4. Las cards de la Fila 3 muestran Células.

---

## 9. Nivel 6 — Célula

**Descripción:** Vista operativa de una célula de desarrollo. Muestra el estado del pipeline de CI/CD y la lista de repositorios con sus métricas de seguridad.

### 9.1 Layout

```
FILA 1: [Resumen del Pipeline — 1/2 ancho] [Tendencia de Escaneos — 1/2 ancho]
FILA 2: [Tabla de Repositorios — ancho completo]
```

### 9.2 Fila 1: Resumen del Pipeline

**Tarjeta izquierda — Resumen del Pipeline:**

Muestra 4 métricas en una cuadrícula de 4 columnas:
- **Escaneos aprobados:** Gauge semicircular (doughnut 180°) en verde + número + porcentaje.
- **Escaneos rechazados:** Gauge semicircular en rojo + número + porcentaje.
- **Total escaneos del mes:** Número grande en blanco.
- **Vulns detectadas en pipeline:** Número grande en color acento.

**Tarjeta derecha — Tendencia de Escaneos:**

Gráfica de barras agrupadas (Chart.js) con dos series:
- Aprobados: barras verdes `rgba(34,197,94,0.7)`.
- Rechazados: barras rojas `rgba(239,68,68,0.7)`.

Eje X: meses del período seleccionado. Altura: 140px.

### 9.3 Fila 2: Tabla de Repositorios

**Encabezado de la tabla:**
- Título `REPOSITORIOS` en 13px bold.
- Botón `Importar Escaneo` que abre un modal de importación.
- Botón `Exportar` que descarga la tabla en formato Excel.

**Columnas de la tabla:**

| Columna | Tipo | Descripción |
|---|---|---|
| Repositorio | Texto monospace | Nombre del repositorio |
| Vulns Críticas | Número | Conteo en rojo bold |
| Vulns Altas | Número | Conteo en naranja bold |
| Score de Madurez | Barra de progreso + % | Verde si ≥75%, amarillo si 60-74%, rojo si <60% |
| SLA Vencido | Dot + texto | Dot rojo con "Sí" si hay SLA vencido, dot verde con "No" si no |
| Último Escaneo | Texto relativo | Ej. "Hace 2 horas" |
| (Acción) | Ícono `›` | Indica que la fila es clicable |

**Interacción:** Al hacer clic en cualquier fila de la tabla, el dashboard navega al **Nivel 7 — Repositorio** para ese repositorio. El cursor cambia a `pointer` al pasar sobre las filas. Al hacer hover, el fondo de la fila cambia a `#1c2035`.

**Ordenamiento:** Todas las columnas son ordenables haciendo clic en el encabezado. El ordenamiento por defecto es por Vulns Críticas descendente.

---

## 10. Nivel 7 — Repositorio

**Descripción:** Vista más granular del dashboard. Muestra todos los hallazgos individuales de un repositorio específico con capacidad de filtrado, selección masiva y acceso al detalle técnico de cada hallazgo.

### 10.1 Layout

```
FILA 1: [Total Hallazgos] [Críticas] [Altas] [Medias] [Bajas] [SLA Vencido]  ← 6 KPI cards
FILA 2: [Info del Repositorio — 1/2 ancho] [Distribución por Motor — 1/2 ancho]
FILA 3: [Tabla de Hallazgos — ancho completo]
```

### 10.2 Fila 1: KPI Cards de Severidad

**6 tarjetas** en una cuadrícula de 6 columnas iguales. Cada tarjeta tiene:
- Etiqueta en 10px mayúsculas gris.
- Número en 28px bold.
- Subtítulo opcional (ej. "Acción inmediata" en rojo para Críticas, "Urgente" en rojo para SLA Vencido).
- Borde superior de 3px con el color de la severidad correspondiente.

| Tarjeta | Color del borde | Color del número |
|---|---|---|
| Total Hallazgos | Sin borde especial | Blanco |
| Críticas | `#ef4444` | `#ef4444` |
| Altas | `#f97316` | `#f97316` |
| Medias | `#eab308` | `#eab308` |
| Bajas | `#22c55e` | `#22c55e` |
| SLA Vencido | `#7c3aed` | `#ef4444` |

**Interacción:** Al hacer clic en cualquiera de las 6 tarjetas KPI, la tabla de hallazgos (Fila 3) se filtra automáticamente para mostrar solo los registros correspondientes a esa tarjeta (ej. clic en "Críticas" aplica el filtro de Severidad = Crítica).

### 10.3 Fila 2: Info del Repositorio + Distribución por Motor

**Tarjeta izquierda — Información del Repositorio:**

Grid de 2×2 con 4 campos:
- **NOMBRE:** Nombre del repositorio en fuente monospace.
- **TECNOLOGÍA:** Stack tecnológico (ej. Java / Spring Boot).
- **ÚLTIMO ESCANEO:** Tiempo relativo (ej. Hace 2 horas).
- **BRANCH:** Branch del último escaneo en fuente monospace.

**Tarjeta derecha — Distribución por Motor:**

Gráfica de donut (doughnut chart) con los colores de cada motor + leyenda lateral con barras de progreso y conteo por motor.

**Interacción:** Al hacer clic en cualquier segmento del donut o en la leyenda, la tabla de hallazgos (Fila 3) se filtra automáticamente para mostrar solo los registros de ese motor.

### 10.4 Fila 3: Tabla de Hallazgos

#### 10.4.1 Barra de Filtros

**Posición:** Dentro del encabezado de la tabla, debajo del título y los botones de acción. Ocupa el ancho completo del encabezado.

**Apariencia:** Fondo `#1c2035`, borde `#252a45`, border-radius 8px, padding 10px 14px.

**Controles de filtro:**

| Filtro | Tipo | Opciones |
|---|---|---|
| Motor | Select dropdown | Todos los Motores / SAST / SCA / DAST / CDS / MAST |
| Severidad | Select dropdown | Todas las Severidades / Crítica / Alta / Media / Baja |
| Estatus | Select dropdown | Todos los Estatus / Activa / En Remediación / En Revisión / Solventada |
| SLA | Select dropdown | SLA: Todos / Vencido / En tiempo |
| Búsqueda | Input de texto | Placeholder: "Buscar por ID, nombre o archivo..." |

**Comportamiento:** Los filtros son reactivos; al cambiar cualquier valor, la tabla se filtra instantáneamente sin necesidad de presionar un botón de "Aplicar". La búsqueda de texto filtra por ID, nombre del hallazgo y ruta del archivo simultáneamente.

#### 10.4.2 Botones de Acción de la Tabla

**Posición:** Extremo derecho del encabezado de la tabla.

- **Botón `🤖 Analizar con IA`:** Al hacer clic, abre un modal que muestra un análisis generado por IA de todos los hallazgos visibles en la tabla (con los filtros activos). El análisis incluye patrones detectados, causas raíz probables y un plan de remediación priorizado.

- **Botón `Exportar`:** Al hacer clic, se despliega un menú con las opciones: Exportar como Excel, Exportar como CSV, Exportar como PDF. La exportación incluye todos los registros que coincidan con los filtros activos.

#### 10.4.3 Columnas de la Tabla

| Columna | Tipo | Descripción |
|---|---|---|
| Checkbox | Checkbox | Permite selección individual o masiva (checkbox en encabezado selecciona todos) |
| ID | Texto monospace gris | Identificador único del hallazgo (ej. SAST-0042) |
| Motor | Chip de color | Chip con color del motor correspondiente |
| Severidad | Chip de color | Chip con color de la severidad |
| Hallazgo | Texto bold | Nombre descriptivo de la vulnerabilidad |
| Archivo / Endpoint | Texto monospace gris | Ruta del archivo o URL del endpoint afectado |
| SLA | Dot + texto | Dot de color + días restantes (negativo si vencido) |
| Estatus | Texto gris | Estado actual del hallazgo |
| (Acción) | Ícono `›` | Indica que la fila abre el drawer de detalle |

#### 10.4.4 Acciones Masivas

Cuando el usuario selecciona uno o más checkboxes, aparece una **barra de acciones masivas** flotante en la parte inferior de la pantalla con las siguientes opciones:
- `Cambiar Estatus` — Abre un select para cambiar el estatus de todos los seleccionados.
- `Reasignar Responsable` — Abre un buscador de usuarios.
- `Exportar Selección` — Exporta solo los registros seleccionados.
- `X seleccionados` — Contador de registros seleccionados con botón `✕` para deseleccionar todos.

#### 10.4.5 Ordenamiento

Todas las columnas son ordenables. El ordenamiento por defecto es: Severidad descendente (Crítica primero), luego SLA ascendente (más urgente primero).

**Interacción con filas:** Al hacer clic en cualquier fila (excepto en el checkbox), se abre el **Drawer de Detalle de Hallazgo** desde el lado derecho de la pantalla.

---

## 11. Drawer de Detalle de Hallazgo

**Descripción:** Panel lateral deslizable que muestra el detalle técnico completo de un hallazgo individual.

**Posición:** Se desliza desde el borde derecho de la pantalla. Ancho: 460px. Ocupa el 100% de la altura de la ventana. El contenido del dashboard detrás del drawer sigue siendo visible pero oscurecido con un overlay `rgba(0,0,0,0.4)`.

**Apertura:** Al hacer clic en cualquier fila de la tabla de hallazgos del Nivel 7.

**Cierre:** Al hacer clic en el botón `✕ Cerrar` en la parte superior del drawer, o al hacer clic en el overlay oscuro fuera del drawer.

### 11.1 Contenido del Drawer

**Sección 1 — Identificación:**
- Chips de Severidad, Motor y Estatus en la parte superior.
- Nombre del hallazgo en 15px bold.
- Ruta del archivo en fuente monospace gris.

**Sección 2 — Métricas Clave:**
Grid de 2 columnas con:
- **CVSS Score:** Puntuación numérica y etiqueta de severidad en el color correspondiente.
- **SLA:** Dot de color + días restantes o vencidos.

**Sección 3 — Evidencia:**
Bloque de código con fondo `#0d0f1a`, borde `#252a45` y texto en color violeta claro (`#a78bfa`). Muestra el fragmento de código relevante donde se detectó la vulnerabilidad.

**Sección 4 — Recomendación:**
Bloque con borde izquierdo en color acento y fondo `rgba(232,54,93,0.06)`. Contiene la recomendación de remediación en texto.

**Sección 5 — Botones de Acción:**
Dos botones en proporción 1:1:
- `✓ Cambiar Estatus` — Abre un select inline para cambiar el estatus del hallazgo.
- `🤖 Analizar con IA` — Genera un análisis detallado del hallazgo específico con sugerencias de código de remediación.

**Sección 6 — Bitácora:**
Lista de comentarios y cambios de estatus ordenados cronológicamente (más reciente primero). Cada entrada muestra:
- Avatar del usuario (iniciales en círculo de color acento).
- Nombre del usuario y tiempo relativo.
- Texto del comentario o descripción del cambio.

Al final de la lista hay un campo de texto para agregar un nuevo comentario y un botón `Enviar`.

---

## 12. Componentes Reutilizables

### 12.1 Tarjeta de Motor

Componente reutilizado en los niveles 1, 2, 3, 4 y 5. Siempre muestra las mismas 4 métricas (Anterior, Actual, Solventadas, Nuevas) con el mismo layout.

**Interacción universal:** Al hacer clic en cualquier métrica numérica dentro de la tarjeta, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla con las vulnerabilidades correspondientes a ese motor y métrica en el contexto del nivel actual.

### 12.2 Gauge Semicircular

Componente de doughnut chart con `rotation: -90` y `circumference: 180` (semicírculo). Usado en los Indicadores de Pipeline de los niveles 1, 3, 4 y 5. El color cambia dinámicamente según el porcentaje.

**Interacción universal:** Al hacer clic en el gauge o en su porcentaje, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla con el detalle de los escaneos correspondientes en el contexto del nivel actual.

### 12.3 Card de Entidad Hija

Componente reutilizado en los niveles 1 al 6 para mostrar las entidades del siguiente nivel. Siempre muestra: nombre, total, chips de motores y datos de pipeline. El comportamiento de hover y clic es idéntico en todos los niveles.

### 12.4 Gráfica de Tendencia Mensual

Componente de line chart reutilizado en los niveles 1, 2 y 3. Muestra la evolución mensual de las vulnerabilidades.

**Interacción universal:** Al hacer clic en cualquier punto de la gráfica, se abre el **Panel de Drill-down** (drawer lateral) mostrando la tabla de vulnerabilidades correspondientes a ese mes y a la serie seleccionada en el contexto del nivel actual.

### 12.5 Dot de SLA

Indicador visual de 8px de diámetro con glow effect. Tres estados:
- **Rojo** (`#ef4444`): SLA vencido.
- **Amarillo** (`#eab308`): SLA por vencer en ≤7 días.
- **Verde** (`#22c55e`): SLA en tiempo.

---

## 13. Reglas de Negocio Transversales

### 13.1 Cálculo del Semáforo General

El semáforo se recalcula en tiempo real cada vez que cambian los filtros o el rango de fechas. Toma como base el total de vulnerabilidades activas del nivel actual (no el global).

### 13.2 Cálculo del Score de Madurez

El Score de Madurez de un repositorio se calcula como:

```
Score = 100 - ((Críticas × 10) + (Altas × 3) + (Medias × 1)) / Total_Hallazgos × 100
```

El score se normaliza entre 0 y 100. Un score de 0 indica que el repositorio tiene únicamente hallazgos críticos. Un score de 100 indica que no tiene hallazgos activos.

### 13.3 Cálculo del SLA

El SLA de un hallazgo se calcula a partir de la fecha de detección más el plazo definido por severidad:

| Severidad | Plazo de SLA |
|---|---|
| Crítica | 7 días calendario |
| Alta | 30 días calendario |
| Media | 60 días calendario |
| Baja | 90 días calendario |

Los días mostrados en la columna SLA son días restantes (positivo) o días vencidos (negativo). El dot cambia a rojo cuando los días son negativos.

### 13.4 Datos en Tiempo Real vs. Caché

Los KPIs de los niveles 1 al 5 se actualizan cada 15 minutos mediante polling. Los datos del nivel 6 (Célula) y nivel 7 (Repositorio) se actualizan en tiempo real al cargar la vista. Al importar un nuevo escaneo, los datos del repositorio y su célula se actualizan inmediatamente; los niveles superiores se actualizan en el siguiente ciclo de 15 minutos.

### 13.5 Permisos de Visibilidad

| Rol | Acceso al dashboard |
|---|---|
| Admin | Todos los niveles (1–7) de toda la organización |
| Jefe de AppSec | Todos los niveles (1–7) de toda la organización |
| Coordinador | Niveles 1–7, pero solo las entidades de su dirección/subdirección |
| Analista | Solo niveles 6–7 (Célula y Repositorio) de su célula asignada |

Si un usuario intenta navegar a un nivel o entidad para la que no tiene permisos, se muestra un estado de error con el mensaje `No tienes permisos para ver esta entidad` y un botón para regresar al último nivel permitido.
