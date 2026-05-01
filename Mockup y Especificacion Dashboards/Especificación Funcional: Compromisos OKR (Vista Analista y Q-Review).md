# Especificación Funcional: Compromisos OKR (Vista Analista y Q-Review)

## 1. Objetivo del Módulo
El módulo de Compromisos OKR permite a cada miembro del equipo (Analista) definir, actualizar y dar seguimiento a sus Objetivos y Resultados Clave (OKRs) trimestrales. Además, incluye el flujo de "Q-Review", donde el líder del equipo evalúa y califica el desempeño al final del trimestre, alimentando el Motor de Scoring.

## 2. Arquitectura de la Pantalla
La interfaz se divide en dos vistas principales, dependiendo del rol del usuario y el momento del trimestre:
- **Vista Analista (Mis OKRs):** Pantalla personal donde el analista ve sus objetivos actuales, actualiza el progreso de sus Key Results (KRs) y sube evidencias.
- **Vista Líder (Q-Review):** Pantalla de evaluación donde el jefe revisa los OKRs de su equipo, aprueba las evidencias y asigna la calificación final del trimestre.

## 3. Vista Analista (Mis OKRs)

### 3.1 Encabezado y Resumen
- **Selector de Trimestre:** Dropdown para navegar entre trimestres (ej. Q1 2025, Q2 2025).
- **Score Proyectado:** Cálculo en tiempo real de la calificación que obtendría el analista si el trimestre cerrara hoy, basado en el avance actual.
- **Estatus del Trimestre:** "En Progreso", "En Revisión (Q-Review)", "Cerrado".

### 3.2 Lista de Objetivos (Objectives)
Cada Objetivo se muestra como una tarjeta expandible que contiene:
- **Título del Objetivo:** Ej. "Mejorar la cobertura de escaneo DAST".
- **Peso del Objetivo:** Porcentaje que representa este objetivo sobre el total del trimestre (la suma de todos los objetivos debe ser 100%).
- **Barra de Progreso Global:** Promedio ponderado del avance de sus Key Results.

### 3.3 Resultados Clave (Key Results)
Dentro de cada Objetivo, se listan los KRs asociados:
- **Descripción del KR:** Ej. "Integrar 10 aplicaciones críticas al pipeline DAST".
- **Métrica:** Tipo de medición (Porcentaje, Numérico, Booleano).
- **Meta (Target):** El valor a alcanzar (ej. 10).
- **Valor Actual:** El valor reportado hasta el momento (ej. 6).
- **Actualizar Avance (Botón):** Abre un modal para registrar un nuevo valor, agregar un comentario y subir evidencia (URL o archivo).

## 4. Flujo de Q-Review (Vista Líder)
Al finalizar el trimestre, el estatus cambia a "En Revisión" y se activa la vista de Q-Review para el líder.

### 4.1 Panel de Equipo
- Lista de los miembros del equipo con su "Score Reportado" (lo que el analista dice que logró).
- Indicador visual de si la revisión ya fue completada o está pendiente.

### 4.2 Pantalla de Evaluación (Por Analista)
Al seleccionar a un analista, el líder ve la misma estructura de OKRs, pero con controles de evaluación:
- **Revisión de Evidencia:** El líder puede ver el historial de actualizaciones y descargar los archivos adjuntos.
- **Ajuste de Avance:** Si el líder considera que la evidencia no sustenta el avance reportado, puede ajustar el "Valor Validado" (ej. el analista reportó 100%, pero el líder lo ajusta a 80%).
- **Feedback:** Campo de texto obligatorio si se realiza un ajuste a la baja.
- **Calificación Final:** El sistema recalcula el Score Final basado en los valores validados por el líder.

### 4.3 Cierre de Trimestre
- Botón "Aprobar y Cerrar Q-Review".
- Al confirmar, el Score Final se congela y se envía al Motor de Scoring (Dashboard Team/Desempeño).
- El analista recibe una notificación con su calificación final y el feedback del líder.

## 5. Interacciones del Prototipo HTML (Mockup)
El prototipo `15_compromisos_okr_captura.html` implementa ambas vistas en una sola pantalla mediante un "Toggle de Rol" (simulador):
1. **Toggle Analista / Líder:** Un interruptor en la parte superior derecha permite cambiar entre la vista de captura (Analista) y la vista de evaluación (Líder).
2. **Actualización de KR (Vista Analista):** Al hacer clic en "Actualizar" en un KR, se abre un modal para ingresar el nuevo valor y subir evidencia. La barra de progreso se actualiza visualmente.
3. **Evaluación (Vista Líder):** En modo Líder, aparecen campos de "Valor Validado" junto a cada KR. Al modificar este valor, el "Score Final" en el encabezado se recalcula dinámicamente, mostrando la diferencia entre lo reportado y lo validado.
4. **Validación de Pesos:** Al igual que en los programas anuales, el sistema muestra una alerta si la suma de los pesos de los Objetivos no es 100%.

## 6. Reglas de Negocio
- **Bloqueo de Edición:** Una vez que el trimestre entra en "Q-Review", los analistas ya no pueden modificar sus avances ni subir nuevas evidencias.
- **Aprobación de Objetivos:** Al inicio del trimestre, los OKRs propuestos por el analista deben ser aprobados por el líder antes de que se consideren "Activos".
- **Cálculo de Score:** El score del OKR se calcula como: `Suma(Avance KR * Peso KR) * Peso Objetivo`. Este score representa una parte de la calificación total del analista en el Motor de Scoring (junto con SLAs y Actividades).
