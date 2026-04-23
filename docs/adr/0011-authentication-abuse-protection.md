# ADR-0011: Authentication abuse protection

- Status: accepted
- Date: 2026-04-21

## Context

Public authentication routes are the first target for brute force, credential
stuffing, and refresh-token abuse. The framework previously had no protection
on `login`, `register`, or `refresh` beyond password verification.

## Decision

The framework applies in-process rate limiting to `login`, `register`, and
`refresh`, with thresholds controlled by settings. Login also enforces a
temporary cooldown after repeated failures for the same client/IP and username
combination.

Refresh token rotation remains single-use. If a revoked refresh token is reused,
the framework treats it as suspicious reuse and revokes the entire session
family.

## Consequences

+ Default deployments gain a meaningful baseline against opportunistic abuse.
+ Suspicious refresh reuse now has a clear containment policy.
+ Multi-instance deployments cover the shared-state gap via Nginx
  `limit_req_zone` on `/api/v1/auth/{login,register,refresh}` (see ADR-0015);
  no additional shared-store dependency is introduced by the baseline.
- In-memory rate limiting is process-local and must be complemented by the
  edge limiter or a project-specific shared store in multi-instance setups.
- Lockout thresholds need tuning per product risk tolerance.

## Alternatives considered

- No built-in abuse controls: rejected because auth endpoints are high-risk by
  default.
- Require a shared-store dependency from day one: rejected because the
  framework should remain lightweight for local development and single-instance
  use.
- Global account lockout only: rejected because it can create an easy
  denial-of-service vector against known usernames.
