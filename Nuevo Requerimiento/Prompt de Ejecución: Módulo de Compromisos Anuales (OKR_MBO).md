# Prompt de Ejecución: Módulo de Compromisos Anuales (OKR/MBO)

Copia y pega el siguiente texto al agente de desarrollo para que implemente el módulo y los dashboards:

---

**Contexto:**
Necesitamos implementar un nuevo módulo core en la plataforma AppSec: **Compromisos Anuales (OKR/MBO)**. Este módulo digitaliza la evaluación de desempeño del equipo, reemplazando hojas de cálculo manuales.

**Requerimientos Técnicos y Arquitectura:**
1.  **Modelo de Datos (Padre-Hijo):** Implementa una estructura relacional donde un `Compromiso` (Padre) puede tener múltiples `Sub-Compromisos` (Hijos). Ambos niveles tienen su propio peso porcentual (`peso_global` para el padre, `peso_interno` para el hijo). La suma de pesos en cada nivel debe ser estrictamente 100%. Cada compromiso padre debe tener `fecha_inicio` y `fecha_fin`.
2.  **Motor de Cascada (Roll-up):** Crea un servicio/worker que calcule automáticamente el avance.
    *   *Hijo a Padre:* `avance_padre = sum(avance_hijo * peso_interno)`
    *   *Padre a Global:* `calificacion_global = sum(avance_padre * peso_global)`
    *   *Equipo a Líder:* Si un compromiso de un líder está configurado como `tipo_medicion = 'cascada'`, su avance es el promedio automático de la `calificacion_global` de sus subordinados directos.
3.  **Jerarquía Configurable:** La relación de quién evalúa a quién (`evaluador_id`) debe ser configurable por usuario en este módulo, independiente del organigrama estricto. Puede haber analistas que reporten a un coordinador y otros directo al jefe.
4.  **Flujo de Aprobación por Q:** Implementa 4 periodos de evaluación (Q1, Q2, Q3, Q4).
    *   Cada Q tiene una `fecha_revision` configurable. El sistema debe enviar alertas 7 y 3 días antes.
    *   El colaborador carga avance, sube evidencias (archivos/URLs) y agrega comentarios por ítem. El sistema debe bloquear el envío si falta evidencia obligatoria.
    *   El evaluador recibe la notificación y puede: **Aprobar** (acepta el %), **Editar** (sobrescribe el % con su propia evaluación) o **Rechazar** (devuelve al colaborador con feedback para que corrija).
    *   Al cerrar el Q, el evaluador debe capturar una `retroalimentacion_general` obligatoria. Los registros quedan inmutables (Read-Only).
5.  **Ciclo de Vida Anual:** Implementa un flujo de aprobación del plan anual. El coordinador propone el plan de su equipo → El Jefe lo aprueba → El plan se congela (pesos inmutables). Debe existir la opción de "Clonar plan del año anterior" y soportar ingresos a mitad de año (evaluando solo los Qs restantes).

---

## Especificación de Dashboards y Vistas (UI/UX)

Implementa las siguientes 3 vistas principales siguiendo el estándar visual de la plataforma (Modo oscuro, paleta de colores, semáforo de estados):

### 1. Vista "Mis Compromisos" (Perfil del Colaborador)
*   **Header:** "Mis Compromisos 2026" + Selector de Q activo.
*   **KPIs Superiores:** Calificación Global Actual (%), Compromisos en Riesgo (avance < esperado), Evidencias Pendientes, Días para Cierre de Q.
*   **Lista de Compromisos (Acordeón):**
    *   Cada fila principal muestra el Compromiso Padre, su Categoría, Fechas, Peso Global y Barra de Progreso.
    *   Al expandir la fila, se ven los Sub-Compromisos (Hijos) en formato tabla: Nombre, Peso Interno, Resultado Esperado, Avance Reportado (input numérico), Campo de Comentarios, Botón "Subir Evidencia" (obligatorio si aplica), y Estatus (Pendiente / En Revisión / Aprobado / Rechazado).
*   **Panel Lateral (Feedback):** Historial de comentarios por ítem y la retroalimentación general del evaluador en Qs anteriores.
*   **Acción Principal:** Botón "Enviar Q a Revisión" (deshabilitado si faltan evidencias o la suma de pesos no es 100%).

### 2. Vista "Mi Equipo" (Para el Coordinador)
*   **Header:** "Evaluación de Equipo" + Selector de Q.
*   **KPIs Superiores:** Promedio de Calificación del Equipo, Analistas Listos para Revisión, Analistas con Retraso.
*   **Tabla de Seguimiento:** Listado de analistas directos. Columnas: Nombre, % Avance Global, Estatus de Carga (Faltan evidencias / Listo para revisión / Revisado).
*   **Drill-down (Módulo de Evaluación):** Al hacer clic en un analista, se abre su vista detallada. El coordinador ve exactamente lo que cargó el analista (evidencias y comentarios) y tiene 3 botones por cada sub-compromiso: `[Aprobar]` `[Editar %]` `[Rechazar]`. Debe haber un campo de texto para el Feedback oficial del Q.

### 3. Dashboard Ejecutivo (Para el Jefe de Jefatura)
*   **Header:** "Dashboard de Desempeño Global (OKR)" + Selector de Q.
*   **Visión 360° (Heatmap):** Matriz visual de toda la jefatura.
    *   *Filas:* Todos los colaboradores (agrupados por coordinador si aplica).
    *   *Columnas:* Q1, Q2, Q3, Q4, Global.
    *   *Celdas:* Color semáforo según la calificación (Verde >90%, Amarillo 70-89%, Rojo <70%).
*   **Simulador de Cascada (Panel Central):** Un widget visual (tipo árbol o diagrama de flujo) que muestra cómo el desempeño actual de las bases (analistas) está impactando matemáticamente la calificación global del Jefe en tiempo real.
*   **Bandeja de Acción:** Lista rápida de los colaboradores que le reportan directamente y están listos para ser evaluados (flujo idéntico a la vista del coordinador).

**Reglas Visuales:**
*   Usa chips de estado (`rounded-full`) para los estatus de revisión.
*   Las barras de progreso deben usar el semáforo de colores estándar de la plataforma.
*   Asegura que la navegación entre la vista de resumen del equipo y el detalle de evaluación de un analista sea fluida (sin recargar la página entera, preferiblemente con paneles laterales o modales grandes).
