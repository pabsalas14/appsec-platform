"""Tests for Bloque C Dashboard endpoints — Phase 18."""

import pytest
from httpx import AsyncClient


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
    ]

    for endpoint in endpoints:
        response = await client.get(endpoint)
        assert response.status_code == 401, f"{endpoint} should require auth"
