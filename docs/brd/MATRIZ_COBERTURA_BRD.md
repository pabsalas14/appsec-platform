# Matriz de cobertura — BRD (alto nivel)

*Última revisión: generada para planificación. Actualizar al cerrar entregas.*

Leyenda: **Hecho** = cumple el espíritu del requisito con evidencia. **Parcial** = API o UI incompleta vs texto BRD. **Pend** = no cubierto o solo prototipo.

| ID | Sección BRD (resumen) | Estado | Notas / brecha principal |
|----|------------------------|--------|----------------------------|
| P1 | §1 Objetivo — plataforma unificada | Parcial | Hay consolidación; falta cierre de todos los módulos operativos con la misma calidad. |
| P2 | §2 Principios (config-driven, schema dinámico, inventario, drill-down, filtros) | Parcial | Catálogos y permisos avanzan; **Schema Builder** dinámico de campos por entidad no está a nivel BRD. |
| P3 | §3.1–3.4 Jerarquía + inventarios (CRUD, import+template+export) | Parcial | Modelo y API; **UIs y plantillas de import** no uniformes en todos los catálogos. |
| P4 | §4 Motor de scoring mensual | Parcial | Entidades/ servicios; **actividades/pesos **configurables en UI y reporte 100% mes** según BRD: revisar. |
| P5 | §5.1–5.2 Programas SAST/SCA/CDS, DAST | Parcial | Modelos de vulnerabilidad/hallazgos; **separación de motores y campos Checkmarx** al detalle: comparar. |
| P6 | §5.3 MDA (amenazas, activos, plan, IA) | Parcial | Sesiones TM + IA + amenazas; **activos múltiples, plan de trabajo, artefactos** al alcance BRD. |
| P7 | §5.4 Código fuente (GitHub/Atlassian) | Parcial | Controles/ inventarios en modelo; **checklists y cierre operativo** según frentes. |
| P8 | §5.5 Servicios regulados | Parcial | Registros; **cierre multi-jefatura** según narrativa. |
| P9 | §6 MAST | Parcial | Entidad/ rutas; **UI y schema dinámico** al nivel BRD. |
| P10 | §7 Iniciativas | Parcial | CRUD; **actividades y scoring** integrados con §4 en UI. |
| P11 | §8 Auditorías | Parcial | Entidad; **requerimientos y fechas** según BRD. |
| P12 | §9 Temas emergentes | Parcial | **Bitácora, actividades, filtros** completos. |
| P13 | §10.1 Liberaciones (flujo Jira) | Parcial | Service release / etapas; **estados y campos** vs flujo diagrama. |
| P14 | §10.2 Pipeline SAST/DAST + match | Parcial | Hallazgo pipeline, etc.; **match ScanID+Branch** y carga de detalle masiva según BRD. |
| P15 | §10.3 Terceros | Parcial | **Checklist y evidencias** al detalle. |
| P16 | §11 Vulnerabilidades (estatus, excepciones, aceptación) | Parcial | Flujos y export; **matriz de estatus y reglas** 100% admin. |
| P17 | §12.1 Indicadores XXX-001… | Parcial | Indicador fórmula; **cálculo y tableros** según fórmulas oficiales. |
| P18 | §12.2 Score de madurez | Parcial | **Visible por célula/sub/org** como el BRD. |
| P19 | §13.1 Paneles modulares + **clicables** + tablas (búsqueda, filtros, orden, grupo, pág.) | Parcial | Visibilidad por rol; **drill 4 niveles, paneles con deep-link**, tablas con todas las capacidades. |
| P20 | §13.2 Filtros por módulo (tabla BRD) | Parcial | Jerarquía; **restante: motor, SLA, reincidencia, fechas, etc. por entidad**. |
| P21 | §13.3 Dashboards 1–9 (contenido) | Parcial | Vistas base; **heatmaps, kanban colapsable, tendencias, enlaces** a detalle. |
| P22 | §14.1–14.3 Roles, auditoría, notificaciones | Parcial | RBAC, audit log; **notificaciones con reglas/umbrales** §14.3. |
| P23 | §15 Config avanzada (flujos, periodos, plantillas, columnas kanban) | Parcial | Flujo estatus, settings; **plantillas de reporte PDF/Excel, columnas kanban** configurables. |
| P24 | §16 IA (MDA, triaje) | Hecho* | *Funcional; **cobertura de pruebas E2E** y más motores/ casos: ver plan. |

**Conclusión:** el BRD es **deliberadamente exhaustivo**; alcanzar 100% es un **programa** (múltiples entregas), no un único commit. El plan en `PLAN_CUMPLIMIENTO_100_BRD.md` desglosa fases y criterios de aceptación.
