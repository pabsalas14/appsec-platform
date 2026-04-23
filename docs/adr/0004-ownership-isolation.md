# ADR-0004: Per-user ownership isolation (no IDOR by construction)

- Status: accepted
- Date: 2026-04-21

## Context

IDOR (Insecure Direct Object Reference) is one of the most common web
vulnerabilities because enforcement lives in the route, scattered across N
handlers. Every new handler is a new chance to forget
`if task.user_id != current_user.id: raise 403`.

## Decision

Ownership is a **property of the service**, not the route.

- `BaseService(owner_field="user_id")` marks an entity as owned. All
  `get/update/delete` calls then require `scope={"user_id": ...}` and raise
  `RuntimeError` when it is missing — the service refuses to run
  unsafely at all.
- `app/api/deps_ownership.py::require_ownership(service)` is the single
  path routes use to fetch an owned entity by its path-param id. It:
  1. Reads `path_params[id_param]`.
  2. Calls `service.get(db, id, scope={owner_field: current_user.id})`.
  3. Raises `NotFoundException` if the entity does not exist OR is owned by
     someone else — **no oracle about other users' ids**.
- IDOR tests in
  [`tests/test_ownership.py`](../../backend/tests/test_ownership.py)
  parametrize every owned entity and assert that user B always gets 404 on
  user A's resources.

## Consequences

+ Adding a new owned entity takes one line
  (`owner_field="user_id"` on the `BaseService`) and IDOR protection comes
  for free.
+ Forgetting to pass `scope=` is a clean `RuntimeError` in staging/CI,
  not a silent 200 in prod.
+ 404 (not 403) means attackers can't enumerate ids.
- Non-scoped access to owned entities (admin dashboards) must use a
  dedicated service wrapper; the base service won't let you skip scope.

## Alternatives considered

- **Row-level security in PostgreSQL**: rejected — possible but adds
  DB-side complexity, and our service layer already has the user context.
- **Per-route checks**: rejected — see context; too easy to forget.
