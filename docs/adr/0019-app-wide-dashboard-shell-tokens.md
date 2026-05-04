# ADR-0019 — Tokens «dark ops» en el shell de página (AppSec)

## Status

Accepted (supplements [0018](0018-dashboard-dark-ops-visual-contract.md))

## Context

ADR-0018 fijó el contrato visual para **dashboards** (`--dashboard-*` + charts). El plan de producto AppSec
requiere la misma coherencia cromática en **todo el área autenticada**, sin reescribir 100+ páginas a mano.

## Decision

- `PageWrapper` aplica por defecto `bg-dashboard-canvas` y `text-dashboard-onStrong` como lienzo de página.
- `PageHeader` usa `text-dashboard-onStrong` / `text-dashboard-muted` para título y descripción.
- Las páginas pueden seguir sobreescribiendo clases vía `className` en `PageWrapper` cuando un módulo necesite
  un fondo distinto (casos excepcionales documentados en PR).

## Consequences

- Contraste y continuidad visual al navegar entre módulos mejora con un solo cambio central.
- ADR-0018 sigue siendo la fuente de verdad de **tokens**; ADR-0019 solo amplía **dónde** se aplican por defecto.
