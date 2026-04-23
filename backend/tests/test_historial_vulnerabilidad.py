"""Smoke + IDOR tests para HistorialVulnerabilidad (inmutable — Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient


BASE_URL = "/api/v1/historial_vulnerabilidads"
VULN_URL = "/api/v1/vulnerabilidads"

VULN_PAYLOAD = {
    "titulo": "Test vuln para historial",
    "fuente": "DAST",
    "severidad": "Media",
    "estado": "Abierta",
}


@pytest.mark.asyncio
async def test_create_historial(client: AsyncClient, auth_headers: dict):
    # Crear una vulnerabilidad válida primero
    v = await client.post(VULN_URL, headers=auth_headers, json=VULN_PAYLOAD)
    assert v.status_code == 201, v.text
    vuln_id = v.json()["data"]["id"]

    payload = {
        "vulnerabilidad_id": vuln_id,
        "estado_anterior": "Abierta",
        "estado_nuevo": "En Remediacion",
        "justificacion": "Analista asignó el ticket de remediación",
        "comentario": "Prioridad alta por impacto en producción",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["estado_nuevo"] == "En Remediacion"


@pytest.mark.asyncio
async def test_list_historial_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_list_historial_by_vulnerabilidad(client: AsyncClient, auth_headers: dict):
    # Crear vuln + historial
    v = await client.post(VULN_URL, headers=auth_headers, json=VULN_PAYLOAD)
    vuln_id = v.json()["data"]["id"]

    payload = {
        "vulnerabilidad_id": vuln_id,
        "estado_anterior": "Abierta",
        "estado_nuevo": "Revisada",
    }
    await client.post(BASE_URL, headers=auth_headers, json=payload)

    # Filtrar por vulnerabilidad_id
    resp = await client.get(f"{BASE_URL}?vulnerabilidad_id={vuln_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_historial_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_historial_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    v = await client.post(VULN_URL, headers=auth_headers, json=VULN_PAYLOAD)
    vuln_id = v.json()["data"]["id"]

    payload = {
        "vulnerabilidad_id": vuln_id,
        "estado_anterior": "Abierta",
        "estado_nuevo": "En Revision",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    # GET de otro usuario debe retornar 404 (historial es inmutable y propiedad del creador)
    r = await client.get(f"{BASE_URL}/{resource_id}", headers=other_auth_headers)
    assert r.status_code == 404, f"IDOR leak on GET: {r.text}"
