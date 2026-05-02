# Especificación de Construcción: Bloque 10 - Módulos Transversales

Este documento define a nivel de construcción los componentes y comportamientos transversales que aplican a toda la plataforma AppSec. Al ser una plataforma No-Code, estos componentes se configuran una vez y se heredan en todos los módulos generados por el Builder.

---

## 1. Búsqueda Global (Omnibox)

**Ubicación:** Barra superior de navegación (Header), visible en todas las pantallas.

### 1.1 Comportamiento
- **Tipo de Input:** Search Input con autocompletado en tiempo real (debounce de 300ms).
- **Alcance (Configurable en Builder):** El Administrador define qué módulos y qué campos están indexados para la búsqueda global.
  - Ejemplo por defecto: Busca en `ID Vulnerabilidad`, `Nombre Repositorio`, `Nombre Activo Web`, `Título Iniciativa`, `Nombre Usuario`.
- **Resultados Visuales:**
  - Dropdown flotante agrupado por Módulo (ej. Sección "Vulnerabilidades", Sección "Repositorios").
  - Cada resultado muestra el Título principal y un subtítulo de contexto (ej. `VULN-1024 | SQL Injection en repo-auth`).
- **Acción al hacer clic:** Redirige directamente al Drawer de Detalle del registro seleccionado.

---

## 2. Tablas Dinámicas (DataGrids)

Todas las tablas de la plataforma (Vulnerabilidades, Inventarios, Iniciativas) comparten el mismo componente base con las siguientes capacidades:

### 2.1 Columnas Configurables por Usuario
- **Trigger:** Clic en el ícono de "Ajustes de Columnas" en la esquina superior derecha de la tabla.
- **Comportamiento:** Abre un popover con checkboxes para todas las columnas disponibles en el módulo.
- **Persistencia:** La selección y el orden de las columnas se guarda en el `LocalStorage` o en las preferencias del usuario en base de datos, para que al regresar a la pantalla la vista se mantenga.

### 2.2 Acciones Masivas
- **Trigger:** Seleccionar uno o más checkboxes en la primera columna de la tabla.
- **Comportamiento:** Aparece una barra flotante (Sticky Action Bar) en la parte inferior o superior de la pantalla.
- **Acciones Disponibles (Configurables por Módulo):**
  - `Cambiar Estatus` (Abre modal para seleccionar nuevo estatus).
  - `Reasignar Responsable` (Abre modal con buscador de usuarios).
  - `Exportar Seleccionados` (Descarga CSV solo de las filas marcadas).
  - `Eliminar` (Requiere confirmación de doble factor si está configurado).

---

## 3. Drawer de Detalle (Panel Lateral)

Cuando un usuario hace clic en un registro de cualquier tabla, no se abre una página nueva, sino un Drawer lateral derecho que ocupa el 40-60% de la pantalla.

### 3.1 Estructura Base del Drawer
- **Header:** Título del registro, Estatus actual (Badge de color), y botones de acción rápida (Editar, Cerrar).
- **Body (Pestañas Configurables):**
  - `Pestaña 1: Detalle` (Muestra todos los campos del formulario en modo lectura o edición según permisos).
  - `Pestaña 2: Evidencia / Adjuntos` (Módulo transversal de archivos).
  - `Pestaña 3: Bitácora` (Módulo transversal de historial).

---

## 4. Módulo Transversal de Adjuntos (Evidencia)

**Ubicación:** Disponible como un tipo de campo en el Schema Builder o como pestaña en el Drawer.

### 4.1 Comportamiento
- **Tipos Permitidos (Configurable):** PDF, JPG, PNG, CSV, DOCX.
- **Tamaño Máximo (Configurable):** Ej. 10MB por archivo.
- **Acciones:**
  - Drag & Drop de archivos.
  - Previsualización en línea (para imágenes y PDFs).
  - Descarga.
  - Eliminación (solo por el creador o Administrador).

---

## 5. Módulo Transversal de Bitácora (Timeline)

**Ubicación:** Pestaña estándar en todos los Drawers de Detalle.

### 5.1 Comportamiento
- **Registro Automático:** El sistema escribe automáticamente en esta bitácora cuando:
  - Se crea el registro.
  - Cambia de estatus (ej. "De Nuevo a En Revisión").
  - Se reasigna a otro usuario.
  - Se adjunta un archivo.
- **Registro Manual:** Input de texto para que los usuarios agreguen comentarios, notas o @menciones a otros usuarios (lo cual dispara una notificación).
- **Visualización:** Formato de línea de tiempo vertical, ordenado del más reciente al más antiguo, mostrando Avatar del usuario, Nombre, Acción, y Timestamp (hace X minutos/días).

---

## 6. Estados de Pantalla (Empty States & Loading)

Para garantizar una UX consistente, todos los módulos implementan los siguientes estados:

- **Loading State:** Skeleton loaders (esqueletos grises animados) que imitan la forma de la tabla o formulario mientras se obtienen los datos de la API. No se usan spinners genéricos a pantalla completa.
- **Empty State (Sin Datos):** Ilustración amigable, texto explicativo ("Aún no hay vulnerabilidades registradas") y un botón de Call to Action primario ("+ Importar Escaneo").
- **Empty State (Filtros sin resultados):** Ilustración diferente, texto ("No se encontraron resultados para estos filtros") y botón ("Limpiar Filtros").
