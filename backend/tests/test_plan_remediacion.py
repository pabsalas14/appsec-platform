"""Tests for PlanRemediacion — remediation plan management."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/plan_remediacions"

SAMPLE = {
    "descripcion": "Remediation plan to fix critical vulnerability",
    "estado": "pendiente",
    "responsable": "security-team",
    "fecha_limite": "2024-05-30",
}


@pytest.mark.asyncio
async def test_create_plan_remediacion(client: AsyncClient, auth_headers: dict):
    """Test creating a remediation plan."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["descripcion"] == SAMPLE["descripcion"]
    assert data["data"]["estado"] == "pendiente"


@pytest.mark.asyncio
async def test_list_plan_remediaciones(client: AsyncClient, auth_headers: dict):
    """Test listing remediation plans."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_get_plan_remediacion(client: AsyncClient, auth_headers: dict):
    """Test getting a specific remediation plan."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    plan_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{plan_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["id"] == plan_id


@pytest.mark.asyncio
async def test_update_plan_remediacion(client: AsyncClient, auth_headers: dict):
    """Test updating a remediation plan."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    plan_id = create_resp.json()["data"]["id"]

    update_payload = {
        "descripcion": "Updated remediation plan",
        "estado": "en_progreso",
        "responsable": "updated-team",
    }
    resp = await client.patch(f"{BASE_URL}/{plan_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["descripcion"] == "Updated remediation plan"
    assert data["estado"] == "en_progreso"


@pytest.mark.asyncio
async def test_delete_plan_remediacion(client: AsyncClient, auth_headers: dict):
    """Test deleting a remediation plan (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    plan_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{plan_id}", headers=auth_headers)
    assert resp.status_code == 200

    # Verify it's soft deleted
    resp = await client.get(f"{BASE_URL}/{plan_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_plan_remediacion_estado_values(client: AsyncClient, auth_headers: dict):
    """Test different estado values for remediation plan."""
    estados = ["pendiente", "en_progreso", "completado", "cancelado"]

    for estado in estados:
        payload = {**SAMPLE, "estado": estado}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201
        assert resp.json()["data"]["estado"] == estado


@pytest.mark.asyncio
async def test_plan_remediacion_required_fields(client: AsyncClient, auth_headers: dict):
    """Test validation of required fields."""
    payload = {"descripcion": "Missing required fields"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_idor_protection_plan_remediacion(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    """Test IDOR protection for remediation plans."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    plan_id = create_resp.json()["data"]["id"]

    # Try to access as different user
    resp = await client.get(f"{BASE_URL}/{plan_id}", headers=other_auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_filters_plan_remediacion(client: AsyncClient, auth_headers: dict):
    """Test filtering remediation plans by estado."""
    # Create plans with different states
    await client.post(BASE_URL, headers=auth_headers, json={**SAMPLE, "estado": "pendiente"})
    await client.post(BASE_URL, headers=auth_headers, json={**SAMPLE, "estado": "completado"})

    # Filter by estado
    resp = await client.get(f"{BASE_URL}?estado=pendiente", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    # Verify only pending items are returned (if filter is implemented)
    assert all(item.get("estado") == "pendiente" for item in data if item.get("estado"))
