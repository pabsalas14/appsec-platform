"""Tests for HitoIniciativa — initiative milestones."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/hito_iniciativas"

SAMPLE = {
    "nombre": "Phase 1 Completion",
    "descripcion": "Complete first phase of security implementation",
    "fecha_objetivo": "2024-06-30",
    "estado": "pendiente",
}


@pytest.mark.asyncio
async def test_create_hito_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test creating an initiative milestone."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["nombre"] == SAMPLE["nombre"]


@pytest.mark.asyncio
async def test_list_hitos_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test listing initiative milestones."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_get_hito_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test getting a specific milestone."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    hito_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{hito_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == hito_id


@pytest.mark.asyncio
async def test_update_hito_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test updating a milestone."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    hito_id = create_resp.json()["data"]["id"]

    update_payload = {
        "nombre": "Phase 1 Completed",
        "estado": "completado",
        "fecha_objetivo": "2024-06-15",
    }
    resp = await client.patch(f"{BASE_URL}/{hito_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["data"]["estado"] == "completado"


@pytest.mark.asyncio
async def test_delete_hito_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test deleting a milestone (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    hito_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{hito_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{hito_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_hito_fecha_objetivo_validation(client: AsyncClient, auth_headers: dict):
    """Test date format validation for fecha_objetivo."""
    payload = {**SAMPLE, "fecha_objetivo": "invalid-date"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_hito_multiple_states(client: AsyncClient, auth_headers: dict):
    """Test milestone with different states."""
    estados = ["pendiente", "en_progreso", "completado", "cancelado"]
    for estado in estados:
        payload = {**SAMPLE, "estado": estado}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201
