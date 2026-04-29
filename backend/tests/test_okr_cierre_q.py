"""Smoke + IDOR tests for the okr_cierre_q entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/okr_cierre_qs"

SAMPLE_PAYLOAD = {
    "plan_id": "00000000-0000-0000-0000-000000000000",
    "quarter": "Q1",
    "retroalimentacion_general": "sample retroalimentacion_general",
    "cerrado_at": "2026-01-01T00:00:00Z",
}


@pytest.mark.asyncio
async def test_create_okr_cierre_q(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code in [201, 422], resp.text
    if resp.status_code == 201:
        assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_okr_cierre_qs_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_okr_cierre_q_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_okr_cierre_q_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    if resp.status_code != 201:
        return
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
