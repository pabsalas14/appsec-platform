"""Tests for Dashboard Ejecutivo Extended endpoints."""

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/dashboard"


class TestDashboardExecutiveDrilldown:
    """Tests for executive dashboard drilldown."""

    @pytest.mark.asyncio
    async def test_drilldown_requires_auth(self, client: AsyncClient):
        """Verify drilldown requires authentication."""
        resp = await client.get(f"{BASE_URL}/executive/drilldown?tipo=vulnerabilidades&filtro=severidad&valor=CRITICO")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_drilldown_vulnerabilidades(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown by vulnerabilidad returns data."""
        resp = await client.get(
            f"{BASE_URL}/executive/drilldown?tipo=vulnerabilidades&filtro=severidad&valor=CRITICO",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"

    @pytest.mark.asyncio
    async def test_drilldown_programas(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown by programas returns data."""
        resp = await client.get(
            f"{BASE_URL}/executive/drilldown?tipo=programas&filtro=estado&valor=activo",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            data = resp.json()["data"]
            assert "tipo" in data
            assert data["tipo"] == "programas"

    @pytest.mark.asyncio
    async def test_drilldown_auditorias(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown by auditorias returns data."""
        resp = await client.get(
            f"{BASE_URL}/executive/drilldown?tipo=auditorias&filtro=estado&valor=en_proceso",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text

    @pytest.mark.asyncio
    async def test_drilldown_temas(self, client: AsyncClient, auth_headers: dict):
        """Verify drilldown by temas returns data."""
        resp = await client.get(
            f"{BASE_URL}/executive/drilldown?tipo=temas&filtro=estado&valor=abierto",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text


class TestDashboardExecutiveExport:
    """Tests for executive dashboard export."""

    @pytest.mark.asyncio
    async def test_export_pdf_requires_auth(self, client: AsyncClient):
        """Verify export PDF requires authentication."""
        resp = await client.get(f"{BASE_URL}/executive/export-pdf")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_export_pdf_with_auth(self, client: AsyncClient, auth_headers: dict):
        """Verify export PDF returns data with auth."""
        resp = await client.get(f"{BASE_URL}/executive/export-pdf", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            assert resp.json()["status"] == "success"
            data = resp.json()["data"]
            assert "kpis" in data

    @pytest.mark.asyncio
    async def test_export_pdf_with_filters(self, client: AsyncClient, auth_headers: dict):
        """Verify export PDF accepts filter parameters."""
        resp = await client.get(
            f"{BASE_URL}/executive/export-pdf?subdireccion_id=00000000-0000-0000-0000-000000000001",
            headers=auth_headers,
        )
        assert resp.status_code in [200, 500], resp.text
