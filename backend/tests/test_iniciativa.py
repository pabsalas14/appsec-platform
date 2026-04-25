"""Smoke + IDOR tests for the iniciativa entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/iniciativas"

SAMPLE_PAYLOAD = {
    "titulo": "sample titulo",
    "descripcion": "sample descripcion",
    "tipo": "sample tipo",
    "estado": "sample estado",
    "fecha_inicio": "2026-01-01T00:00:00Z",
    "fecha_fin_estimada": "2026-01-01T00:00:00Z",
}


@pytest.mark.asyncio
async def test_create_iniciativa(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_iniciativas_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_iniciativa_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_iniciativa_idor_protected(
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


@pytest.mark.asyncio
async def test_iniciativa_export_requires_permission(client: AsyncClient, auth_headers: dict):
    """El rol user no puede exportar sin initiatives.export."""
    resp = await client.get(f"{BASE_URL}/export.csv", headers=auth_headers)
    assert resp.status_code == 403
    assert "initiatives.export" in resp.text


@pytest.mark.asyncio
async def test_iniciativa_export_csv_success(client: AsyncClient, admin_auth_headers: dict):
    created = await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert created.status_code == 201, created.text
    resp = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("text/csv")
    assert "titulo,tipo,estado" in resp.text
    assert SAMPLE_PAYLOAD["titulo"] in resp.text
