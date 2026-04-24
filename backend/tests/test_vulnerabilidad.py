"""Smoke + IDOR tests for Vulnerabilidad (Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.services.ia_provider import IAResult


BASE_URL = "/api/v1/vulnerabilidads"

# Payload mínimo válido — solo fuente/severidad/estado correctos, un activo opcional (todos null OK en DB)
SAMPLE_PAYLOAD = {
    "titulo": "SQL Injection en endpoint de login",
    "descripcion": "Parámetro username no sanitizado",
    "fuente": "SAST",
    "severidad": "Alta",
    "estado": "Abierta",
    "cvss_score": 8.5,
    "cwe_id": "CWE-89",
    "owasp_categoria": "A03:2021",
}


@pytest.mark.asyncio
async def test_create_vulnerabilidad(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["titulo"] == SAMPLE_PAYLOAD["titulo"]
    assert data["data"]["fuente"] == "SAST"
    assert data["data"]["severidad"] == "Alta"


@pytest.mark.asyncio
async def test_list_vulnerabilidads_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_get_vulnerabilidad(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201
    vid = resp.json()["data"]["id"]

    resp2 = await client.get(f"{BASE_URL}/{vid}", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["data"]["id"] == vid


@pytest.mark.asyncio
async def test_update_vulnerabilidad(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    vid = resp.json()["data"]["id"]

    patch = await client.patch(
        f"{BASE_URL}/{vid}", headers=auth_headers, json={"estado": "En Remediacion"}
    )
    assert patch.status_code == 200
    assert patch.json()["data"]["estado"] == "En Remediacion"


@pytest.mark.asyncio
async def test_delete_vulnerabilidad(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    vid = resp.json()["data"]["id"]

    del_resp = await client.delete(f"{BASE_URL}/{vid}", headers=auth_headers)
    assert del_resp.status_code == 200

    # Soft-deleted — no longer visible
    get_resp = await client.get(f"{BASE_URL}/{vid}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_vulnerabilidad_invalid_fuente(client: AsyncClient, auth_headers: dict):
    bad = {**SAMPLE_PAYLOAD, "fuente": "INVALID_SOURCE"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_vulnerabilidad_invalid_severidad(client: AsyncClient, auth_headers: dict):
    bad = {**SAMPLE_PAYLOAD, "severidad": "Extreme"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_vulnerabilidad_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_vulnerabilidad_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {"estado": "Cerrada"}}),
        ("DELETE", {}),
    ]:
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_export_csv_requires_export_permission(
    client: AsyncClient, auth_headers: dict
):
    """Rol user (solo .view) no puede exportar sin vulnerabilities.export."""
    r = await client.get(f"{BASE_URL}/export.csv", headers=auth_headers)
    assert r.status_code == 403
    assert "vulnerabilities.export" in r.text


@pytest.mark.asyncio
async def test_export_csv_success_records_audit(
    client: AsyncClient, admin_auth_headers: dict
):
    """Admin exporta CSV y el cuerpo incluye cabecera + fila."""
    create = await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert create.status_code == 201, create.text

    r = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    assert "titulo" in r.text
    assert SAMPLE_PAYLOAD["titulo"] in r.text
    assert r.headers.get("content-type", "").startswith("text/csv")


@pytest.mark.asyncio
async def test_triage_fp_requires_ia_execute_permission(
    client: AsyncClient, auth_headers: dict
):
    create = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert create.status_code == 201, create.text
    vid = create.json()["data"]["id"]

    r = await client.post(
        f"{BASE_URL}/{vid}/ia/triage-fp",
        headers=auth_headers,
        json={"dry_run": True},
    )
    assert r.status_code == 403
    assert "ia.execute" in r.text


@pytest.mark.asyncio
async def test_triage_fp_dry_run_success(
    client: AsyncClient, admin_auth_headers: dict
):
    create = await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert create.status_code == 201, create.text
    vid = create.json()["data"]["id"]

    r = await client.post(
        f"{BASE_URL}/{vid}/ia/triage-fp",
        headers=admin_auth_headers,
        json={"dry_run": True, "contexto_adicional": "Escaneo CI con reglas custom"},
    )
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["dry_run"] is True
    assert data["verdict"] in {"false_positive", "likely_real", "needs_review"}
    assert 0 <= data["confidence"] <= 1


@pytest.mark.asyncio
async def test_triage_fp_parses_json_output(
    client: AsyncClient,
    admin_auth_headers: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    create = await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert create.status_code == 201, create.text
    vid = create.json()["data"]["id"]

    async def _fake_run_prompt(*args, **kwargs):
        return IAResult(
            provider="openai",
            model="gpt-4o-mini",
            content=(
                '{"verdict":"false_positive","confidence":0.92,'
                '"rationale":"No hay ruta explotable en runtime.",'
                '"suggested_state":"En Revision"}'
            ),
            usage={"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        )

    monkeypatch.setattr("app.api.v1.vulnerabilidad.run_prompt", _fake_run_prompt)

    r = await client.post(
        f"{BASE_URL}/{vid}/ia/triage-fp",
        headers=admin_auth_headers,
        json={"dry_run": False},
    )
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["verdict"] == "false_positive"
    assert data["confidence"] == pytest.approx(0.92)
    assert data["suggested_state"] == "En Revision"
