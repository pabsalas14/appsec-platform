# ADR-0013: Operational security defaults

- Status: accepted
- Date: 2026-04-21

## Context

Starter projects often inherit insecure operational defaults because docs,
cookie policies, password requirements, and deployment headers feel
"environment-specific" and are postponed indefinitely. The framework already
ships deployment configuration, so it must define safe defaults.

## Decision

Production runs fail closed on API docs exposure unless an explicit
`ALLOW_OPENAPI_IN_PROD=true` override is set. Auth cookies remain `Secure` in
production, and the default browser policy is `SameSite=Lax` unless a reviewed
cross-site flow requires something stricter or different.

The framework also enforces a password policy (minimum length plus mixed case
and digit by default, with a deny list and a username-containment check — see
ADR-0015), rejects well-known default secrets, and expects production
deployments to rotate secrets, terminate TLS correctly, and keep CORS and CSP
intentionally scoped.

## Consequences

+ New deployments are less likely to leak docs or ship weak auth defaults by
  accident.
+ Operational requirements become visible in config and ADRs.
- Teams must opt in explicitly if they really want docs exposed in production.
- Stronger defaults may require updating example credentials and setup docs.

## Alternatives considered

- Leave docs enabled everywhere and rely on deploy discipline: rejected because
  templates get copied without careful review.
- Encode every operational policy in Nginx only: rejected because backend config
  should fail unsafe combinations before deployment.
