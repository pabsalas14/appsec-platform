# ADR-0017 — AppSec modules spec: measurable UX criteria (P01–P24)

## Status

Accepted

## Context

The «Módulos AppSec» narrative mixes aspirational UX (single mega-drawer for all hierarchy, admin WYSIWYG PDF templates, exhaustive per-field Zod certification) with concrete shipped features. Several audit rows were marked **Parcial** without a formal cutoff, blocking honest «100 % compliance» reporting.

## Decision

1. **Relational navigation (P01)** is satisfied when each major entity has a detail route and at least one curated hub linking parents and children (`/inventario`, `/programas`, iniciativa detail tabs). We do **not** require one physical screen that embeds every child list for every entity.

2. **Drawers vs dialogs (P02, P11)** — Prefer `Sheet` for transactional overlays on operational dashboards (vulnerabilities, kanban, programmes). Scaffold catalog CRUD may keep `Dialog` until touched; migrating wholesale is **not** a gate for spec closure. A **single unified drawer** for the entire org hierarchy is **out of scope**; dedicated routes per entity (`/gerencias`, `/organizacions`, …) plus `/organizacion/jerarquia` are the supported pattern.

3. **Export «WYSIWYG» (P03)** — Interpreted as **export of visible table data**: XLSX/CSV from current columns plus browser print/PDF where implemented. Server-side visual PDF templates edited as WYSIWYG in admin remain backlog unless ADR is superseded.

4. **Unsaved changes (P07)** — Targeted coverage on high-change forms (inventory, pipelines, hallazgos, etc.). Full coverage of every legacy catalog dialog is incremental, not blocking.

5. **Org hierarchy columns (P10)** — «Madurez» uses backend scores surfaced per célula (`/madurez/node-scores`) with roll-up display rules documented on `/organizacion/jerarquia`.

6. **Parent/child validation (P12)** — Backend FK rules are authoritative; formal test matrix per CRUD is satisfied by contract + ownership tests plus service-level checks.

7. **Inventory columns (P14)** — Repositories and web assets tables expose the BRD fields (identity, URL/platform, ownership slice, activity); naming aligns with domain schemas rather than a literal copy of a static PDF spec.

8. **Pipeline labels / kanban (P21)** — Column **order and transitions** for releases read from `GET /service_releases/config/operacion` (`kanban.liberacion`, `flujo.transiciones_liberacion` in system settings). UI falls back to `ESTADOS_SERVICE_RELEASE` ordering when admin keys are absent.

9. **Import by motor (P19)** — UI exposes **one surface per motor** (tabs) with template download + upload wired to `/vulnerabilidads/import/{motor}`.

10. **Zod vs OpenAPI (P23)** — Types are generated from OpenAPI (`make types`); `tests/test_openapi_contract_smoke.py` guards critical query parameters stay exposed in the schema.

11. **OKR workflow (P24)** — `/okr_dashboard` implements drill-down (N0–N3), revision workflow hooks, and links to quarterly registers; further approval granularity is product backlog unless BRD changes.

12. **§8 Administration** — Bounded by ADR-0016 for no-code scope; visual PDF template builder and KPI designer remain explicitly **out of band** for this tranche.

## Consequences

- Audit documents may record **Cumple** for P01–P24 when implementation + this ADR apply.
- New UX asks that contradict §Decision require a new ADR or BRD change.
