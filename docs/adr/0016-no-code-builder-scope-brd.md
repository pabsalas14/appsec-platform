# ADR-0016: Alcance verificable del «No-Code» (P04) frente al BRD

- Status: accepted
- Date: 2026-05-02
- Supersedes: interpretación literal de «100 % de módulos sin código» en [`docs/qa/MODULOS_APSEC_SPEC_COMPLIANCE.md`](../qa/MODULOS_APSEC_SPEC_COMPLIANCE.md)

## Context

El requisito genérico «100 % No-Code Builder en todos los módulos» es **no acotado**: implica que cualquier entidad futura deba configurable sin deploy, lo cual no es un criterio de aceptación medible por sprint.

El BRD y la matriz de cobertura ([`docs/brd/MATRIZ_COBERTURA_BRD.md`](../brd/MATRIZ_COBERTURA_BRD.md)) sí definen **módulos de negocio prioritarios** donde customización administrativa tiene sentido.

## Decision

Se define el **cumplimiento de P04 (No-Code administrable)** como:

1. **Custom Fields** (`/admin/custom-fields`): capacidad de definir campos dinámicos por `entity_type` para los **tipos de entidad listados abajo**, con valores persistidos vía API existente (`GET/PATCH /api/v1/admin/custom-fields/{entity_type}/{entity_id}/...`).
2. **Module Views** (`/admin/module-views`): capacidad de definir vistas por módulo para los **módulos que correspondan** a esas entidades en la UI actual (tabla/kanban/calendario según soporte del builder).
3. **Validación y flujos**: reglas de validación y flujos de estatus siguen en Admin según ADR existentes; no se exige «cero código» para **entidades no listadas** ni para **integraciones externas** (GitHub, Jira) que siempre requieren conectores.

### Lista cerrada de `entity_type` BRD (P04)

| entity_type (API) | Evidencia UI mínima |
|-------------------|---------------------|
| `vulnerabilidad` | Listado/detalles en `/vulnerabilidads` |
| `repositorio` | `/repositorios` |
| `activo_web` | `/activo_webs` |
| `service_release` | `/service_releases` |
| `plan_remediacion` | `/plan_remediacions` |
| `tema_emergente` | `/temas_emergentes` |
| `auditoria` | `/auditorias` |
| `iniciativa` | `/iniciativas` |
| `hallazgo_pipeline` | `/hallazgo_pipelines` |

Nuevas entidades **post-BRD** se evalúan en ADR adicional; no bloquean el cierre de P04.

**Criterio de verificación:** para cada fila, admin puede crear al menos un campo custom no destructivo y la lista/detalle del módulo puede mostrar o editar valores sin cambiar el modelo SQL (salvo migraciones ya contempladas por `CustomField`).

## Consequences

- Positivo: P04 pasa a ser **demostrable** en revisión y en [`MATRIZ_DOD_24_PUNTOS.md`](../qa/MATRIZ_DOD_24_PUNTOS.md).
- Negativo: equipos que esperaban builder universal deben alinear expectativas con esta lista o proponer ADR que amplíe la lista.
- Seguimiento: gap analysis por entidad (documento `P04_GAP_ANALYSIS.md`); completar render de valores custom en UI donde falte.

## Alternatives considered

- **Mantener literal «100 % universal»** — rechazado: no hay definición de terminación.
- **Exigir solo backend CustomField sin UI** — rechazado: no cumple espíritu operativo del spec.
