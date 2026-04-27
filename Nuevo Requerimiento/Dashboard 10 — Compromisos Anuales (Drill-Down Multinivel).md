# Dashboard 10 — Compromisos Anuales (Drill-Down Multinivel)

Este documento detalla la especificación exacta del nuevo dashboard de Compromisos Anuales (OKR/MBO), diseñado con el mismo estándar de calidad, dinamismo y profundidad que los 9 dashboards principales de la plataforma AppSec.

El dashboard implementa una navegación **Drill-Down de 4 niveles**, permitiendo al Jefe de la Jefatura (o a cualquier líder) ir desde la visión macro de toda la organización hasta el detalle micro de la evidencia cargada por un analista en un sub-compromiso específico.

---

## NIVEL 0 — Visión Global de la Jefatura (Heatmap)

**Objetivo:** Mostrar el estado de salud general del desempeño de todo el equipo en un solo vistazo, identificando rápidamente quién va bien y quién está en riesgo.

**Header:** "Dashboard de Compromisos Anuales / Visión Global" + Selector de Año (ej. 2026) + Selector de Q Activo (ej. Q2).

**Fila de 4 KPIs Clickeables:**
*   **Calificación Global Promedio:** 82% (↑4% vs Q anterior). Mini gráfica de tendencia.
*   **Colaboradores en Riesgo:** 3 (15% del equipo con calificación < 70%). Chip rojo.
*   **Avance de Evaluación (Q Activo):** 14/20 evaluados (70%). Barra de progreso.
*   **Evidencias Pendientes de Carga:** 12 sub-ítems sin evidencia en el Q actual.

**Sección Central Izquierda: Simulador de Cascada (El Motor en Vivo)**
*   Un diagrama visual interactivo (tipo árbol horizontal o Sankey).
*   **Nodo Raíz (Tú):** Muestra tu calificación global calculada en tiempo real (ej. 85%).
*   **Nodos Hijos (Coordinadores):** Eduardo (88%), Pablo (82%).
*   **Nodos Nietos (Analistas):** Ramón (90%), Alexis (85%), Roberto (75%), etc.
*   *Interacción:* Al pasar el mouse sobre un nodo, muestra qué porcentaje exacto está aportando ese colaborador a la calificación de su líder.

**Sección Central Derecha: Heatmap de Desempeño 360°**
*   Matriz visual densa.
*   **Filas:** Todos los colaboradores de la jefatura, agrupados por su líder directo (ej. Grupo "Reportan a Eduardo", Grupo "Reportan Directo").
*   **Columnas:** Q1, Q2, Q3, Q4, Calificación Anual Proyectada.
*   **Celdas:** Muestran el % de calificación de ese Q. El color de fondo es el semáforo estándar: Verde (>85%), Amarillo (70-84%), Rojo (<70%).
*   *Interacción:* Al hacer clic en la fila de un colaborador (ej. Ramón Aguilar) → **Navega al NIVEL 1**.

---

## NIVEL 1 — Vista del Colaborador (ej. Ramón Aguilar)

**Objetivo:** Analizar el desempeño de una persona específica, viendo cómo se compone su calificación global a través de sus compromisos padre.

**Breadcrumb:** Dashboard > Visión Global > Ramón Aguilar

**Header:** Perfil de Desempeño: Ramón Aguilar (Analista Ofensiva) + Avatar + Calificación Global: 90% (Verde).

**Fila de 3 KPIs del Colaborador:**
*   **Compromisos Asignados:** 4 (Suman 100% del peso).
*   **Sub-ítems Evaluables:** 12 totales.
*   **Estatus del Q Activo:** "Listo para Revisión" (Chip azul).

**Gráfica Radar (Spider Chart):**
*   Muestra el balance del colaborador en las 4 categorías estratégicas: Financieros, Comerciales, Procesos Internos, Talento Humano.
*   Compara el "Esperado" (línea gris punteada) vs el "Logrado" (área azul translúcida).

**Tabla Principal: Desglose de Compromisos (Padres)**
*   **Columnas:** Categoría (Chip), Nombre del Compromiso, Fechas (Inicio - Fin), Peso Global (%), Avance Q1, Avance Q2, Avance Q3, Avance Q4, Calificación Actual (Barra de progreso semáforo).
*   **Datos de ejemplo:**
    *   Procesos Internos | Plan Director | Ene-Dic | 35% | 100% | 90% | - | - | 95% 🟢
    *   Procesos Internos | Operación y Temas Emergentes | Ene-Dic | 20% | 80% | 85% | - | - | 82.5% 🟡
    *   Talento Humano | Excelencia Técnica | Ene-Jun | 15% | 50% | 100% | - | - | 75% 🟡
*   *Interacción:* Al hacer clic en una fila (ej. Excelencia Técnica) → **Navega al NIVEL 2**.

---

## NIVEL 2 — Vista del Compromiso (ej. Excelencia Técnica)

**Objetivo:** Entender por qué un compromiso específico tiene esa calificación, desglosando sus sub-ítems (hijos) y evaluando el avance granular.

**Breadcrumb:** Dashboard > Visión Global > Ramón Aguilar > Excelencia Técnica

**Header:** Detalle de Compromiso: Excelencia Técnica (Peso Global: 15%) + Calificación Actual: 75%.

**Panel de Contexto (Arriba):**
*   **Descripción:** Desarrollar las capacidades técnicas del equipo a través de certificaciones, laboratorios, cursos internos y autoaprendizaje.
*   **Soporte:** Certificaciones, Personal interno, Udemy.
*   **Fechas:** 01/Ene/2026 - 30/Jun/2026.

**Tabla de Sub-ítems (Hijos):**
*   **Columnas:** Nombre del Sub-ítem, Resultado Esperado, Peso Interno (%), Evidencia Requerida (Sí/No), Avance Reportado (%), Comentarios del Colaborador, Estatus de Revisión (Chip).
*   **Datos de ejemplo:**
    *   Certificación Gobierno de TI | Aprobación del examen | 30% | Sí | 100% | "Examen aprobado el 15 de mayo" | Aprobado ✅
    *   Taller Desarrollo Profesional | Asistencia confirmada | 15% | Sí | 100% | "Asistí a las 3 sesiones" | Aprobado ✅
    *   Workshop Checkmarx One | Constancia | 15% | Sí | 0% | "Se pospuso para julio" | Pendiente ⏳
    *   Conocimientos IAC | Implementación en Sandbox | 40% | Sí | 80% | "Scripts de Terraform listos" | En Revisión 🔍
*   *Interacción:* Al hacer clic en una fila (ej. Conocimientos IAC) → **Abre el Panel Lateral (NIVEL 3)**.

---

## NIVEL 3 — Panel Lateral de Evaluación (Action Center)

**Objetivo:** Ver la evidencia física, leer los comentarios del colaborador y ejecutar la acción de validación (Aprobar/Editar/Rechazar). Este es el "Zoom" máximo.

**Comportamiento:** Slide-in panel desde la derecha (no abandona la pantalla del Nivel 2).

**Contenido del Panel:**
*   **Header:** Evaluando: Conocimientos IAC (Ramón Aguilar).
*   **Sección 1: Lo que reportó el colaborador**
    *   *Avance Reportado:* 80%
    *   *Comentarios de Ramón:* "Ya terminé los scripts de Terraform para desplegar la infraestructura base. Me falta afinar los playbooks de Ansible para el hardening de CIS, calculo terminarlo la próxima semana."
    *   *Evidencias Adjuntas:*
        *   📄 `repo_terraform_sandbox.zip` (Botón para descargar)
        *   🔗 `https://github.com/org/repo/pull/142` (Link clickeable)
*   **Sección 2: Historial del Q**
    *   Timeline vertical mostrando cuándo Ramón subió la evidencia, si hubo rechazos previos, etc.
*   **Sección 3: Acción del Evaluador (Tú o el Coordinador)**
    *   *Calificación Final del Q:* Input numérico (pre-llenado con el 80% que reportó Ramón, pero editable).
    *   *Feedback del Ítem:* Textarea para escribir la retroalimentación específica (ej. "Buen avance con Terraform, pero no puedo darte el 80% hasta ver Ansible. Te lo ajusto a 60% por ahora.").
    *   *Botones de Acción:*
        *   🟩 **Aprobar** (Guarda la calificación y cierra el sub-ítem).
        *   🟨 **Editar %** (Guarda la calificación modificada y notifica a Ramón).
        *   🟥 **Rechazar** (Devuelve el sub-ítem a Ramón, exigiendo que suba nueva evidencia).

---

## Cierre del Q y Retroalimentación General

Una vez que todos los sub-ítems de un colaborador han sido evaluados (Aprobados o Editados), el evaluador debe cerrar formalmente el Q para esa persona.

**Modal de Cierre de Q:**
*   **Resumen:** Muestra la calificación final calculada para el Q (ej. 82%).
*   **Retroalimentación General:** Un campo de texto obligatorio grande donde el evaluador escribe sus comentarios generales sobre el desempeño del colaborador en todo el trimestre, destacando fortalezas y áreas de mejora.
*   **Acción:** Botón "Cerrar Q y Congelar Resultados". Una vez presionado, los datos del Q quedan inmutables.
