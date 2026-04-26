# Módulo de Compromisos Anuales (OKR/MBO)
## Plataforma AppSec — Especificación de Negocio (BRD)

Este documento define la arquitectura, reglas de negocio y flujos operativos para el nuevo módulo de **Compromisos Anuales**, diseñado para gestionar, medir y ponderar automáticamente el desempeño del equipo de Ciberseguridad Aplicativa.

---

## 1. Objetivo del Módulo

Digitalizar y automatizar el seguimiento de los compromisos anuales del equipo, eliminando el uso de hojas de cálculo manuales. El módulo permite:
1. Definir compromisos anuales personalizados por colaborador con pesos específicos, fechas de inicio y fin.
2. Soportar **múltiples evaluaciones por compromiso** (modelo Padre-Hijo) donde cada sub-ítem requiere su propia evidencia.
3. Cargar evidencias, registrar avances y capturar comentarios de forma trimestral (Q1, Q2, Q3, Q4).
4. **Ponderar automáticamente en cascada:** El cumplimiento de los analistas alimenta la calificación de sus coordinadores, y el de los coordinadores alimenta la calificación del jefe de la jefatura.
5. Proveer un flujo de validación multinivel (Aprobar/Editar/Rechazar) con retroalimentación general por Q.
6. Gestionar el ciclo de vida anual (clonación de planes, ingresos a mitad de año) con un flujo de aprobación formal antes de congelar los pesos.

---

## 2. Principios de Diseño (100% Builder)

El módulo sigue la filosofía *Configuration-Driven* de la plataforma:
*   **Categorías Configurables:** Las agrupaciones (ej. Financieros, Comerciales, Procesos Internos, Talento Humano) se definen desde el panel de administración.
*   **Jerarquía de Evaluación Configurable:** La relación de reporte para este módulo (quién evalúa a quién) se define en el Builder. No está rígidamente amarrada al organigrama general. Puede haber analistas que reporten a un coordinador y otros que reporten directamente al jefe.
*   **Pesos Personalizables:** Cada compromiso tiene un peso porcentual (ej. 35%, 15%, 5%) que debe sumar 100% por colaborador. Estos pesos se bloquean una vez que el Jefe aprueba el plan anual.

---

## 3. Estructura de Datos (Modelo Padre-Hijo)

Para soportar compromisos complejos (ej. "Excelencia Técnica" que incluye 5 cursos/certificaciones distintas), el sistema utiliza un modelo de dos niveles:

### 3.1 Nivel 1: Compromiso (Padre)
| Campo | Tipo | Descripción |
|---|---|---|
| **Colaborador** | Relación | Usuario al que pertenece el compromiso. |
| **Categoría** | Catálogo | Agrupación estratégica (ej. Procesos Internos). |
| **Nombre del Objetivo** | Texto | Título corto del compromiso (ej. "Excelencia Técnica"). |
| **Descripción** | Texto Largo | Detalle del alcance general. |
| **Peso Global (%)** | Porcentaje | Valor del compromiso sobre el 100% anual del colaborador. |
| **Fecha Inicio / Fin** | Fechas | Periodo de vigencia del compromiso (puede ser menor a un año). |
| **Tipo de Medición** | Selector | Manual (captura directa), Automática (cascada de equipo) o Por Sub-ítems (calculado por sus hijos). |

### 3.2 Nivel 2: Sub-Compromiso / Evaluación (Hijo)
*(Aplica solo si el Padre es de tipo "Por Sub-ítems")*
| Campo | Tipo | Descripción |
|---|---|---|
| **Compromiso Padre** | Relación | ID del compromiso al que pertenece. |
| **Nombre del Sub-ítem** | Texto | Ej. "Certificación Gobierno de TI". |
| **Resultado Esperado** | Texto | Qué se tiene que entregar exactamente. |
| **Peso Interno (%)** | Porcentaje | Valor del sub-ítem sobre el 100% del compromiso Padre. |
| **Evidencia Requerida** | Booleano | Si es obligatorio adjuntar archivo/URL para reportar avance. |

---

## 4. Ciclo de Vida Anual y Aprobación del Plan

El proceso de definición de compromisos ocurre al inicio de cada año o cuando ingresa un nuevo colaborador.

### 4.1 Creación o Clonación del Plan
*   **Nuevo Año:** El sistema permite "Clonar compromisos del año anterior". Esto copia la estructura completa (compromisos, sub-ítems, pesos, jerarquía) como borrador.
*   **Nuevos Ingresos:** Para colaboradores que entran a mitad de año, se crea un plan desde cero. El motor de scoring solo evaluará los Qs restantes (ej. si entra en julio, el 100% anual se calcula promediando solo Q3 y Q4).

### 4.2 Flujo de Aprobación del Plan Anual
Antes de que el ciclo inicie, los pesos deben congelarse mediante un flujo formal:
1.  **Propuesta:** El Coordinador diseña el plan de sus analistas (o el colaborador directo diseña el suyo) y lo envía a revisión.
2.  **Aprobación del Jefe:** El Jefe de la Jefatura revisa los planes propuestos. Puede solicitar ajustes o aprobarlos.
3.  **Congelamiento:** Una vez aprobado por el Jefe, el plan pasa a estado "Activo". Los pesos, nombres y jerarquías quedan bloqueados para el resto del año.

---

## 5. Flujo de Evaluación Trimestral (Q-Review)

El proceso de evaluación ocurre 4 veces al año (Q1, Q2, Q3, Q4) y sigue un flujo estricto de validación multinivel.

### 5.1 Fechas y Alertas del Q
*   El administrador define la **Fecha de Revisión** para cada Q (ej. 15 de abril para Q1).
*   El sistema envía alertas automáticas (correo/notificación) a los colaboradores 7 y 3 días antes de la Fecha de Revisión, recordando que deben cargar sus evidencias.

### 5.2 Paso 1: Carga del Colaborador
1. El colaborador entra a su vista "Mis Compromisos".
2. Por cada compromiso (o sub-compromiso), registra su **Avance Reportado (%)**.
3. Adjunta las **Evidencias** (archivos o URLs) obligatorias.
4. Agrega **Comentarios** justificando su avance en ese ítem específico.
5. Hace clic en "Enviar a Revisión". El sistema bloquea la edición para el colaborador.

### 5.3 Paso 2: Validación del Evaluador Directo
El evaluador directo (Coordinador o Jefe, según la jerarquía configurada) recibe la notificación.
1. Entra al "Módulo de Evaluación".
2. Revisa el avance reportado, las evidencias cargadas y los comentarios por ítem.
3. Se reúne con el colaborador (fuera del sistema) para discutir el desempeño.
4. En el sistema, toma una decisión por cada compromiso/sub-compromiso:
   *   ✅ **Aprobar:** Acepta el % reportado. El avance queda validado.
   *   ✏️ **Editar:** Ajusta el % de avance (ej. el colaborador reportó 100%, pero el evaluador decide que es 80%). El avance queda validado con el nuevo valor.
   *   ❌ **Rechazar:** Devuelve el compromiso al colaborador con feedback obligatorio. El colaborador debe corregir (ej. subir la evidencia correcta) y volver a enviar.

### 5.4 Paso 3: Cierre del Q y Retroalimentación General
Una vez que todos los compromisos de un colaborador están en estado "Aprobado" o "Editado", el evaluador "Cierra el Q" para esa persona.
*   **Retroalimentación General:** Al cerrar el Q, el evaluador debe capturar un comentario global sobre el desempeño del colaborador en ese trimestre.
*   **Inmutabilidad:** Los datos del Q cerrado quedan bloqueados (Read-Only) por motivos de auditoría.
*   **Recálculo en Cascada:** El motor actualiza automáticamente las calificaciones de los líderes que dependen de este colaborador.

---

## 6. Motor de Ponderación Automática en Cascada

El corazón del módulo es el motor de cálculo que automatiza la evaluación jerárquica.

### 6.1 Cálculo de Sub-ítems (Hijo a Padre)
`Avance del Padre = Σ (Avance Aprobado del Hijo × Peso Interno del Hijo)`
*Ejemplo:* Si "Excelencia Técnica" tiene 2 cursos (50% cada uno) y el colaborador completó 1 (100% aprobado) y el otro no (0%), el avance del Padre es 50%.

### 6.2 Cálculo Global del Colaborador
`Calificación Global = Σ (Avance Aprobado del Compromiso Padre × Peso Global del Compromiso)`
*Nota:* El Peso Global representa el máximo aporte al año. Si un compromiso pesa 30% y el colaborador saca 80% de avance promedio en los Qs evaluados, el aporte real a su calificación anual es 24% (30% × 0.80).

### 6.3 Cálculo en Cascada (Equipo a Líder)
Para los líderes (Coordinadores y Jefe), ciertos compromisos están configurados como *Automáticos* y dependen del desempeño de su equipo.
*   *Cálculo:* El sistema promedia las Calificaciones Globales de los colaboradores asignados a ese líder en la jerarquía del módulo, y asigna automáticamente ese valor al compromiso del líder.
*   *Beneficio:* Si a los analistas les va bien, el coordinador sube. Si a los coordinadores les va bien, el jefe sube. Todo en tiempo real sin intervención manual.

---

## 7. Reglas de Negocio Estrictas

1.  **Evidencia Obligatoria:** El sistema no permite al colaborador "Enviar a Revisión" si un sub-compromiso exige evidencia y no se ha adjuntado al menos un archivo o URL.
2.  **Suma Cero (Padres):** El Builder no permite enviar a aprobación el plan anual de un colaborador si la suma de los Pesos Globales de sus compromisos es diferente al 100%.
3.  **Suma Cero (Hijos):** Si un compromiso es de tipo "Por Sub-ítems", la suma de los Pesos Internos de sus hijos debe ser exactamente 100%.
4.  **Jerarquía Flexible:** Un colaborador puede reportar a un Coordinador, mientras que otro puede reportar directamente al Jefe. El flujo de validación se adapta dinámicamente a esta configuración.
