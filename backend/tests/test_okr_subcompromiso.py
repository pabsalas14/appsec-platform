"""Smoke + IDOR tests for the okr_subcompromiso entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/okr_subcompromisos"

SAMPLE_PAYLOAD = {
"compromiso_id": "00000000-0000-0000-0000-000000000000",
"nombre_sub_item": "sample nombre_sub_item",
"resultado_esperado": "sample resultado_esperado",
"peso_interno": 1.0,
"evidencia_requerida": False,
}


@pytest.mark.asyncio
async def test_create_okr_subcompromiso(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_okr_subcompromisos_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_okr_subcompromiso_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_okr_subcompromiso_idor_protected(
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
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
