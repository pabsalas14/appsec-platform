"""Smoke + IDOR tests for the sesion_threat_modeling entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_programa_tm_id


BASE_URL = "/api/v1/sesion_threat_modelings"


@pytest.mark.asyncio
async def test_create_sesion_threat_modeling(client: AsyncClient, auth_headers: dict):
    pt = await create_programa_tm_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_tm_id": pt,
        "fecha": "2024-03-01T10:00:00+00:00",
        "participantes": "Alice, Bob",
        "contexto": "API review",
        "estado": "Completada",
        "ia_utilizada": False,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_sesion_threat_modelings_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_sesion_threat_modeling_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_sesion_threat_modeling_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    pt = await create_programa_tm_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_tm_id": pt,
        "fecha": "2024-03-01T10:00:00+00:00",
        "participantes": "Alice, Bob",
        "contexto": "API review",
        "estado": "Completada",
        "ia_utilizada": False,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
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
