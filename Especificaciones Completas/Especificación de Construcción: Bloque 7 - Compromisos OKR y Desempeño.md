# Especificación de Construcción: Bloque 7 - Compromisos OKR y Desempeño

Este documento define a nivel de construcción el módulo de Compromisos OKR y Desempeño. Describe el flujo de captura de objetivos (Padre-Hijo), la auto-evaluación del analista, el proceso de Q-Review (evaluación del líder) y la integración con el Motor de Scoring.

---

## 1. Catálogos Requeridos (Base de Datos)

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_PeriodoOKR` | Q1, Q2, Q3, Q4 | Define el trimestre de evaluación. |
| `Cat_EstatusOKR` | Propuesto, Aprobado, En Riesgo, Completado, Cancelado | Controla el ciclo de vida del objetivo. |
| `Cat_TipoMedicion` | Porcentaje (0-100%), Numérico (Cantidad), Booleano (Sí/No) | Define cómo se mide el Key Result. |

---

## 2. Pantalla 1: Mis Compromisos (Vista Analista)

**Ubicación en Menú:** `Desempeño > Mis Compromisos`

### 2.1 Vista Principal (Acordeón Padre-Hijo)
- **Componente:** Lista tipo acordeón. Cada fila principal es un **Objetivo (O)**, al expandir muestra sus **Key Results (KR)**.
- **Filtro Superior:** Periodo (Dropdown, lee de `Cat_PeriodoOKR`, por defecto el actual).
- **Botón Principal:** `+ Nuevo Objetivo`.

### 2.2 Formulario de Captura de Objetivo (Modal)
- **Campo 1: Título del Objetivo** (Text Input, Obligatorio).
- **Campo 2: Descripción** (Textarea, Opcional).
- **Campo 3: Periodo** (Dropdown, lee de `Cat_PeriodoOKR`, Obligatorio).
- **Campo 4: Peso Relativo (%)**
  - Tipo: Number Input.
  - Validación: La suma de los pesos de todos los Objetivos del analista en el trimestre debe ser exactamente 100%.

### 2.3 Formulario de Captura de Key Result (Modal)
**Trigger:** Clic en `+ Agregar KR` dentro de un Objetivo expandido.

- **Campo 1: Título del Key Result** (Text Input, Obligatorio).
- **Campo 2: Tipo de Medición** (Dropdown, lee de `Cat_TipoMedicion`, Obligatorio).
- **Campo 3: Meta (Target)** (Number Input, Obligatorio).
- **Campo 4: Peso Relativo dentro del Objetivo (%)**
  - Tipo: Number Input.
  - Validación: La suma de los pesos de los KRs dentro de un mismo Objetivo debe ser exactamente 100%.

### 2.4 Flujo de Auto-Evaluación (Actualización de Avance)
**Trigger:** Clic en el botón `Actualizar Avance` de un KR.

- **Campo 1: Valor Actual** (Number Input, Obligatorio).
- **Campo 2: Comentarios de Avance** (Textarea, Obligatorio).
- **Campo 3: Evidencia** (File Upload, Opcional).
- **Lógica de Cálculo Automático:**
  1. El sistema calcula el `% de Avance del KR` = `(Valor Actual / Meta) * 100`.
  2. Multiplica ese avance por el `Peso Relativo del KR` para obtener su aportación al Objetivo.
  3. Suma las aportaciones de todos los KRs para calcular el `% de Avance del Objetivo`.
  4. Multiplica el avance del Objetivo por su `Peso Relativo` para obtener la aportación al Score Total del Trimestre.

---

## 3. Pantalla 2: Q-Review (Vista Líder / Jefatura)

**Ubicación en Menú:** `Desempeño > Q-Review Equipo`

### 3.1 Vista Principal (Tabla de Equipo)
- **Componente:** DataGrid.
- **Columnas:** Analista, Rol, Células Asignadas, Score Auto-Evaluación, Score Final (Líder), Estatus Q-Review.
- **Filtro Superior:** Periodo (Dropdown).
- **Interacción:** Clic en una fila abre el Drawer de Evaluación.

### 3.2 Flujo de Evaluación (Drawer Lateral)
- **Sección 1: Resumen del Analista**
  - Muestra el Score calculado automáticamente por el sistema basado en la auto-evaluación.
- **Sección 2: Revisión de Objetivos (Grid Editable)**
  - Muestra todos los Objetivos y KRs del analista.
  - **Campo: Calificación del Líder (%)**
    - Tipo: Number Input (0-100).
    - Lógica: El líder puede sobreescribir el avance calculado por el sistema si considera que la calidad no fue la esperada.
  - **Campo: Feedback** (Textarea, Obligatorio si la calificación del líder es menor a la auto-evaluación).
- **Sección 3: Evaluación Cualitativa**
  - `Alineación a Valores Core` (Dropdown: Excede, Cumple, Requiere Mejora).
  - `Comentarios Generales del Trimestre` (Textarea).

**Botón: Cerrar Q-Review**
- **Acción:** Congela las calificaciones del analista para ese trimestre.
- **Resultado:** Envía el `Score Final (Líder)` al Motor de Scoring como la calificación oficial de desempeño del analista para el periodo. Dispara notificación al analista con el feedback.
