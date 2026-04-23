"""Smoke + IDOR tests for the tipo_prueba entity."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/tipo_pruebas"

VALID_CATEGORIAS = ["SAST", "DAST", "SCA", "TM", "MAST"]


@pytest.mark.asyncio
async def test_create_tipo_prueba(client: AsyncClient, auth_headers: dict):
    payload = {
        "nombre": "SonarQube SAST",
        "categoria": "SAST",
        "descripcion": "Static analysis scan",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["nombre"] == "SonarQube SAST"
    assert data["categoria"] == "SAST"


@pytest.mark.asyncio
async def test_list_tipo_pruebas_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_tipo_prueba_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
@pytest.mark.parametrize("categoria", VALID_CATEGORIAS)
async def test_tipo_prueba_valid_categorias(
    client: AsyncClient, auth_headers: dict, categoria: str
):
    payload = {
        "nombre": f"Prueba {categoria}",
        "categoria": categoria,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, f"Expected 201 for categoria={categoria}, got {resp.text}"
    assert resp.json()["data"]["categoria"] == categoria


@pytest.mark.asyncio
async def test_tipo_prueba_rejects_invalid_categoria(
    client: AsyncClient, auth_headers: dict
):
    payload = {
        "nombre": "Bad Type",
        "categoria": "INVALID_CATEGORY",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 422, resp.text


@pytest.mark.asyncio
async def test_tipo_prueba_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    payload = {"nombre": "TM Session", "categoria": "TM"}
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
async def test_tipo_prueba_update_and_soft_delete(
    client: AsyncClient, auth_headers: dict
):
    payload = {"nombre": "DAST Scan", "categoria": "DAST"}
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert create_resp.status_code == 201
    rid = create_resp.json()["data"]["id"]

    # Update nombre
    patch_resp = await client.patch(
        f"{BASE_URL}/{rid}", headers=auth_headers, json={"nombre": "DAST Scan v2"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["nombre"] == "DAST Scan v2"

    # Soft delete
    del_resp = await client.delete(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert del_resp.status_code == 200

    get_resp = await client.get(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert get_resp.status_code == 404
