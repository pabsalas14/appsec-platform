"""Smoke + IDOR tests for the control_mitigacion entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_sesion_tm_id

BASE_URL = "/api/v1/control_mitigacions"


async def _amenaza_id(client, headers: dict) -> str:
    sid = await create_sesion_tm_id(client, headers)
    r = await client.post(
        "/api/v1/amenazas",
        headers=headers,
        json={
            "sesion_id": sid,
            "titulo": "T",
            "descripcion": "D",
            "categoria_stride": "Spoofing",
            "dread_damage": 5,
            "dread_reproducibility": 5,
            "dread_exploitability": 5,
            "dread_affected_users": 5,
            "dread_discoverability": 5,
            "estado": "Abierta",
        },
    )
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_control_mitigacion(client: AsyncClient, auth_headers: dict):
    aid = await _amenaza_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "amenaza_id": aid,
        "nombre": "Implement Auth",
        "descripcion": "Add authentication",
        "tipo": "Preventivo",
        "estado": "Pendiente",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_control_mitigacions_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_control_mitigacion_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_control_mitigacion_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    aid = await _amenaza_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "amenaza_id": aid,
        "nombre": "Implement Auth",
        "descripcion": "Add authentication",
        "tipo": "Preventivo",
        "estado": "Pendiente",
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
