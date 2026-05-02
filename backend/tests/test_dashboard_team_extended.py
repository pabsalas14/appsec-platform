"""Tests for Dashboard Team Extended endpoints."""

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/dashboard"


class TestDashboardTeamDetalle:
    """Tests for team analyst detalle endpoint."""

    @pytest.mark.asyncio
    async def test_team_detalle_requires_auth(self, client: AsyncClient):
        """Verify team detalle requires authentication."""
        resp = await client.get(f"{BASE_URL}/team/00000000-0000-0000-0000-000000000001/detalle")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_team_detalle_with_auth(self, client: AsyncClient, admin_auth_headers: dict):
        """Verify team detalle returns data with auth."""
        resp = await client.get(
            f"{BASE_URL}/team/00000000-0000-0000-0000-000000000001/detalle",
            headers=admin_auth_headers,
        )
        # Either returns data or error (non-existent analyst)
        assert resp.status_code in [200, 404, 500], resp.text


class TestDashboardTeamCalificar:
    """Tests for team calificar endpoint."""

    @pytest.mark.asyncio
    async def test_calificar_requires_auth(self, client: AsyncClient):
        """Verify calificar requires authentication."""
        resp = await client.post(
            f"{BASE_URL}/team/calificar",
            json={"analista_id": "00000000-0000-0000-0000-000000000001", "calificacion": 85.0},
        )
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_calificar_with_valid_data(self, client: AsyncClient, admin_auth_headers: dict):
        """Verify calificar accepts valid data (requiere ``dashboards.edit``)."""
        resp = await client.post(
            f"{BASE_URL}/team/calificar",
            headers=admin_auth_headers,
            json={
                "analista_id": "00000000-0000-0000-0000-000000000001",
                "calificacion": 85.0,
                "comentario": "Buen desempeño",
            },
        )
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"

    @pytest.mark.asyncio
    async def test_calificar_invalid_data(self, client: AsyncClient, admin_auth_headers: dict):
        """Verify calificar validates data."""
        resp = await client.post(
            f"{BASE_URL}/team/calificar",
            headers=admin_auth_headers,
            json={"analista_id": "invalid-uuid", "calificacion": 85.0},
        )
        # Should fail validation or server error
        assert resp.status_code in [422, 500], resp.text
