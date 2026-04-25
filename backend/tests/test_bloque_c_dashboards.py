"""Tests for Bloque C Dashboard endpoints — Phase 18."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.role import Permission, Role, role_permissions
from app.services.permission_seed import ensure_roles_permissions_seeded


@pytest.mark.asyncio
async def test_dashboard_vulnerabilities_endpoint(client: AsyncClient, auth_headers: dict):
    """Test vulnerabilities dashboard multidimensional data."""
    response = await client.get("/api/v1/dashboard/vulnerabilities", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Check structure
    assert "total_vulnerabilities" in data["data"]
    assert "by_severity" in data["data"]
    assert "by_state" in data["data"]
    assert "overdue_count" in data["data"]
    assert "sla_status" in data["data"]

    # Check severity keys exist
    for sev in ["CRITICA", "ALTA", "MEDIA", "BAJA"]:
        assert sev in data["data"]["by_severity"]


@pytest.mark.asyncio
async def test_dashboard_releases_endpoint(client: AsyncClient, auth_headers: dict):
    """Test releases dashboard status distribution."""
    response = await client.get("/api/v1/dashboard/releases", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Check structure
    assert "total_releases" in data["data"]
    assert "pending_approval" in data["data"]
    assert "in_progress" in data["data"]
    assert "completed" in data["data"]
    assert "status_distribution" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_initiatives_endpoint(client: AsyncClient, auth_headers: dict):
    """Test initiatives dashboard."""
    response = await client.get("/api/v1/dashboard/initiatives", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Check structure
    assert "total_initiatives" in data["data"]
    assert "in_progress" in data["data"]
    assert "completed" in data["data"]
    assert "completion_percentage" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_emerging_themes_endpoint(client: AsyncClient, auth_headers: dict):
    """Test emerging themes dashboard."""
    response = await client.get("/api/v1/dashboard/emerging-themes", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Check structure
    assert "total_themes" in data["data"]
    assert "unmoved_7_days" in data["data"]
    assert "active" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_executive_endpoint(client: AsyncClient, auth_headers: dict):
    """Test executive/general dashboard with KPIs."""
    response = await client.get("/api/v1/dashboard/executive", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Check KPI structure
    assert "kpis" in data["data"]
    assert "risk_level" in data["data"]
    assert "total_vulnerabilities" in data["data"]["kpis"]
    assert "critical_count" in data["data"]["kpis"]


@pytest.mark.asyncio
async def test_dashboard_programs_endpoint(client: AsyncClient, auth_headers: dict):
    """Test programs consolidado dashboard."""
    response = await client.get("/api/v1/dashboard/programs", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

    # Check structure
    assert "total_programs" in data["data"]
    assert "avg_completion" in data["data"]
    assert "programs_at_risk" in data["data"]
    assert "program_breakdown" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_programs_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    gid = uuid4()
    endpoint = f"/api/v1/dashboard/programs?gerencia_id={gid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["gerencia_id"] == str(gid)


@pytest.mark.asyncio
async def test_dashboard_team_endpoint(client: AsyncClient, auth_headers: dict):
    """Test team dashboard structure."""
    response = await client.get("/api/v1/dashboard/team", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "team_size" in data["data"]
    assert "analysts" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_program_detail_endpoint(client: AsyncClient, auth_headers: dict):
    """Test program detail dashboard structure."""
    response = await client.get("/api/v1/dashboard/program-detail?program=sast", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["program"] == "sast"
    assert "total_findings" in data["data"]
    assert "completion_percentage" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_releases_table_endpoint(client: AsyncClient, auth_headers: dict):
    """Test releases table dashboard structure."""
    response = await client.get("/api/v1/dashboard/releases-table", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "items" in data["data"]
    assert "count" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_releases_kanban_endpoint(client: AsyncClient, auth_headers: dict):
    """Test releases kanban dashboard structure."""
    response = await client.get("/api/v1/dashboard/releases-kanban", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "columns" in data["data"]
    assert "total_cards" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_vulnerabilities_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    sid = uuid4()
    endpoint = f"/api/v1/dashboard/vulnerabilities?subdireccion_id={sid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["subdireccion_id"] == str(sid)


@pytest.mark.asyncio
async def test_dashboard_releases_table_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    gid = uuid4()
    endpoint = f"/api/v1/dashboard/releases-table?gerencia_id={gid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["gerencia_id"] == str(gid)


@pytest.mark.asyncio
async def test_dashboard_executive_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    oid = uuid4()
    endpoint = f"/api/v1/dashboard/executive?organizacion_id={oid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["organizacion_id"] == str(oid)


@pytest.mark.asyncio
async def test_dashboard_team_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    cid = uuid4()
    endpoint = f"/api/v1/dashboard/team?celula_id={cid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["celula_id"] == str(cid)


@pytest.mark.asyncio
async def test_dashboard_initiatives_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    oid = uuid4()
    endpoint = f"/api/v1/dashboard/initiatives?organizacion_id={oid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["organizacion_id"] == str(oid)


@pytest.mark.asyncio
async def test_dashboard_emerging_themes_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    gid = uuid4()
    endpoint = f"/api/v1/dashboard/emerging-themes?gerencia_id={gid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["gerencia_id"] == str(gid)


@pytest.mark.asyncio
async def test_dashboard_releases_kanban_accepts_hierarchy_filters(client: AsyncClient, auth_headers: dict):
    sid = uuid4()
    endpoint = f"/api/v1/dashboard/releases-kanban?subdireccion_id={sid}"
    response = await client.get(endpoint, headers=auth_headers)
    assert response.status_code == 200, response.text
    data = response.json()["data"]
    assert data["applied_filters"]["subdireccion_id"] == str(sid)


@pytest.mark.asyncio
async def test_dashboard_stats_still_works(client: AsyncClient, auth_headers: dict):
    """Test original stats endpoint still works."""
    response = await client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "scope" in data["data"]


@pytest.mark.asyncio
async def test_dashboard_requires_auth(client: AsyncClient):
    """All dashboard endpoints require authentication."""
    endpoints = [
        "/api/v1/dashboard/stats",
        "/api/v1/dashboard/vulnerabilities",
        "/api/v1/dashboard/releases",
        "/api/v1/dashboard/initiatives",
        "/api/v1/dashboard/emerging-themes",
        "/api/v1/dashboard/executive",
        "/api/v1/dashboard/programs",
        "/api/v1/dashboard/team",
        "/api/v1/dashboard/program-detail",
        "/api/v1/dashboard/releases-table",
        "/api/v1/dashboard/releases-kanban",
    ]

    for endpoint in endpoints:
        response = await client.get(endpoint)
        assert response.status_code == 401, f"{endpoint} should require auth"


@pytest.mark.asyncio
async def test_dashboard_forbidden_without_dashboards_view(
    client: AsyncClient,
    auth_headers: dict,
    _session_factory: async_sessionmaker[AsyncSession],
):
    """Usuario sin permiso dashboards.view recibe 403."""
    async with _session_factory() as session:
        await ensure_roles_permissions_seeded(session)
        r_user = (await session.execute(select(Role).where(Role.name == "user"))).scalar_one()
        perm = (await session.execute(select(Permission).where(Permission.code == "dashboards.view"))).scalar_one()
        await session.execute(
            delete(role_permissions).where(
                role_permissions.c.role_id == r_user.id,
                role_permissions.c.permission_id == perm.id,
            )
        )
        await session.commit()

    response = await client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert response.status_code == 403
    assert "dashboards.view" in response.text
