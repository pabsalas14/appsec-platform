"""Smoke + IDOR tests for the estado_cumplimiento entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import (
    create_regulacion_control_id,
    create_servicio_regulado_registro_id,
)

BASE_URL = "/api/v1/estado_cumplimientos"


@pytest.mark.asyncio
async def test_create_estado_cumplimiento(client: AsyncClient, auth_headers: dict):
    rid = await create_servicio_regulado_registro_id(client, auth_headers)
    cid = await create_regulacion_control_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "registro_id": rid,
        "control_id": cid,
        "estado": "Cumple",
        "porcentaje": 100.0,
        "notas": "Fully compliant",
        "fecha_evaluacion": "2024-03-01T10:00:00+00:00",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_estado_cumplimientos_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_estado_cumplimiento_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_estado_cumplimiento_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    rid = await create_servicio_regulado_registro_id(client, auth_headers)
    cid = await create_regulacion_control_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "registro_id": rid,
        "control_id": cid,
        "estado": "Cumple",
        "porcentaje": 100.0,
        "notas": "Fully compliant",
        "fecha_evaluacion": "2024-03-01T10:00:00+00:00",
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
