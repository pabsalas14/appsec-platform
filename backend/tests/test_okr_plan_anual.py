"""Smoke + IDOR tests for the okr_plan_anual entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/okr_plan_anuals"

SAMPLE_PAYLOAD = {
    "colaborador_id": "00000000-0000-0000-0000-000000000000",
    "evaluador_id": "00000000-0000-0000-0000-000000000000",
    "ano": 1,
    "estado": "sample estado",
    "fecha_aprobado": "2026-01-01T00:00:00Z",
    "aprobado_por_id": "00000000-0000-0000-0000-000000000000",
}


@pytest.mark.asyncio
async def test_create_okr_plan_anual(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_okr_plan_anuals_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_okr_plan_anual_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_okr_plan_anual_idor_protected(
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
