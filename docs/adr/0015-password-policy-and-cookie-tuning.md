# ADR-0015: Password policy, cookie tuning and edge rate-limit

- Status: accepted
- Date: 2026-04-21

## Context

ADR-0011 and ADR-0013 left three knobs as follow-ups: how much password
complexity the framework should enforce by default, whether `SameSite` can be
tuned per deployment, and how multi-instance deployments should share abuse
protection state without adding a new runtime dependency. All three questions
kept surfacing in reviews, and leaving them implicit invites inconsistent
hardening across projects built from this starter.

## Decision

**Password policy.** `validate_password_strength` enforces the minimum length
from `AUTH_MIN_PASSWORD_LENGTH` plus three toggleable rules:
`AUTH_PASSWORD_REQUIRE_MIXED_CASE` and `AUTH_PASSWORD_REQUIRE_DIGIT` are on by
default; `AUTH_PASSWORD_REQUIRE_SYMBOL` is opt-in. The validator also rejects
a small in-repo deny list of notorious weak passwords (`password`, `qwerty`,
`changeme123`, …) and anything that matches or contains the username. Every
entry point that persists a password — public registration, self-service
change, admin create, admin password reset, and the seed script — calls the
validator with the owning username.

**Cookie tuning.** `AUTH_COOKIE_SAMESITE` selects `lax` (default), `strict`, or
`none`. Choosing `none` is rejected outside `ENV=prod` because browsers only
accept `SameSite=None` together with `Secure`, and `Secure` is gated on prod.
`HttpOnly` for auth cookies, `Secure` in prod, and scoped paths remain
unchanged from ADR-0010.

**Edge rate-limit at the reverse proxy.** Multi-instance deployments get
shared abuse protection through Nginx (`limit_req_zone` at 30 r/min per client
IP for `/api/v1/auth/{login,register,refresh}`). The in-process limiter keeps
covering single-instance installs. No additional runtime dependency or shared
store is introduced by the framework baseline.

## Consequences

+ Registration, password change, admin user creation and the seed script share
  the same policy, so the framework contract is consistent end-to-end.
+ Deployments that need `SameSite=Strict` or cross-site `None` cookies have a
  reviewed path instead of ad-hoc patches.
+ Multi-instance abuse protection is solved with infrastructure the project
  already runs (Nginx), without adding a runtime dependency.
- Test fixtures and example secrets had to be rotated to satisfy the new
  defaults; projects forking the template must rotate their seeded admin
  password accordingly.
- Edge rate-limit is per-IP, not per-user: projects behind shared NAT or CGNAT
  may need tighter per-identity controls on top.

## Alternatives considered

- **Introduce a shared-store rate-limit backend.** Rejected: adds a runtime
  dependency for a problem Nginx already solves declaratively at the edge.
- **Leave the password policy to the consumer project.** Rejected: the framework
  already ships auth routes and a seed script, so a weak default propagates to
  every project by copy-paste.
- **Hardcode `SameSite=Strict` globally.** Rejected: some cross-site browser
  flows (embedded dashboards, OAuth redirects) legitimately need `Lax` or
  `None`, and flipping globally would break them silently.
