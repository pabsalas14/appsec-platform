"""Tests for FlujoEstatus — Bloque B, Fase 14."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_flujo_estatus(client: AsyncClient, auth_headers: dict):
    """Test creating a new flujo estatus."""
    payload = {
        "entity_type": "Vulnerabilidad",
        "from_status": "Abierta",
        "to_status": "En Progreso",
        "allowed": True,
        "requires_justification": False,
        "requires_approval": False,
    }
    response = await client.post("/api/v1/flujos_estatus", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["entity_type"] == payload["entity_type"]


@pytest.mark.asyncio
async def test_list_flujos_estatus(client: AsyncClient, auth_headers: dict):
    """Test listing flujos estatus."""
    response = await client.get("/api/v1/flujos_estatus", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_update_flujo_estatus_allowed_flag(client: AsyncClient, auth_headers: dict):
    """Test updating allowed flag on flujo estatus."""
    # Create
    payload = {
        "entity_type": "ServiceRelease",
        "from_status": "Design Review",
        "to_status": "Security Validation",
        "allowed": True,
        "requires_approval": True,
    }
    response = await client.post("/api/v1/flujos_estatus", json=payload, headers=auth_headers)
    flujo_id = response.json()["data"]["id"]

    # Update
    update_payload = {"allowed": False}
    response = await client.patch(
        f"/api/v1/flujos_estatus/{flujo_id}",
        json=update_payload,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["data"]["allowed"] == False


@pytest.mark.asyncio
async def test_flujo_estatus_requires_justification(client: AsyncClient, auth_headers: dict):
    """Test that flujo estatus can require justification."""
    payload = {
        "entity_type": "Vulnerabilidad",
        "from_status": "Crítica",
        "to_status": "Cerrada",
        "requires_justification": True,
        "requires_approval": True,
    }
    response = await client.post("/api/v1/flujos_estatus", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["requires_justification"] == True
    assert data["requires_approval"] == True


@pytest.mark.asyncio
async def test_idor_protection_flujo_estatus(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    """Test IDOR protection for flujo estatus."""
    payload = {
        "entity_type": "TemaEmergente",
        "from_status": "Abierto",
        "to_status": "Monitoreando",
        "allowed": True,
    }
    response = await client.post("/api/v1/flujos_estatus", json=payload, headers=auth_headers)
    flujo_id = response.json()["data"]["id"]

    # Try to access as different user
    response = await client.get(f"/api/v1/flujos_estatus/{flujo_id}", headers=other_auth_headers)
    assert response.status_code == 404
