# Especificación Funcional: Módulo Administración / Builder No-Code

## 1. Objetivo del Módulo
El Módulo de Administración (Builder No-Code) es el núcleo de la plataforma AppSec. Permite a los administradores configurar, extender y personalizar la plataforma sin necesidad de escribir código. Sigue el principio "100% No-Code Builder", asegurando que la plataforma pueda adaptarse a nuevos requerimientos, motores de escaneo o regulaciones de forma ágil.

## 2. Arquitectura de la Pantalla
La pantalla se divide en un layout clásico de administración:
- **Sidebar Izquierdo (Menú de Configuración):** Navegación entre las diferentes secciones del Builder (Schema Builder, Flujos de Estatus, Catálogos, SLAs, AI Builder, Permisos).
- **Área Principal (Workspace):** El lienzo donde se realiza la configuración de la sección seleccionada.
- **Panel Lateral Derecho (Propiedades):** Aparece al seleccionar un elemento en el Workspace para editar sus propiedades detalladas.

## 3. Secciones del Builder

### 3.1 Schema Builder (Campos Dinámicos)
Permite agregar, editar o eliminar campos en cualquier módulo de la plataforma.
- **Selección de Entidad:** Dropdown para elegir qué módulo modificar (ej. Vulnerabilidades, Liberaciones, Temas Emergentes).
- **Lienzo de Campos:** Lista ordenable (Drag & Drop) de los campos actuales de la entidad.
- **Tipos de Campo Soportados:** Texto Corto, Texto Largo, Número, Porcentaje, Fecha, Booleano (Toggle), Dropdown (Catálogo), Selección Múltiple, Relación (Buscador de otra entidad), Archivo Adjunto, Fórmula Calculada.
- **Propiedades por Campo (Panel Derecho):**
  - `Nombre del Campo` (Etiqueta visible)
  - `Nombre Interno` (Key para API/Base de datos, autogenerado)
  - `Obligatorio` (Booleano)
  - `Visible en Tabla Principal` (Booleano)
  - `Filtrable` (Booleano)
  - `Editable` (Booleano)
  - `Valor por Defecto`

### 3.2 Flujos de Estatus (Workflows)
Define el ciclo de vida de las entidades y las transiciones permitidas.
- **Selección de Entidad:** Dropdown para elegir el módulo.
- **Lienzo Visual:** Interfaz tipo diagrama de flujo donde los nodos son los estatus y las flechas son las transiciones permitidas.
- **Propiedades de Transición (Panel Derecho):**
  - `Estatus Origen`
  - `Estatus Destino`
  - `Roles Permitidos` (Quién puede hacer este cambio)
  - `Campos Requeridos` (Campos que deben llenarse obligatoriamente al hacer esta transición, ej. "Justificación" al pasar a "Falso Positivo").

### 3.3 Catálogos Centrales
Gestión de las listas desplegables utilizadas en toda la plataforma.
- **Lista de Catálogos:** Motores, Severidades, Tipos de Aplicación, Regulaciones, etc.
- **Edición de Valores:** Interfaz tipo tabla para agregar, editar, reordenar o desactivar (soft-delete) valores de un catálogo.
- **Colores:** Asignación de colores (hex/semáforo) a valores específicos (ej. Crítica = Rojo).

### 3.4 Configuración de SLAs
Reglas de negocio para tiempos de atención.
- **Matriz de SLAs:** Tabla cruzada por Motor y Severidad.
- **Configuración:** Días naturales o hábiles permitidos para la remediación.
- **Acciones:** Qué sucede al vencer (ej. Notificar al Jefe, Cambiar estatus a "Vencido").

### 3.5 AI Builder (Configuración de IA)
Configuración de los asistentes de Inteligencia Artificial.
- **Casos de Uso:** Lista de integraciones activas (STRIDE/DREAD, Triaje, Asistente de Redacción).
- **Editor de Prompt:** Área de texto para definir el "System Prompt" y "User Prompt".
- **Variables de Contexto:** Inserción de variables dinámicas (ej. `{{snippet_codigo}}`, `{{framework}}`) mediante botones o autocompletado.
- **Parámetros del Modelo:** Sliders para Temperatura y Max Tokens.
- **Consola de Pruebas:** Área para simular una ejecución de la IA con datos de prueba antes de guardar.

## 4. Interacciones del Prototipo HTML (Mockup)
El prototipo `11_builder_nocode.html` implementa las siguientes interacciones:
1. **Navegación del Sidebar:** Clic en las opciones del menú izquierdo cambia el contenido del área principal (simulado mediante pestañas).
2. **Schema Builder:**
   - Clic en "Agregar Campo" abre el panel derecho para configurar un nuevo campo.
   - Clic en un campo existente en la lista abre sus propiedades en el panel derecho.
   - Botones de "Guardar" y "Cancelar" en el panel de propiedades.
3. **Flujos de Estatus:**
   - Visualización de una matriz de transiciones.
   - Clic en una celda de la matriz abre el panel derecho para configurar esa transición específica (roles y campos requeridos).
4. **AI Builder:**
   - Selección de un caso de uso (ej. "Triaje de Falsos Positivos").
   - Editor de prompt con variables resaltadas.
   - Botón "Probar Prompt" que muestra un resultado simulado en la consola inferior.

## 5. Reglas de Negocio y Validaciones
- **Campos Base:** Los campos nativos del sistema (ej. ID, Fecha de Creación) no pueden ser eliminados ni modificados en su tipo de dato, solo se puede cambiar su etiqueta visible.
- **Prevención de Pérdida de Datos:** Si se intenta eliminar un campo o un valor de catálogo que ya tiene datos asociados en registros existentes, el sistema advierte y sugiere "Desactivar" en lugar de eliminar.
- **Validación de Flujos:** El sistema valida que no existan "islas" (estatus a los que no se puede llegar o de los que no se puede salir, excepto estatus finales como "Cerrado").
