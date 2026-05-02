# Especificación de Construcción: Bloque 9 - Administración No-Code Completa

Este documento define a nivel de construcción el módulo de Administración No-Code de la plataforma AppSec. Describe el Builder de Módulos, el AI Builder, el Dashboard Builder y la gestión granular de Roles y Permisos hasta nivel de widget.

---

## 1. Catálogos Requeridos (Base de Datos)

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_TipoCampo` | Texto, Número, Fecha, Dropdown, Archivo, Usuario, Relación | Define los tipos de datos disponibles en el Builder. |
| `Cat_TipoWidget` | KPI, Gráfica de Barras, Gráfica de Líneas, Pie Chart, Tabla | Define los componentes visuales del Dashboard Builder. |
| `Cat_NivelPermiso` | Ver, Crear, Editar, Eliminar, Exportar, Aprobar | Define las acciones granulares por rol. |

---

## 2. Pantalla 1: Builder de Módulos (Schema Builder)

**Ubicación en Menú:** `Administración > Builder de Módulos`

### 2.1 Vista Principal (Lista de Módulos)
- **Componente:** DataGrid.
- **Columnas:** Nombre del Módulo, Tabla Base, Campos, Estatus (Activo/Inactivo).
- **Botón Principal:** `+ Nuevo Módulo`.

### 2.2 Editor de Esquema (Drag & Drop)
**Trigger:** Clic en un módulo existente o en `+ Nuevo Módulo`.

- **Sección Izquierda (Paleta de Campos):**
  - Lista de tipos de campos disponibles (lee de `Cat_TipoCampo`).
  - El administrador arrastra un campo hacia el lienzo central.
- **Sección Central (Lienzo del Formulario):**
  - Representación visual del formulario de captura.
  - Permite reordenar campos arrastrándolos.
- **Sección Derecha (Propiedades del Campo Seleccionado):**
  - `Nombre del Campo` (Text Input, Obligatorio).
  - `Nombre en Base de Datos` (Text Input, autogenerado en snake_case).
  - `Tipo de Campo` (Dropdown, Solo Lectura).
  - `Obligatorio` (Toggle, Sí/No).
  - `Valor por Defecto` (Text Input).
  - `Fuente de Datos` (Dropdown, visible solo si el tipo es Dropdown o Relación. Permite seleccionar un catálogo existente o crear uno nuevo).
  - `Reglas de Visibilidad` (Lógica condicional: "Mostrar este campo SOLO SI [Campo X] = [Valor Y]").

**Botón: Guardar y Publicar Módulo**
- **Acción:** `POST /api/v1/admin/builder/modulos`.
- **Resultado:** Genera o actualiza la tabla en base de datos, crea los endpoints CRUD automáticamente y renderiza el formulario en el frontend.

---

## 3. Pantalla 2: AI Builder (Configuración de Prompts)

**Ubicación en Menú:** `Administración > AI Builder`

### 3.1 Vista Principal (Lista de Prompts)
- **Componente:** DataGrid.
- **Columnas:** Nombre del Prompt, Módulo Asociado, Modelo LLM, Estatus.
- **Botón Principal:** `+ Nuevo Prompt`.

### 3.2 Editor de Prompts
**Trigger:** Clic en un prompt existente.

- **Campo 1: Nombre del Prompt** (Text Input, Obligatorio).
- **Campo 2: Módulo Asociado** (Dropdown, lee los módulos creados en el Schema Builder).
- **Campo 3: Modelo LLM** (Dropdown: GPT-4, Claude 3, Gemini, etc.).
- **Campo 4: Prompt del Sistema (System Prompt)**
  - Tipo: Textarea (Soporta variables dinámicas usando llaves `{{campo_modulo}}`).
  - Ejemplo: "Eres un experto en AppSec. Analiza la vulnerabilidad {{nombre_vuln}} y sugiere una remediación para el lenguaje {{lenguaje_repo}}."
- **Campo 5: Temperatura** (Slider 0.0 a 1.0).
- **Sección de Pruebas (Playground):**
  - Permite inyectar valores de prueba en las variables y ejecutar el prompt contra el LLM seleccionado para validar la respuesta antes de publicar.

---

## 4. Pantalla 3: Dashboard Builder

**Ubicación en Menú:** `Administración > Dashboard Builder`

### 4.1 Vista Principal (Lista de Dashboards)
- **Componente:** DataGrid.
- **Columnas:** Nombre del Dashboard, Nivel Organizacional, Widgets, Estatus.
- **Botón Principal:** `+ Nuevo Dashboard`.

### 4.2 Editor de Dashboards (Lienzo Interactivo)
**Trigger:** Clic en un dashboard existente.

- **Sección Izquierda (Paleta de Widgets):**
  - Lista de tipos de widgets (lee de `Cat_TipoWidget`).
- **Sección Central (Lienzo Grid):**
  - Sistema de grid (ej. 12 columnas) donde se arrastran y redimensionan los widgets.
- **Sección Derecha (Configuración del Widget Seleccionado):**
  - **Pestaña Datos:**
    - `Fuente de Datos` (Dropdown, selecciona un módulo del Schema Builder).
    - `Métrica` (Dropdown: Conteo, Suma, Promedio).
    - `Agrupar Por` (Dropdown, selecciona un campo del módulo).
    - `Filtros` (Constructor de queries visual: "Donde [Campo] [Operador] [Valor]").
  - **Pestaña Interacción (Drill-down):**
    - `Acción al hacer clic` (Dropdown: Abrir Drawer de Detalle, Filtrar otro widget, Redirigir a URL).

---

## 5. Pantalla 4: Roles y Permisos Granulares

**Ubicación en Menú:** `Administración > Roles y Permisos`

### 5.1 Vista Principal (Matriz de Permisos)
- **Componente:** Tabla Matriz (Filas = Módulos/Pantallas, Columnas = Roles).
- **Roles por Defecto:** Administrador, Líder AppSec, Analista AppSec, Jefatura Externa, Auditor, Solo Lectura.
- **Botón Principal:** `+ Nuevo Rol`.

### 5.2 Configuración Granular (Drawer Lateral)
**Trigger:** Clic en la celda de intersección (ej. Módulo Vulnerabilidades - Rol Analista AppSec).

- **Sección 1: Permisos de Datos (CRUD)**
  - Checkboxes: Ver, Crear, Editar, Eliminar, Exportar.
  - `Alcance de Visión` (Dropdown: Todo, Solo lo asignado a su Célula, Solo lo creado por él).
- **Sección 2: Permisos de Acciones Específicas**
  - Checkboxes dinámicos según el módulo (ej. "Aprobar Excepciones", "Cerrar Mes", "Ejecutar Freeze").
- **Sección 3: Permisos a Nivel Widget (Dashboards)**
  - Lista de dashboards y widgets disponibles.
  - Toggle para mostrar/ocultar cada widget específico para este rol.
