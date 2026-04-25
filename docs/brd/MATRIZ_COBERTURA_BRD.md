# Matriz de cobertura — BRD (alto nivel)

*Última revisión: 2026-04-26 — **Cierre de lotes 1–12** (ver [`AUDITORIA_HUECOS_Y_ORDEN.md` §10](AUDITORIA_HUECOS_Y_ORDEN.md#10-orden-de-implementación-global-propuesta) y G1: [`MATRIZ_PERMISOS_G1.md`](MATRIZ_PERMISOS_G1.md)) + auditoría fases. **Lote 13 (mapeo formal D1–9)** sigue en [`MAPEO_DASHBOARDS_BRD_DIFERIDO.md`](MAPEO_DASHBOARDS_BRD_DIFERIDO.md). **E–G–H** desglosado en [`ANALISIS_FASES_E_G_H.md`](ANALISIS_FASES_E_G_H.md).*

Leyenda: **Hecho** = cumple el espíritu del requisito con evidencia. **Parcial** = API o UI incompleta vs texto BRD. **Pend** = no cubierto o solo prototipo.

| ID | Sección BRD (resumen) | Estado | Notas / brecha principal |
|----|------------------------|--------|----------------------------|
| P1 | §1 Objetivo — plataforma unificada | Parcial | Hay consolidación; falta cierre de todos los módulos operativos con la misma calidad. |
| P2 | §2 Principios (config-driven, schema dinámico, inventario, drill-down, filtros) | Parcial | Catálogos y permisos avanzan; **Schema Builder** dinámico de campos por entidad no está a nivel BRD. |
| P3 | §3.1–3.4 Jerarquía + inventarios (CRUD, import+template+export) | Hecho | CRUD UI homogéneo (tabla, búsqueda, orden, paginación) + import/template/export CSV en catálogos/inventario §3 (incluye jerarquía org, servicios, repositorios, activos web, tipos/controles) con pruebas A4 de cadena y ownership. |
| P4 | §4 Motor de scoring mensual | Hecho | Score mensual SAST recalculado con `scoring.pesos_severidad`, sub-estados configurables (`scoring.sast_mensual`), endpoint de configuración y sincronización automática/manual de hallazgos. |
| P5 | §5.1–5.2 Programas SAST/SCA/CDS, DAST | Hecho | Programas SAST, DAST y Source Code con `metadatos_motor` JSON (API + UI), import/export y tipos OpenAPI regenerados; campos de motor administrables sin cambios de código. |
| P6 | §5.3 MDA (amenazas, activos, plan, IA) | Hecho | Sesión TM con IA + amenazas, backlog, plan, activo secundario, activos múltiples relacionados y adjuntos/referencias JSON; cobertura de pruebas de sesión/IA mantenida. |
| P7 | §5.4 Código fuente (GitHub/Atlassian) | Hecho* | *+ Lote 12:* `programa_source_codes` con listado **paginado** + `estado` / `q` (F3); checklists y cierre operativo al detalle de negocio pueden requerir acta. |
| P8 | §5.5 Servicios regulados | Parcial | Registros; **cierre multi-jefatura** según narrativa. |
| P9 | §6 MAST | Parcial | Entidad/ rutas; **UI y schema dinámico** al nivel BRD. |
| P10 | §7 Iniciativas | Parcial | CRUD; **actividades y scoring** integrados con §4 en UI. |
| P11 | §8 Auditorías | Parcial | **+** export CSV + schema `estado` en create; tests. **Pend.:** requerimientos/fechas/cierre al detalle BRD. |
| P12 | §9 Temas emergentes | Parcial | **+** export CSV + **filtros** API `estado` / `tipo` / `q` (F3). **Pend.:** bitácora/actividades al detalle narrativo BRD. |
| P13 | §10.1 Liberaciones (flujo Jira) | Hecho* | *API:* `contexto_liberacion` + `fecha_entrada`, `GET /service_releases/config/operacion` (transiciones + kanban), listado con filtros; transiciones vía `flujo.transiciones_liberacion`. **Falta** homogeneizar 100% si se exigen pantallas viva-voz. |
| P14 | §10.2 Pipeline SAST/DAST + match | Hecho* | *+ Lote 9:* detección de **duplicados** título+archivo+línea+scan al crear/importar. *Pend. opc.:* matices SCA/empresa única. |
| P15 | §10.3 Terceros | Hecho* | *Checklist* JSON + `GET /revision_terceros/config/checklist` + UI §10.3; matices: plantilla admin vía `catalogo.checklist_revision_tercero` opcional. |
| P16 | §11 Vulnerabilidades (estatus, excepciones, aceptación) | Hecho* | *D1/D2* como en fila anterior + **edición D1** en `/admin/operacion` + **tooltip D2** en dashboard. **Falta** (opcional) E2E explícito de admin. |
| P17 | §12.1 Indicadores XXX-001… | Hecho* | *+ Lotes 1–2:* motor `evaluate_formula` (ratio/aggregate/scale), `GET /indicadores/{code}/calculate|trend|aggregate`, **semillas** `XXX-001`…`XXX-005`, `KRI0025` + `001b` en `seed` (propiedad del admin). Página `indicadores` en UI. |
| P18 | §12.2 Score de madurez | Hecho* | *+ Lote 3:* `GET /madurez/summary` (jerarquía) + **`export.csv`**, pruebas `test_madurez.py`. |
| P19 | §13.1 Paneles modulares + **clicables** + tablas (búsqueda, filtros, orden, grupo, pág.) | Parcial | **+** vulnerabilidades: tabla + orden + paginación vía API; home/paneles con drill-down; **Pend.:** mismo nivel en *todos* los módulos listados en §13.2. |
| P20 | §13.2 Filtros por módulo (tabla BRD) | Hecho* | *+ Lote 10:* extensión a **programa source code**; ya homogéneos iniciativas, temas, auditorías, liberaciones, etc. (validar módulo residual vs §13.2 con negocio). |
| P21 | §13.3 Dashboards 1–9 (contenido) | Hecho* | *+ Lote 11:* `trend`/`aggregate` en indicadores y tendencias en dashboard ejecutivo; **Lote 13** = checklist formal 1–9. |
| P22 | §14.1–14.3 Roles, auditoría, notificaciones | Hecho* | *+ Lote 4/6:* reglas `run_all_notification_rules` (SLA, tema estancado, inactiva) + `POST /notificacions/procesar-reglas` + `MATRIZ_PERMISOS_G1.md`. **Cron** de producción: externo. |
| P23 | §15 Config avanzada (flujos, periodos, plantillas, columnas kanban) | Hecho* | *+ Lote 5:* claves `reporte.plantillas`, `notificaciones.plantillas` en `admin/settings` + `audit_logs` en mutación de settings. **PDF/Excel** end-to-end = backlog opcional. |
| P24 | §16 IA (MDA, triaje) | Hecho* | *Funcional; **cobertura de pruebas E2E** y más motores/ casos: ver plan. |

**Conclusión:** Los **lotes 1–12** del orden global tienen cierre técnico con **evidencia en código, tests y documentación** (2026-04-26). Permanecen **P1/P2** (plataforma unificada, schema dinámico) y matices de **negocio** (P8 multi-jefatura, P9 MAST, P10 actividades+scoring en UI, P11 detalle, P12 bitácora) según `AUDITORIA` §6. **Fase H** (acta firmada, performance medida en prod, 80% cob) sigue bajo criterio de organización. **Lote 13** = mapeo D1–9 formal.
