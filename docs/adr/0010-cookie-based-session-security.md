# ADR-0010: Cookie-based session security

- Status: accepted
- Date: 2026-04-21

## Context

ADR-0002 established HttpOnly cookies and refresh rotation, but the runtime
still exposed `access_token` in JSON and lacked explicit CSRF enforcement for
cookie-authenticated mutations. That left the framework half-switched between a
browser cookie model and a token-in-body model.

## Decision

Browser sessions are cookie-only. `POST /api/v1/auth/login` and
`POST /api/v1/auth/refresh` set `access_token`, `refresh_token`, and
`csrf_token` cookies, but do not expose access tokens in JSON responses.
JavaScript must never read auth tokens directly.

Cookie-authenticated mutating requests use a double-submit CSRF pattern:
frontend code reads the non-HttpOnly `csrf_token` cookie and echoes it in the
`X-CSRF-Token` header. Requests authenticated with `Authorization: Bearer`
remain available for non-browser clients and do not require CSRF.

Cookie defaults are `HttpOnly` for auth cookies, `Secure` in production,
`SameSite=Lax`, root path for `access_token` and `csrf_token`, and
`/api/v1/auth` for `refresh_token`.

## Consequences

+ Access tokens stop leaking into browser-visible JSON payloads.
+ Cookie-based browser flows gain an explicit CSRF barrier instead of relying
  only on SameSite.
+ Frontend auth remains simple because cookies and CSRF headers are handled by
  the shared API client.
- Mutating requests made through browser cookies must include the CSRF header.
- Cross-site browser flows need a dedicated review before changing SameSite or
  cookie paths.

## Alternatives considered

- Keep returning access tokens in JSON for compatibility: rejected because it
  breaks the HttpOnly-cookie security model.
- Rely on SameSite alone for CSRF: rejected because it is not a complete
  application-level defense.
- Remove Bearer support entirely: rejected because API clients and test helpers
  still need a non-browser authentication path.
