"""Smoke + IDOR tests for the okr_compromiso entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/okr_compromisos"

SAMPLE_PAYLOAD = {
    "plan_id": "00000000-0000-0000-0000-000000000000",
    "categoria_id": "00000000-0000-0000-0000-000000000000",
    "nombre_objetivo": "sample nombre_objetivo",
    "descripcion": "sample descripcion",
    "peso_global": 1.0,
    "fecha_inicio": "2026-01-01T00:00:00Z",
    "fecha_fin": "2026-01-01T00:00:00Z",
    "tipo_medicion": "sample tipo_medicion",
}


@pytest.mark.asyncio
async def test_create_okr_compromiso(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_okr_compromisos_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_okr_compromiso_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_okr_compromiso_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
