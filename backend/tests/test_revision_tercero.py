"""Smoke + IDOR tests para RevisionTercero (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/revision_terceros"


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _create_servicio(client: AsyncClient, headers: dict) -> str:
    sub = await client.post(
        "/api/v1/subdireccions", headers=headers,
        json={"nombre": f"Sub {uuid4().hex[:6]}", "codigo": uuid4().hex[:6]},
    )
    sub_id = sub.json()["data"]["id"]
    cel = await client.post(
        "/api/v1/celulas", headers=headers,
        json={"nombre": f"Cel {uuid4().hex[:6]}", "tipo": "Desarrollo", "subdireccion_id": sub_id},
    )
    cel_id = cel.json()["data"]["id"]
    svc = await client.post(
        "/api/v1/servicios", headers=headers,
        json={"nombre": f"Srv {uuid4().hex[:6]}", "criticidad": "Alta", "celula_id": cel_id},
    )
    assert svc.status_code == 201, svc.text
    return svc.json()["data"]["id"]


def _payload(servicio_id: str) -> dict:
    return {
        "nombre_empresa": "SecureTeam S.A.",
        "tipo": "Pentest",
        "servicio_id": servicio_id,
        "fecha_inicio": "2026-03-01T00:00:00Z",
        "fecha_fin": "2026-03-15T00:00:00Z",
        "estado": "Planificada",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_revision_tercero(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["tipo"] == "Pentest"
    assert data["estado"] == "Planificada"


@pytest.mark.asyncio
async def test_list_revision_terceros_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_filter_by_servicio_id(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))

    resp = await client.get(f"{BASE_URL}?servicio_id={svc_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


@pytest.mark.asyncio
async def test_revision_tercero_requires_activo(client: AsyncClient, auth_headers: dict):
    """Sin servicio_id ni activo_web_id → 422 (model_validator)."""
    resp = await client.post(
        BASE_URL, headers=auth_headers,
        json={
            "nombre_empresa": "SecureTeam",
            "tipo": "Pentest",
            "fecha_inicio": "2026-03-01T00:00:00Z",
            "estado": "Planificada",
        },
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_revision_tercero_invalid_tipo(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    bad = {**_payload(svc_id), "tipo": "Desconocido"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_revision_tercero_sha256_max_length(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    bad = {**_payload(svc_id), "informe_sha256": "a" * 65}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_revision_tercero_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_revision_tercero_idor_protected(
    client: AsyncClient, auth_headers: dict, other_auth_headers: dict
):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    assert resp.status_code == 201, resp.text
    rid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{rid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
