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
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"
    # scoring.pesos_severidad 40,30,20,10 → 100*(1-140/(5*40)) = 30
    assert abs(resp.json()["data"]["score"] - 30.0) < 0.01


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


@pytest.mark.asyncio
async def test_sincronizar_hallazgos_recalcula_conteo(
    client: AsyncClient, auth_headers: dict,
):
    ps_id = await create_programa_sast_id(client, auth_headers)
    r0 = await client.post(
        BASE_URL,
        headers=auth_headers,
        json={
            "programa_sast_id": ps_id,
            "mes": 1,
            "ano": 2024,
            "total_hallazgos": 0,
            "criticos": 0,
            "altos": 0,
            "medios": 0,
            "bajos": 0,
        },
    )
    assert r0.status_code == 201, r0.text
    aid = r0.json()["data"]["id"]
    assert r0.json()["data"]["score"] == 100.0
    h = await client.post(
        "/api/v1/hallazgo_sasts",
        headers=auth_headers,
        json={
            "actividad_sast_id": aid,
            "vulnerabilidad_id": None,
            "titulo": "T",
            "descripcion": None,
            "severidad": "Alta",
            "herramienta": None,
            "regla": None,
            "archivo": None,
            "linea": None,
            "estado": "Abierto",
        },
    )
    assert h.status_code == 201, h.text
    sync = await client.post(
        f"{BASE_URL}/{aid}/sincronizar-hallazgos",
        headers=auth_headers,
    )
    assert sync.status_code == 200, sync.text
    d = sync.json()["data"]
    assert d["altos"] == 1
    assert d["total_hallazgos"] == 1
    assert d["score"] is not None and d["score"] < 100.0
