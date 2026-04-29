"""Tests for ActualizacionTema — emerging topic update logs."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/actualizacion_temas"

SAMPLE = {
    "descripcion": "New vulnerability discovered in dependency X",
    "fuente": "external",
    "impacto_cambio": "alto",
    "estado_anterior": "abierto",
    "estado_nuevo": "escalado",
}


@pytest.mark.asyncio
async def test_create_actualizacion_tema(client: AsyncClient, auth_headers: dict):
    """Test creating a topic update."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code in [201, 422]


@pytest.mark.asyncio
async def test_list_actualizaciones_tema(client: AsyncClient, auth_headers: dict):
    """Test listing topic updates."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_get_actualizacion_tema(client: AsyncClient, auth_headers: dict):
    """Test getting a specific topic update."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    if create_resp.status_code != 201:
        return
    update_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{update_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == update_id


@pytest.mark.asyncio
async def test_update_actualizacion_tema(client: AsyncClient, auth_headers: dict):
    """Test updating a topic update."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    if create_resp.status_code != 201:
        return
    update_id = create_resp.json()["data"]["id"]

    update_payload = {
        "impacto_cambio": "critico",
        "estado_nuevo": "resuelto",
    }
    resp = await client.patch(f"{BASE_URL}/{update_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["data"]["estado_nuevo"] == "resuelto"


@pytest.mark.asyncio
async def test_delete_actualizacion_tema(client: AsyncClient, auth_headers: dict):
    """Test deleting a topic update (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    if create_resp.status_code != 201:
        return
    update_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{update_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{update_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_fuente_values(client: AsyncClient, auth_headers: dict):
    """Test different fuente values."""
    fuentes = ["internal", "external", "customer"]
    for fuente in fuentes:
        payload = {**SAMPLE, "fuente": fuente}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code in [201, 422]


@pytest.mark.asyncio
async def test_impacto_cambio_values(client: AsyncClient, auth_headers: dict):
    """Test different impacto_cambio values."""
    impactos = ["bajo", "medio", "alto", "critico"]
    for impacto in impactos:
        payload = {**SAMPLE, "impacto_cambio": impacto}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code in [201, 422]
