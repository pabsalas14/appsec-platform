"""Smoke + IDOR + SoD tests para ExcepcionVulnerabilidad (Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

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


@pytest.mark.asyncio
async def test_aprobar_excepcion_requires_permission(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
    _session_factory: async_sessionmaker[AsyncSession],
):
    vuln_id = await _create_vuln(client, other_auth_headers)
    created = await client.post(
        BASE_URL,
        headers=other_auth_headers,
        json={
            "vulnerabilidad_id": vuln_id,
            "justificacion": "Compensacion temporal con controles adicionales activos",
            "fecha_limite": "2027-05-01T00:00:00Z",
        },
    )
    assert created.status_code == 201, created.text
    eid = created.json()["data"]["id"]

    me = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert me.status_code == 200, me.text
    uid = me.json()["data"]["id"]
    async with _session_factory() as session:
        await session.execute(
            text("UPDATE users SET role = 'readonly' WHERE id = :uid"),
            {"uid": uid},
        )
        await session.commit()

    denied = await client.post(
        f"{BASE_URL}/{eid}/aprobar", headers=auth_headers, json={"notas": "ok"}
    )
    assert denied.status_code == 403
    assert "vulnerabilities.approve" in denied.text


@pytest.mark.asyncio
async def test_aprobar_excepcion_success_with_admin(
    client: AsyncClient,
    admin_auth_headers: dict,
    other_auth_headers: dict,
):
    vuln_id = await _create_vuln(client, other_auth_headers)
    created = await client.post(
        BASE_URL,
        headers=other_auth_headers,
        json={
            "vulnerabilidad_id": vuln_id,
            "justificacion": "Mitigacion compensatoria validada por arquitectura",
            "fecha_limite": "2027-09-01T00:00:00Z",
        },
    )
    assert created.status_code == 201, created.text
    eid = created.json()["data"]["id"]

    approved = await client.post(
        f"{BASE_URL}/{eid}/aprobar",
        headers=admin_auth_headers,
        json={"notas": "Aprobada por comite"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["data"]["estado"] == "Aprobada"


@pytest.mark.asyncio
async def test_excepcion_export_requires_permission(
    client: AsyncClient, auth_headers: dict
):
    resp = await client.get(f"{BASE_URL}/export.csv", headers=auth_headers)
    assert resp.status_code == 403
    assert "vulnerabilities.export" in resp.text


@pytest.mark.asyncio
async def test_excepcion_export_csv_success(
    client: AsyncClient, admin_auth_headers: dict
):
    vuln_id = await _create_vuln(client, admin_auth_headers)
    created = await client.post(
        BASE_URL,
        headers=admin_auth_headers,
        json={
            "vulnerabilidad_id": vuln_id,
            "justificacion": "Excepcion temporal aprobada por negocio y arquitectura",
            "fecha_limite": "2027-12-01T00:00:00Z",
        },
    )
    assert created.status_code == 201, created.text

    resp = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("text/csv")
    assert "vulnerabilidad_id,estado,justificacion" in resp.text
    assert "Excepcion temporal aprobada por negocio y arquitectura" in resp.text
