"""Smoke + IDOR tests for the ejecucion_dast entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_programa_dast_id


BASE_URL = "/api/v1/ejecucion_dasts"


@pytest.mark.asyncio
async def test_create_ejecucion_dast(client: AsyncClient, auth_headers: dict):
    pid = await create_programa_dast_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_dast_id": pid,
        "fecha_inicio": "2024-03-01T10:00:00+00:00",
        "fecha_fin": "2024-03-01T11:00:00+00:00",
        "ambiente": "Staging",
        "herramienta": "OWASP ZAP",
        "resultado": "Exitosa",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_ejecucion_dasts_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_ejecucion_dast_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_ejecucion_dast_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    pid = await create_programa_dast_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_dast_id": pid,
        "fecha_inicio": "2024-03-01T10:00:00+00:00",
        "fecha_fin": "2024-03-01T11:00:00+00:00",
        "ambiente": "Staging",
        "herramienta": "OWASP ZAP",
        "resultado": "Exitosa",
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
