"""Smoke + IDOR tests para EvidenciaRemediacion — SHA-256 integrity (A3, Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/evidencia_remediacions"
VULN_URL = "/api/v1/vulnerabilidads"

VULN_PAYLOAD = {
    "titulo": "Test vuln para evidencia",
    "fuente": "MAST",
    "severidad": "Alta",
    "estado": "En Remediacion",
}

# SHA-256 de ejemplo (64 hex chars)
SAMPLE_SHA256 = "a" * 64


async def _create_vuln(client, headers):
    v = await client.post(VULN_URL, headers=headers, json=VULN_PAYLOAD)
    assert v.status_code == 201, v.text
    return v.json()["data"]["id"]


@pytest.mark.asyncio
async def test_create_evidencia(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "descripcion": "Captura de pantalla confirmando patch aplicado",
        "filename": "patch_confirmation.png",
        "content_type": "image/png",
        "sha256": SAMPLE_SHA256,
        "file_size": 204800,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["sha256"] == SAMPLE_SHA256
    assert data["filename"] == "patch_confirmation.png"


@pytest.mark.asyncio
async def test_list_evidencias_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_list_evidencias_by_vulnerabilidad(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "descripcion": "Log de sistema post-remediación",
    }
    await client.post(BASE_URL, headers=auth_headers, json=payload)

    resp = await client.get(f"{BASE_URL}?vulnerabilidad_id={vuln_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_delete_evidencia(client: AsyncClient, auth_headers: dict):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "descripcion": "Evidencia temporal",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    eid = resp.json()["data"]["id"]

    del_resp = await client.delete(f"{BASE_URL}/{eid}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Soft-deleted — no longer visible
    get_resp = await client.get(f"{BASE_URL}/{eid}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_evidencia_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_evidencia_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    vuln_id = await _create_vuln(client, auth_headers)

    payload = {
        "vulnerabilidad_id": vuln_id,
        "descripcion": "Evidencia de remediación del ticket #1234",
        "sha256": SAMPLE_SHA256,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {"descripcion": "descripcion editada por otro"}}),
        ("DELETE", {}),
    ]:
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
