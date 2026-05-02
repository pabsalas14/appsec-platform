# Especificación de Construcción: Bloque 5 - Módulos Independientes

Este documento define a nivel de construcción los módulos operativos independientes de la plataforma AppSec: Iniciativas, Auditorías, Temas Emergentes y Planes de Remediación.

---

## 1. Catálogos Requeridos (Base de Datos)

Antes de construir las pantallas, deben existir los siguientes catálogos en el sistema:

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_EstatusIniciativa` | Propuesta, Aprobada, En Ejecución, Pausada, Finalizada, Cancelada | Controla el ciclo de vida de una iniciativa. |
| `Cat_EstatusAuditoria` | Planeada, En Curso, Hallazgos Emitidos, En Remediación, Cerrada | Controla el ciclo de vida de una auditoría. |
| `Cat_EstatusTemaEmergente` | Abierto, En Investigación, Mitigado, Resuelto | Controla el ciclo de vida de un tema emergente. |
| `Cat_EstatusPlanRemediacion` | Borrador, Activo, Vencido, Completado | Controla el ciclo de vida de un plan de remediación. |

---

## 2. Pantalla 1: Iniciativas Estratégicas

Gestiona proyectos especiales de AppSec que no son programas anuales recurrentes, pero que tienen peso en el desempeño del equipo.

**Ubicación en Menú:** `Gestión > Iniciativas`

### 2.1 Vista Principal (Tabla)
- **Componente:** DataGrid.
- **Columnas:** ID, Nombre de la Iniciativa, Líder, Fecha Inicio, Fecha Fin, Avance (%), Estatus.
- **Botón Principal:** `+ Nueva Iniciativa`.

### 2.2 Formulario de Captura (Drawer Lateral)
- **Campo 1: Nombre de la Iniciativa** (Text Input, Obligatorio).
- **Campo 2: Descripción y Objetivos** (Textarea, Obligatorio).
- **Campo 3: Líder de la Iniciativa** (Buscador Usuarios, Obligatorio).
- **Campo 4: Equipo Participante** (Multi-select Usuarios, Opcional).
- **Campo 5: Fechas (Inicio y Fin Estimado)** (Datepickers, Obligatorio).
- **Campo 6: Estatus** (Dropdown, lee de `Cat_EstatusIniciativa`, Obligatorio).

### 2.3 Pestaña de Actividades (Dentro del Detalle de la Iniciativa)
- **Componente:** Tabla Grid Editable.
- **Columnas:** Nombre de la Actividad, Responsable, Peso (%), Avance (%), Estatus.
- **Validación de Peso:** La suma de los pesos de todas las actividades debe ser exactamente 100%.
- **Cálculo Automático:** El `Avance (%)` general de la iniciativa se calcula sumando el `(Avance de la Actividad * Peso de la Actividad)` de todas las filas.

---

## 3. Pantalla 2: Auditorías Internas y Externas

Gestiona los requerimientos de información solicitados por auditores y el seguimiento a los hallazgos emitidos.

**Ubicación en Menú:** `Gestión > Auditorías`

### 3.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Nombre de la Auditoría** (Text Input, Obligatorio).
- **Campo 2: Ente Auditor** (Text Input, ej. "KPMG", "Auditoría Interna", Obligatorio).
- **Campo 3: Año / Periodo Evaluado** (Text Input, Obligatorio).
- **Campo 4: Analista AppSec Asignado** (Buscador Usuarios, Obligatorio).
- **Campo 5: Estatus** (Dropdown, lee de `Cat_EstatusAuditoria`, Obligatorio).

### 3.2 Pestaña de Requerimientos de Información
- **Componente:** Tabla Grid Editable.
- **Columnas:** Descripción del Requerimiento, Fecha Límite de Entrega, Responsable de Entregar, Estatus (Pendiente, Entregado), Evidencia (File Upload).

### 3.3 Pestaña de Hallazgos Emitidos
- **Componente:** Tabla Grid Editable.
- **Columnas:** Descripción del Hallazgo, Severidad, Fecha Compromiso de Remediación, Estatus (Abierto, Cerrado).
- **Botón:** `Vincular a Plan de Remediación` (Permite agrupar varios hallazgos en un plan formal).

---

## 4. Pantalla 3: Temas Emergentes (Incidentes / Zero-Days)

Gestiona la respuesta rápida a vulnerabilidades Zero-Day (ej. Log4j) o incidentes de seguridad que requieren atención inmediata fuera del flujo normal.

**Ubicación en Menú:** `Gestión > Temas Emergentes`

### 4.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Título del Tema / Incidente** (Text Input, Obligatorio).
- **Campo 2: Descripción Técnica** (Textarea, Obligatorio).
- **Campo 3: CVE Asociado** (Text Input, Opcional).
- **Campo 4: Severidad** (Dropdown, lee de `Cat_SeveridadVuln`, Obligatorio).
- **Campo 5: Estatus** (Dropdown, lee de `Cat_EstatusTemaEmergente`, Obligatorio).

### 4.2 Pestaña de Bitácora de Seguimiento
- **Componente:** Timeline / Chat.
- **Funcionalidad:** Permite a los analistas agregar notas de investigación, adjuntar archivos y registrar acciones tomadas con marca de tiempo y autor.

### 4.3 Pestaña de Activos Afectados
- **Componente:** Tabla Grid Editable.
- **Funcionalidad:** Permite buscar y vincular Repositorios o Activos Web del inventario que están confirmados como vulnerables a este tema emergente.

---

## 5. Pantalla 4: Planes de Remediación

Agrupa múltiples vulnerabilidades o hallazgos de auditoría bajo un solo plan de trabajo formal con fechas compromiso aprobadas por negocio.

**Ubicación en Menú:** `Gestión > Planes de Remediación`

### 5.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Nombre del Plan** (Text Input, Obligatorio).
- **Campo 2: Justificación / Contexto** (Textarea, Obligatorio).
- **Campo 3: Célula / Área Responsable** (Dropdown, lee de tabla Células, Obligatorio).
- **Campo 4: Fecha Compromiso Final** (Datepicker, Obligatorio).
- **Campo 5: Estatus** (Dropdown, lee de `Cat_EstatusPlanRemediacion`, Obligatorio).

### 5.2 Pestaña de Hallazgos Vinculados
- **Componente:** Tabla.
- **Botón:** `+ Agregar Hallazgos`.
  - **Acción:** Abre un modal con un buscador avanzado que permite filtrar la Tabla Unificada de Vulnerabilidades y la tabla de Hallazgos de Auditoría.
  - **Comportamiento:** Al seleccionar hallazgos y agregarlos, el estatus de esas vulnerabilidades en su tabla original cambia automáticamente a `En Remediación (Plan Activo)`.

### 5.3 Lógica de Cierre del Plan
- **Trigger:** Clic en botón `Cerrar Plan`.
- **Validación:** El sistema verifica que todos los hallazgos vinculados tengan estatus `Resuelto`.
- **Si falla:** Muestra Toast de error: "No se puede cerrar el plan. Existen hallazgos pendientes de remediación."
- **Si pasa:** Cambia el estatus del plan a `Completado` y registra la fecha de cierre.
