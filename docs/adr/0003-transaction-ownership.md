# ADR-0003: Transaction ownership (`get_db` commits, services never do)

- Status: accepted
- Date: 2026-04-21

## Context

Services that commit internally can't participate in multi-step workflows
atomically: if step 2 fails after step 1's `commit`, the DB is inconsistent.
Worse, nested commits mask partial writes and make tests flaky because
rollback happens at an unexpected layer.

## Decision

- `app/database.py::get_db()` is the **only** place that commits. The
  dependency yields a session, and on successful return it does
  `await session.commit()`. On any exception it rolls back.
- `BaseService` and every generated service MUST NOT call `db.commit()`.
  Instead they call `db.flush()` when they need the DB-generated id before
  returning.
- Contract test
  [`tests/test_ownership.py::test_base_service_never_commits`](../../backend/tests/test_ownership.py)
  reads the source of `create/update/delete` and fails if any of them
  mentions `commit(`.

## Consequences

+ Every HTTP request is one transaction: either everything or nothing.
+ Services are composable: calling service A then service B in one endpoint
  runs atomically.
+ Tests are deterministic — rollbacks happen at a well-known boundary.
- Developers must remember to `flush` when they need `record.id`
  immediately. The base service does this for them.

## Alternatives considered

- **Each service commits**: rejected — breaks atomicity, partial writes
  possible.
- **Explicit transaction context in each route**: rejected — noisy,
  easy to forget.
