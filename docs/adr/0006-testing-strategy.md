# ADR-0006: Testing strategy (contract + IDOR + coverage ≥ 70%)

- Status: accepted
- Date: 2026-04-21

## Context

Tests are the only thing that keeps hard rules from rotting. Without
framework-level tests, every contributor re-derives the rules, forgets one,
and the audit re-opens the same finding six months later.

## Decision

### Backend — `backend/tests/` (pytest + pytest-asyncio)

Three non-negotiable test suites:

1. **Smoke** per entity (`test_<entity>.py`): at least one success path per
   CRUD endpoint plus the `401 without auth` case. Scaffolded by
   `scripts/new_entity.py`.
2. **Contract**
   ([`tests/test_contract.py`](../../backend/tests/test_contract.py)):
   - Every `/api/v1/*` route has an auth guard (unless in `PUBLIC_ROUTES`).
   - Success envelopes match `{status: "success", data: ...}`.
   - `401`, `404`, `422` responses match
     `{status: "error", detail, code}`.
3. **Ownership / IDOR**
   ([`tests/test_ownership.py`](../../backend/tests/test_ownership.py)):
   - For every owned entity, user B's `GET/PATCH/DELETE` of user A's resource
     returns 404.
   - `BaseService` CRUD source is inspected to forbid `db.commit`.

Coverage gate: `pytest --cov=backend/app --cov-fail-under=70` in CI.

Async test isolation: [`tests/conftest.py`](../../backend/tests/conftest.py)
uses `poolclass=NullPool`, a session-scoped engine, and
`asyncio_default_fixture_loop_scope=session` to avoid the `asyncpg`
"operation in progress" trap.

### Frontend — `frontend/src/__tests__/` (Vitest + React Testing Library)

- **Runner**: Vitest (`npm test`, `npm run test:run`, `npm run test:coverage`).
- **Environment**: `happy-dom` for speed; `@testing-library/jest-dom/vitest`
  matchers loaded in `vitest.setup.ts`.
- **Wrapper**: `src/__tests__/test-utils.tsx` exports `renderWithProviders`
  with a per-test `QueryClient` (`retry: false`, `gcTime: 0`) so TanStack
  Query flows are deterministic.
- **Mocks**:
  - `next/navigation` and `sonner` stubbed globally in `vitest.setup.ts`.
  - Axios client (`@/lib/api`) mocked per test with `vi.mock()`.
- **Minimum coverage target**: hook CRUD (loading / success / error), Zod
  form validation, and list/table rendering. Grows as entities are added.

### End-to-end — `frontend/e2e/` (Playwright)

- Two projects: Chromium + Firefox. Safari is optional and out of scope.
- Fixture `authedPage` (see [`e2e/fixtures.ts`](../../frontend/e2e/fixtures.ts))
  performs a UI login against the seeded admin and reuses the page's
  HttpOnly cookies.
- Critical flow covered: **Login → Create → Edit → Toggle → Delete** a task.
- Runs in CI against a full stack (Postgres service + uvicorn + `next start`)
  with `RUN_SEED=true`. Report uploaded as `playwright-report` artifact.

## Consequences

+ New entities inherit IDOR + smoke coverage via `make new-entity`.
+ Envelope and auth regressions fail CI before review.
+ Coverage gate prevents "tests exist, but cover nothing" regressions.
+ Frontend unit tests run on every PR (`test-frontend` job) and gate
  regressions in hook/form logic without needing a live backend.
+ Playwright job (`e2e`) proves the full stack boots and the critical
  flow stays green before merge.
- Adding an owned entity requires registering it in
  `tests/test_ownership.py::OWNED_ENTITIES`. Enforced by code review + the
  scaffolding CLI emitting a reminder.
- Playwright adds ~3–5 min to CI. Mitigated by running only after
  `test-backend` and `build-frontend` succeed.

## Alternatives considered

- **Only e2e tests**: rejected — too slow, too coarse to pinpoint hard-rule
  violations.
- **Coverage 90%+**: rejected initially — gates should be achievable; we
  can ratchet upward.
