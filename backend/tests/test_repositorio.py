"""Smoke + IDOR tests for the repositorio entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_celula_id

BASE_URL = "/api/v1/repositorios"


@pytest.mark.asyncio
async def test_create_repositorio(client: AsyncClient, auth_headers: dict):
    cel_id = await create_celula_id(client, auth_headers)
    payload = {
        "nombre": "sample nombre",
        "url": "https://repo.example.com/proyecto",
        "plataforma": "github",
        "rama_default": "main",
        "activo": True,
        "celula_id": cel_id,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_repositorios_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_repositorio_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_repositorio_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    cel_id = await create_celula_id(client, auth_headers)
    payload = {
        "nombre": "sample nombre",
        "url": "https://repo2.example.com/proyecto",
        "plataforma": "github",
        "rama_default": "main",
        "activo": True,
        "celula_id": cel_id,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_repositorio_rejects_private_url(client: AsyncClient, auth_headers: dict):
    cel_id = await create_celula_id(client, auth_headers)
    payload = {
        "nombre": "bad repo",
        "url": "http://127.0.0.1/internal",
        "plataforma": "github",
        "rama_default": "main",
        "activo": True,
        "celula_id": cel_id,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 422
