"""Smoke + IDOR + SoD tests para ExcepcionVulnerabilidad (Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/excepcion_vulnerabilidads"
VULN_URL = "/api/v1/vulnerabilidads"

VULN_PAYLOAD = {
    "titulo": "Test vuln para excepcion",
    "fuente": "SCA",
    "severidad": "Baja",
    "estado": "Abierta",
}


async def _create_vuln(client, headers):
    v = await client.post(VULN_URL, headers=headers, json=VULN_PAYLOAD)
    assert v.status_code == 201, v.text
    return v.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_excepcion(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion": "Tercero no tiene parche disponible, mitigado con WAF",
        "fecha_limite": "2027-01-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["estado"] == "Pendiente"
    assert data["justificacion"] == payload["justificacion"]


@pytest.mark.asyncio
async def test_create_excepcion_justificacion_muy_corta(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion": "corto",  # < 10 chars
        "fecha_limite": "2027-01-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_excepcion_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_delete_excepcion(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion": "Excepcion temporal mientras se aplica parche de proveedor",
        "fecha_limite": "2027-06-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    eid = resp.json()["data"]["id"]

    del_resp = await client.delete(f"{BASE_URL}/{eid}", headers=auth_headers)
    assert del_resp.status_code == 200

    get_resp = await client.get(f"{BASE_URL}/{eid}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_excepcion_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_excepcion_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion": "Compensacion implementada con control alternativo",
        "fecha_limite": "2027-03-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {"notas_aprobador": "intento de edicion"}}),
        ("DELETE", {}),
    ]:
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
