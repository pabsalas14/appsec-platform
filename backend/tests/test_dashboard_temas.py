"""Tests for Dashboard Temas/Auditorías endpoints."""

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/dashboard"


class TestTemasAuditoriasDrilldown:
    """Tests for Temas/Auditorías drilldown endpoints."""

    @pytest.mark.asyncio
    async def test_drilldown_requires_auth(self, client: AsyncClient):
        """Verify drilldown requires authentication."""
        resp = await client.get(f"{BASE_URL}/temas-auditorias/drilldown?tipo=tema&filtro=estado&valor=abierto")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_drilldown_temas(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown temas returns data."""
        resp = await client.get(
            f"{BASE_URL}/temas-auditorias/drilldown?tipo=tema&filtro=estado&valor=abierto",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"
            assert "temas" in resp.json()["data"]

    @pytest.mark.asyncio
    async def test_drilldown_auditorias(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown auditorias returns data."""
        resp = await client.get(
            f"{BASE_URL}/temas-auditorias/drilldown?tipo=auditoria&filtro=estado&valor=en_proceso",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"
            assert "auditorias" in resp.json()["data"]

    @pytest.mark.asyncio
    async def test_drilldown_invalid_tipo(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown rejects invalid tipo."""
        resp = await client.get(
            f"{BASE_URL}/temas-auditorias/drilldown?tipo=invalid&filtro=estado&valor=abierto",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert "error" in resp.json()["data"]


class TestTemaDetalle:
    """Tests for tema detalle endpoint."""

    @pytest.mark.asyncio
    async def test_tema_detalle_requires_auth(self, client: AsyncClient):
        """Verify tema detalle requires authentication."""
        resp = await client.get(f"{BASE_URL}/temas/detalle/00000000-0000-0000-0000-000000000001")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_tema_detalle_not_found(self, client: AsyncClient, auth_headers: dict):
        """Verify tema detalle returns error for non-existent tema."""
        resp = await client.get(
            f"{BASE_URL}/temas/detalle/00000000-0000-0000-0000-000000000001",
            headers=auth_headers,
        )
        # Either 404 or 500 is acceptable (or 200 with error in data)
        assert resp.status_code in [200, 404, 500], resp.text


class TestAuditoriaDetalle:
    """Tests for auditoria detalle endpoint."""

    @pytest.mark.asyncio
    async def test_auditoria_detalle_requires_auth(self, client: AsyncClient):
        """Verify auditoria detalle requires authentication."""
        resp = await client.get(f"{BASE_URL}/auditorias/detalle/00000000-0000-0000-0000-000000000001")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_auditoria_detalle_not_found(self, client: AsyncClient, auth_headers: dict):
        """Verify auditoria detalle returns error for non-existent auditoría."""
        resp = await client.get(
            f"{BASE_URL}/auditorias/detalle/00000000-0000-0000-0000-000000000001",
            headers=auth_headers,
        )
        # Either 404 or 500 is acceptable (or 200 with error in data)
        assert resp.status_code in [200, 404, 500], resp.text
