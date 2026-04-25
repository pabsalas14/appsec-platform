"""Smoke + IDOR tests para ServiceRelease (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_servicio_id

BASE_URL = "/api/v1/service_releases"


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _create_servicio(client: AsyncClient, headers: dict) -> str:
    return await create_servicio_id(client, headers)


def _payload(servicio_id: str) -> dict:
    return {
        "nombre": "Release v2.0 — autenticación reforzada",
        "version": "2.0.1",
        "descripcion": "Incluye mejoras de seguridad en el flujo de login",
        "servicio_id": servicio_id,
        "estado_actual": "Borrador",
        "jira_referencia": "SEC-1234",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_service_release(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["estado_actual"] == "Borrador"


@pytest.mark.asyncio
async def test_list_service_releases_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_get_service_release(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    rid = resp.json()["data"]["id"]

    resp2 = await client.get(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["data"]["id"] == rid


@pytest.mark.asyncio
async def test_update_service_release(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    rid = resp.json()["data"]["id"]

    patch = await client.patch(
        f"{BASE_URL}/{rid}",
        headers=auth_headers,
        json={"estado_actual": "En Revision de Diseno"},
    )
    assert patch.status_code == 200
    assert patch.json()["data"]["estado_actual"] == "En Revision de Diseno"


@pytest.mark.asyncio
async def test_delete_service_release(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    rid = resp.json()["data"]["id"]

    del_resp = await client.delete(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert del_resp.status_code == 200

    get_resp = await client.get(f"{BASE_URL}/{rid}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_service_release_invalid_estado(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    bad = {**_payload(svc_id), "estado_actual": "Inexistente"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_service_release_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_service_release_idor_protected(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    assert resp.status_code == 201, resp.text
    rid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{rid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_service_release_export_requires_permission(client: AsyncClient, readonly_auth_headers: dict[str, str]):
    """Rol readonly (sin releases.export) no puede exportar."""
    resp = await client.get(f"{BASE_URL}/export.csv", headers=readonly_auth_headers)
    assert resp.status_code == 403
    assert "releases.export" in resp.text


@pytest.mark.asyncio
async def test_service_release_export_csv_success(client: AsyncClient, admin_auth_headers: dict):
    svc_id = await _create_servicio(client, admin_auth_headers)
    created = await client.post(BASE_URL, headers=admin_auth_headers, json=_payload(svc_id))
    assert created.status_code == 201, created.text
    resp = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("text/csv")
    assert "nombre,version,estado_actual" in resp.text
    assert "Release v2.0" in resp.text
