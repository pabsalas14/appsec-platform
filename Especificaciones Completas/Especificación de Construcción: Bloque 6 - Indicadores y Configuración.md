# Especificación de Construcción: Bloque 6 - Indicadores y Configuración

Este documento define a nivel de construcción los módulos transversales y de administración de la plataforma AppSec: Captura de Indicadores (KPIs), Gestión de Usuarios, Roles y Permisos, Log de Auditoría y Configuración Avanzada.

---

## 1. Catálogos Requeridos (Base de Datos)

Antes de construir las pantallas, deben existir los siguientes catálogos en el sistema:

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_FrecuenciaKPI` | Mensual, Trimestral, Semestral, Anual | Define cada cuánto se debe capturar un indicador. |
| `Cat_TipoDatoKPI` | Porcentaje, Número Entero, Moneda, Decimal | Define el formato de captura y visualización del KPI. |
| `Cat_SentidoKPI` | Ascendente (Más es mejor), Descendente (Menos es mejor) | Define cómo se evalúa el cumplimiento de la meta. |
| `Cat_RolSistema` | Super Admin, CISO, Director, Gerente, Analista AppSec, Auditor, Solo Lectura | Define el nivel de acceso base del usuario. |

---

## 2. Pantalla 1: Configuración y Captura de Indicadores (KPIs)

Este módulo permite definir los KPIs que alimentan el Dashboard Ejecutivo y capturar sus valores manualmente cuando no provienen de una fuente automatizada.

**Ubicación en Menú:** `Configuración > Indicadores (KPIs)`

### 2.1 Pestaña: Definición de KPIs (Administrador)
- **Componente:** DataGrid.
- **Botón Principal:** `+ Nuevo KPI`.
- **Formulario de Definición (Drawer Lateral):**
  - **Campo 1: Nombre del Indicador** (Text Input, Obligatorio).
  - **Campo 2: Descripción / Fórmula** (Textarea, Obligatorio).
  - **Campo 3: Tipo de Dato** (Dropdown, lee de `Cat_TipoDatoKPI`, Obligatorio).
  - **Campo 4: Sentido de Medición** (Dropdown, lee de `Cat_SentidoKPI`, Obligatorio).
  - **Campo 5: Frecuencia de Medición** (Dropdown, lee de `Cat_FrecuenciaKPI`, Obligatorio).
  - **Campo 6: Meta Objetivo (Target)** (Number Input, Obligatorio).
  - **Campo 7: Umbral de Riesgo (Warning)** (Number Input, Obligatorio).
  - **Campo 8: Responsable de Captura** (Buscador Usuarios, Obligatorio).

### 2.2 Pestaña: Captura de Valores (Vista del Responsable)
- **Componente:** Tabla Grid Editable.
- **Filtro Superior:** Periodo (Mes/Año).
- **Columnas:** Nombre del Indicador, Meta, Valor Capturado, Estatus (Calculado), Evidencia.
- **Lógica de Captura:**
  - El usuario ingresa el `Valor Capturado` (Number Input).
  - El sistema calcula el `Estatus` en tiempo real comparando el valor contra la Meta y el Umbral, respetando el `Sentido de Medición`.
    - *Ejemplo Ascendente:* Si Meta=90 y Valor=95 -> Verde. Si Valor=85 (entre Umbral y Meta) -> Amarillo. Si Valor=70 -> Rojo.
  - **Campo Evidencia:** File Upload (Obligatorio si el estatus es Verde o Rojo).
- **Botón: Guardar Valores del Periodo**
  - **Acción:** Congela los valores capturados para el periodo seleccionado y actualiza las gráficas del Dashboard Ejecutivo.

---

## 3. Pantalla 2: Gestión de Usuarios

**Ubicación en Menú:** `Administración > Usuarios`

### 3.1 Vista Principal (Tabla)
- **Columnas:** Nombre, Correo, Rol Principal, Célula Asignada, Último Acceso, Estatus (Activo/Inactivo).
- **Botón Principal:** `+ Nuevo Usuario`.

### 3.2 Formulario de Captura (Drawer Lateral)
- **Campo 1: Nombre Completo** (Text Input, Obligatorio).
- **Campo 2: Correo Electrónico Corporativo** (Text Input, Obligatorio, Validación de formato email).
- **Campo 3: Rol Principal** (Dropdown, lee de `Cat_RolSistema`, Obligatorio).
- **Campo 4: Célula Asignada**
  - Tipo: Dropdown (Apunta a la tabla de Células).
  - Obligatorio: No (Solo aplica para roles operativos).
  - Comportamiento: Si se asigna una célula, el usuario hereda automáticamente acceso a los repositorios y activos web de esa célula.
- **Campo 5: Estatus** (Toggle: Activo / Inactivo).

---

## 4. Pantalla 3: Matriz de Roles y Permisos (Segregación Granular)

Este módulo permite a los Super Admins afinar qué puede hacer cada rol en cada pantalla del sistema.

**Ubicación en Menú:** `Administración > Roles y Permisos`

### 4.1 Vista Principal (Matriz Interactiva)
- **Componente:** Tabla Matriz (Filas = Módulos/Pantallas, Columnas = Roles).
- **Interacción:** Cada celda de intersección contiene 4 checkboxes: `Crear`, `Leer`, `Actualizar`, `Eliminar` (CRUD).
- **Lógica de Guardado:**
  - **Trigger:** Clic en botón `Guardar Matriz`.
  - **Acción:** Actualiza la tabla de permisos en base de datos. Los cambios aplican inmediatamente en la siguiente navegación de los usuarios afectados (el frontend re-evalúa los permisos para mostrar/ocultar botones y menús).

### 4.2 Permisos Especiales (Toggles adicionales por Rol)
Debajo de la matriz, al seleccionar un Rol específico, aparecen permisos de negocio:
- `Puede aprobar Excepciones de Vulnerabilidades` (Toggle).
- `Puede cerrar Planes de Remediación` (Toggle).
- `Puede modificar Metas de KPIs` (Toggle).
- `Puede acceder al Log de Auditoría` (Toggle).

---

## 5. Pantalla 4: Log de Auditoría del Sistema (Audit Trail)

Registra todas las acciones críticas realizadas por los usuarios en la plataforma para cumplimiento normativo.

**Ubicación en Menú:** `Administración > Log de Auditoría`

### 5.1 Vista Principal (Tabla de Solo Lectura)
- **Componente:** DataGrid (Estrictamente de solo lectura, sin botones de edición ni eliminación).
- **Columnas:**
  - Timestamp (Fecha y hora exacta).
  - Usuario (Quién realizó la acción).
  - Acción (Ej. `UPDATE`, `DELETE`, `LOGIN`, `EXPORT`).
  - Módulo (Ej. `Vulnerabilidades`, `Usuarios`, `Roles`).
  - Detalle (Texto JSON con el valor anterior y el valor nuevo).
  - Dirección IP.
- **Filtros:** Rango de fechas, Usuario, Módulo, Acción.
- **Botón:** `Exportar Log (CSV/PDF)` (Genera un reporte inmutable con firma digital del sistema).

---

## 6. Pantalla 5: Configuración Avanzada (SLAs y Notificaciones)

**Ubicación en Menú:** `Administración > Configuración Avanzada`

### 6.1 Pestaña: SLAs de Remediación
- **Componente:** Tabla Grid Editable.
- **Columnas:** Severidad (Crítica, Alta, Media, Baja), Días para Remediación SAST, Días para Remediación DAST, Días para Remediación SCA.
- **Lógica:** Estos valores se usan en el Módulo 2 (Vulnerabilidades) para calcular automáticamente la `Fecha Vencimiento SLA` al momento de crear o importar un hallazgo.

### 6.2 Pestaña: Reglas de Notificación
- **Componente:** Lista de reglas configurables.
- **Ejemplo de Regla:**
  - Evento: `Vulnerabilidad Crítica Nueva`.
  - Acción: `Enviar Correo` y `Notificación In-App`.
  - Destinatarios: `Responsable de la Célula` y `CISO`.
- **Botón:** `Guardar Reglas`.
