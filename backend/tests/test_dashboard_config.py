"""Tests for DashboardConfig entity — system-level configuration (super_admin only)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


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
