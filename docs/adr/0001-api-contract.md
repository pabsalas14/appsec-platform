# ADR-0001: API response envelope

- Status: accepted
- Date: 2026-04-21

## Context

Frontends break every time the backend shape changes (field added at root,
error fields renamed, pagination injected inline). Without a contract, every
feature negotiates a new shape and drift is silent.

## Decision

Every `/api/*` response is wrapped by one of two envelopes.

**Success**

```json
{
  "status": "success",
  "data": <payload>,
  "meta": { "message": "…" },          // optional
  "pagination": {                      // only on list endpoints
    "page": 1, "page_size": 20,
    "total": 123, "total_pages": 7
  }
}
```

**Error**

```json
{
  "status": "error",
  "detail": "human-readable message | list of pydantic errors",
  "code":   "NotFoundException | RequestValidationError | …"
}
```

Enforcement:

- Helpers live in [`app/core/response.py`](../../backend/app/core/response.py)
  (`success`, `paginated`, `error`). Every route MUST return through them.
- Global exception handlers in [`app/main.py`](../../backend/app/main.py)
  wrap `HTTPException` and `RequestValidationError` so errors follow the same
  shape automatically.
- Contract tests in
  [`backend/tests/test_contract.py`](../../backend/tests/test_contract.py)
  fail CI if any endpoint deviates.

### URL shape rule: no trailing slash on collections

`FastAPI` is configured with `redirect_slashes=False` (see
[`app/main.py`](../../backend/app/main.py)). Routers MUST declare collection
endpoints **without** a trailing slash:

```python
@router.get("")          # ✅ GET  /api/v1/tasks
@router.post("")         # ✅ POST /api/v1/tasks
@router.get("/{id}")     # ✅ GET  /api/v1/tasks/{id}
```

Not:

```python
@router.get("/")         # ❌ would force a 307 redirect, dropping POST bodies
```

Rationale: FastAPI's default `redirect_slashes=True` issues a `307 Temporary
Redirect` when the client omits the trailing slash. Several HTTP clients (and
browsers for cross-origin requests) drop the request body or cookies on the
follow-up, silently breaking `POST`/`PATCH`. The scaffolder templates in
[`scripts/templates/backend_router.py.j2`](../../scripts/templates/backend_router.py.j2)
already encode this rule for new entities.

## Consequences

+ Frontend code reads `resp.data.data` or `resp.data.detail` with no `try/catch`
  gymnastics.
+ Error codes are machine-parseable (`code`), allowing targeted UX for known
  failure modes.
+ Contract tests catch regressions before merge.
- Slight verbosity at call sites (`return success(...)` instead of `return obj`).

## Alternatives considered

- **Raw JSON**: rejected — no uniform error shape, drift inevitable.
- **JSON:API / HAL**: rejected — overkill for internal API, verbose for simple
  shapes, ecosystem support uneven.
