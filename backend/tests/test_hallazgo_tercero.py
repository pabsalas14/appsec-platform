"""Smoke + IDOR tests para HallazgoTercero (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/hallazgo_terceros"


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _create_revision_tercero(client: AsyncClient, headers: dict) -> str:
    """Crea subdireccion → celula → servicio → revision_tercero. Retorna revision_id."""
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
    svc_id = svc.json()["data"]["id"]
    rev = await client.post(
        "/api/v1/revision_terceros", headers=headers,
        json={
            "nombre_empresa": "SecureTeam S.A.",
            "tipo": "Pentest",
            "servicio_id": svc_id,
            "fecha_inicio": "2026-03-01T00:00:00Z",
            "estado": "Planificada",
        },
    )
    assert rev.status_code == 201, rev.text
    return rev.json()["data"]["id"]


def _payload(revision_id: str) -> dict:
    return {
        "revision_tercero_id": revision_id,
        "titulo": "Bypass de autenticación en API de pagos",
        "descripcion": "Token JWT no validado correctamente en endpoint /payment",
        "severidad": "Critica",
        "cvss_score": 9.8,
        "cwe_id": "CWE-287",
        "estado": "Abierto",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_hallazgo_tercero(client: AsyncClient, auth_headers: dict):
    rev_id = await _create_revision_tercero(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(rev_id))
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["severidad"] == "Critica"
    assert data["cvss_score"] == 9.8
    assert data["estado"] == "Abierto"


@pytest.mark.asyncio
async def test_list_hallazgo_terceros_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_filter_by_revision_tercero_id(client: AsyncClient, auth_headers: dict):
    rev_id = await _create_revision_tercero(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(rev_id))

    resp = await client.get(f"{BASE_URL}?revision_tercero_id={rev_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


@pytest.mark.asyncio
async def test_hallazgo_tercero_invalid_severidad(client: AsyncClient, auth_headers: dict):
    rev_id = await _create_revision_tercero(client, auth_headers)
    bad = {**_payload(rev_id), "severidad": "Extrema"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_hallazgo_tercero_cvss_fuera_de_rango(client: AsyncClient, auth_headers: dict):
    rev_id = await _create_revision_tercero(client, auth_headers)
    bad = {**_payload(rev_id), "cvss_score": 11.0}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_hallazgo_tercero_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_hallazgo_tercero_idor_protected(
    client: AsyncClient, auth_headers: dict, other_auth_headers: dict
):
    rev_id = await _create_revision_tercero(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(rev_id))
    assert resp.status_code == 201, resp.text
    hid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{hid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
