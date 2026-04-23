"""
Double-submit CSRF protection for cookie-authenticated API requests.

Requests authenticated with ``Authorization: Bearer`` are treated as
non-browser/API clients and do not require a CSRF token. Cookie-based mutating
requests must echo the readable ``csrf_token`` cookie via ``X-CSRF-Token``.
"""

from __future__ import annotations

import secrets
from hmac import compare_digest

from fastapi import Request

CSRF_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_EXEMPT_PATHS = {
    "/api/health",
    "/api/v1/",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
}


def issue_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def request_needs_csrf(request: Request) -> bool:
    if request.method in SAFE_METHODS:
        return False

    path = request.url.path
    if path in CSRF_EXEMPT_PATHS:
        return False
    if not path.startswith("/api/v1/"):
        return False

    authorization = request.headers.get("authorization", "")
    if authorization.startswith("Bearer "):
        return False

    return bool(
        request.cookies.get("access_token") or request.cookies.get("refresh_token")
    )


def csrf_is_valid(request: Request) -> bool:
    cookie_token = request.cookies.get(CSRF_COOKIE)
    header_token = request.headers.get(CSRF_HEADER)
    if not cookie_token or not header_token:
        return False
    return compare_digest(cookie_token, header_token)
