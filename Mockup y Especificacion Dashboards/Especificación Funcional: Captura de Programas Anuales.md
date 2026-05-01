# Especificación Funcional: Captura de Programas Anuales

## 1. Objetivo del Módulo
El módulo de Programas Anuales permite a la Jefatura de Ciberseguridad Aplicativa planificar, ponderar y dar seguimiento a las actividades recurrentes (mensuales, trimestrales o anuales) que forman parte de la estrategia de seguridad. Este módulo alimenta directamente el Motor de Scoring Mensual.

## 2. Arquitectura de la Pantalla
La interfaz sigue el principio de "Navegación Relacional" y se divide en:
- **Vista Principal (Lista de Programas):** Tabla con los programas activos del año en curso.
- **Detalle del Programa (Página Completa):** Al hacer clic en un programa, se abre su vista de detalle, que contiene la matriz de actividades mensuales y sus pesos.
- **Panel Lateral (Drawer de Captura):** Para crear o editar una actividad específica dentro de un mes.

## 3. Detalle del Programa (Matriz de Actividades)

### 3.1 Encabezado del Programa
- **Nombre del Programa:** Ej. "Seguridad en Código Fuente".
- **Año Fiscal:** Selector de año (ej. 2025).
- **Estatus Global:** Borrador, Activo, Histórico.
- **Avance Anual:** Barra de progreso calculada automáticamente basada en los meses cerrados.
- **Botón "Clonar Programa":** Permite copiar la estructura (actividades y pesos) para el siguiente año fiscal.

### 3.2 Matriz de Ponderación (Grid Mensual)
La vista principal del detalle es una matriz donde las filas son las Actividades y las columnas son los Meses (Ene - Dic).
- **Actividades (Filas):** Ej. "Evaluación de Controles GitHub", "Inventario de Repositorios".
- **Celdas (Meses):** Cada celda representa la ejecución de esa actividad en ese mes.
  - Si la celda está vacía, significa que la actividad no aplica para ese mes.
  - Si tiene un valor (ej. `30%`), indica el peso de esa actividad en la calificación de ese mes.
- **Validación de Pesos:** La suma de los pesos de todas las actividades en una columna (mes) debe ser exactamente `100%` (o `0%` si no hay actividades ese mes). El sistema muestra una alerta visual en la cabecera del mes si la suma es incorrecta.

### 3.3 Flujo de Cierre Mensual
- Cada columna (mes) tiene un estatus: `Abierto` o `Cerrado`.
- Al finalizar el mes, el Administrador hace clic en "Cerrar Mes". Esto congela los pesos y los avances reportados, calculando el score final del mes para el programa.

## 4. Panel Lateral (Captura de Actividad Mensual)
Al hacer clic en una celda de la matriz, se abre el panel lateral para configurar o reportar el avance de esa actividad en ese mes específico.

### 4.1 Modo Configuración (Antes de cerrar el mes)
- **Actividad:** Nombre de la actividad.
- **Mes:** Mes seleccionado.
- **Peso (%):** Valor numérico (ej. 30).
- **Responsable:** Usuario asignado a ejecutarla.
- **Entregable Esperado:** Texto descriptivo de lo que se debe cumplir.

### 4.2 Modo Ejecución (Durante el mes)
- **Estatus de la Actividad:** No Iniciada, En Progreso, Completada, Cancelada.
- **Avance (%):** Porcentaje de completitud de la actividad (0-100%).
- **Evidencia:** Carga de archivo o URL.
- **Comentarios:** Bitácora de seguimiento.

## 5. Interacciones del Prototipo HTML (Mockup)
El prototipo `14_programas_anuales_captura.html` implementa:
1. **Matriz Interactiva:** Una tabla cruzada (Actividades x Meses) donde las celdas muestran el peso asignado y un indicador visual de estatus (color de fondo o borde).
2. **Validación de Suma 100%:** La fila de "Total Mes" calcula dinámicamente la suma de los pesos de la columna. Si no es 100%, se marca en rojo.
3. **Panel Lateral (Drawer):** Al hacer clic en una celda con peso (ej. "Evaluación GitHub" en Enero), se abre el panel lateral simulando la captura de avance y carga de evidencia.
4. **Botón Agregar Actividad:** Permite añadir una nueva fila a la matriz.

## 6. Reglas de Negocio
- **Recálculo Automático:** Si se modifica el peso de una actividad en un mes abierto, el sistema recalcula la validación del 100%.
- **Bloqueo Histórico:** No se pueden modificar pesos ni avances de meses que ya están en estatus `Cerrado`.
- **Alertas de Inactividad:** Si una actividad en un mes abierto no tiene actualizaciones en 15 días hábiles, el sistema dispara una alerta al responsable.
