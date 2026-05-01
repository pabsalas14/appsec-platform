# Especificación Funcional: Dashboard Builder (Constructor de Vistas Analíticas)

## 1. Objetivo del Módulo
El Dashboard Builder es la herramienta que permite a los administradores crear, modificar y personalizar los dashboards de la plataforma sin necesidad de escribir código. Cumple con el principio "100% No-Code Builder", permitiendo que las vistas analíticas evolucionen junto con las necesidades del negocio.

## 2. Arquitectura de la Pantalla
La interfaz del Dashboard Builder se divide en tres áreas principales:
- **Panel Izquierdo (Catálogo de Widgets):** Contiene los tipos de visualizaciones disponibles (KPI Cards, Gráficas, Tablas) que pueden ser arrastrados al lienzo.
- **Área Central (Lienzo / Canvas):** El espacio de trabajo donde se construye el dashboard. Utiliza un sistema de cuadrícula (Grid) de 12 columnas para organizar y redimensionar los widgets.
- **Panel Derecho (Configuración del Widget):** Aparece al seleccionar un widget en el lienzo. Permite configurar la fuente de datos, métricas, dimensiones, filtros e interacciones (drill-down).

## 3. Componentes del Builder

### 3.1 Gestión del Dashboard (Encabezado)
- **Nombre del Dashboard:** Campo de texto editable.
- **Módulo Asociado:** Dropdown que define el contexto principal del dashboard (ej. Vulnerabilidades, Liberaciones). Esto ayuda a pre-filtrar las fuentes de datos disponibles.
- **Visibilidad:** Control de acceso (Todos, Solo Admin, Roles Específicos).
- **Filtros Globales:** Botón para agregar controles de filtro en la parte superior del dashboard (ej. Selector de Fecha, Dropdown de Motor).

### 3.2 Catálogo de Widgets (Panel Izquierdo)
Los administradores pueden arrastrar y soltar los siguientes elementos:
1. **KPI Card:** Tarjeta con un número principal, subtítulo (tendencia) y color semafórico.
2. **Bar Chart:** Gráfica de barras (vertical u horizontal).
3. **Line Chart:** Gráfica de líneas para series de tiempo.
4. **Pie / Donut Chart:** Gráfica circular para distribuciones.
5. **Gauge Chart:** Medidor semicircular para scores (0-100).
6. **Data Table:** Tabla resumida de registros.

### 3.3 Configuración de Datos (Panel Derecho - Pestaña Datos)
Al seleccionar un widget, se debe configurar de dónde obtiene su información:
- **Fuente de Datos (Entidad):** Ej. `Vulnerabilidades`.
- **Métrica (Agregación):** Operación matemática a realizar: `Conteo (Count)`, `Suma (Sum)`, `Promedio (Avg)`, `Máximo (Max)`, `Mínimo (Min)`.
- **Campo de Métrica:** El campo sobre el cual se aplica la agregación (ej. `ID` para conteo, `Score` para promedio).
- **Dimensión (Agrupación):** El campo por el cual se agrupan los datos (ej. agrupar por `Severidad` para una gráfica de pastel).
- **Filtros Base:** Condiciones fijas que siempre aplican a este widget (ej. `Estatus != Cerrado`).

### 3.4 Configuración de Interacciones (Panel Derecho - Pestaña Interacción)
Define qué sucede cuando el usuario hace clic en un elemento del widget (ej. clic en una barra o en un KPI):
- **Acción al Clic:**
  - `Ninguna` (Solo lectura).
  - `Filtrar Dashboard` (Aplica el valor seleccionado como filtro global para el resto de los widgets).
  - `Abrir Panel de Detalle (Drill-down)` (Abre un panel lateral con la tabla de registros que componen ese dato).
  - `Navegar a URL` (Redirección personalizada).

## 4. Interacciones del Prototipo HTML (Mockup)
El prototipo `12_dashboard_builder.html` implementa las siguientes interacciones:
1. **Drag & Drop Simulado:** El panel izquierdo muestra los widgets disponibles.
2. **Selección de Widget:** Al hacer clic en un widget dentro del lienzo central (ej. la gráfica de barras), este se resalta con un borde azul y el panel derecho se actualiza para mostrar su configuración.
3. **Pestañas de Configuración:** El panel derecho tiene dos pestañas funcionales: "Datos" e "Interacción", que cambian el contenido del formulario de configuración.
4. **Redimensionamiento Simulado:** Los widgets en el lienzo muestran controles visuales en las esquinas para indicar que pueden ser redimensionados en la cuadrícula de 12 columnas.

## 5. Reglas de Negocio
- **Validación de Datos:** El sistema no permite guardar un widget si la combinación de Métrica y Dimensión es inválida (ej. intentar promediar un campo de texto).
- **Mapeo de Filtros Globales:** Si se agrega un filtro global al dashboard (ej. "Motor"), el sistema intentará aplicarlo automáticamente a todos los widgets que tengan un campo llamado "Motor" en su fuente de datos. El administrador puede desactivar este mapeo por widget si lo desea.
