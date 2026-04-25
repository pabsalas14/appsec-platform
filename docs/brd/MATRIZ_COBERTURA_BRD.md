# Matriz de cobertura — BRD (alto nivel)

*Última revisión: 2026-04-25 — Export CSV `programa_dasts`; `hallazgo_pipelines.scan_id` + filtro (correlación pipeline BRD C2); *ruff format* en CI; resto: filtros URL dashboards, audit logs, 422, `make types`.*

Leyenda: **Hecho** = cumple el espíritu del requisito con evidencia. **Parcial** = API o UI incompleta vs texto BRD. **Pend** = no cubierto o solo prototipo.

| ID | Sección BRD (resumen) | Estado | Notas / brecha principal |
|----|------------------------|--------|----------------------------|
| P1 | §1 Objetivo — plataforma unificada | Parcial | Hay consolidación; falta cierre de todos los módulos operativos con la misma calidad. |
| P2 | §2 Principios (config-driven, schema dinámico, inventario, drill-down, filtros) | Parcial | Catálogos y permisos avanzan; **Schema Builder** dinámico de campos por entidad no está a nivel BRD. |
| P3 | §3.1–3.4 Jerarquía + inventarios (CRUD, import+template+export) | Hecho | CRUD UI homogéneo (tabla, búsqueda, orden, paginación) + import/template/export CSV en catálogos/inventario §3 (incluye jerarquía org, servicios, repositorios, activos web, tipos/controles) con pruebas A4 de cadena y ownership. |
| P4 | §4 Motor de scoring mensual | Hecho | Score mensual SAST recalculado con `scoring.pesos_severidad`, sub-estados configurables (`scoring.sast_mensual`), endpoint de configuración y sincronización automática/manual de hallazgos. |
| P5 | §5.1–5.2 Programas SAST/SCA/CDS, DAST | Hecho | Programas SAST, DAST y Source Code con `metadatos_motor` JSON (API + UI), import/export y tipos OpenAPI regenerados; campos de motor administrables sin cambios de código. |
| P6 | §5.3 MDA (amenazas, activos, plan, IA) | Hecho | Sesión TM con IA + amenazas, backlog, plan, activo secundario, activos múltiples relacionados y adjuntos/referencias JSON; cobertura de pruebas de sesión/IA mantenida. |
| P7 | §5.4 Código fuente (GitHub/Atlassian) | Parcial | Controles/ inventarios en modelo; **checklists y cierre operativo** según frentes. |
| P8 | §5.5 Servicios regulados | Parcial | Registros; **cierre multi-jefatura** según narrativa. |
| P9 | §6 MAST | Parcial | Entidad/ rutas; **UI y schema dinámico** al nivel BRD. |
| P10 | §7 Iniciativas | Parcial | CRUD; **actividades y scoring** integrados con §4 en UI. |
| P11 | §8 Auditorías | Parcial | **+** export CSV + schema `estado` en create; tests. **Pend.:** requerimientos/fechas/cierre al detalle BRD. |
| P12 | §9 Temas emergentes | Parcial | **+** export CSV (`emerging_themes.export`, A7). **Pend.:** bitácora/actividades/filtros §9 al completo. |
| P13 | §10.1 Liberaciones (flujo Jira) | Parcial | Service release / etapas; **estados y campos** vs flujo diagrama. |
| P14 | §10.2 Pipeline SAST/DAST + match | Parcial | **+** `scan_id` en hallazgo pipeline y filtro listado; rama vía `pipeline_releases.rama`. **Pend.:** carga masiva de detalle, SCA, match avanzado. |
| P15 | §10.3 Terceros | Parcial | **Checklist y evidencias** al detalle. |
| P16 | §11 Vulnerabilidades (estatus, excepciones, aceptación) | Parcial | Flujos y export; **matriz de estatus y reglas** 100% admin. |
| P17 | §12.1 Indicadores XXX-001… | Parcial | Indicador fórmula; **cálculo y tableros** según fórmulas oficiales. |
| P18 | §12.2 Score de madurez | Parcial | **Visible por célula/sub/org** como el BRD. |
| P19 | §13.1 Paneles modulares + **clicables** + tablas (búsqueda, filtros, orden, grupo, pág.) | Parcial | **+** home: `StatCard` con `href` a módulos; vulnerabilidades con filtros en querystring; **filtros jerárquicos (4 niveles) en URL** en home y paneles; índice `/dashboards` propaga query a sub-rutas. **Pend.:** tablas avanzadas everywhere. |
| P20 | §13.2 Filtros por módulo (tabla BRD) | Parcial | **+** vulnerabilidades: búsqueda, severidad, SLA vencida vía URL. **Pend.:** motor, reincidencia, más entidades. |
| P21 | §13.3 Dashboards 1–9 (contenido) | Parcial | Vistas base; **heatmaps, kanban colapsable, tendencias, enlaces** a detalle. |
| P22 | §14.1–14.3 Roles, auditoría, notificaciones | Parcial | **+** notificaciones in-app (entidad + API + campana + `marcar-todas-leidas` + PBAC). **Pend.:** reglas/umbrales automáticos §14.3. |
| P23 | §15 Config avanzada (flujos, periodos, plantillas, columnas kanban) | Parcial | Flujo estatus, settings; **plantillas de reporte PDF/Excel, columnas kanban** configurables. |
| P24 | §16 IA (MDA, triaje) | Hecho* | *Funcional; **cobertura de pruebas E2E** y más motores/ casos: ver plan. |

**Conclusión:** el BRD es **deliberadamente exhaustivo**; alcanzar 100% es un **programa** (múltiples entregas), no un único commit. El plan en `PLAN_CUMPLIMIENTO_100_BRD.md` desglosa fases y criterios de aceptación.
