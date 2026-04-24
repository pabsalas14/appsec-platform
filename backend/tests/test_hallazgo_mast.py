"""Smoke + IDOR tests for the hallazgo_mast entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_ejecucion_mast_id


BASE_URL = "/api/v1/hallazgo_masts"


@pytest.mark.asyncio
async def test_create_hallazgo_mast(client: AsyncClient, auth_headers: dict):
    em_id = await create_ejecucion_mast_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "ejecucion_mast_id": em_id,
        "vulnerabilidad_id": None,
        "nombre": "Insecure Storage of Sensitive Data",
        "descripcion": "App stores user credentials in plaintext within SharedPreferences",
        "severidad": "Alta",
        "cwe": "CWE-532",
        "owasp_categoria": "M2:Insecure Data Storage",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_hallazgo_masts_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_hallazgo_mast_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_hallazgo_mast_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    em_id = await create_ejecucion_mast_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "ejecucion_mast_id": em_id,
        "vulnerabilidad_id": None,
        "nombre": "Insecure Storage of Sensitive Data",
        "descripcion": "App stores user credentials in plaintext within SharedPreferences",
        "severidad": "Alta",
        "cwe": "CWE-532",
        "owasp_categoria": "M2:Insecure Data Storage",
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
