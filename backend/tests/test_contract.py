"""
Framework-wide contract tests.

These tests encode the hard rules from AGENTS.md / docs/adr/0001-api-contract.md:

- Every /api/v1 route requires auth unless explicitly whitelisted.
- Success responses follow the ``{status: "success", data, ...}`` envelope.
- Error responses follow the ``{status: "error", detail, code}`` envelope.

If any new endpoint breaks this contract, these tests fail — preventing
regressions before they reach prod.
"""

from __future__ import annotations

import pytest
from fastapi.routing import APIRoute
from httpx import AsyncClient
from pydantic import ValidationError

from app.api.deps import get_current_user
from app.config import Settings
from app.core.exceptions import ConflictException
from app.core.security import validate_password_strength
from app.main import app
from app.schemas.auth import UserCreate

# Routes that are intentionally public.
PUBLIC_ROUTES: set[tuple[str, str]] = {
    ("POST", "/api/v1/auth/login"),
    ("POST", "/api/v1/auth/register"),
    ("POST", "/api/v1/auth/refresh"),
    ("POST", "/api/v1/auth/logout"),
    ("GET", "/api/v1/"),
    ("GET", "/api/v1/navigation"),
    ("GET", "/api/v1/catalogs/{catalog_type}"),
    ("GET", "/api/health"),
    ("GET", "/openapi.json"),
    ("GET", "/docs"),
    ("GET", "/docs/oauth2-redirect"),
    ("GET", "/redoc"),
}


def _has_auth_guard(route: APIRoute) -> bool:
    """Return True iff the route's dependency tree includes ``get_current_user``.

    Works transitively: ``require_role`` and ``require_ownership`` both
    eventually depend on ``get_current_user``, so any route wired through
    them is considered guarded.
    """

    def _walk(dependant) -> bool:
        if dependant.call is get_current_user:
            return True
        return any(_walk(sub) for sub in dependant.dependencies)

    return any(_walk(d) for d in route.dependant.dependencies)


def test_every_api_v1_route_requires_auth_unless_whitelisted():
    """Guardrail: no silent public endpoints under /api/v1/."""
    offenders: list[str] = []
    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue
        if not route.path.startswith("/api/v1/") and route.path != "/api/v1/":
            continue
        for method in route.methods or set():
            if method == "HEAD":
                continue
            key = (method, route.path)
            if key in PUBLIC_ROUTES:
                continue
            if not _has_auth_guard(route):
                offenders.append(f"{method} {route.path}")

    assert not offenders, (
        "Routes under /api/v1 missing get_current_user/require_role and not "
        f"whitelisted in tests/test_contract.py::PUBLIC_ROUTES: {offenders}"
    )


@pytest.mark.asyncio
async def test_success_envelope_shape(client: AsyncClient, auth_headers: dict[str, str]):
    """A canonical success response must be ``{status: 'success', data: ...}``."""
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert "data" in body


def test_register_schema_does_not_accept_role():
    """Guardrail: public registration must not expose role assignment."""
    assert "role" not in UserCreate.model_fields


@pytest.mark.asyncio
async def test_login_response_never_exposes_access_token(client: AsyncClient):
    """Guardrail: auth cookies are the only token transport for browser flows."""
    import uuid

    unique = uuid.uuid4().hex[:8]
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"contract_{unique}",
            "email": f"contract_{unique}@example.com",
            "password": "Contractpass123",
        },
    )

    resp = await client.post(
        "/api/v1/auth/login",
        json={
            "username": f"contract_{unique}",
            "password": "Contractpass123",
        },
    )
    assert resp.status_code == 200
    assert "access_token" not in resp.json()["data"]


@pytest.mark.asyncio
async def test_cookie_mutations_require_csrf(
    auth_client: AsyncClient,
):
    """Guardrail: cookie-authenticated mutating routes reject missing CSRF."""
    resp = await auth_client.post(
        "/api/v1/tasks",
        json={"title": "contract-csrf", "description": "", "completed": False},
    )
    assert resp.status_code == 403
    body = resp.json()
    assert body["status"] == "error"
    assert body["code"] == "ForbiddenException"


def test_password_policy_rejects_weak_defaults():
    """Guardrail (ADR-0015): the validator must reject obvious weak passwords."""
    weak_samples = ["password", "Password", "12345678", "Changeme123"]
    for sample in weak_samples:
        with pytest.raises(ConflictException):
            validate_password_strength(sample)

    with pytest.raises(ConflictException):
        validate_password_strength("Mypassword1", username="mypassword")

    with pytest.raises(ConflictException):
        validate_password_strength("alllowercase123")


@pytest.mark.asyncio
async def test_auth_cookie_samesite_is_configurable(client: AsyncClient, monkeypatch: pytest.MonkeyPatch):
    """Guardrail (ADR-0015): Set-Cookie must honor AUTH_COOKIE_SAMESITE."""
    import uuid

    monkeypatch.setattr("app.config.settings.AUTH_COOKIE_SAMESITE", "strict")

    unique = uuid.uuid4().hex[:8]
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": f"samesite_{unique}",
            "email": f"samesite_{unique}@example.com",
            "password": "Samesite123",
        },
    )
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": f"samesite_{unique}", "password": "Samesite123"},
    )
    assert resp.status_code == 200

    raws = resp.headers.get_list("set-cookie")
    access_cookies = [raw for raw in raws if raw.split(";", 1)[0].split("=", 1)[0].strip() == "access_token"]
    assert access_cookies, "missing access_token Set-Cookie"
    assert any("samesite=strict" in raw.lower() for raw in access_cookies), (
        f"expected SameSite=Strict on access_token, got {access_cookies}"
    )


def test_samesite_none_requires_prod(monkeypatch: pytest.MonkeyPatch):
    """Guardrail (ADR-0015): ``AUTH_COOKIE_SAMESITE=none`` is prod-only."""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://x:y@z/db_test")
    monkeypatch.setenv("SECRET_KEY", "super-secret-key-that-is-long-enough-1234567890")
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "Changeme123!")
    monkeypatch.setenv("ENV", "dev")
    monkeypatch.setenv("AUTH_COOKIE_SAMESITE", "none")

    with pytest.raises(ValidationError):
        Settings()


def test_prod_docs_require_explicit_override(monkeypatch: pytest.MonkeyPatch):
    """Prod must fail closed unless docs exposure is explicitly allowed."""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://x:y@z/db_test")
    monkeypatch.setenv("SECRET_KEY", "super-secret-key-that-is-long-enough-1234567890")
    monkeypatch.setenv("ADMIN_EMAIL", "admin@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "changeme123")
    monkeypatch.setenv("ENV", "prod")
    monkeypatch.setenv("ENABLE_OPENAPI_DOCS", "true")
    monkeypatch.delenv("ALLOW_OPENAPI_IN_PROD", raising=False)

    with pytest.raises(ValidationError):
        Settings()


@pytest.mark.asyncio
async def test_error_envelope_401(client: AsyncClient):
    """Unauthenticated requests must use the error envelope with a code."""
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    body = resp.json()
    assert body["status"] == "error"
    assert "detail" in body
    assert body.get("code") == "UnauthorizedException"


@pytest.mark.asyncio
async def test_error_envelope_404(client: AsyncClient, auth_headers: dict[str, str]):
    """Not found must use the error envelope."""
    from uuid import uuid4

    resp = await client.get(f"/api/v1/tasks/{uuid4()}", headers=auth_headers)
    assert resp.status_code == 404
    body = resp.json()
    assert body["status"] == "error"
    assert body.get("code") == "NotFoundException"


@pytest.mark.asyncio
async def test_error_envelope_422(client: AsyncClient, auth_headers: dict[str, str]):
    """Validation errors must use the error envelope with 422."""
    resp = await client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"description": "missing title"},
    )
    assert resp.status_code == 422
    body = resp.json()
    assert body["status"] == "error"
    assert body.get("code") == "RequestValidationError"
    assert isinstance(body["detail"], list)


def test_owned_services_declare_audit_action_prefix():
    """Every owned BaseService MUST set ``audit_action_prefix`` (ADR-0007).

    We walk all modules under ``app.services`` and assert that any
    ``BaseService`` instance with an ``owner_field`` also defines
    ``audit_action_prefix``. This catches new entities that forget to wire
    the audit hook.
    """
    import importlib
    import pkgutil

    import app.services as services_pkg
    from app.services.base import BaseService

    offenders: list[str] = []
    for _, name, _ in pkgutil.iter_modules(services_pkg.__path__):
        module = importlib.import_module(f"app.services.{name}")
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if not isinstance(attr, BaseService):
                continue
            if attr.owner_field and not attr.audit_action_prefix:
                offenders.append(f"app.services.{name}.{attr_name}")

    assert not offenders, f"Owned BaseService instances missing audit_action_prefix (ADR-0007): {offenders}"


@pytest.mark.asyncio
async def test_mutation_writes_audit_log(
    client: AsyncClient,
    auth_headers: dict[str, str],
    _session_factory,
):
    """A POST on an owned entity must leave a row in ``audit_logs``."""
    from sqlalchemy import select

    from app.models.audit_log import AuditLog

    resp = await client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "contract-audit", "description": "", "completed": False},
    )
    assert resp.status_code == 201
    task_id = resp.json()["data"]["id"]

    async with _session_factory() as session:
        rows = (await session.execute(select(AuditLog).where(AuditLog.entity_id == task_id))).scalars().all()

    assert any(r.action == "task.create" for r in rows), (
        "No task.create audit row — BaseService did not record the mutation."
    )
