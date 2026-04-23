# ADR-0002: Authentication strategy (JWT + HttpOnly cookies + rotation)

- Status: superseded by ADR-0010
- Date: 2026-04-21

## Context

Browser SPAs that store tokens in `localStorage` leak them to every XSS on
the page. Tokens in memory are safer but are lost on reload and force complex
refresh choreography. Long-lived refresh tokens compound the risk: a stolen
refresh token is often usable for weeks.

## Decision

- **Transport**: access + refresh tokens are JWTs signed with `SECRET_KEY`
  (HS256) and **set as HttpOnly cookies** from the server. JavaScript never
  reads them.
- **Cookie helper**: a single `app/core/cookies.py` is the only allowed
  caller of `response.set_cookie` for auth cookies. It sets `HttpOnly`,
  `SameSite=lax`, and `Secure=True` whenever `settings.ENV == "prod"`.
- **Refresh rotation**: each successful `POST /api/v1/auth/refresh` marks the
  incoming refresh token as revoked (DB row `refresh_tokens.revoked_at`) and
  issues a **new pair**. A replayed refresh token is rejected because its
  hash is already revoked.
- **Logout**: revokes the current refresh token and clears both cookies.

Expirations (configurable via env):

| Token   | Default         | Cookie max-age               |
|---------|-----------------|------------------------------|
| Access  | 30 minutes      | `JWT_ACCESS_EXPIRE_MINUTES`  |
| Refresh | 7 days          | `JWT_REFRESH_EXPIRE_DAYS`    |

## Consequences

+ Access tokens never touch JS → XSS mitigates to "can call API as user in
  window" instead of "full account takeover".
+ Token rotation gives us detection: if refresh N+1 arrives after N+2 was
  already used, the client is compromised.
+ `Secure` is environment-aware, so dev over HTTP keeps working.
- Requires a DB table (`refresh_tokens`) and an index on `token_hash`.
- Cross-site browser requests now rely on cookies → CORS config must send
  `Access-Control-Allow-Credentials: true` and enumerate origins.

## Alternatives considered

- **Access token in localStorage**: rejected — XSS equals account takeover.
- **Stateless refresh (no DB)**: rejected — no revocation, no rotation
  detection.
- **Session cookies only**: rejected — server-side state grows per login and
  multi-tenant horizontal scaling complicates session stores.
