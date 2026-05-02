# Especificación de Construcción: Bloque 8 - Motor de Scoring y Reglas Transversales

Este documento define a nivel de construcción el Motor de Scoring de la plataforma AppSec. Describe cómo se calculan las calificaciones de las células, el ciclo de vida de los programas, el proceso de "Freeze" de periodo y las reglas de negocio transversales.

---

## 1. Catálogos Requeridos (Base de Datos)

| Nombre del Catálogo | Valores por Defecto | Uso |
|---|---|---|
| `Cat_ComponenteScoring` | Vulnerabilidades, Programas Anuales, Iniciativas, OKRs | Define los pilares que componen la calificación final. |
| `Cat_PesoComponente` | Vulns (40%), Programas (30%), Iniciativas (15%), OKRs (15%) | Ponderación de cada pilar en el score global. |
| `Cat_EstatusPeriodo` | Abierto, En Cierre, Congelado (Freeze) | Controla si un mes/trimestre puede recibir modificaciones. |

---

## 2. Motor de Scoring (Lógica de Cálculo Core)

El Motor de Scoring es un proceso en background (cron job o trigger) que calcula la calificación de desempeño de cada Célula (Nivel 6) y la agrega hacia arriba en la jerarquía organizacional (Organización -> Gerencia -> Subdirección -> Dirección).

### 2.1 Cálculo del Pilar 1: Vulnerabilidades (Configurable, ej. 40%)
**Objetivo:** Penalizar a las células que tienen vulnerabilidades fuera de SLA o de alta criticidad.

- **Fórmula Base:** Configurable en el Builder (ej. Empieza en 100 puntos).
- **Deducciones (Parametrizables en el Motor de Fórmulas):**
  - El Administrador define reglas de deducción usando variables dinámicas.
  - Ejemplo de regla: `Si [Severidad] = 'Crítica' Y [Estatus_SLA] = 'Vencido' ENTONCES restar [Valor_Deduccion_Critica]`.
  - Los valores de deducción (ej. -5, -3, -1) se leen de un catálogo de configuración (`Cat_ReglasDeduccion`), no están quemados en código.
- **Tope:** Configurable (ej. mínimo 0).

### 2.2 Cálculo del Pilar 2: Programas Anuales (30%)
**Objetivo:** Premiar el cumplimiento de las actividades de seguridad programadas.

- **Fórmula Base:** Promedio ponderado del avance de los 5 sub-programas (SAST/SCA/CDS, DAST, MDA, Código Fuente, Servicios Regulados) asignados a la célula.
- **Fuente de Datos:** Lee directamente el `Avance Total del Mes` calculado en el cierre de mes de cada programa (Ver REQ_03).

### 2.3 Cálculo del Pilar 3: Iniciativas (15%)
**Objetivo:** Premiar la participación en proyectos especiales de seguridad.

- **Fórmula Base:** Promedio del avance de las iniciativas asignadas a la célula en el mes actual.
- **Fuente de Datos:** Lee el `% de Avance` del módulo de Iniciativas (Ver REQ_05).

### 2.4 Cálculo del Pilar 4: Compromisos OKR (15%)
**Objetivo:** Evaluar el desempeño individual de los analistas asignados a la célula.

- **Fórmula Base:** Promedio del `Score Final (Líder)` de todos los analistas vinculados a la célula en el trimestre actual.
- **Fuente de Datos:** Lee el resultado del Q-Review (Ver REQ_07).

### 2.5 Cálculo del Score Global de la Célula
- **Fórmula:** Calculada dinámicamente por el Motor de Fórmulas leyendo los pesos del catálogo `Cat_PesoComponente`.
  - Ejemplo dinámico: `(Score Vulns * {{peso_vulns}}) + (Score Programas * {{peso_programas}}) + (Score Iniciativas * {{peso_iniciativas}}) + (Score OKRs * {{peso_okrs}})`.
- **Resultado:** Un número (ej. 0 al 100, configurable) que representa la calificación de seguridad de la célula en ese mes.

---

## 3. Lógica de Agregación Jerárquica (Cascada Inversa)

Una vez calculado el score de todas las células (Nivel 6), el motor calcula el score de los niveles superiores promediando a sus hijos.

- **Score Organización (Nivel 5):** Promedio de los scores de todas las Células que le pertenecen.
- **Score Gerencia (Nivel 4):** Promedio de los scores de todas las Organizaciones que le pertenecen.
- **Score Subdirección (Nivel 3):** Promedio de los scores de todas las Gerencias que le pertenecen.
- **Score Dirección (Nivel 2):** Promedio de los scores de todas las Subdirecciones que le pertenecen.
- **Score Global (Nivel 1):** Promedio de los scores de todas las Direcciones.

---

## 4. Proceso de Freeze de Periodo (Cierre Mensual)

**Objetivo:** Congelar los datos de un mes para que los scores históricos sean inmutables y auditables.

### 4.1 Flujo de Freeze (Administrador)
**Ubicación en Menú:** `Configuración > Cierre de Periodo`

- **Vista Principal:** Tabla con los meses del año y su estatus actual (Abierto, En Cierre, Congelado).
- **Trigger:** Clic en el botón `Ejecutar Freeze` para el mes anterior (ej. en los primeros 5 días del mes actual).
- **Validaciones Previas:**
  1. Verifica que todos los Programas Anuales tengan su mes cerrado (REQ_03).
  2. Verifica que todos los Q-Reviews estén cerrados (si es fin de trimestre) (REQ_07).
- **Acción (Transacción de Base de Datos):**
  1. Ejecuta el Motor de Scoring para todas las células y niveles superiores.
  2. Guarda los resultados en la tabla histórica `Historico_Scoring_Mensual`.
  3. Cambia el `EstatusPeriodo` del mes a `Congelado`.
- **Efecto Transversal en la Plataforma:**
  - Ningún usuario (ni siquiera el Administrador) puede modificar registros (vulnerabilidades, avances, evidencias) cuya fecha de actualización pertenezca a un mes `Congelado`.
  - Los dashboards históricos leen exclusivamente de la tabla `Historico_Scoring_Mensual`, garantizando que los números reportados a dirección no cambien retroactivamente.
