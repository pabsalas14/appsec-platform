# SCR - Pendientes Operativos Implementados

Este documento queda como bitácora de los pendientes operativos que ya fueron
cerrados para que el módulo SCR muestre datos reales persistidos.

## Implementado y conectado

- Hallazgos globales, filtros, selección, export local y acciones masivas usan
  datos reales de `code_security_findings`.
- Forense global, búsqueda, timeline, anomalías y detalle de commit usan
  eventos reales de `code_security_events`.
- Historial, comparación, re-escaneo y export por revisión usan revisiones,
  hallazgos, eventos y reportes reales.
- Dashboard SCR está filtrado por usuario y ya no agrega datos de otros dueños.
- Routers SCR mock de hallazgos fueron desactivados del router principal.
- El pipeline persiste `started_at`, `completed_at`, `duration_ms`,
  `total_tokens_used` y `estimated_cost_usd` en cada revisión.
- Cada agente persiste telemetría por etapa en `scr_analysis_metrics`:
  duración, proveedor, modelo, tokens, costo estimado, estado y contexto.
- Cada ejecución SCR es un registro histórico independiente. El endpoint de
  análisis solo acepta revisiones `PENDING`; los re-escaneos crean una revisión
  nueva para preservar historial, costos y comparaciones.
- Las métricas de agentes se registran en transacción durable propia, por lo que
  los escaneos fallidos conservan tokens/costo si alcanzaron a llamar al LLM.
- Las estadísticas de agentes calculan tokens, tiempo promedio, costo y precisión
  validada usando hallazgos confirmados frente a falsos positivos.
- Los hallazgos exponen `assignee_email` y `assignee_name` para las vistas
  globales y de detalle.
- La comparación de escaneos tiene export dedicado en
  `GET /api/v1/code_security_reviews/compare/export`.
- Se cerraron brechas de auditoría: `/admin/scr` requiere rol backoffice,
  WebSocket SCR valida usuario/ownership, falso positivo ya no permite IDOR y
  las acciones de hallazgos registran historial básico.
- Detective persiste eventos generados por LLM y GitHub trae archivos/líneas por
  commit para que Forense tenga evidencia real.
- Inspector procesa el repositorio por chunks configurables y los prompts de
  Inspector, Detective y Fiscal respetan la configuración del módulo Agentes.
- Los toggles de patrones se persisten en configuración de agente.
- Hallazgos y Forense global usan endpoints agregados server-side para evitar
  N+1 de frontend.
- Configuración LLM actualizada para Anthropic: se reemplazó el default obsoleto
  `claude-3-5-sonnet-20241022` por modelos Claude vigentes y se normalizan
  alias retirados.
- Se agregó cancelación operativa de escaneos en ejecución.
- Se agregaron comentarios/bitácora por hallazgo usando el historial SCR.
- Exports globales de hallazgos y eventos forenses se sirven desde backend.
- Costos guardan metadata de input/output tokens cuando el proveedor la reporta.
- Tokens SCM aceptan GitHub y GitLab en la configuración administrativa.
- Runtime check disponible en `GET /api/v1/admin/scr/runtime-check`.

## Pendientes cerrados

1. **Duración real del escaneo**
   - Implementado: se persiste por revisión y por etapa/agente.

2. **Costo real y tokens consumidos**
   - Implementado: se guarda el uso real reportado por el proveedor cuando está
     disponible y se calcula costo estimado por proveedor/modelo.

3. **Precisión real de agentes**
   - Implementado: se calcula desde estados validados por analistas
     (`VERIFIED`, `CORRECTED`, `CLOSED`, `IN_CORRECTION`) contra
     `FALSE_POSITIVE`.

4. **Asignación por analista en hallazgos globales**
   - Implementado: el backend resuelve usuario asignado y la UI muestra nombre o
     email.

5. **Export PDF de comparación**
   - Implementado: endpoint dedicado con PDF comparativo y resumen de hallazgos
     nuevos, resueltos y persistentes.

6. **Auditoría posterior**
   - Implementado: autorización admin real, WebSocket seguro, corrección IDOR,
     eventos Detective persistidos, prompts aplicados a todos los agentes,
     chunking de Inspector, toggles de patrones y endpoints globales.

7. **Cierre de desarrollo SCR**
   - Implementado: modelo Anthropic vigente, cancelación, comentarios,
     export server-side global, GitLab básico, runtime-check y telemetría de
     tokens input/output en `extra`.

