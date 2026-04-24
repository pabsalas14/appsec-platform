"""Tests for DashboardConfig entity — system-level configuration (super_admin only)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.role import Role
from sqlalchemy import select


BASE_URL = "/api/v1/dashboard_configs"


async def get_admin_role_id(db: AsyncSession) -> str:
    """Get or create admin role for testing."""
    result = await db.execute(select(Role).where(Role.name == "admin"))
    role = result.scalar_one_or_none()
    if role:
        return str(role.id)
    # Create a test role
    role = Role(name="test_admin", description="Test Admin Role")
    db.add(role)
    await db.flush()
    return str(role.id)


@pytest.mark.asyncio
async def test_dashboard_config_requires_super_admin(client: AsyncClient, auth_headers: dict):
    """DashboardConfig endpoints are super_admin only."""
    payload = {
        "dashboard_id": "1",
        "widget_id": "dashboard.1.panel.kpis",
        "role_id": "00000000-0000-0000-0000-000000000001",
        "visible": True,
        "editable_by_role": False,
    }

    # Regular user should get 403
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_dashboard_configs(client: AsyncClient, auth_headers: dict):
    """List is read-only and requires authentication."""
    resp = await client.get(BASE_URL, headers=auth_headers)
    # Should either be 403 (non-admin) or 200 with empty list (admin)
    assert resp.status_code in [200, 403]


@pytest.mark.asyncio
async def test_dashboard_config_requires_auth(client: AsyncClient):
    """Unauthenticated requests should fail."""
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_dashboard_config_system_level(client: AsyncClient, auth_headers: dict):
    """DashboardConfig is not owned by users — it's system-level configuration."""
    # Should not have IDOR protection; it's admin-only access control
    assert (await client.get(f"{BASE_URL}/{uuid4()}", headers=auth_headers)).status_code in [
        403,  # Forbidden (not admin)
        404,  # Not found (admin but doesn't exist)
    ]
