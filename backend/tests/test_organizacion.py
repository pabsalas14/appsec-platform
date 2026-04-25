"""Smoke + IDOR tests for the organizacion entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_org_hierarchy

BASE_URL = "/api/v1/organizacions"


@pytest.mark.asyncio
async def test_create_organizacion(client: AsyncClient, auth_headers: dict):
    h = await create_org_hierarchy(client, auth_headers)
    resp = await client.post(
        BASE_URL,
        headers=auth_headers,
        json={
            "nombre": "sample nombre",
            "codigo": "sample-codigo-2",
            "descripcion": "sample descripcion",
            "gerencia_id": h["gerencia_id"],
            "plataforma": "GitHub",
        },
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_organizacions_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_organizacion_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_organizacion_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    h = await create_org_hierarchy(client, auth_headers)
    resp = await client.post(
        BASE_URL,
        headers=auth_headers,
        json={
            "nombre": "sample nombre",
            "codigo": "sample-codigo-idor",
            "descripcion": "sample descripcion",
            "gerencia_id": h["gerencia_id"],
            "plataforma": "Atlassian",
        },
    )
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
