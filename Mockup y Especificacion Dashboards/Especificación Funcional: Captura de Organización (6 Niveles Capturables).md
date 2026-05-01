# Especificación Funcional: Captura de Organización (6 Niveles Capturables)

## 1. Objetivo del Módulo
El módulo de Organización permite a los administradores definir y mantener la estructura jerárquica de la empresa y sus activos. Esta estructura es el motor detrás del "Dashboard de Vulnerabilidades Organizacional" (que muestra 7 niveles, siendo el Nivel 1 el "Global" o agregado total). 

En este módulo de captura, los usuarios gestionan los **6 niveles reales** que componen la estructura:
1. **Dirección**
2. **Subdirección**
3. **Gerencia**
4. **Organización** (Entidad lógica en GitHub/Atlassian)
5. **Célula** (Equipo de desarrollo)
6. **Repositorio** (Activo final)

## 2. Arquitectura de la Pantalla
La interfaz utiliza un patrón de "Árbol Jerárquico Interactivo" (Tree View) combinado con un panel de detalles:
- **Panel Izquierdo (Árbol Organizacional):** Visualización jerárquica expandible/colapsable de todos los nodos de la empresa, desde Direcciones hasta Repositorios.
- **Panel Derecho (Detalle del Nodo):** Formulario dinámico para crear, editar o ver los detalles del nodo seleccionado en el árbol. Los campos cambian dependiendo del nivel seleccionado.
- **Barra Superior:** Controles de búsqueda global, filtros por nivel y botones de importación masiva.

## 3. Panel Izquierdo (Árbol Organizacional)

### 3.1 Estructura Visual
- Los nodos se muestran anidados con líneas conectoras.
- Cada nivel tiene un ícono distintivo:
  - 🏛️ Dirección
  - 🏬 Subdirección
  - 💼 Gerencia
  - 🌐 Organización (GitHub/Atlassian)
  - 👥 Célula
  - 📦 Repositorio
- **Indicadores Visuales:** Junto al nombre del nodo, se muestra un "badge" con la cantidad de repositorios o vulnerabilidades asociadas a ese nodo (o a sus hijos).

### 3.2 Interacciones del Árbol
- **Expandir/Colapsar:** Clic en la flecha junto al nodo para ver sus hijos.
- **Seleccionar:** Clic en el nombre del nodo para cargar sus datos en el panel derecho.
- **Drag & Drop (Reorganización):** Los administradores pueden arrastrar un nodo (ej. una Célula) y soltarlo dentro de otro nodo padre (ej. otra Organización) para mover toda esa rama. El sistema recalcula automáticamente las dependencias.

## 4. Panel Derecho (Detalle y Captura del Nodo)

El formulario es dinámico y se adapta al nivel del nodo seleccionado.

### 4.1 Campos Comunes (Todos los niveles)
- **Nombre del Nodo:** Texto obligatorio.
- **Nivel Jerárquico:** Dropdown bloqueado (heredado de su posición en el árbol).
- **Entidad Padre:** Muestra a quién reporta. Dropdown filtrado por el nivel anterior (Obligatorio excepto para Dirección).
- **Responsable (Owner):** Buscador de usuarios (Active Directory / IAM) para asignar al líder de esa área.

### 4.2 Campos Específicos por Nivel
- **Si Nivel = Organización:**
  - `Plataforma`: Dropdown (GitHub, Atlassian, GitLab, etc.).
  - `URL Base`: URL de la organización en la plataforma.
- **Si Nivel = Repositorio:**
  - `URL del Repositorio`: Enlace directo al código fuente.
  - `Lenguaje Principal`: Dropdown (Java, Python, JS, etc.).
  - `Criticidad`: Alta, Media, Baja.

### 4.3 Modo Creación (Cascada)
Para crear un nuevo nodo, el usuario selecciona un nodo padre en el árbol y hace clic en "Agregar Sub-nivel".
- El formulario se pre-llena con la "Entidad Padre".
- El "Nivel Jerárquico" se autoselecciona al nivel inmediatamente inferior (ej. si el padre es Gerencia, el nuevo nodo será Organización).
- **Validación de Cascada:** El sistema no permite "saltarse" niveles en la jerarquía lógica.

## 5. Flujo de Importación Masiva
Dado que capturar cientos de células y repositorios manualmente es ineficiente, el módulo incluye opciones de automatización:
- **Sincronización con AD/IAM:** Para actualizar los responsables de Direcciones, Subdirecciones y Gerencias.
- **Sincronización con GitHub/Atlassian:** Para auto-descubrir Organizaciones, Células y Repositorios.
- **Importación por Excel:** Carga de un archivo CSV con columnas predefinidas para construir el árbol completo de una sola vez.

## 6. Interacciones del Prototipo HTML (Mockup)
El prototipo `16_organizacion_7niveles.html` implementa:
1. **Árbol Interactivo:** Nodos colapsables con los 6 niveles correctos (Dirección → Subdirección → Gerencia → Organización → Célula → Repositorio).
2. **Formulario Dinámico:** Al seleccionar un nodo de tipo "Organización", aparecen los campos específicos de Plataforma y URL Base. Al seleccionar un "Repositorio", aparecen los campos de URL y Criticidad.
3. **Simulación de Creación:** Al hacer clic en el botón "+ Agregar Sub-nivel", el formulario se prepara para capturar el nivel hijo correspondiente.

## 7. Reglas de Negocio
- **Propagación de Responsabilidad:** Si un nodo inferior no tiene un Responsable asignado, las notificaciones y SLAs escalan automáticamente al Responsable de la Entidad Padre.
- **Eliminación Segura:** No se puede eliminar un nodo si tiene hijos (ej. no se puede borrar una Célula si aún tiene Repositorios asignados). Primero deben reasignarse.
- **El Nivel "Global":** El Nivel 1 (Global) que se ve en los dashboards no se captura aquí; es simplemente la agregación matemática de todas las Direcciones (Nivel 2 en el dashboard, Nivel 1 en captura) registradas en este módulo.
