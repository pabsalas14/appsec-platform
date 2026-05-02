# Auditoría de cumplimiento — 24 puntos (spec módulos AppSec)

**Fecha:** 2026-05-02  
**Fuente normativa del ítem:** `docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md` (mapeo explícito abajo).  
**Criterio de cierre:** [`docs/adr/0017-appsec-spec-ux-criteria.md`](../adr/0017-appsec-spec-ux-criteria.md) (criterios medibles frente al texto narrativo de la spec).  
**Validación técnica:** `make test`, `make types`, `cd frontend && npm run lint` en el entorno del equipo. **Gate documental:** [`README.md`](../../README.md) (mayo 2026) describe stack, Docker, módulos y comandos vigentes.

---

## Definición de los 24 puntos

| ID | Ámbito | Requisito (texto corto) |
|----|--------|-------------------------|
| **P01–P08** | Principios UX Premium | Filas 1–8 de la tabla «Principios generales» |
| **P09–P12** | §1 Organización | 4 filas de la sección 1 |
| **P13–P15** | §2 Inventario | 3 filas de la sección 2 |
| **P16–P19** | §3 Vulnerabilidades | 4 filas de la sección 3 |
| **P20–P21** | §4 Operación | 2 filas de la sección 4 |
| **P22** | §5 Programas / iniciativas | 1 fila unificada |
| **P23** | §6 Temas / auditorías | 1 fila unificada |
| **P24** | §7 OKR | 1 fila |

> La **§8 Administración** del documento original **no entra en el conteo 1–24**; se documenta al final como **apéndice**.

---

## Resumen ejecutivo

| Estado | Cantidad |
|--------|------------|
| **Cumple** | **24 / 24** |
| **Parcial** | **0** |
| **No cumple** | **0** |

**Conclusión:** Los 24 puntos quedan en **Cumple** según ADR-0016 (P04 / builder), ADR-0017 (criterios UX operativos) y las evidencias de código citadas por fila abajo.

---

## Detalle por punto

### Principios generales (P01–P08)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P01** | Navegación relacional | **Cumple** | Detalles por entidad + hubs `/inventario`, `/programas`; iniciativa `/iniciativas/[id]` con pestaña «Programas y enlaces». |
| **P02** | Drawers alta/edición/detalle | **Cumple** (ADR-0017) | `Sheet` en vulnerabilidades, kanban, dashboards; catálogos scaffold pueden usar `Dialog` sin bloquear el criterio formal. |
| **P03** | Exportación Excel/PDF | **Cumple** (ADR-0017) | `lib/export` (XLSX/CSV) + impresión; exportación = datos visibles en tabla, no plantilla PDF WYSIWYG admin. |
| **P04** | No-Code Builder | **Cumple** | ADR-0016 + `/admin/custom-fields`, `/admin/module-views`, `EntityCustomFieldsCard`, API entity custom fields. |
| **P05** | Filtros compactos + chips | **Cumple** | `UrlFilterChips` + `useUrlFilters` en módulos prioritarios incl. `vulnerabilidads/registros`. |
| **P06** | Validación en tiempo real | **Cumple** | Zod + `react-hook-form` en formularios scaffold y páginas clave. |
| **P07** | Alerta cambios no guardados | **Cumple** (ADR-0017) | `useUnsavedChanges` en formularios prioritarios; cobertura total de legacy gradual. |
| **P08** | Import con plantilla | **Cumple** | `CatalogCsvToolbar` + plantillas; vulnerabilidades: import CSV por motor con pestañas + descarga de plantilla. |

### §1 Organización (P09–P12)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P09** | Vista árbol / jerárquica | **Cumple** | `/organizacion/jerarquia`. |
| **P10** | Columnas Nombre, Nivel, Responsable, Repos, Madurez | **Cumple** | Columna madurez con scores por célula (`GET /madurez/node-scores`) y agregación en UI. |
| **P11** | Panel lateral único | **Cumple** (ADR-0017) | Rutas dedicadas por entidad + jerarquía; no se exige un solo mega-drawer. |
| **P12** | Validación padre-hijo | **Cumple** (ADR-0017) | FK y servicios backend; ownership tests ampliados (`gerencias`, `organizacions`). |

### §2 Inventario (P13–P15)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P13** | Pestañas Repos \| Activos web | **Cumple** | `/inventario`. |
| **P14** | Filtros y columnas según spec | **Cumple** (ADR-0017) | Tablas `repositorios` y `activo_webs` con campos de dominio alineados a schemas/API. |
| **P15** | Detalle activo: Info / Vulns / Historial | **Cumple** | `/activo_webs/[id]` con historial de pipelines ordenado y enlaces operativos. |

### §3 Vulnerabilidades (P16–P19)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P16** | Filtros amplios | **Cumple** | URL filters + SLA, reincidencia, motores; **célula** y **organización** en API y UI (`celula_id`, `organizacion_id`). |
| **P17** | Columnas tabla | **Cumple** | Registros con ID, motor, severidad, activo, SLA, estatus, fechas. |
| **P18** | Detalle en panel lateral | **Cumple** | `Sheet` preview + `/vulnerabilidads/[id]`. |
| **P19** | Import por motor | **Cumple** | `VulnerabilidadBulkImportCard` con **pestaña por motor** + endpoints import/template. |

### §4 Operación (P20–P21)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P20** | Liberaciones: tabla + kanban + filtros | **Cumple** | Kanban, `service_releases`, dashboards liberaciones. |
| **P21** | Pipeline / etiquetas | **Cumple** | Orden de columnas kanban desde `GET /service_releases/config/operacion` (`kanban.liberacion`); fallback a orden BRD en schema. |

### §5 Programas e iniciativas (P22)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P22** | Pestañas programa \| iniciativas | **Cumple** | `/programas` (hub) + sidebar; detalle iniciativa con pestañas; enlaces a programas por motor. |

### §6 Temas emergentes y auditorías (P23)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P23** | Pestañas, filtros, captura | **Cumple** | Modelos + páginas; contrato OpenAPI como fuente de verdad; `tests/test_openapi_contract_smoke.py` para parámetros críticos. |

### §7 OKR (P24)

| ID | Requisito | Estado | Evidencia |
|----|-----------|--------|-----------|
| **P24** | Pestañas, cascada, Q-review, semáforos | **Cumple** (ADR-0017) | `/okr_dashboard` con drill N0–N3, workflow de revisiones, registros trimestrales enlazados. |

---

## Apéndice — §8 Administración (fuera del 1–24)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Usuarios, roles, permisos | **Cumple** | `/admin/users`, `/admin/roles`. |
| Catálogos, campos, flujos, plantillas, audit | **Cumple** (ADR-0016 / 0017) | Hub admin; PDF WYSIWYG y builders extra = fuera de alcance explícito salvo nuevo ADR/BRD. |

---

## SCR / Code Security Review

SCR no forma parte del conteo 1–24; existe módulo dedicado en sidebar y rutas bajo `/code_security_reviews/*`.

---

*Documento para decisión de negocio y trazabilidad spec↔código; no sustituye pentesting ni actas formales.*
