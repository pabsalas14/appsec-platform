"""Smoke + IDOR tests para HallazgoPipeline (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_repositorio_id

BASE_URL = "/api/v1/hallazgo_pipelines"


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _create_pipeline_release(client: AsyncClient, headers: dict) -> str:
    """Crea repositorio → pipeline_release. Retorna pipeline_id."""
    repo_id = await create_repositorio_id(client, headers)
    pipeline = await client.post(
        "/api/v1/pipeline_releases",
        headers=headers,
        json={
            "repositorio_id": repo_id,
            "rama": "main",
            "tipo": "SAST",
            "resultado": "Pendiente",
        },
    )
    assert pipeline.status_code == 201, pipeline.text
    return pipeline.json()["data"]["id"]


def _payload(pipeline_id: str) -> dict:
    return {
        "pipeline_release_id": pipeline_id,
        "titulo": "SQL Injection en endpoint de usuarios",
        "descripcion": "Parámetro no sanitizado en consulta SQL",
        "severidad": "Alta",
        "archivo": "app/api/users.py",
        "linea": 42,
        "regla": "sql-injection",
        "estado": "Abierto",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_hallazgo_pipeline(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["severidad"] == "Alta"
    assert data["estado"] == "Abierto"


@pytest.mark.asyncio
async def test_list_hallazgo_pipelines_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_filter_by_pipeline_release_id(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))

    resp = await client.get(f"{BASE_URL}?pipeline_release_id={pid}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


@pytest.mark.asyncio
async def test_hallazgo_pipeline_invalid_severidad(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    bad = {**_payload(pid), "severidad": "Extrema"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_hallazgo_pipeline_invalid_estado(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    bad = {**_payload(pid), "estado": "Invalido"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_hallazgo_pipeline_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_hallazgo_pipeline_idor_protected(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))
    assert resp.status_code == 201, resp.text
    hid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{hid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
