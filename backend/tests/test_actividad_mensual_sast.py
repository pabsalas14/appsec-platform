"""Smoke + IDOR tests for the actividad_mensual_sast entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_programa_sast_id

BASE_URL = "/api/v1/actividad_mensual_sasts"


@pytest.mark.asyncio
async def test_create_actividad_mensual_sast(client: AsyncClient, auth_headers: dict):
    ps_id = await create_programa_sast_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_sast_id": ps_id,
        "mes": 3,
        "ano": 2024,
        "total_hallazgos": 5,
        "criticos": 1,
        "altos": 2,
        "medios": 2,
        "bajos": 0,
        "score": 75.5,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_actividad_mensual_sasts_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_actividad_mensual_sast_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_actividad_mensual_sast_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    ps_id = await create_programa_sast_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_sast_id": ps_id,
        "mes": 3,
        "ano": 2024,
        "total_hallazgos": 5,
        "criticos": 1,
        "altos": 2,
        "medios": 2,
        "bajos": 0,
        "score": 75.5,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
