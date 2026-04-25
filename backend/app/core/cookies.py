"""
Environment-aware cookie helpers.

Single source of truth for auth-related cookies. MUST be used by every route
that sets or clears ``access_token`` / ``refresh_token`` cookies.

Rationale
---------
- Guarantees identical ``samesite`` / ``httponly`` flags across routes.
- ``secure`` is bound to ``settings.ENV == "prod"``, so dev works over HTTP and
  staging/prod stay HTTPS-only.
- Grep-friendly: ``grep -rn "set_cookie" backend/app`` should match only this
  module (see AGENTS.md hard rules).

See docs/adr/0002-auth-strategy.md.
"""

from __future__ import annotations

from fastapi import Response

from app.config import settings
from app.core.csrf import CSRF_COOKIE

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"

ACCESS_MAX_AGE = 60 * settings.JWT_ACCESS_EXPIRE_MINUTES
REFRESH_MAX_AGE = 60 * 60 * 24 * settings.JWT_REFRESH_EXPIRE_DAYS


def _secure_flag() -> bool:
    return settings.ENV == "prod"


def _samesite_flag() -> str:
    return settings.AUTH_COOKIE_SAMESITE


def set_auth_cookie(
    response: Response,
    *,
    key: str,
    value: str,
    max_age: int,
    path: str = "/",
) -> None:
    """Set an HttpOnly auth cookie using the framework-wide flags."""
    response.set_cookie(
        key=key,
        value=value,
        max_age=max_age,
        httponly=True,
        samesite=_samesite_flag(),
        secure=_secure_flag(),
        path=path,
    )


def set_csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=CSRF_COOKIE,
        value=token,
        max_age=REFRESH_MAX_AGE,
        httponly=False,
        samesite=_samesite_flag(),
        secure=_secure_flag(),
        path="/",
    )


def set_access_cookie(response: Response, token: str) -> None:
    set_auth_cookie(response, key=ACCESS_COOKIE, value=token, max_age=ACCESS_MAX_AGE)


def set_refresh_cookie(response: Response, token: str) -> None:
    set_auth_cookie(
        response,
        key=REFRESH_COOKIE,
        value=token,
        max_age=REFRESH_MAX_AGE,
        path="/api/v1/auth",
    )


def clear_auth_cookies(response: Response) -> None:
    """Delete both auth cookies (used on logout / revocation)."""
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")
    response.delete_cookie(CSRF_COOKIE, path="/")
