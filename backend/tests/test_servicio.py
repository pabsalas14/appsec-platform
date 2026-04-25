"""Smoke + IDOR tests for the servicio entity."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_celula_id

BASE_URL = "/api/v1/servicios"


@pytest.mark.asyncio
async def test_create_servicio(client: AsyncClient, auth_headers: dict):
    celula_id = await create_celula_id(client, auth_headers)
    payload = {
        "nombre": "API Gateway",
        "descripcion": "Servicio de enrutamiento",
        "criticidad": "alta",
        "tecnologia_stack": "Python,FastAPI",
        "celula_id": celula_id,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["nombre"] == "API Gateway"
    assert data["criticidad"] == "alta"
    assert data["celula_id"] == celula_id


@pytest.mark.asyncio
async def test_list_servicios_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_servicio_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_servicio_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    celula_id = await create_celula_id(client, auth_headers)
    payload = {
        "nombre": "Servicio X",
        "criticidad": "media",
        "celula_id": celula_id,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_servicio_update_and_delete(client: AsyncClient, auth_headers: dict):
    celula_id = await create_celula_id(client, auth_headers)
    payload = {
        "nombre": "Svc Delete",
        "criticidad": "baja",
        "celula_id": celula_id,
    }
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert create_resp.status_code == 201
    rid = create_resp.json()["data"]["id"]

    # Update
    patch_resp = await client.patch(
        f"{BASE_URL}/{rid}", headers=auth_headers, json={"criticidad": "critica"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["criticidad"] == "critica"

    # Soft delete
    del_resp = await client.delete(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Deleted item not visible
    get_resp = await client.get(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert get_resp.status_code == 404
