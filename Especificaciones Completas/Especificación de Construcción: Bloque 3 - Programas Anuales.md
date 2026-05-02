# Especificación de Construcción: Bloque 3 - Programas Anuales

Este documento define a nivel de construcción el módulo de Programas Anuales de la plataforma AppSec. Describe los 5 sub-programas (SAST/SCA/CDS, DAST, MDA, Código Fuente, Servicios Regulados), cada uno con su propio flujo de captura, campos, validaciones y lógica de cálculo mensual.

---

## 1. Catálogos Requeridos (Base de Datos)

Antes de construir las pantallas, deben existir los siguientes catálogos en el sistema:

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_ProgramaAnual` | SAST/SCA/CDS, DAST, MDA, Código Fuente, Servicios Regulados | Identifica el sub-programa. |
| `Cat_Meses` | Enero, Febrero, Marzo, Abril, Mayo, Junio, Julio, Agosto, Septiembre, Octubre, Noviembre, Diciembre | Define el periodo de evaluación. |
| `Cat_EstatusActividad` | No Iniciada, En Proceso, En Proceso de Firmas, Finalizada, Cancelada | Controla el ciclo de vida de una actividad mensual. |
| `Cat_JefaturaRegulada` | Infraestructura, Base de Datos, Redes, Nube, Identidad | Identifica a las áreas participantes en Servicios Regulados. |
| `Cat_Regulacion` | Banco de México, PCI-DSS, CNBV, SOX | Clasifica el marco normativo de un servicio regulado. |

---

## 2. Pantalla 1: Configuración de Programas Anuales y Fórmulas Dinámicas (Administrador)

**Ubicación en Menú:** `Configuración > Programas Anuales`

### 2.1 Vista Principal (Tabla)
- **Componente:** DataGrid.
- **Columnas:** ID, Nombre del Programa, Año, Mes de Inicio, Meses Activos (10, 11 o 12), Analista Responsable.
- **Botón Principal:** `+ Nuevo Programa Anual`.

### 2.2 Formulario de Configuración (Drawer Lateral)
- **Campo 1: Nombre del Programa**
  - Tipo: Dropdown (Lee de `Cat_ProgramaAnual`).
  - Obligatorio: Sí.
- **Campo 2: Año**
  - Tipo: Number Input (ej. 2024).
  - Obligatorio: Sí.
- **Campo 3: Mes de Inicio**
  - Tipo: Dropdown (Lee de `Cat_Meses`).
  - Obligatorio: Sí.
- **Campo 4: Meses Activos**
  - Tipo: Number Input (10, 11 o 12).
  - Obligatorio: Sí.
- **Campo 5: Analista Responsable**
  - Tipo: Buscador con autocompletado (Usuarios).
  - Obligatorio: Sí.

### 2.3 Motor de Fórmulas Dinámicas (Configuración de Actividades)
Para cada actividad dentro de un programa, el Administrador no define un cálculo "quemado" en código, sino que configura cómo se mide el avance usando el Motor de Fórmulas.

- **Campo: Tipo de Medición**
  - Tipo: Dropdown (Por Estatus, Por Volumen, Por Checklist).
- **Si Tipo = Por Estatus:**
  - El administrador asigna un % de avance a cada estatus del catálogo.
  - Ejemplo: `Finalizada = 100%`, `En Proceso = 50%`, `No Iniciada = 0%`.
- **Si Tipo = Por Volumen (Fórmula Matemática):**
  - El administrador construye la fórmula usando variables dinámicas expuestas por el sistema.
  - Ejemplo para Código Fuente: `({{orgs_validadas_mes}} / {{total_orgs_inventario}}) * 100`.
  - Ejemplo para MDA: `({{sesiones_ejecutadas}} / {{sesiones_programadas}}) * 100`.
- **Si Tipo = Por Checklist:**
  - El administrador define N ítems. El sistema calcula automáticamente: `(Ítems Cumplidos / Total Ítems Aplicables) * 100`.

**Botón: Guardar Configuración**
- **Acción:** `POST /api/v1/programas/configuracion`.
- **Resultado:** Crea la estructura base del programa para el año seleccionado.

---

## 3. Sub-Programa 1: SAST / SCA / CDS (Cobertura de Escaneo)

Este programa mide la cobertura de escaneo de los repositorios del inventario.

**Ubicación en Menú:** `Programas Anuales > SAST / SCA / CDS`

### 3.1 Vista Principal (Matriz Mensual)
- **Componente:** Tabla Matriz (Filas = Actividades, Columnas = Meses).
- **Actividades (Filas):**
  - Escaneo SAST (Peso: 40%)
  - Escaneo SCA (Peso: 40%)
  - Escaneo CDS (Peso: 20%)
- **Validación de Peso:** La suma de los pesos de las actividades en un mes debe ser exactamente 100%.

### 3.2 Flujo de Captura Mensual (Drawer Lateral)
**Trigger:** Clic en la celda de intersección (ej. Escaneo SAST - Marzo).

- **Campo 1: Total de Repositorios en Inventario**
  - Tipo: Number Input (Solo Lectura).
  - Fuente: `SELECT COUNT(*) FROM Inventario_Repositorios`.
- **Campo 2: Repositorios Escaneados en el Mes**
  - Tipo: Number Input (Solo Lectura).
  - Fuente: `SELECT COUNT(DISTINCT Repositorio) FROM Pipeline_SAST WHERE Mes = 'Marzo' AND Resultado = 'Aprobado'`.
- **Campo 3: Porcentaje de Cobertura**
  - Tipo: Number Input (Solo Lectura).
  - Fórmula: Calculado automáticamente por el Motor de Fórmulas Dinámicas según la configuración del Administrador (ej. `({{repos_escaneados}} / {{total_repos}}) * 100`).
- **Campo 4: Estatus de la Actividad**
  - Tipo: Dropdown (Lee de `Cat_EstatusActividad`).
  - Obligatorio: Sí.
- **Campo 5: Evidencia (Reporte de Cobertura)**
  - Tipo: File Upload (PDF/Excel).
  - Obligatorio: Sí (Solo si Estatus = Finalizada).

**Botón: Guardar Avance**
- **Acción:** Actualiza el porcentaje de avance de la celda en la matriz.
- **Cálculo:** Si la cobertura es 80%, y el peso de la actividad es 40%, el avance aportado al mes es `80% * 40% = 32%`.

---

## 4. Sub-Programa 2: DAST (Seguridad en Aplicaciones Web)

Este programa mide la cobertura de escaneo sobre el inventario de activos web.

**Ubicación en Menú:** `Programas Anuales > DAST`

### 4.1 Vista Principal (Matriz Mensual)
- **Componente:** Tabla Matriz.
- **Actividades (Filas):**
  - Escaneo DAST Automatizado (Peso: 60%)
  - Revisión Manual / Pentest (Peso: 40%)

### 4.2 Flujo de Captura Mensual (Drawer Lateral)
**Trigger:** Clic en la celda de intersección (ej. Escaneo DAST - Abril).

- **Campo 1: Total de Activos Web en Inventario**
  - Tipo: Number Input (Solo Lectura).
  - Fuente: `SELECT COUNT(*) FROM Inventario_ActivosWeb`.
- **Campo 2: Activos Web Escaneados en el Mes**
  - Tipo: Number Input (Solo Lectura).
  - Fuente: `SELECT COUNT(DISTINCT ActivoWeb) FROM Pipeline_DAST WHERE Mes = 'Abril'`.
- **Campo 3: Porcentaje de Cobertura**
  - Tipo: Number Input (Solo Lectura).
  - Fórmula: Calculado automáticamente por el Motor de Fórmulas Dinámicas (ej. `({{activos_escaneados}} / {{total_activos}}) * 100`).
- **Campo 4: Estatus de la Actividad** (Dropdown, Obligatorio).
- **Campo 5: Evidencia** (File Upload, Obligatorio si Finalizada).

---

## 5. Sub-Programa 3: MDA (Modelado de Amenazas)

Este programa mide el avance de las sesiones de Threat Modeling programadas.

**Ubicación en Menú:** `Programas Anuales > MDA`

### 5.1 Vista Principal (Matriz Mensual)
- **Componente:** Tabla Matriz.
- **Actividades (Filas):**
  - Sesiones MDA Programadas (Peso: 50%)
  - Mitigación de Amenazas Identificadas (Peso: 50%)

### 5.2 Flujo de Captura Mensual (Drawer Lateral)
**Trigger:** Clic en la celda de intersección (ej. Sesiones MDA - Mayo).

- **Campo 1: Sesiones Programadas para el Mes**
  - Tipo: Number Input (Editable al inicio del mes).
  - Obligatorio: Sí.
- **Campo 2: Sesiones Ejecutadas**
  - Tipo: Number Input (Solo Lectura).
  - Fuente: `SELECT COUNT(*) FROM Sesiones_MDA WHERE Mes = 'Mayo' AND Estatus = 'Completada'`.
- **Campo 3: Porcentaje de Avance**
  - Tipo: Number Input (Solo Lectura).
  - Fórmula: Calculado automáticamente por el Motor de Fórmulas Dinámicas (ej. `({{sesiones_ejecutadas}} / {{sesiones_programadas}}) * 100`).
- **Campo 4: Estatus de la Actividad** (Dropdown, Obligatorio).
- **Campo 5: Evidencia (Minutas de Sesión)** (File Upload, Obligatorio si Finalizada).

---

## 6. Sub-Programa 4: Seguridad en Código Fuente

Este programa evalúa los controles de seguridad en las plataformas de repositorios y mantiene actualizados los inventarios.

**Ubicación en Menú:** `Programas Anuales > Código Fuente`

### 6.1 Vista Principal (Matriz Mensual)
- **Componente:** Tabla Matriz.
- **Actividades (Filas):**
  - Evaluación de Controles GitHub (Peso: 30%)
  - Evaluación de Controles Atlassian (Peso: 30%)
  - Actualización Inventario de Repositorios (Peso: 20%)
  - Actualización Inventario de Equipos Atlassian (Peso: 20%)

### 6.2 Flujo de Captura Mensual (Drawer Lateral)
**Trigger:** Clic en la celda de intersección (ej. Controles GitHub - Junio).

- **Campo 1: Checklist de Controles (Grid Editable)**
  - Tipo: Tabla con Checkboxes.
  - Columnas: Control (ej. "MFA Obligatorio", "Branch Protection Rules"), Cumple (Sí/No/NA), Evidencia (URL o Archivo).
  - Fuente: Lee de la tabla de configuración de controles.
- **Campo 2: Porcentaje de Cumplimiento**
  - Tipo: Number Input (Solo Lectura).
  - Fórmula: Calculado automáticamente por el Motor de Fórmulas Dinámicas usando el Tipo de Medición "Por Checklist".
- **Campo 3: Estatus de la Actividad** (Dropdown, Obligatorio).
- **Campo 4: Plan de Acción para Controles No Cumplidos**
  - Tipo: Textarea.
  - Obligatorio: Sí (Solo si hay controles marcados como "No").

---

## 7. Sub-Programa 5: Servicios Regulados

Este programa consolida las actividades de cumplimiento de múltiples jefaturas sobre servicios bajo normativas específicas.

**Ubicación en Menú:** `Programas Anuales > Servicios Regulados`

### 7.1 Vista Principal (Matriz Mensual por Jefatura)
- **Componente:** Tabla Matriz agrupada por Jefatura.
- **Filtro Superior:** Regulación (Dropdown, lee de `Cat_Regulacion`).
- **Actividades (Filas):**
  - Jefatura de Infraestructura: Hardening de Servidores (Peso: 25%)
  - Jefatura de Base de Datos: Cifrado en Reposo (Peso: 25%)
  - Jefatura de Redes: Segmentación (Peso: 25%)
  - Jefatura de Identidad: Rotación de Llaves (Peso: 25%)

### 7.2 Flujo de Captura Distribuida (Drawer Lateral)
**Trigger:** Clic en la celda de intersección (ej. Hardening de Servidores - Julio).

- **Campo 1: Jefatura Responsable**
  - Tipo: Dropdown (Lee de `Cat_JefaturaRegulada`, Solo Lectura).
- **Campo 2: Actividad a Realizar**
  - Tipo: Textarea (Solo Lectura).
- **Campo 3: Porcentaje de Avance Reportado**
  - Tipo: Number Input (0-100).
  - Obligatorio: Sí.
  - Permiso: Solo editable por usuarios que pertenezcan a la Jefatura Responsable.
- **Campo 4: Estatus de la Actividad** (Dropdown, Obligatorio).
- **Campo 5: Evidencia de Cumplimiento**
  - Tipo: File Upload.
  - Obligatorio: Sí (Solo si Estatus = Finalizada).
- **Campo 6: Comentarios AppSec (Revisión)**
  - Tipo: Textarea.
  - Permiso: Solo editable por el Analista Responsable del programa.

**Botón: Aprobar Avance (Solo AppSec)**
- **Acción:** Congela el porcentaje reportado por la jefatura y lo suma al cálculo global del mes para el programa de Servicios Regulados.

---

## 8. Lógica de Cierre de Mes (Común a todos los programas)

**Trigger:** Clic en el botón `Cerrar Mes` (Ubicado en la cabecera de la columna del mes actual en la matriz).

**Lógica Paso a Paso:**
1. El sistema verifica que todas las actividades del mes tengan Estatus = `Finalizada` o `Cancelada`.
2. Si alguna actividad está `En Proceso`, bloquea el cierre y muestra Toast de error: "Existen actividades sin finalizar en este mes".
3. Si todas están finalizadas, suma los porcentajes de avance aportados por cada actividad.
4. Guarda el `Avance Total del Mes` (0-100%) en la tabla histórica del programa.
5. Envía el `Avance Total del Mes` al **Motor de Scoring** para que impacte la calificación de la Célula/Gerencia correspondiente.
6. Bloquea la edición de todas las celdas de ese mes (pasan a Solo Lectura).
7. Muestra Toast de éxito: "Mes cerrado correctamente. Avance: X%".
