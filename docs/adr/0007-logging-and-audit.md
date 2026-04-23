# ADR-0007: Structured logging & persistent audit trail

- Status: accepted
- Date: 2026-04-21

## Context

The framework previously shipped `logging.basicConfig` with a plain-text
format and no correlation fields. The frontend had no logger at all. Two
concrete problems followed:

1. Operators could not correlate a browser-side failure with its backend
   request — no `request_id`, no shared format, no ingestion endpoint.
2. There was no tamper-evident record of *who* mutated *what*. Ownership
   (ADR-0004) guarantees isolation at read time but said nothing about
   historical traceability.

We want one solution that covers observability (ops) **and** auditability
(security/compliance), without introducing infra (Loki/Sentry/ELK) as a
hard dependency.

## Decision

### 1. Backend emits JSON to stdout, always

A single `configure_logging(settings)` call in `app/main.py` wires a
`dictConfig` that produces JSON Lines on `sys.stdout`. Docker's log driver
forwards those to whatever aggregator is deployed (Loki, ELK, Datadog,
CloudWatch, …). No file handlers, no rotation — stateless containers.

**Stable field contract** (ADR-backed; changes require a new ADR):

| Field         | Source                       | Notes                            |
|---------------|------------------------------|----------------------------------|
| `ts`          | formatter                    | ISO-8601 UTC with `Z` suffix     |
| `level`       | `record.levelname`           |                                  |
| `logger`      | `record.name`                |                                  |
| `event`       | `extra.event` or `msg`       | Dot-separated (`task.create`)    |
| `msg`         | formatted message            |                                  |
| `request_id`  | contextvar                   | Matches `X-Request-ID` header    |
| `user_id`     | contextvar (after auth)      |                                  |
| `ip`          | contextvar                   |                                  |
| `method`      | contextvar                   |                                  |
| `path`        | contextvar                   |                                  |
| `service`     | settings.LOG_SERVICE_NAME    |                                  |
| `env`         | settings.ENV                 |                                  |
| `version`     | settings.LOG_VERSION         |                                  |
| `duration_ms` | middleware                   | On `http.response` records       |
| `status`      | middleware                   | On `http.response` records       |
| `error.type`  | formatter                    | When `exc_info` present          |

**`LOG_FORMAT=text` is accepted only when `ENV=dev`**. Staging/prod refuse
to boot with text logs — JSON is the contract.

### 2. Request correlation via `X-Request-ID`

The HTTP middleware in `app/main.py`:

- Reads `X-Request-ID` from the request (or generates a UUID4).
- Binds `request_id`, `method`, `path`, `ip`, `user_agent` to contextvars
  defined in `app/core/logging_context.py`.
- Emits `event="http.request"` on entry and `event="http.response"` on
  exit with `status` and `duration_ms`.
- Echoes `X-Request-ID` on the response so the frontend can attach it to
  its own log entries.

`get_current_user` additionally binds `user_id` once the JWT is validated.

### 3. Secrets are scrubbed automatically

`RedactFilter` recursively replaces any dict key in
`REDACTED_KEYS = {authorization, cookie, password, token, access_token,
refresh_token, secret, secret_key, api_key, hashed_password, set-cookie}`
with `"***"`. The filter is installed on every handler, so neither direct
`logger.info(..., extra={"password": "x"})` nor Sentry events can leak
credentials. The same redactor runs as Sentry's `before_send`.

### 4. Persistent audit log (`audit_logs` table)

Every `BaseService` that sets `audit_action_prefix="<entity>"` auto-writes
one row per `create` / `update` / `delete`:

- `action`: `"<entity>.<verb>"` (e.g. `task.update`)
- `actor_user_id`: bound from the logging context (set by
  `get_current_user`)
- `entity_type` / `entity_id`: model table + stringified PK
- `request_id` / `ip` / `user_agent`: from context
- `metadata`: JSONB diff (for updates) or created payload (for creates),
  passed through `RedactFilter`
- `status`: `"success"` by default

Writes use `db.flush()` — `get_db()` keeps transaction ownership
(ADR-0003). An admin-only `GET /api/v1/audit-logs` endpoint exposes rows
with filters by actor, action, entity type, and date window.

Contract test (`test_owned_services_declare_audit_action_prefix`) fails
if any owned service forgets the prefix.

### 5. Frontend logger + ingestion

`frontend/src/lib/logger.ts` is the only module allowed to call
`console.*` (ESLint `no-console` is `error` everywhere else). In
production it batches entries in memory and flushes them via
`POST /api/v1/client-logs` every 5 s, on `visibilitychange=hidden`, and on
`pagehide`. The backend endpoint requires authentication, enforces a per-
user rate-limit (`CLIENT_LOGS_RATE_LIMIT_PER_MIN`, default 120/min) and
a hard cap on batch size (`CLIENT_LOGS_MAX_BATCH`, default 50). Each
entry is re-emitted through the backend logger with `source="frontend"`.

`lib/api.ts` reads the backend's `X-Request-ID` from every response and
calls `logger.setRequestId(rid)`, so a UI action logged right after a
failed request automatically carries the matching correlation id.

A top-level `ErrorBoundary` and `window.error` /
`unhandledrejection` listeners in `providers.tsx` guarantee that render
failures and stray promise rejections reach the logger.

### 6. Sentry (optional)

When `SENTRY_DSN` is set, `sentry_sdk` is initialised in
`configure_logging` with `LoggingIntegration(event_level=ERROR)` and the
same `RedactFilter` wired as `before_send`. Without `SENTRY_DSN` we skip
the SDK entirely — there are no side effects if the package is absent.

## Consequences

**Positive**

- Every log line in prod is machine-readable and cross-referenceable via
  `request_id`.
- Every mutation on an owned entity leaves a queryable audit trail, for
  free, by setting one kwarg on the service.
- Operators can plug in any aggregator (or none) without code changes.
- PII / credential leakage has a single, testable choke point
  (`RedactFilter` + `REDACTED_KEYS`).

**Negative**

- `audit_logs` grows unboundedly. Retention / partitioning is out of
  scope here and must be handled per-deployment (cron `DELETE ... WHERE
  ts < now() - interval '90 days'` or TimescaleDB hypertable).
- In-memory rate limit on `/client-logs` does not survive restarts and is
  not cluster-aware. Acceptable as a tripwire; put Nginx / WAF in front
  for real abuse protection.
- `contextvars` require careful middleware ordering: anything wrapping
  the middleware must not spawn detached tasks without re-binding.

**Follow-up**

- Evaluate OpenTelemetry tracing as a successor ADR once we need
  cross-service spans.
- Wire a Loki/Vector container in `docker-compose.override.yml` as an
  opt-in sample.

## Alternatives considered

- **Loguru / structlog instead of stdlib logging**: nicer ergonomics, but
  would conflict with the uvicorn / SQLAlchemy loggers that expect
  stdlib. Rejected.
- **Write audit entries from routers directly**: more explicit, but
  duplicates wiring and is easy to forget. Centralising in `BaseService`
  lets a single test enforce the rule. Rejected.
- **Rely on PostgreSQL triggers for audit**: opaque to the application
  and loses `request_id` / `actor` context. Rejected.
- **`localStorage` client log buffer**: survives reloads but risks
  including PII in device storage. Rejected — memory buffer + `keepalive`
  fetch gives "good enough" delivery without that hazard.
