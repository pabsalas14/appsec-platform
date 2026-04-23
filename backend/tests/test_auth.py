"""Smoke tests — authentication endpoints."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.core.rate_limit import reset_rate_limit_state


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    """POST /api/v1/auth/register should create a new user."""
    unique = uuid.uuid4().hex[:8]
    resp = await client.post("/api/v1/auth/register", json={
        "username": f"newuser_{unique}",
        "email": f"new_{unique}@example.com",
        "password": "Securepass123",
    })
    assert resp.status_code == 201

    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["username"] == f"newuser_{unique}"
    assert body["data"]["role"] == "user"
    assert "id" in body["data"]


@pytest.mark.asyncio
async def test_register_ignores_privileged_role(
    client: AsyncClient,
    _session_factory,
):
    """Public registration must never elevate the caller's role."""
    unique = uuid.uuid4().hex[:8]
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"role_{unique}",
            "email": f"role_{unique}@example.com",
            "password": "Securepass123",
            "role": "admin",
        },
    )
    assert resp.status_code == 201
    assert resp.json()["data"]["role"] == "user"

    async with _session_factory() as session:
        user = (
            await session.execute(
                select(User).where(User.username == f"role_{unique}")
            )
        ).scalar_one()
    assert user.role == "user"


@pytest.mark.asyncio
async def test_register_duplicate(client: AsyncClient):
    """Registering the same username twice should return 409."""
    unique = uuid.uuid4().hex[:8]
    payload = {
        "username": f"dup_{unique}",
        "email": f"dup_{unique}@example.com",
        "password": "Testpass123",
    }

    resp1 = await client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = await client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """POST /api/v1/auth/login should create a cookie-backed session."""
    unique = uuid.uuid4().hex[:8]

    # Register first
    await client.post("/api/v1/auth/register", json={
        "username": f"loginuser_{unique}",
        "email": f"login_{unique}@example.com",
        "password": "Mypassword1",
    })

    # Login
    resp = await client.post("/api/v1/auth/login", json={
        "username": f"loginuser_{unique}",
        "password": "Mypassword1",
    })
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["user"]["username"] == f"loginuser_{unique}"
    assert "access_token" not in body["data"]
    assert client.cookies.get("access_token")
    assert client.cookies.get("refresh_token")
    assert client.cookies.get("csrf_token")


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """Login with wrong password should return 401."""
    unique = uuid.uuid4().hex[:8]

    await client.post("/api/v1/auth/register", json={
        "username": f"wrongpw_{unique}",
        "email": f"wrongpw_{unique}@example.com",
        "password": "Correctpassword1",
    })

    resp = await client.post("/api/v1/auth/login", json={
        "username": f"wrongpw_{unique}",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_rate_limit_returns_429(client: AsyncClient, monkeypatch):
    """Repeated failed logins should be rate limited."""
    reset_rate_limit_state()
    monkeypatch.setattr("app.config.settings.AUTH_LOGIN_RATE_LIMIT_PER_MIN", 2)

    unique = uuid.uuid4().hex[:8]
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"limited_{unique}",
            "email": f"limited_{unique}@example.com",
            "password": "Correctpassword1",
        },
    )

    for _ in range(2):
        resp = await client.post(
            "/api/v1/auth/login",
            json={
                "username": f"limited_{unique}",
                "password": "wrongpassword",
            },
        )
        assert resp.status_code == 401

    resp = await client.post(
        "/api/v1/auth/login",
        json={
            "username": f"limited_{unique}",
            "password": "wrongpassword",
        },
    )
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_refresh_rotates_without_exposing_token(
    auth_client: AsyncClient,
    auth_csrf_headers: dict[str, str],
    _session_factory,
):
    """Refresh should rotate the session and keep tokens out of JSON."""
    old_refresh = auth_client.cookies.get("refresh_token")
    resp = await auth_client.post("/api/v1/auth/refresh", headers=auth_csrf_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert "access_token" not in body["data"]
    assert auth_client.cookies.get("refresh_token") != old_refresh

    async with _session_factory() as session:
        stored = (
            await session.execute(
                select(RefreshToken).where(RefreshToken.token_hash.is_not(None))
            )
        ).scalars().all()
    assert len(stored) == 2
    assert any(token.revoked_at is not None for token in stored)


@pytest.mark.asyncio
async def test_refresh_reuse_revokes_session_family(
    auth_client: AsyncClient,
    auth_csrf_headers: dict[str, str],
):
    """Reusing an old refresh token should revoke the whole session family."""
    old_refresh = auth_client.cookies.get("refresh_token")
    refresh_resp = await auth_client.post(
        "/api/v1/auth/refresh",
        headers=auth_csrf_headers,
    )
    assert refresh_resp.status_code == 200

    auth_client.cookies.set("refresh_token", old_refresh, path="/api/v1/auth")
    reuse_resp = await auth_client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": auth_client.cookies.get("csrf_token")},
    )
    assert reuse_resp.status_code == 401

    me_resp = await auth_client.get("/api/v1/auth/me")
    assert me_resp.status_code == 401


@pytest.mark.asyncio
async def test_me(auth_client: AsyncClient):
    """GET /api/v1/auth/me should work with cookie auth."""
    resp = await auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "success"
    assert "username" in body["data"]
    assert "email" in body["data"]


@pytest.mark.asyncio
async def test_me_unauthorized(client: AsyncClient):
    """GET /api/v1/auth/me without token should return 401."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_cookie_mutation_requires_csrf(auth_client: AsyncClient):
    """Cookie-authenticated mutations must reject missing CSRF headers."""
    resp = await auth_client.post(
        "/api/v1/tasks",
        json={"title": "no csrf", "description": "", "completed": False},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cookie_mutation_accepts_valid_csrf(
    auth_client: AsyncClient,
    auth_csrf_headers: dict[str, str],
):
    """Cookie-authenticated mutations should succeed with a valid CSRF token."""
    resp = await auth_client.post(
        "/api/v1/tasks",
        headers=auth_csrf_headers,
        json={"title": "valid csrf", "description": "", "completed": False},
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_logout(auth_client: AsyncClient, auth_csrf_headers: dict[str, str]):
    """POST /api/v1/auth/logout should revoke the current session."""
    resp = await auth_client.post("/api/v1/auth/logout", headers=auth_csrf_headers)
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "success"
    me_resp = await auth_client.get("/api/v1/auth/me")
    assert me_resp.status_code == 401


@pytest.mark.asyncio
async def test_login_cooldown_after_threshold(
    client: AsyncClient, monkeypatch
):
    """After AUTH_LOCKOUT_THRESHOLD failures the same key is blocked with 429.

    The cooldown must trip even when the next attempt uses a *valid* password,
    so the block is clearly coming from ``enforce_login_cooldown`` and not from
    the per-minute rate limiter. Keep the rate limit high and the threshold low
    to isolate the behavior under test.
    """
    reset_rate_limit_state()
    monkeypatch.setattr("app.config.settings.AUTH_LOGIN_RATE_LIMIT_PER_MIN", 1000)
    monkeypatch.setattr("app.config.settings.AUTH_LOCKOUT_THRESHOLD", 3)
    monkeypatch.setattr("app.config.settings.AUTH_LOCKOUT_MINUTES", 15)

    unique = uuid.uuid4().hex[:8]
    username = f"cooldown_{unique}"
    password = "Cooldown1password"
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "email": f"{username}@example.com",
            "password": password,
        },
    )

    for _ in range(3):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"username": username, "password": "Wrongpass9"},
        )
        assert resp.status_code == 401

    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 429, resp.text
    body = resp.json()
    assert body["status"] == "error"
    assert body["code"] == "TooManyRequestsException"


def _set_cookie_headers_for(headers, name: str) -> list[str]:
    """Return all ``Set-Cookie`` headers whose cookie name is ``name``."""
    matches: list[str] = []
    for raw in headers.get_list("set-cookie"):
        first, _, _ = raw.partition(";")
        key, _, _ = first.partition("=")
        if key.strip() == name:
            matches.append(raw)
    return matches


@pytest.mark.asyncio
async def test_auth_cookies_dev_are_not_secure(
    client: AsyncClient, monkeypatch
):
    """Dev environments must not emit ``Secure`` cookies (HTTP is allowed)."""
    monkeypatch.setattr("app.config.settings.ENV", "dev")
    monkeypatch.setattr("app.config.settings.AUTH_COOKIE_SAMESITE", "lax")

    unique = uuid.uuid4().hex[:8]
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"cookiedev_{unique}",
            "email": f"cookiedev_{unique}@example.com",
            "password": "Cookiedev123",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": f"cookiedev_{unique}", "password": "Cookiedev123"},
    )
    assert resp.status_code == 200

    for name in ("access_token", "refresh_token", "csrf_token"):
        raws = _set_cookie_headers_for(resp.headers, name)
        assert raws, f"missing Set-Cookie for {name}"
        for raw in raws:
            lowered = raw.lower()
            assert "secure" not in lowered, (
                f"dev cookie {name!r} must not be Secure: {raw}"
            )
            assert "samesite=lax" in lowered, (
                f"expected SameSite=Lax on {name!r}, got {raw}"
            )


@pytest.mark.asyncio
async def test_auth_cookies_in_prod_are_secure_and_samesite_strict(
    client: AsyncClient, monkeypatch
):
    """Prod must emit Secure + HttpOnly and honor AUTH_COOKIE_SAMESITE."""
    monkeypatch.setattr("app.config.settings.ENV", "prod")
    monkeypatch.setattr("app.config.settings.AUTH_COOKIE_SAMESITE", "strict")

    unique = uuid.uuid4().hex[:8]
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"cookieprod_{unique}",
            "email": f"cookieprod_{unique}@example.com",
            "password": "Cookieprod123",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": f"cookieprod_{unique}", "password": "Cookieprod123"},
    )
    assert resp.status_code == 200

    for name in ("access_token", "refresh_token"):
        raws = _set_cookie_headers_for(resp.headers, name)
        assert raws, f"missing Set-Cookie for {name}"
        for raw in raws:
            lowered = raw.lower()
            assert "secure" in lowered, f"{name!r} must be Secure in prod: {raw}"
            assert "httponly" in lowered, f"{name!r} must be HttpOnly: {raw}"
            assert "samesite=strict" in lowered, (
                f"{name!r} must honor AUTH_COOKIE_SAMESITE: {raw}"
            )

    csrf_raws = _set_cookie_headers_for(resp.headers, "csrf_token")
    assert csrf_raws, "missing csrf_token cookie"
    csrf_lowered = csrf_raws[0].lower()
    assert "httponly" not in csrf_lowered, (
        "csrf_token MUST remain readable by JS for the double-submit pattern"
    )
    assert "secure" in csrf_lowered
    assert "samesite=strict" in csrf_lowered
