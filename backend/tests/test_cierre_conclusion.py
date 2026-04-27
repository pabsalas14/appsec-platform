"""Tests for CierreConclusión — topic closure and lessons learned."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/cierre_conclusiones"

SAMPLE = {
    "descripcion": "Closed after vulnerability fix implemented",
    "conclusiones": "Issue was in outdated dependency, updated to latest version",
    "recomendaciones": "Implement automated dependency scanning in CI/CD",
    "tipo_cierre": "resuelto",
}


@pytest.mark.asyncio
async def test_create_cierre_conclusion(client: AsyncClient, auth_headers: dict):
    """Test creating a topic closure."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["tipo_cierre"] == "resuelto"


@pytest.mark.asyncio
async def test_list_cierres_conclusiones(client: AsyncClient, auth_headers: dict):
    """Test listing topic closures."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_get_cierre_conclusion(client: AsyncClient, auth_headers: dict):
    """Test getting a specific closure."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    cierre_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{cierre_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == cierre_id


@pytest.mark.asyncio
async def test_update_cierre_conclusion(client: AsyncClient, auth_headers: dict):
    """Test updating a closure."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    cierre_id = create_resp.json()["data"]["id"]

    update_payload = {
        "conclusiones": "Updated lessons learned",
        "recomendaciones": "Also implement SBOM tracking",
    }
    resp = await client.patch(f"{BASE_URL}/{cierre_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert "SBOM" in resp.json()["data"]["recomendaciones"]


@pytest.mark.asyncio
async def test_delete_cierre_conclusion(client: AsyncClient, auth_headers: dict):
    """Test deleting a closure (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    cierre_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{cierre_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{cierre_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tipo_cierre_values(client: AsyncClient, auth_headers: dict):
    """Test different tipo_cierre values."""
    tipos = ["resuelto", "rechazado", "duplicado", "no_aplicable"]
    for tipo in tipos:
        payload = {**SAMPLE, "tipo_cierre": tipo}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201


@pytest.mark.asyncio
async def test_long_conclusions_field(client: AsyncClient, auth_headers: dict):
    """Test storing long conclusions text."""
    long_text = "A" * 5000
    payload = {**SAMPLE, "conclusiones": long_text}
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201
    assert len(resp.json()["data"]["conclusiones"]) == 5000
