# Especificación Funcional y Técnica: Dashboard Kanban de Liberaciones

**Versión:** 1.0  
**Módulo:** Operación › Kanban de Liberaciones  
**Acceso:** Analista AppSec, Coordinador, Jefe de AppSec

---

## 1. Propósito

Proveer una vista operativa y ágil (tipo tablero Kanban) para que el equipo de AppSec gestione el flujo diario de revisiones de seguridad de liberaciones a producción. Permite visualizar rápidamente los cuellos de botella, reasignar cargas de trabajo mediante Drag & Drop, y gestionar el ciclo de vida de cada solicitud desde que ingresa hasta que se aprueba o rechaza.

---

## 2. Estructura General de la Pantalla

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: Breadcrumb | Mes Activo | Vista Lista/Kanban | + Nueva  │
├─────────────────────────────────────────────────────────────────┤
│ FILTER BAR: Búsqueda | Chips de Motor | Célula | Responsable    │
├─────────────────────────────────────────────────────────────────┤
│ KANBAN BOARD (Scroll horizontal si es necesario):               │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │
│ │ Pendiente (5)│ │ En Revisión(3)│ │ Aprobado (12)│ │ Rechazado│ │
│ ├──────────────┤ ├──────────────┤ ├──────────────┤ ├──────────┤ │
│ │ [Tarjeta 1]  │ │ [Tarjeta 6]  │ │ [Tarjeta 9]  │ │ [Tarj 15]│ │
│ │ [Tarjeta 2]  │ │ [Tarjeta 7]  │ │ [Tarjeta 10] │ │          │ │
│ │ [Tarjeta 3]  │ │ [Tarjeta 8]  │ │ [Tarjeta 11] │ │          │ │
│ │ [Tarjeta 4]  │ │              │ │ [Tarjeta 12] │ │          │ │
│ │ [Tarjeta 5]  │ │              │ │              │ │          │ │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Componentes Detallados

### 3.1 Topbar y Filtros
- **Mes Activo:** Dropdown para seleccionar el mes a visualizar (por defecto el mes actual).
- **Búsqueda:** Campo de texto libre que filtra las tarjetas en tiempo real por ID de liberación, nombre del servicio o repositorio.
- **Chips de Motor:** Filtro rápido por motor (SAST, DAST, SCA, CDS). Selección múltiple permitida.
- **Selectores:** Dropdowns para filtrar por Célula y por Responsable (Analista asignado).

### 3.2 Columnas del Kanban
El tablero consta de 5 columnas fijas que representan el flujo de trabajo:
1. **Pendiente:** Solicitudes nuevas que aún no han sido tomadas por un analista.
2. **En Revisión:** Solicitudes asignadas a un analista que están siendo evaluadas.
3. **Aprobado:** Liberaciones que pasaron la revisión de seguridad sin hallazgos bloqueantes.
4. **Rechazado:** Liberaciones bloqueadas por contener vulnerabilidades críticas o altas sin remediar.
5. **Con Vulns Activas:** Liberaciones aprobadas por excepción (riesgo aceptado) a pesar de tener vulnerabilidades.

Cada columna tiene una cabecera con el nombre del estatus, un punto de color identificativo y un contador (badge) con el número total de tarjetas en esa columna.

### 3.3 Tarjetas de Liberación (Cards)
Cada tarjeta representa una solicitud de liberación y muestra la siguiente información compacta:
- **ID:** Identificador único (ej. `LIB-2025-248`).
- **Servicio:** Nombre del aplicativo o repositorio en negrita.
- **Badges de Motor:** Etiquetas de color indicando qué motores se ejecutaron (ej. `SAST`, `SCA`).
- **Badges de Hallazgos:** Si hay hallazgos bloqueantes, muestra etiquetas rojas/naranjas (ej. `3 Críticas`, `8 Altas`). Si está en la columna "Con Vulns Activas", muestra un badge de advertencia `⚠ Vulns Activas`.
- **Footer de la Tarjeta:**
  - Célula y Fecha de solicitud.
  - **SLA:** Etiqueta de color indicando el estado del SLA (`SLA OK` en verde, `SLA: 1 día` en amarillo, `SLA VENCIDO` en rojo).
  - **Avatar:** Iniciales del analista responsable. Si no está asignado, muestra un ícono de usuario vacío.

### 3.4 Interacciones del Tablero
- **Drag & Drop:** Los usuarios con permisos pueden arrastrar una tarjeta de una columna a otra para cambiar su estatus. Al soltar la tarjeta, el sistema valida si el cambio de estatus es permitido (ver Reglas de Negocio).
- **Clic en Tarjeta:** Abre el **Drawer de Detalle de Liberación** (el mismo drawer especificado en el Dashboard de Liberaciones).

---

## 4. Drawer de Detalle de Liberación

Al hacer clic en cualquier card del Kanban, se abre un panel lateral derecho (Drawer) con la información completa de la liberación:

**Cabecera:**
- ID de Liberación (ej. REL-2025-089)
- Estatus actual (dropdown para cambiar estatus manualmente)
- Botón de cierre

**Sección 1: Información General**
- Nombre de la aplicación/servicio
- Célula responsable
- Fecha solicitada y Fecha objetivo de liberación
- Tipo de liberación (Mayor, Menor, Parche)

**Sección 2: Estado de Seguridad (Gatekeepers)**
- **SAST:** Estatus (Aprobado/Rechazado), Total de hallazgos, Link al reporte
- **DAST:** Estatus (Aprobado/Rechazado), Total de hallazgos, Link al reporte
- **SCA:** Estatus (Aprobado/Rechazado), Total de hallazgos, Link al reporte
- **Pentest:** Estatus (N/A, En Proceso, Completado), Link al reporte

**Sección 3: Excepciones y Aprobaciones**
- Si la liberación tiene vulnerabilidades bloqueantes, muestra la justificación de negocio.
- Aprobador (quién autorizó la excepción).
- Fecha de aprobación.

**Sección 4: Bitácora de Actividad**
- Historial cronológico de cambios de estatus en el Kanban.
- Comentarios de los analistas o gatekeepers.

---

## 5. Reglas de Negocio y Validaciones de Drag & Drop

El sistema aplica validaciones estrictas al intentar mover una tarjeta entre columnas:

1. **De Pendiente a En Revisión:**
   - Si la tarjeta no tiene un responsable asignado, al moverla a "En Revisión" se asigna automáticamente al usuario logueado que realizó la acción.
2. **De En Revisión a Aprobado:**
   - El sistema verifica si existen vulnerabilidades Críticas o Altas activas asociadas a esta liberación.
   - Si **NO** existen, el movimiento se permite y el estatus cambia a Aprobado.
   - Si **SÍ** existen, el movimiento se **bloquea** y se muestra un modal de error: *"No se puede aprobar una liberación con vulnerabilidades Críticas o Altas activas. Deben ser remediadas o gestionadas mediante una excepción."*
3. **De En Revisión a Rechazado:**
   - Movimiento siempre permitido. Se requiere que el analista ingrese un comentario de rechazo en un modal emergente.
4. **De En Revisión a Con Vulns Activas:**
   - El sistema verifica si existe una **Excepción Aprobada** vigente para las vulnerabilidades bloqueantes de este servicio.
   - Si existe, el movimiento se permite.
   - Si no existe, el movimiento se **bloquea** y se muestra un modal de error: *"Se requiere una excepción aprobada por el Jefe de AppSec para liberar con riesgo aceptado."*
5. **Reasignación Rápida:**
   - Un Coordinador o Jefe puede arrastrar el avatar de un analista (desde un panel lateral de equipo) y soltarlo sobre una tarjeta para reasignarla rápidamente.
