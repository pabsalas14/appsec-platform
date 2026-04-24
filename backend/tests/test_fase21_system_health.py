"""
Fase 21 — System Health Tests.

Tests:
1. super_admin can read system health metrics
2. Regular user cannot read system health metrics (403)
3. Endpoint returns expected keys (users, audit, database, ia_integration)
"""

import pytest
from httpx import AsyncClient

HEALTH_URL = "/api/v1/admin/system-health"


@pytest.mark.asyncio
async def test_admin_can_read_system_health(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """Admin can successfully read the system health endpoint."""
    resp = await client.get(HEALTH_URL, headers=admin_auth_headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]

    # Verify key sections exist
    assert "timestamp" in data
    assert "users" in data
    assert "audit" in data
    assert "database" in data
    assert "ia_integration" in data

    # Verify db stats
    assert "size_mb" in data["database"]
    assert isinstance(data["database"]["table_stats"], list)


@pytest.mark.asyncio
async def test_user_cannot_read_system_health(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Regular user gets 403 when trying to read system health."""
    resp = await client.get(HEALTH_URL, headers=auth_headers)
    assert resp.status_code == 403
