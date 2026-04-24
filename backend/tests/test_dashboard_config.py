"""Tests for DashboardConfig entity — system-level configuration (super_admin only)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.dashboard_config import DashboardConfig
from app.models.role import Role
from app.services.permission_seed import ensure_roles_permissions_seeded

BASE_URL = "/api/v1/dashboard_configs"


@pytest.mark.asyncio
async def test_dashboard_config_requires_super_admin(client: AsyncClient, auth_headers: dict):
    """DashboardConfig endpoints are super_admin only."""
    payload = {
        "dashboard_id": "1",
        "widget_id": "dashboard.1.panel.kpis",
        "role_id": str(uuid4()),
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


@pytest.mark.asyncio
async def test_dashboard_config_my_visibility_requires_auth(client: AsyncClient):
    assert (await client.get(f"{BASE_URL}/my-visibility")).status_code == 401


@pytest.mark.asyncio
async def test_dashboard_config_my_visibility_default(
    client: AsyncClient, auth_headers: dict
):
    resp = await client.get(f"{BASE_URL}/my-visibility?dashboard_id=home", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["dashboard_id"] == "home"
    assert data["default_visible"] is True
    assert isinstance(data["widgets"], dict)


@pytest.mark.asyncio
async def test_dashboard_config_my_visibility_with_role_overrides(
    client: AsyncClient,
    auth_headers: dict,
    _session_factory: async_sessionmaker[AsyncSession],
):
    async with _session_factory() as session:
        await ensure_roles_permissions_seeded(session)
        role = (await session.execute(select(Role).where(Role.name == "user"))).scalar_one()
        session.add(
            DashboardConfig(
                dashboard_id="home",
                widget_id="dashboard.home.card.appsec.total_vulnerabilities",
                role_id=role.id,
                visible=False,
                editable_by_role=False,
            )
        )
        await session.commit()

    resp = await client.get(f"{BASE_URL}/my-visibility?dashboard_id=home", headers=auth_headers)
    assert resp.status_code == 200, resp.text
    widgets = resp.json()["data"]["widgets"]
    assert "dashboard.home.card.appsec.total_vulnerabilities" in widgets
    assert widgets["dashboard.home.card.appsec.total_vulnerabilities"]["visible"] is False
