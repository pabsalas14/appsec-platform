# ADR-0005: TypeScript types generated from OpenAPI

- Status: accepted
- Date: 2026-04-21

## Context

Hand-written `interface Task { ... }` in the frontend is a second source of
truth. Every time a backend schema changes, half the TS types drift silently
and the frontend only breaks at runtime.

## Decision

- `openapi-typescript` runs against the live backend OpenAPI at
  `/openapi.json` and writes
  [`frontend/src/types/api.ts`](../../frontend/src/types/api.ts).
- `frontend/src/types/index.ts` re-exports the generated shapes so the rest
  of the app imports from a single module (`@/types`).
- `make types` regenerates locally. A **drift-types** CI job runs the same
  generation and fails if the output diverges from the committed file.
- Manual types are permitted only for pure UI primitives (e.g. table
  column configs) that are not part of the wire shape.

## Consequences

+ Backend schema changes surface as TS compile errors, not runtime bugs.
+ Frontend refactors that drop fields are caught by `tsc --noEmit` in CI.
+ Onboarding new entities via `make new-entity` + `make types` takes one
  minute of typing.
- Requires a running backend (or a committed `openapi.json`) for
  regeneration. The CI job spins the backend up before running the drift
  check.

## Alternatives considered

- **Manual interfaces**: rejected — see context.
- **GraphQL**: rejected — adds a new contract layer on top of REST/FastAPI
  without removing the original.
- **Zod on the frontend as source of truth**: rejected — still manual,
  still drifts; zod schemas are fine for forms but not for wire shapes.
