# Especificación de Construcción: Bloque 1 - Organización e Inventarios

Este documento define a nivel de construcción (campo por campo, botón por botón, lógica paso a paso) el módulo de Organización e Inventarios de la plataforma AppSec.

---

## 1. Catálogos Requeridos (Base de Datos)

Antes de construir las pantallas, deben existir los siguientes catálogos en el sistema:

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_PlataformaRepo` | GitHub, Atlassian, GitLab, Azure DevOps | Define dónde está alojada la organización. |
| `Cat_TecnologiaPrincipal` | Java, C#, Python, Node.js, Swift, Kotlin, Go, PHP | Clasifica el lenguaje principal del repositorio. |
| `Cat_VisibilidadRepo` | Público, Privado, Interno | Define el nivel de exposición del código. |
| `Cat_CriticidadActivo` | Crítico, Alto, Medio, Bajo | Define el SLA y el peso en el motor de scoring. |
| `Cat_AmbienteWeb` | Producción, Pre-Producción, QA, Desarrollo | Clasifica el entorno del activo web. |
| `Cat_EmpresaMarca` | Banregio, Hey Banco, Regional Tecnología | Clasifica a qué entidad pertenece el activo. |

---

## 2. Pantalla 1: Captura de Subdirecciones

**Ubicación en Menú:** `Configuración > Organización > Subdirecciones`

### 2.1 Vista Principal (Tabla)
- **Componente:** DataGrid.
- **Columnas:** ID, Nombre de la Subdirección, Director Responsable, Fecha de Creación.
- **Filtros:** Buscador de texto libre.
- **Botón Principal:** `+ Nueva Subdirección` (Ubicación: Arriba a la derecha).
  - **Acción:** Abre el Drawer Lateral de Captura.

### 2.2 Formulario de Captura (Drawer Lateral)
- **Campo 1: Nombre de la Subdirección**
  - Tipo: Text Input.
  - Obligatorio: Sí.
  - Validaciones: Máximo 100 caracteres. Único en base de datos.
- **Campo 2: Director Responsable**
  - Tipo: Buscador con autocompletado (Apunta a la tabla de Usuarios del sistema).
  - Obligatorio: Sí.
- **Botón: Guardar**
  - Estado: Deshabilitado hasta que los campos obligatorios estén llenos.
  - Acción: `POST /api/v1/organizacion/subdirecciones`.
  - Resultado esperado: Cierra el drawer, recarga la tabla, muestra Toast verde "Subdirección creada exitosamente".

---

## 3. Pantalla 2: Captura de Gerencias

**Ubicación en Menú:** `Configuración > Organización > Gerencias`

### 3.1 Vista Principal (Tabla)
- **Columnas:** ID, Nombre de la Gerencia, Gerente Responsable, Subdirección Padre.
- **Botón Principal:** `+ Nueva Gerencia`.

### 3.2 Formulario de Captura (Drawer Lateral)
- **Campo 1: Subdirección Padre**
  - Tipo: Dropdown (Apunta a la tabla de Subdirecciones).
  - Obligatorio: Sí.
- **Campo 2: Nombre de la Gerencia**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Gerente Responsable**
  - Tipo: Buscador con autocompletado (Usuarios).
  - Obligatorio: Sí.
- **Botón: Guardar**
  - Acción: `POST /api/v1/organizacion/gerencias`.

---

## 4. Pantalla 3: Captura de Organizaciones (GitHub/Atlassian)

**Ubicación en Menú:** `Configuración > Organización > Organizaciones`

### 4.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Gerencia Padre**
  - Tipo: Dropdown (Apunta a la tabla de Gerencias).
  - Obligatorio: Sí.
- **Campo 2: Nombre de la Organización**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Plataforma**
  - Tipo: Dropdown (Lee de `Cat_PlataformaRepo`).
  - Obligatorio: Sí.
- **Campo 4: URL Base**
  - Tipo: Text Input.
  - Obligatorio: Sí.
  - Validaciones: Formato URL válido (regex `^https?://`).
- **Campo 5: Responsable de la Organización**
  - Tipo: Buscador con autocompletado (Usuarios).
  - Obligatorio: Sí.

---

## 5. Pantalla 4: Captura de Células / Equipos

**Ubicación en Menú:** `Configuración > Organización > Células`

### 5.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Organización Padre**
  - Tipo: Dropdown (Apunta a la tabla de Organizaciones).
  - Obligatorio: Sí.
- **Campo 2: Nombre de la Célula**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Líder de la Célula**
  - Tipo: Buscador con autocompletado (Usuarios).
  - Obligatorio: Sí.
- **Campo 4: Integrantes**
  - Tipo: Multi-select Buscador (Usuarios).
  - Obligatorio: No.
  - Comportamiento: Permite seleccionar múltiples usuarios. Al guardar, estos usuarios quedan vinculados a esta célula para heredar permisos.

---

## 6. Pantalla 5: Inventario de Repositorios (Fuente de Verdad)

**Ubicación en Menú:** `Inventarios > Repositorios`

### 6.1 Vista Principal (Tabla)
- **Columnas:** Org ID, Nombre del Repositorio, Tecnología, Criticidad, Célula Responsable.
- **Botones Principales:** `+ Nuevo Repositorio`, `Importar CSV`, `Descargar Template`.

### 6.2 Formulario de Captura Manual (Drawer Lateral)
- **Campo 1: Célula Responsable**
  - Tipo: Dropdown (Apunta a la tabla de Células).
  - Obligatorio: Sí.
- **Campo 2: Org ID de Referencia**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: Nombre del Repositorio**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 4: URL del Repositorio**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 5: Tecnología Principal**
  - Tipo: Dropdown (Lee de `Cat_TecnologiaPrincipal`).
  - Obligatorio: Sí.
- **Campo 6: Visibilidad**
  - Tipo: Dropdown (Lee de `Cat_VisibilidadRepo`).
  - Obligatorio: Sí.
- **Campo 7: Criticidad**
  - Tipo: Dropdown (Lee de `Cat_CriticidadActivo`).
  - Obligatorio: Sí.

### 6.3 Lógica de Importación Masiva
- **Trigger:** Clic en `Importar CSV`.
- **Paso 1:** Abre modal con input de tipo File Upload (solo `.csv`).
- **Paso 2:** Al subir, el sistema valida que las columnas coincidan con el template.
- **Paso 3:** El sistema valida que el nombre de la "Célula Responsable" en el CSV exista en la base de datos. Si no existe, rechaza la fila.
- **Paso 4:** Inserta los registros válidos.

---

## 7. Pantalla 6: Inventario de Activos Web

**Ubicación en Menú:** `Inventarios > Activos Web`

### 7.1 Formulario de Captura (Drawer Lateral)
- **Campo 1: Célula Responsable**
  - Tipo: Dropdown (Apunta a la tabla de Células).
  - Obligatorio: Sí.
- **Campo 2: Nombre del Servicio**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 3: URL / Dominio**
  - Tipo: Text Input.
  - Obligatorio: Sí.
- **Campo 4: Ambiente**
  - Tipo: Dropdown (Lee de `Cat_AmbienteWeb`).
  - Obligatorio: Sí.
- **Campo 5: Empresa / Marca**
  - Tipo: Dropdown (Lee de `Cat_EmpresaMarca`).
  - Obligatorio: Sí.
- **Campo 6: Criticidad**
  - Tipo: Dropdown (Lee de `Cat_CriticidadActivo`).
  - Obligatorio: Sí.

---

## 8. Lógica de Negocio: Herencia Automática (Cascada Inversa)

Esta es la lógica central del sistema que se ejecuta cada vez que se crea una vulnerabilidad o un escaneo.

**Trigger:** Inserción de un registro en la tabla de Vulnerabilidades o Pipeline que contenga el `Nombre del Repositorio` o la `URL del Activo Web`.

**Lógica Paso a Paso:**
1. El sistema toma el `Nombre del Repositorio`.
2. Hace un `SELECT` en la tabla de **Inventario de Repositorios** para encontrar la `Célula Responsable`.
3. Con el ID de la Célula, hace un `SELECT` en la tabla de **Células** para encontrar la `Organización Padre`.
4. Con el ID de la Organización, hace un `SELECT` en la tabla de **Gerencias** para encontrar la `Gerencia Padre`.
5. Con el ID de la Gerencia, hace un `SELECT` en la tabla de **Subdirecciones** para encontrar la `Subdirección Padre`.
6. **Resultado:** El registro de la vulnerabilidad se actualiza automáticamente (UPDATE) rellenando los campos ocultos: `id_celula`, `id_organizacion`, `id_gerencia`, `id_subdireccion`.
7. **Fallo:** Si el repositorio no existe en el inventario, la vulnerabilidad se marca con el flag `huerfana = true` y se asigna a una bandeja de "Pendientes de Asignación" para el Administrador.
