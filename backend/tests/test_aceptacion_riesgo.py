"""Smoke + IDOR + SoD tests para AceptacionRiesgo (Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


BASE_URL = "/api/v1/aceptacion_riesgos"
VULN_URL = "/api/v1/vulnerabilidads"

VULN_PAYLOAD = {
    "titulo": "Test vuln para aceptacion riesgo",
    "fuente": "TM",
    "severidad": "Media",
    "estado": "Abierta",
}


async def _create_vuln(client, headers):
    v = await client.post(VULN_URL, headers=headers, json=VULN_PAYLOAD)
    assert v.status_code == 201, v.text
    return v.json()["data"]["id"]


async def _get_user_id(client, headers):
    """Obtener el user_id del token actual via list (workaround)."""
    v = await client.post(VULN_URL, headers=headers, json=VULN_PAYLOAD)
    return v.json()["data"]["user_id"]


@pytest.mark.asyncio
async def test_create_aceptacion_riesgo(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)
    user_id = await _get_user_id(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion_negocio": "Costo de remediación supera el impacto potencial del riesgo",
        "propietario_riesgo_id": user_id,
        "fecha_revision_obligatoria": "2027-01-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["estado"] == "Pendiente"
    assert data["justificacion_negocio"] == payload["justificacion_negocio"]


@pytest.mark.asyncio
async def test_create_aceptacion_justificacion_muy_corta(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)
    user_id = await _get_user_id(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion_negocio": "corta",  # < 10 chars
        "propietario_riesgo_id": user_id,
        "fecha_revision_obligatoria": "2027-01-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_aceptacion_riesgos_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_aceptacion_riesgo_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_aceptacion_riesgo_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    vuln_id = await _create_vuln(client, auth_headers)
    user_id = await _get_user_id(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "justificacion_negocio": "Riesgo residual aceptable dado el contexto operativo",
        "propietario_riesgo_id": user_id,
        "fecha_revision_obligatoria": "2027-06-01T00:00:00Z",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {"notas_aprobador": "intento externo"}}),
        ("DELETE", {}),
    ]:
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_aprobar_aceptacion_requires_permission(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
    _session_factory: async_sessionmaker[AsyncSession],
):
    vuln_id = await _create_vuln(client, other_auth_headers)
    user_info = await client.get("/api/v1/auth/me", headers=other_auth_headers)
    assert user_info.status_code == 200, user_info.text
    owner_id = user_info.json()["data"]["id"]
    created = await client.post(
        BASE_URL,
        headers=other_auth_headers,
        json={
            "vulnerabilidad_id": vuln_id,
            "justificacion_negocio": "Riesgo residual aceptable por impacto acotado",
            "propietario_riesgo_id": owner_id,
            "fecha_revision_obligatoria": "2027-07-01T00:00:00Z",
        },
    )
    assert created.status_code == 201, created.text
    rid = created.json()["data"]["id"]

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
        f"{BASE_URL}/{rid}/aprobar", headers=auth_headers, json={"notas": "ok"}
    )
    assert denied.status_code == 403
    assert "vulnerabilities.approve" in denied.text


@pytest.mark.asyncio
async def test_aprobar_aceptacion_success_with_admin(
    client: AsyncClient,
    admin_auth_headers: dict,
    other_auth_headers: dict,
):
    vuln_id = await _create_vuln(client, other_auth_headers)
    user_info = await client.get("/api/v1/auth/me", headers=other_auth_headers)
    assert user_info.status_code == 200, user_info.text
    owner_id = user_info.json()["data"]["id"]
    created = await client.post(
        BASE_URL,
        headers=other_auth_headers,
        json={
            "vulnerabilidad_id": vuln_id,
            "justificacion_negocio": "Riesgo aceptado temporalmente por dependencia externa",
            "propietario_riesgo_id": owner_id,
            "fecha_revision_obligatoria": "2027-10-01T00:00:00Z",
        },
    )
    assert created.status_code == 201, created.text
    rid = created.json()["data"]["id"]

    approved = await client.post(
        f"{BASE_URL}/{rid}/aprobar",
        headers=admin_auth_headers,
        json={"notas": "Aprobada por negocio"},
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["data"]["estado"] == "Aprobada"
