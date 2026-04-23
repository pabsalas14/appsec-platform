"""Smoke + IDOR tests for the celula entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/celulas"


@pytest.mark.asyncio
async def test_create_celula(client: AsyncClient, auth_headers: dict):
    sub = await client.post(
        "/api/v1/subdireccions",
        headers=auth_headers,
        json={"nombre": "sub-a", "codigo": "SUB-A", "descripcion": "x"},
    )
    sub_id = sub.json()["data"]["id"]

    payload = {
        "nombre": "sample nombre",
        "tipo": "sample tipo",
        "descripcion": "sample descripcion",
        "subdireccion_id": sub_id,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_celulas_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_celula_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_celula_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    sub = await client.post(
        "/api/v1/subdireccions",
        headers=auth_headers,
        json={"nombre": "sub-b", "codigo": "SUB-B", "descripcion": "x"},
    )
    payload = {
        "nombre": "sample nombre",
        "tipo": "sample tipo",
        "descripcion": "sample descripcion",
        "subdireccion_id": sub.json()["data"]["id"],
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
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
