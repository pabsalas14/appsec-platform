"""Smoke + IDOR tests para RevisionTercero (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_servicio_id

BASE_URL = "/api/v1/revision_terceros"


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _create_servicio(client: AsyncClient, headers: dict) -> str:
    return await create_servicio_id(client, headers)


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
        BASE_URL,
        headers=auth_headers,
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
    assert (await client.get(f"{BASE_URL}/config/checklist")).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_get_checklist_template(client: AsyncClient, auth_headers: dict):
    r = await client.get(f"{BASE_URL}/config/checklist", headers=auth_headers)
    assert r.status_code == 200
    data = r.json()["data"]
    assert "items" in data
    assert len(data["items"]) >= 1
    assert data["items"][0].get("id")


@pytest.mark.asyncio
async def test_patch_checklist_evidencias(client: AsyncClient, auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    r = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    assert r.status_code == 201
    rid = r.json()["data"]["id"]
    patch = await client.patch(
        f"{BASE_URL}/{rid}",
        headers=auth_headers,
        json={
            "responsable_revision": "Juan Pérez",
            "observaciones": "OK entorno staging",
            "checklist_resultados": {"alcance": {"ok": True}},
            "evidencias": [{"url": "https://example.com/informe.pdf", "tipo": "informe"}],
        },
    )
    assert patch.status_code == 200
    d = patch.json()["data"]
    assert d["responsable_revision"] == "Juan Pérez"
    assert d["checklist_resultados"]["alcance"]["ok"] is True
    assert d["evidencias"][0]["url"] == "https://example.com/informe.pdf"


@pytest.mark.asyncio
async def test_revision_tercero_idor_protected(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    svc_id = await _create_servicio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(svc_id))
    assert resp.status_code == 201, resp.text
    rid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{rid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
