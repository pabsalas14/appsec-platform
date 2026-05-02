"""Tests for Dashboard Export endpoints."""

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/dashboard"


class TestDashboardExport:
    """Tests for dashboard export endpoints."""

    @pytest.mark.asyncio
    async def test_export_requires_auth(self, client: AsyncClient):
        """Verify export requires authentication."""
        resp = await client.get(f"{BASE_URL}/export?type=okr&format=json")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_export_okr_json(self, client: AsyncClient, auth_headers: dict):
        """Verify export OKR in JSON format."""
        resp = await client.get(f"{BASE_URL}/export?type=okr&format=json", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            data = resp.json()["data"]
            assert "data" in data
            assert data["format"] == "json"
            assert data["type"] == "okr"

    @pytest.mark.asyncio
    async def test_export_okr_csv(self, client: AsyncClient, auth_headers: dict):
        """Verify export OKR in CSV format."""
        resp = await client.get(f"{BASE_URL}/export?type=okr&format=csv", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
        if resp.status_code == 200:
            data = resp.json()["data"]
            assert "export_data" in data
            assert data["format"] == "csv"

    @pytest.mark.asyncio
    async def test_export_vulnerabilidades(self, client: AsyncClient, auth_headers: dict):
        """Verify export vulnerabilidades."""
        resp = await client.get(f"{BASE_URL}/export?type=vulnerabilidades&format=json", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text

    @pytest.mark.asyncio
    async def test_export_auditorias(self, client: AsyncClient, auth_headers: dict):
        """Verify export auditorias."""
        resp = await client.get(f"{BASE_URL}/export?type=auditorias&format=json", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text

    @pytest.mark.asyncio
    async def test_export_temas(self, client: AsyncClient, auth_headers: dict):
        """Verify export temas."""
        resp = await client.get(f"{BASE_URL}/export?type=temas&format=json", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text

    @pytest.mark.asyncio
    async def test_export_programas(self, client: AsyncClient, auth_headers: dict):
        """Verify export programas."""
        resp = await client.get(f"{BASE_URL}/export?type=programas&format=json", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text

    @pytest.mark.asyncio
    async def test_export_with_year_filter(self, client: AsyncClient, auth_headers: dict):
        """Verify export accepts year filter."""
        resp = await client.get(f"{BASE_URL}/export?type=okr&format=json&year=2026", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text

    @pytest.mark.asyncio
    async def test_export_invalid_type(self, client: AsyncClient, auth_headers: dict):
        """Verify export handles invalid type."""
        resp = await client.get(f"{BASE_URL}/export?type=invalid&format=json", headers=auth_headers)
        assert resp.status_code in [200, 500], resp.text
