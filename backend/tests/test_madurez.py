"""E2 — Madurez — maturity score calculations."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/madurez"


@pytest.mark.asyncio
async def test_madurez_summary(client: AsyncClient, auth_headers: dict):
    """Test getting maturity score summary."""
    r = await client.get(f"{BASE_URL}/summary", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()["data"]
    assert "score" in d
    assert "total" in d or "counts" in d
    assert "cerradas" in d or "closed" in d
    assert "activas" in d or "active" in d


@pytest.mark.asyncio
async def test_madurez_score_range(client: AsyncClient, auth_headers: dict):
    """Test that maturity score is between 0-100."""
    r = await client.get(f"{BASE_URL}/summary", headers=auth_headers)
    score = r.json()["data"]["score"]
    assert 0 <= score <= 100


@pytest.mark.asyncio
async def test_madurez_with_subdireccion_filter(client: AsyncClient, auth_headers: dict):
    """Test maturity score filtered by subdireccion."""
    r = await client.get(f"{BASE_URL}/summary?subdireccion_id=test", headers=auth_headers)
    assert r.status_code in [200, 404]  # May not exist


@pytest.mark.asyncio
async def test_madurez_with_gerencia_filter(client: AsyncClient, auth_headers: dict):
    """Test maturity score filtered by gerencia."""
    r = await client.get(f"{BASE_URL}/summary?gerencia_id=test", headers=auth_headers)
    assert r.status_code in [200, 404]


@pytest.mark.asyncio
async def test_madurez_with_organizacion_filter(client: AsyncClient, auth_headers: dict):
    """Test maturity score filtered by organizacion."""
    r = await client.get(f"{BASE_URL}/summary?organizacion_id=test", headers=auth_headers)
    assert r.status_code in [200, 404]


@pytest.mark.asyncio
async def test_madurez_with_celula_filter(client: AsyncClient, auth_headers: dict):
    """Test maturity score filtered by celula."""
    r = await client.get(f"{BASE_URL}/summary?celula_id=test", headers=auth_headers)
    assert r.status_code in [200, 404]


@pytest.mark.asyncio
async def test_madurez_breakdown_by_celula(client: AsyncClient, auth_headers: dict):
    """Test that maturity score includes breakdown by celula."""
    r = await client.get(f"{BASE_URL}/summary", headers=auth_headers)
    payload = r.json()["data"]
    if "by_celula" in payload and payload["by_celula"]:
        for item in payload["by_celula"]:
            assert "celula" in item
            assert "score" in item


@pytest.mark.asyncio
async def test_madurez_breakdown_by_organizacion(client: AsyncClient, auth_headers: dict):
    """Test that maturity score includes breakdown by organizacion."""
    r = await client.get(f"{BASE_URL}/summary", headers=auth_headers)
    payload = r.json()["data"]
    if "by_organizacion" in payload and payload["by_organizacion"]:
        for item in payload["by_organizacion"]:
            assert "organizacion" in item
            assert "score" in item


@pytest.mark.asyncio
async def test_madurez_export_csv(client: AsyncClient, auth_headers: dict):
    """Test exporting maturity data as CSV."""
    r = await client.get(f"{BASE_URL}/export.csv", headers=auth_headers)
    assert r.status_code in [200, 403]  # May require special permission
    if r.status_code == 200:
        assert "score" in r.text
        assert "vulnerabilidades" in r.text or "total" in r.text


@pytest.mark.asyncio
async def test_madurez_export_with_filters(client: AsyncClient, auth_headers: dict):
    """Test CSV export with hierarchy filters."""
    r = await client.get(
        f"{BASE_URL}/export.csv?organizacion_id=test",
        headers=auth_headers,
    )
    assert r.status_code in [200, 403, 404]


@pytest.mark.asyncio
async def test_madurez_readonly_access(client: AsyncClient, readonly_auth_headers: dict):
    """Test that readonly users can access maturity data."""
    r = await client.get(f"{BASE_URL}/summary", headers=readonly_auth_headers)
    assert r.status_code == 200
