# Matriz Definition of Done — 24 puntos (spec módulos)

**Fecha:** 2026-05-02  
**Normativa:** [`MODULOS_APSEC_SPEC_COMPLIANCE.md`](MODULOS_APSEC_SPEC_COMPLIANCE.md) + [ADR-0016](../adr/0016-no-code-builder-scope-brd.md) para P04.

Leyenda DoD: evidencia mínima para marcar **Cumple** en auditoría.

| ID | DoD (evidencia mínima) |
|----|-------------------------|
| P01 | Detalle padre con sección o rutas hijas documentadas; datos desde API (sin listas estáticas de negocio). |
| P02 | Alta/edición en `Sheet` o patrón documentado en entidades prioritarias; sin formulario solo-modal donde el spec exija drawer. |
| P03 | Export CSV/XLSX desde datos reales + impresión o plantilla admin si BRD la exige (ver Oleada F). |
| P04 | Lista ADR-0016: custom fields + module views operativos por `entity_type`; ver [`P04_GAP_ANALYSIS.md`](P04_GAP_ANALYSIS.md). |
| P05 | Filtros sincronizados con URL y chips removibles en módulos prioritarios (liberaciones, repos, pipeline, hallazgos pipeline). |
| P06 | Zod + RHF en formularios de alta/edición de esos módulos. |
| P07 | `useUnsavedChanges` en formularios de creación/edición en rutas prioritarias y catálogos críticos. |
| P08 | Botón template + import CSV alineado a API por catálogo/importador. |
| P09 | `/organizacion/jerarquia` operativo con datos reales. |
| P10 | Columna madurez/score donde aplique con datos de API (`/madurez` o scoring), no texto placeholder fijo. |
| P11 | `OrgEntityDrawer` **o** ADR alternativo ≤2 clics documentado y cumplido. |
| P12 | Tests ownership/IDOR para routers org en `tests/test_ownership.py` (entidades listadas). |
| P13 | `/inventario` con pestañas funcionales. |
| P14 | Encabezados de tabla alineados a nombres del spec maestro (documento de referencia enlazado en PR). |
| P15 | Detalle activo web: pestaña o bloque historial de escaneos desde `pipeline_releases`. |
| P16 | Filtros de listado vulns alineados a query params del backend; sin filtros UI sin soporte API. |
| P17 | Columnas obligatorias visibles en registros (config columnas opcional). |
| P18 | Sheet preview + ruta detalle. |
| P19 | Import por motor: plantilla desde API + UI por motor o matriz documentada. |
| P20 | Kanban + registros + config operación. |
| P21 | Labels estado desde `system_settings` / config operación; match scan_id documentado en código. |
| P22 | Hub o detalle programa + detalle iniciativa con enlaces API. |
| P23 | Schemas Zod alineados a OpenAPI o test de contrato de campos; transiciones auditoría validadas. |
| P24 | Flujo Q-review y semáforos desde datos reales en UI OKR. |

---

Actualizar estado en [`AUDITORIA_24_PUNTOS_CUMPLIMIENTO_2026-05-02.md`](AUDITORIA_24_PUNTOS_CUMPLIMIENTO_2026-05-02.md) al cerrar cada ID.
