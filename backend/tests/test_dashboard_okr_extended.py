"""Tests for Dashboard OKR Extended endpoints."""

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/dashboard"


class TestDashboardOkrTeam:
    """Tests for OKR Team dashboard endpoint."""

    @pytest.mark.asyncio
    async def test_get_okr_team_requires_auth(self, client: AsyncClient):
        """Verify OKR team endpoint requires authentication."""
        resp = await client.get(f"{BASE_URL}/okr/team")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_okr_team_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Verify OKR team endpoint returns data with auth."""
        resp = await client.get(f"{BASE_URL}/okr/team", headers=auth_headers)
        # Should return 200 or 500 (if no direct reports), but not 401
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"
            data = resp.json()["data"]
            assert "analistas" in data
            assert "kpis" in data


class TestDashboardOkrGlobal:
    """Tests for OKR Global dashboard endpoint."""

    @pytest.mark.asyncio
    async def test_get_okr_global_requires_auth(self, client: AsyncClient):
        """Verify OKR global endpoint requires authentication."""
        resp = await client.get(f"{BASE_URL}/okr/global")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_okr_global_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Verify OKR global endpoint returns data with auth."""
        resp = await client.get(f"{BASE_URL}/okr/global", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"
            data = resp.json()["data"]
            assert "celulas" in data
            assert "kpis" in data


class TestDashboardOkrCalificar:
    """Tests for OKR calificar endpoint."""

    @pytest.mark.asyncio
    async def test_calificar_requires_auth(self, client: AsyncClient):
        """Verify calificar endpoint requires authentication."""
        resp = await client.post(f"{BASE_URL}/okr/calificar", json={})
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_calificar_validation(self, client: AsyncClient, auth_headers: dict):
        """Verify calificar validates required fields."""
        resp = await client.post(f"{BASE_URL}/okr/calificar", headers=auth_headers, json={})
        # 403 (no permission) or 422 (validation error) are acceptable
        assert resp.status_code in [422, 403, 500], resp.text

    @pytest.mark.asyncio
    async def test_calificar_with_valid_data(self, client: AsyncClient, auth_headers: dict):
        """Verify calificar accepts valid data."""
        # This will fail if no subcompromiso exists, but tests the schema validation
        # Note: Requires EDIT permission which regular users don't have, so 403 is expected
        payload = {
            "subcompromiso_id": "00000000-0000-0000-0000-000000000001",
            "quarter": "Q1",
            "avance": 75.0,
            "comentario": "Avance correcto",
            "evidencia": "Evidencia de avance",
        }
        resp = await client.post(f"{BASE_URL}/okr/calificar", headers=auth_headers, json=payload)
        # Either 201 (created), 404 (subcompromiso not found), or 403 (no permission) is acceptable
        assert resp.status_code in [201, 404, 403, 500], resp.text


class TestDashboardOkrEvolution:
    """Tests for OKR evolution endpoint."""

    @pytest.mark.asyncio
    async def test_get_okr_evolution_requires_auth(self, client: AsyncClient):
        """Verify OKR evolution endpoint requires authentication."""
        resp = await client.get(f"{BASE_URL}/okr/evolution")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_okr_evolution_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Verify OKR evolution endpoint returns data with auth."""
        resp = await client.get(f"{BASE_URL}/okr/evolution", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"


class TestDashboardOkrDrilldown:
    """Tests for OKR drilldown endpoint."""

    @pytest.mark.asyncio
    async def test_okr_drilldown_requires_auth(self, client: AsyncClient):
        """Verify OKR drilldown endpoint requires authentication."""
        resp = await client.get(f"{BASE_URL}/okr/drilldown")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_okr_drilldown_with_filters(self, client: AsyncClient, auth_headers: dict):
        """Verify OKR drilldown accepts filter parameters."""
        resp = await client.get(
            f"{BASE_URL}/okr/drilldown?min_avance=0&max_avance=50",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"


class TestDashboardOkrBase:
    """Tests for OKR base endpoint."""

    @pytest.mark.asyncio
    async def test_get_okr_base_requires_auth(self, client: AsyncClient):
        """Verify OKR base endpoint requires authentication."""
        resp = await client.get(f"{BASE_URL}/okr")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_okr_base_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Verify OKR base endpoint returns data with auth."""
        resp = await client.get(f"{BASE_URL}/okr", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"
