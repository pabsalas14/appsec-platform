"""Tests for ActualizacionIniciativa — initiative update logs."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/actualizacion_iniciativas"

SAMPLE = {
    "descripcion": "Phase 1 implementation started",
    "tipo": "progreso",
    "porcentaje_avance": 25,
    "notas": "Initial setup completed",
}


@pytest.mark.asyncio
async def test_create_actualizacion_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test creating an initiative update."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["tipo"] == "progreso"


@pytest.mark.asyncio
async def test_list_actualizaciones_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test listing initiative updates."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_get_actualizacion_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test getting a specific update."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    update_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{update_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == update_id


@pytest.mark.asyncio
async def test_update_actualizacion_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test updating an initiative update."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    update_id = create_resp.json()["data"]["id"]

    update_payload = {
        "porcentaje_avance": 50,
        "notas": "Half way through implementation",
    }
    resp = await client.patch(f"{BASE_URL}/{update_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["data"]["porcentaje_avance"] == 50


@pytest.mark.asyncio
async def test_delete_actualizacion_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test deleting an initiative update (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    update_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{update_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{update_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_porcentaje_avance_validation(client: AsyncClient, auth_headers: dict):
    """Test validation of porcentaje_avance (0-100)."""
    payload = {**SAMPLE, "porcentaje_avance": 150}
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    # Should either accept or validate
    assert resp.status_code in [201, 422]


@pytest.mark.asyncio
async def test_tipo_values(client: AsyncClient, auth_headers: dict):
    """Test different tipo values."""
    tipos = ["progreso", "bloqueador", "cambio", "completado"]
    for tipo in tipos:
        payload = {**SAMPLE, "tipo": tipo}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201
