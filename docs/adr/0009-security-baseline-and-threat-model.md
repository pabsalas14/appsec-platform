# ADR-0009: Security baseline and threat model

- Status: accepted
- Date: 2026-04-21

## Context

The framework now ships with authentication, admin surfaces, uploads, generated
types, and browser-based dashboards out of the box. That convenience creates a
security expectation: new projects should inherit safe defaults instead of
having to rediscover basic controls during each rollout.

The main assets we protect are user accounts, refresh sessions, API data owned
by tenants, admin capabilities, uploaded content, secrets, and deployment
metadata. The main threats we design for by default are XSS, CSRF, IDOR,
privilege escalation, brute force and credential stuffing, secret leakage,
unsafe documentation exposure, and insecure file handling.

## Decision

We define a framework-wide security baseline. By default the framework
guarantees cookie-only browser sessions, ownership checks for user data,
structured audit logs, production-safe docs exposure, CSRF protection for
cookie-authenticated mutations, and abuse controls on authentication endpoints.

Projects built from this framework remain responsible for domain-specific
authorization policy, production secret rotation, external rate limiting in
multi-instance deployments, file malware scanning, and any cross-site browser
flows that require different cookie or CORS settings.

## Consequences

+ Security decisions become explicit, reviewable, and testable instead of being
  left to convention.
+ New starter projects inherit a threat model and a minimum hardening baseline.
- The framework now carries more operational opinion, so projects that need
  weaker or different behavior must override it consciously.
- CI and tests must keep enforcing these defaults or the guarantees become
  documentation-only.

## Alternatives considered

- Treat security as project-specific documentation only: rejected because the
  framework already makes shared security promises.
- Defer hardening until a concrete product uses the template: rejected because
  starter kits tend to fossilize insecure defaults.
