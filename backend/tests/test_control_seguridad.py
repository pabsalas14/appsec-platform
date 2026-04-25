"""Smoke + IDOR tests for the control_seguridad entity."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/control_seguridads"


@pytest.mark.asyncio
async def test_create_control_seguridad(client: AsyncClient, auth_headers: dict):
    payload = {
        "nombre": "Branch Protection",
        "tipo": "source_code",
        "descripcion": "Requiere PRs y aprobaciones",
        "obligatorio": True,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["nombre"] == "Branch Protection"
    assert data["obligatorio"] is True


@pytest.mark.asyncio
async def test_create_control_seguridad_default_obligatorio(client: AsyncClient, auth_headers: dict):
    """obligatorio defaults to False when not provided."""
    payload = {
        "nombre": "Secret Scanning",
        "tipo": "source_code",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    assert resp.json()["data"]["obligatorio"] is False


@pytest.mark.asyncio
async def test_list_control_seguridads_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_control_seguridad_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_control_seguridad_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    payload = {"nombre": "Code Signing", "tipo": "integrity"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_control_seguridad_update_and_soft_delete(client: AsyncClient, auth_headers: dict):
    payload = {"nombre": "Dependency Review", "tipo": "sca", "obligatorio": False}
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert create_resp.status_code == 201
    rid = create_resp.json()["data"]["id"]

    # Update
    patch_resp = await client.patch(f"{BASE_URL}/{rid}", headers=auth_headers, json={"obligatorio": True})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["obligatorio"] is True

    # Soft delete
    del_resp = await client.delete(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert del_resp.status_code == 200

    get_resp = await client.get(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert get_resp.status_code == 404
