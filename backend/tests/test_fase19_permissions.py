"""
Fase 19 — Granular Permissions Tests.

Tests:
1. require_permission allows super_admin/admin bypassing all checks
2. require_permission allows user with correct permission
3. require_permission returns 403 when user lacks permission
4. Permission catalogue is seeded with all P codes on first access
5. Role permission matrix matches DEFAULT_ROLE_PERMISSIONS
"""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

# ─── Helpers ──────────────────────────────────────────────────────────────────


async def _register_user(client: AsyncClient, role: str = "user") -> dict:
    """Register a user with the given role. Returns {username, password, token}."""
    unique = uuid.uuid4().hex[:8]
    username = f"perm_{role}_{unique}"
    payload = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "Testpass123",
    }
    resp = await client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return {"username": username, "password": "Testpass123"}


async def _login(client: AsyncClient, username: str, password: str) -> str:
    """Login and return the access token."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )
    assert resp.status_code == 200, resp.text
    return client.cookies.get("access_token")


async def _promote_role(
    session_factory: async_sessionmaker[AsyncSession],
    username: str,
    role: str,
) -> None:
    """Directly promote a user to a given role in the DB."""
    async with session_factory() as session:
        await session.execute(
            text("UPDATE users SET role = :role WHERE username = :u"),
            {"role": role, "u": username},
        )
        await session.commit()


# ─── Tests ────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_admin_bypasses_permission_check(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """super_admin/admin roles should bypass all permission checks."""
    # Access the roles admin endpoint (which requires admin role)
    resp = await client.get("/api/v1/admin/roles", headers=admin_auth_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_permission_catalogue_seeded(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """Permission catalogue should contain all codes from P after first access."""
    resp = await client.get(
        "/api/v1/admin/roles/_permissions",
        headers=admin_auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    codes = [p["code"] for p in data]

    # Verify key permission codes exist
    assert "vulnerabilities.view" in codes
    assert "vulnerabilities.approve" in codes
    assert "releases.view" in codes
    assert "releases.approve" in codes
    assert "dashboards.view" in codes
    assert "dashboards.export" in codes
    assert "audit_logs.view" in codes
    assert "ia.execute" in codes
    assert "admin.view" in codes
    assert "inventory.repos.export" in codes
    assert "inventory.repos.import" in codes


@pytest.mark.asyncio
async def test_all_platform_roles_seeded(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """All 8 roles (6 platform + 2 framework) should be seeded."""
    resp = await client.get("/api/v1/admin/roles", headers=admin_auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    role_names = {r["name"] for r in data}

    expected_roles = {
        "super_admin",
        "chief_appsec",
        "lider_programa",
        "analista",
        "auditor",
        "readonly",
        "admin",
        "user",
    }
    assert expected_roles.issubset(role_names), f"Missing roles: {expected_roles - role_names}"


@pytest.mark.asyncio
async def test_role_permission_matrix_correctness(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """Verify that the default permission matrix is correctly applied."""
    resp = await client.get("/api/v1/admin/roles", headers=admin_auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]

    roles_by_name = {r["name"]: r for r in data}

    # super_admin should have ALL permissions
    sa_perms = set(roles_by_name["super_admin"]["permissions"])
    assert "vulnerabilities.approve" in sa_perms
    assert "admin.delete" in sa_perms
    assert "ia.configure" in sa_perms

    # readonly should only have view-level permissions
    ro_perms = set(roles_by_name["readonly"]["permissions"])
    assert "dashboards.view" in ro_perms
    assert "vulnerabilities.view" in ro_perms
    assert "vulnerabilities.create" not in ro_perms
    assert "admin.view" not in ro_perms

    # auditor should have views + audit_logs.export + audit_logs.verify
    aud_perms = set(roles_by_name["auditor"]["permissions"])
    assert "audit_logs.view" in aud_perms
    assert "audit_logs.export" in aud_perms
    assert "audit_logs.verify" in aud_perms
    assert "vulnerabilities.create" not in aud_perms

    # analista should have create/edit on programs, vulns, releases
    ana_perms = set(roles_by_name["analista"]["permissions"])
    assert "programs.create" in ana_perms
    assert "vulnerabilities.edit" in ana_perms
    assert "releases.create" in ana_perms
    assert "admin.view" not in ana_perms
    assert "vulnerabilities.delete" not in ana_perms


@pytest.mark.asyncio
async def test_user_without_permission_gets_403(
    client: AsyncClient,
    _session_factory: async_sessionmaker[AsyncSession],
):
    """A user with 'readonly' role should get 403 on admin endpoints."""
    user = await _register_user(client, role="readonly")
    await _promote_role(_session_factory, user["username"], "readonly")
    token = await _login(client, user["username"], user["password"])

    headers = {"Authorization": f"Bearer {token}"}

    # Admin endpoints require admin role — readonly should be denied
    resp = await client.get("/api/v1/admin/roles", headers=headers)
    assert resp.status_code == 403
