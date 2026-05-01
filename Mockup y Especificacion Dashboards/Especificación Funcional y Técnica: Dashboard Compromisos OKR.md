# Especificación Funcional y Técnica: Dashboard Compromisos OKR

**Versión:** 2.0  
**Módulo:** Compromisos OKR  
**Acceso:** Analista AppSec, Coordinador, Jefe de AppSec, Director

---

## 1. Propósito

Permitir a los Jefes de Célula, Coordinadores y Directores monitorear el avance de los Objetivos y Key Results (OKRs) del ciclo vigente. El dashboard opera en tres vistas (Mis OKRs, Mi Equipo, Vista Global) y permite navegar desde el resumen ejecutivo hasta el detalle de cada Key Result individual, así como calificar el avance directamente desde la interfaz.

---

## 2. Estructura General de la Pantalla

```
┌─────────────────────────────────────────────────────────────────┐
│ TOPBAR: Breadcrumb | Selector de Año | Filtros | Exportar       │
├─────────────────────────────────────────────────────────────────┤
│ TABS: [ Mis OKRs ]  [ Mi Equipo ]  [ Vista Global ]             │
├─────────────────────────────────────────────────────────────────┤
│ SELECTOR DE PERÍODO: [ Q1 ] [ Q2 ] [ Q3 ] [ Q4 ] [ Anual ]      │
├─────────────────────────────────────────────────────────────────┤
│ KPI ROW (4 tarjetas clickeables):                               │
│ Total Compromisos | En Verde | En Amarillo | En Rojo            │
├─────────────────────────────────────────────────────────────────┤
│ CONTENIDO DINÁMICO SEGÚN LA PESTAÑA SELECCIONADA                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pestaña "Mis OKRs"

Muestra exclusivamente los compromisos donde el usuario logueado es el responsable directo.

### 3.1 Tabla de Mis Compromisos
- **Columnas:** ID, Compromiso, Avance (barra + %), Semáforo (Verde/Amarillo/Rojo), Fecha Límite, Acción.
- **Acción:** Botón "Calificar" en cada fila que abre el Modal de Calificación.
- **Interacción:** Clic en cualquier fila abre el Modal de Calificación.

### 3.2 Gráficas Personales
- **Evolución de Avance:** Line chart mostrando el % de avance de los compromisos a lo largo de las semanas del Q seleccionado.
- **Distribución por Semáforo:** Donut chart (Verde, Amarillo, Rojo). Clic en un segmento abre el Panel de Drill-down con esos compromisos.

---

## 4. Pestaña "Mi Equipo"

Muestra el desempeño de los miembros directos del equipo del usuario logueado (ej. un Jefe ve a sus Analistas).

### 4.1 Tarjetas de Miembros del Equipo
Grid de tarjetas, una por cada miembro del equipo.
- **Contenido:** Avatar, Nombre, Rol, Avance Promedio, y un mini-desglose de sus compromisos (ej. 3 Verde, 1 Amarillo, 0 Rojo).
- **Interacción:** Al hacer clic en la tarjeta de un miembro, se abre el Panel de Drill-down mostrando la tabla de todos sus compromisos, desde donde el Jefe puede hacer clic en "Calificar" para actualizar el avance en nombre del analista.

### 4.2 Gráficas del Equipo
- **Avance por Miembro:** Bar chart horizontal comparando el avance promedio de cada miembro del equipo.
- **Salud del Equipo:** Donut chart consolidado con todos los compromisos del equipo por semáforo.

---

## 5. Pestaña "Vista Global"

Muestra el desempeño consolidado a nivel organizacional. Disponible para Coordinadores, Directores y Admin.

### 5.1 Tabla de Jefaturas / Células
- **Columnas:** Jefatura, Responsable, Total Compromisos, Avance Promedio, Semáforo Consolidado, Tendencia (vs Q anterior).
- **Interacción:** Clic en una fila abre el Panel de Drill-down con los compromisos de esa jefatura.

### 5.2 Gráficas Globales
- **Evolución Anual:** Line chart mostrando el avance promedio global a lo largo de Q1, Q2, Q3 y Q4.
- **Top Jefaturas:** Bar chart con las 5 jefaturas de mayor avance y las 5 de menor avance.

---

## 6. Modal de Calificación de Compromiso

Se abre al hacer clic en "Calificar" o en la fila de un compromiso. Es un modal centrado en pantalla con 3 pestañas internas:

### Pestaña 1: Calificar (Actual)
- **Info:** Título del compromiso, Responsable, Fecha Límite.
- **Formulario:**
  - Input numérico: "% de Avance Actual" (0-100).
  - Textarea: "Comentario / Justificación" (obligatorio si el avance no subió respecto a la última calificación).
- **Botón:** "Guardar Calificación". Al guardar, recalcula el semáforo y actualiza las gráficas del dashboard.

### Pestaña 2: Histórico Q
- Tabla de solo lectura mostrando el avance reportado al cierre de Q1, Q2, Q3 y Q4 para este compromiso específico, con su respectivo semáforo y comentario de cierre.

### Pestaña 3: Compromisos Hijos (Cascada)
- Si el compromiso actual es un "Padre" (ej. un OKR de Dirección que se cascada a las Células), esta pestaña muestra una tabla con todos los compromisos "Hijos".
- **Columnas:** ID Hijo, Responsable, Avance, Semáforo.
- **Interacción:** Cada fila hija es clickeable y abre un nuevo Modal de Calificación sobrepuesto para calificar al hijo directamente.

---

## 7. Panel de Drill-down Universal

Panel lateral derecho que se abre al hacer clic en cualquier KPI global, segmento de donut, barra de gráfica, o tarjeta de miembro del equipo.

- **Contenido:** Tabla con la lista de compromisos que componen el elemento clickeado.
- **Ejemplo:** Si el Jefe hace clic en la tarjeta del analista "Ana García", el panel muestra los 5 compromisos de Ana. El Jefe puede hacer clic en cualquiera de ellos para abrir el Modal de Calificación.

---

## 8. Reglas de Negocio

1. **Cálculo de Semáforo:**
   - Verde: Avance acorde o superior a lo esperado para la fecha actual.
   - Amarillo: Avance con rezago menor al 15% respecto a lo esperado.
   - Rojo: Avance con rezago mayor al 15% respecto a lo esperado.
2. **Cálculo de Avance Padre:** Si un compromiso tiene hijos, su avance se calcula automáticamente como el promedio ponderado del avance de sus hijos. El input de "% de Avance Actual" se bloquea y se muestra un mensaje indicando que el avance se calcula desde los hijos.
3. **Permisos de Calificación:**
   - Un Analista solo puede calificar sus propios compromisos.
   - Un Jefe puede calificar sus compromisos y los de los miembros de su equipo.
   - Un Director puede calificar cualquier compromiso de su dirección.
