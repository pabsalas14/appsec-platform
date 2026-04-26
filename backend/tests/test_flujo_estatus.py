"""Tests for FlujoEstatus — status transition rules."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/flujos_estatus"

SAMPLE = {
    "entity_type": "vulnerabilidad",
    "from_status": "abierta",
    "to_status": "en_remediacion",
    "requires_justification": True,
    "requires_approval": False,
    "descripcion": "Allow transition from open to remediation",
}


@pytest.mark.asyncio
async def test_create_flujo_estatus(client: AsyncClient, auth_headers: dict):
    """Test creating a status flow rule."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["entity_type"] == "vulnerabilidad"


@pytest.mark.asyncio
async def test_list_flujos_estatus(client: AsyncClient, auth_headers: dict):
    """Test listing status flow rules."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_get_flujo_estatus(client: AsyncClient, auth_headers: dict):
    """Test getting a specific status flow rule."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    flujo_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{flujo_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == flujo_id


@pytest.mark.asyncio
async def test_update_flujo_estatus(client: AsyncClient, auth_headers: dict):
    """Test updating a status flow rule."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    flujo_id = create_resp.json()["data"]["id"]

    update_payload = {
        "requires_approval": True,
        "descripcion": "Updated: now requires approval",
    }
    resp = await client.patch(f"{BASE_URL}/{flujo_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["data"]["requires_approval"] is True


@pytest.mark.asyncio
async def test_delete_flujo_estatus(client: AsyncClient, auth_headers: dict):
    """Test deleting a status flow rule (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    flujo_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{flujo_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{flujo_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_entity_type_values(client: AsyncClient, auth_headers: dict):
    """Test different entity_type values."""
    entity_types = ["vulnerabilidad", "iniciativa", "tema_emergente", "auditoria"]
    for etype in entity_types:
        payload = {
            **SAMPLE,
            "entity_type": etype,
            "from_status": "pendiente",
            "to_status": "en_progreso",
        }
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201


@pytest.mark.asyncio
async def test_requires_justification_and_approval(client: AsyncClient, auth_headers: dict):
    """Test requiring both justification and approval."""
    payload = {
        **SAMPLE,
        "requires_justification": True,
        "requires_approval": True,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201
    data = resp.json()["data"]
    assert data["requires_justification"] is True
    assert data["requires_approval"] is True


@pytest.mark.asyncio
async def test_filter_by_entity_type(client: AsyncClient, auth_headers: dict):
    """Test filtering status flows by entity_type."""
    await client.post(
        BASE_URL,
        headers=auth_headers,
        json={**SAMPLE, "entity_type": "vulnerabilidad"},
    )
    await client.post(
        BASE_URL,
        headers=auth_headers,
        json={**SAMPLE, "entity_type": "iniciativa", "from_status": "no_iniciada"},
    )

    resp = await client.get(f"{BASE_URL}?entity_type=vulnerabilidad", headers=auth_headers)
    assert resp.status_code == 200
