# Plan Maestro de Cumplimiento y Riesgos (Especificación Técnica Maestra)

Fecha: 2026-04-27  
Alcance: secciones 1–40 de `Especificación Técnica Maestra: Plataforma AppSec.md`.

## 1) Matriz de cumplimiento (1–40)

Leyenda: **Sí** = cubierto mayormente, **Parcial** = existe base pero falta cierre funcional/UX/no-code, **No** = no implementado o sin evidencia suficiente.

| Sección | Estado | Brecha principal | Prioridad |
|---|---|---|---|
| 1. Principios generales | Parcial | Falta cumplimiento transversal homogéneo (drawers, WYSIWYG, no-code total, unsaved guard) | P0 |
| 2. Sidebar arquitectura | Parcial | Menú más cercano, pero aún conviven entradas legacy/no 100% relacional | P1 |
| 3. Organización (jerarquía) | Parcial | Árbol ya existe; falta score madurez real y captura unificada por nivel en drawer | P1 |
| 4. Inventario (repo/web) | Parcial | Hub con tabs existe; falta alinear columnas/filtros y tabs completas del detalle de activo | P1 |
| 5. Vulnerabilidades | Parcial | Mejoró listado + sheet; faltan todos los filtros avanzados y acciones completas por estatus | P0 |
| 6. Threat Modeling (MDA) | Parcial | Base funcional existe; falta cerrar UX por tabs y plan de trabajo/aprobación exacto | P1 |
| 7. MAST | Parcial | CRUD base; falta alineación total de captura y dashboard/contexto | P2 |
| 8. Planes de remediación | Parcial | Entidades base, falta experiencia integrada y vínculo operativo fuerte con hallazgos | P1 |
| 9. Operación (liberaciones/pipeline) | Parcial | Base sólida; falta consolidar kanban+tabla con reglas exactas y match enriquecido | P0 |
| 10. Revisión de terceros | Parcial | Entidades y pantallas base; falta checklist/evidencias con UX relacional final | P2 |
| 11. Programas e iniciativas | Parcial | Existen módulos; falta unificación completa en detalle padre-hijo y captura estandarizada | P0 |
| 12. Motor scoring mensual | Parcial | Hay piezas, falta motor único configurable y trazable end-to-end | P0 |
| 13. Seguridad código fuente | Parcial | Cobertura parcial por módulos relacionados; falta flujo integral de evaluación/checklist/hallazgos | P2 |
| 14. Servicios regulados | Parcial | Base existe; falta cobertura completa de ciclo mensual y tabs según spec | P2 |
| 15. Temas emergentes y auditorías | Sí/Parcial | Muy avanzado; falta estandarizar UX transversal y algunas reglas de inactividad | P1 |
| 16. Iniciativas | Parcial | CRUD y dashboard; falta cerrar detalle de hitos/actualizaciones 100% relacional | P1 |
| 17. Desempeño (OKR) | Parcial | Existe módulo + dashboard; falta cascada completa y flujo Q-review definitivo | P0 |
| 18. KPIs y notificaciones | Parcial | Fórmulas/notificaciones base; falta completar builder y ciclo de captura manual robusto | P1 |
| 19. Administración no-code | Parcial | Admin robusto, pero aún no cubre 100% de export, IA y dashboards como builders completos | P0 |
| 20. Roles/permisos granulares | Parcial | Roles/permisos existen; falta granularidad plena por widget/panel y data-scope consistente | P0 |
| 21. Dashboards (10) | Parcial | Existe suite V2; faltan cierres de detalle (WYSIWYG global, homogeneidad, algunos drill-down) | P1 |
| 22. IA transversal | Parcial | Triaje/hints existen; falta builder de prompts/providers y casos de uso expandidos | P1 |
| 23. Templates importación | Parcial | Templates en varias pantallas; falta cobertura estricta de todos los templates maestros | P1 |
| 24. Flujos estatus OOTB | Parcial | Base en flujos; falta validar catálogo/transiciones exactas por entidad contra maestro | P0 |
| 25. Reglas SLA | Parcial | SLA existe en partes; falta motor unificado con pausas/reanudaciones por excepción/riesgo | P0 |
| 26. No funcionales | Parcial | Seguridad fuerte; falta prueba formal de 10k filas y objetivo <3s en todos dashboards | P1 |
| 27. Ciclo de vida programas | No/Parcial | Falta freeze histórico + clonado anual con recálculo gobernado | P1 |
| 28. Ciclo de vida KPIs | No/Parcial | Falta congelamiento histórico/versionado de fórmulas y recálculo retroactivo explícito | P1 |
| 29. Excepciones y riesgo | Parcial | Entidades existen; falta flujo completo de aprobación con pausa SLA estricta | P0 |
| 30. Bitácora actividad | Parcial | Existe audit log, falta bitácora colaborativa por entidad con @menciones inmutables | P1 |
| 31. Omnisearch | Parcial | Command palette existe; falta búsqueda global agrupada multi-módulo y navegación a detalle | P1 |
| 32. Usuarios y reasignación | Parcial | Gestión usuarios existe; falta asistente robusto de reasignación masiva en offboarding | P1 |
| 33. Catálogos centrales | Parcial | Catálogos existen; falta validar set inicial completo y gobernanza de cambios | P2 |
| 34. Adjuntos | Parcial | Uploads existe; falta enforcement completo de formatos/tamaño/AV/S3 firmada | P0 |
| 35. Freeze mensual | No/Parcial | Falta job/política de cierre día 5 con desbloqueo auditado | P1 |
| 36. Estados UX transversales | Parcial | Hay skeletons y toasts en partes; falta patrón unificado en todas las vistas | P1 |
| 37. Acciones masivas | Parcial | Parcial en tablas; falta barra bulk estándar + confirmaciones fuertes | P1 |
| 38. Columnas configurables | Parcial | Mecanismos parciales; falta estándar único por usuario y persistencia global | P2 |
| 39. AI Builder | No/Parcial | Falta panel completo de providers/prompts/variables/temperatura por caso de uso | P1 |
| 40. Dashboard Builder | Parcial | Existe base de builder; falta cerrar grid/drag-drop/data-source/drill-down full no-code | P1 |

## 2) Plan por oleadas (ejecución recomendada)

### Oleada 0 (2–4 semanas) — “Convergencia crítica”
- Objetivo: estabilizar núcleos transversales que bloquean el 100% no-code.
- Entregables:
  - Motor de SLA unificado (sección 25 + 29).
  - Normalización de flujos de estatus OOTB (sección 24).
  - Paquete UX transversal v1: drawer filters + chips + export XLS/PDF(print) + unsaved guard (secciones 1, 36).
  - Permisos de datos por alcance (rol/célula) consistentes (sección 20).

### Oleada 1 (4–6 semanas) — “Builders y gobierno”
- Objetivo: convertir funcionalidades hardcodeadas en metadata administrable.
- Entregables:
  - AI Builder v1 (providers, prompts, variables, parámetros) (sección 39).
  - Dashboard Builder v1 (grid, widgets, data source, filtros globales, drill-down básico) (sección 40).
  - Plantillas de exportación administrables (sección 19.3).
  - Templates de importación maestros y rechazo estricto con bitácora de errores (sección 23).

### Oleada 2 (4–6 semanas) — “Ciclo de vida y operación avanzada”
- Objetivo: cerrar madurez operativa y trazabilidad de negocio anual/mensual.
- Entregables:
  - Freeze mensual + desbloqueo auditado (sección 35).
  - Ciclo de vida de programas (clonado anual, histórico) (sección 27).
  - Ciclo de vida de KPIs (versionado/congelamiento/recálculo opcional) (sección 28).
  - Reasignación masiva de offboarding + bulk actions estándar (secciones 32, 37).

## 3) Estrategia de mitigación para riesgos identificados

## Riesgo A — “No-code incompleto por hardcode”
- Riesgo: reglas clave siguen en código y rompen el principio 100% no-code.
- Estrategia:
  - Definir contrato de metadata mínimo: `schema_fields`, `status_flows`, `sla_rules`, `export_templates`, `dashboard_widgets`, `ai_prompts`.
  - Política “no nueva regla hardcode sin ADR temporal”.
  - Migrar gradualmente por dominio (vulnerabilidades → liberaciones → programas).
- Señal de éxito:
  - >80% de cambios funcionales comunes realizados desde admin sin deploy.

## Riesgo B — “Inconsistencia UX entre módulos”
- Riesgo: experiencia desigual (filtros, estados, detalle, export).
- Estrategia:
  - Kit UI obligatorio (`EntityListScaffold`): search + filter drawer + chips + bulk bar + export + empty/loading/error states.
  - Checklist de PR UX transversal.
  - Refactor por lotes: módulos de mayor uso primero.
- Señal de éxito:
  - 100% de tablas core usan el mismo patrón de interacción.

## Riesgo C — “Reglas de negocio transversales fragmentadas”
- Riesgo: SLA, excepciones, scoring y freeze implementados en sitios distintos.
- Estrategia:
  - Crear `policy_engine` de dominio con evaluadores declarativos.
  - Eventos de dominio (`status_changed`, `exception_approved`, `period_closed`) + reacciones.
  - Pruebas de contrato por regla transversal.
- Señal de éxito:
  - Mismo resultado de SLA/estatus sin importar módulo origen.

## Riesgo D — “Permisos granulares insuficientes”
- Riesgo: acceso por panel/widget o scope de datos inconsistente.
- Estrategia:
  - Matriz única `role x action x resource x scope`.
  - Middleware de autorización unificado + helpers frontend para ocultar/mostrar.
  - Tests por rol y por alcance.
- Señal de éxito:
  - Cero rutas sensibles accesibles fuera de policy.

## Riesgo E — “Capacidad/performance en importaciones y dashboards”
- Riesgo: timeout en 10k filas o dashboards >3s.
- Estrategia:
  - Pipeline de import asíncrono por lotes + validación fila a fila + reporte de rechazo.
  - Índices/materialized views para KPIs pesados.
  - Presupuestos de performance y pruebas de carga.
- Señal de éxito:
  - Import 10k sin timeout y p95 dashboards dentro de objetivo.

## Riesgo F — “IA sin control/observabilidad”
- Riesgo: respuestas inconsistentes, costos altos, falta trazabilidad.
- Estrategia:
  - AI Builder con versionado de prompts + feature flags por caso de uso.
  - Telemetría: latencia, costo, aceptación/rechazo, fallback.
  - Modo degradado “sin IA” funcional.
- Señal de éxito:
  - Cada caso IA auditable y reversible sin impacto operativo.

## Riesgo G — “Deuda de pruebas y regresiones”
- Riesgo: cambios transversales generan regresiones.
- Estrategia:
  - Contratos por módulo + pruebas E2E de journeys críticos.
  - Fixtures robustas sin interferencia por rate limiting en test.
  - Gates de CI por dominio (auth/SLA/builder/UX).
- Señal de éxito:
  - Disminución sostenida de fallos no determinísticos en CI.

## 4) Backlog inmediato recomendado (siguiente sprint)

- P0-1: `useUnsavedChanges` transversal en `Dialog/Sheet`.
- P0-2: Motor SLA único con pausa/reanudación por excepción.
- P0-3: Normalización de flujos de estatus OOTB (vulns/liberaciones/temas/auditorías).
- P0-4: Permisos por alcance de datos en endpoints críticos.
- P1-1: Plantillas export administrables (Excel/PDF) por módulo.
- P1-2: AI Builder v1 + Dashboard Builder v1 (capas mínimas viables).

