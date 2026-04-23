"""Smoke + IDOR + SoD tests para AceptacionRiesgo (Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


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
