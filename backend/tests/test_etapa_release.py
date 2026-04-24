"""Smoke + IDOR tests para EtapaRelease (Módulo 8) con aprobación SoD."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_celula_id

BASE_URL = "/api/v1/etapa_releases"


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _create_service_release(client: AsyncClient, headers: dict) -> str:
    """Crea celula → servicio → service_release. Retorna release_id."""
    cel_id = await create_celula_id(client, headers)
    svc = await client.post(
        "/api/v1/servicios", headers=headers,
        json={"nombre": f"Srv {uuid4().hex[:6]}", "criticidad": "Alta", "celula_id": cel_id},
    )
    svc_id = svc.json()["data"]["id"]
    rel = await client.post(
        "/api/v1/service_releases", headers=headers,
        json={
            "nombre": "Release X", "version": "1.0.0",
            "servicio_id": svc_id, "estado_actual": "Borrador",
        },
    )
    assert rel.status_code == 201, rel.text
    return rel.json()["data"]["id"]


def _payload(release_id: str) -> dict:
    return {
        "service_release_id": release_id,
        "etapa": "Design Review",
        "estado": "Pendiente",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_etapa_release(client: AsyncClient, auth_headers: dict):
    rid = await _create_service_release(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(rid))
    assert resp.status_code == 201, resp.text
    assert resp.json()["data"]["etapa"] == "Design Review"
    assert resp.json()["data"]["estado"] == "Pendiente"


@pytest.mark.asyncio
async def test_list_etapa_releases_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_filter_by_service_release_id(client: AsyncClient, auth_headers: dict):
    rid = await _create_service_release(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(rid))

    resp = await client.get(f"{BASE_URL}?service_release_id={rid}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


@pytest.mark.asyncio
async def test_aprobar_etapa(client: AsyncClient, auth_headers: dict):
    rid = await _create_service_release(client, auth_headers)
    etapa = await client.post(BASE_URL, headers=auth_headers, json=_payload(rid))
    eid = etapa.json()["data"]["id"]

    resp = await client.post(f"{BASE_URL}/{eid}/aprobar", headers=auth_headers, json={})
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["estado"] == "Aprobada"


@pytest.mark.asyncio
async def test_rechazar_etapa_justificacion_obligatoria(client: AsyncClient, auth_headers: dict):
    rid = await _create_service_release(client, auth_headers)
    etapa = await client.post(BASE_URL, headers=auth_headers, json=_payload(rid))
    eid = etapa.json()["data"]["id"]

    # Sin justificacion → 422
    resp = await client.post(f"{BASE_URL}/{eid}/rechazar", headers=auth_headers, json={})
    assert resp.status_code == 422

    # Con justificacion corta → 422
    resp2 = await client.post(
        f"{BASE_URL}/{eid}/rechazar", headers=auth_headers,
        json={"justificacion": "corta"},
    )
    assert resp2.status_code == 422


@pytest.mark.asyncio
async def test_rechazar_etapa(client: AsyncClient, auth_headers: dict):
    rid = await _create_service_release(client, auth_headers)
    etapa = await client.post(BASE_URL, headers=auth_headers, json=_payload(rid))
    eid = etapa.json()["data"]["id"]

    resp = await client.post(
        f"{BASE_URL}/{eid}/rechazar", headers=auth_headers,
        json={"justificacion": "La etapa no cumple los criterios de seguridad establecidos"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["estado"] == "Rechazada"


@pytest.mark.asyncio
async def test_etapa_release_invalid_etapa(client: AsyncClient, auth_headers: dict):
    rid = await _create_service_release(client, auth_headers)
    bad = {**_payload(rid), "etapa": "Etapa Inexistente"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_etapa_release_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_etapa_release_idor_protected(
    client: AsyncClient, auth_headers: dict, other_auth_headers: dict
):
    rid = await _create_service_release(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(rid))
    assert resp.status_code == 201, resp.text
    eid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{eid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
