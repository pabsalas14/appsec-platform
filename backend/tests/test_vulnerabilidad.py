"""Smoke + IDOR tests for Vulnerabilidad (Módulo 9)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.services.ia_provider import RunPromptResult

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
async def test_config_flujo_disponible(client: AsyncClient, auth_headers: dict):
    r = await client.get(f"{BASE_URL}/config/flujo", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "success"
    assert "estatus" in r.json()["data"]


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

    patch = await client.patch(f"{BASE_URL}/{vid}", headers=auth_headers, json={"estado": "en_remediacion"})
    assert patch.status_code == 200
    assert patch.json()["data"]["estado"] == "en_remediacion"


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
        r = await client.request(method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_export_csv_requires_export_permission(client: AsyncClient, readonly_auth_headers: dict[str, str]):
    """Rol readonly (vulnerabilities.view, sin .export) no puede exportar CSV."""
    r = await client.get(f"{BASE_URL}/export.csv", headers=readonly_auth_headers)
    assert r.status_code == 403
    assert "vulnerabilities.export" in r.text


@pytest.mark.asyncio
async def test_export_csv_success_records_audit(client: AsyncClient, admin_auth_headers: dict):
    """Admin exporta CSV y el cuerpo incluye cabecera + fila."""
    create = await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert create.status_code == 201, create.text

    r = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    assert "titulo" in r.text
    assert SAMPLE_PAYLOAD["titulo"] in r.text
    assert r.headers.get("content-type", "").startswith("text/csv")


@pytest.mark.asyncio
async def test_triage_fp_requires_ia_execute_permission(client: AsyncClient, auth_headers: dict):
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
async def test_triage_fp_dry_run_success(client: AsyncClient, admin_auth_headers: dict):
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
async def test_triage_fp_dry_run_success_super_admin(client: AsyncClient, super_admin_auth_headers: dict):
    """Bloque D: triaje FP con permiso `ia.execute` (rol super_admin)."""
    create = await client.post(BASE_URL, headers=super_admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert create.status_code == 201, create.text
    vid = create.json()["data"]["id"]
    r = await client.post(
        f"{BASE_URL}/{vid}/ia/triage-fp",
        headers=super_admin_auth_headers,
        json={"dry_run": True, "contexto_adicional": "Mismo flujo que admin"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["dry_run"] is True


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
        return RunPromptResult(
            provider="openai",
            model="gpt-4o-mini",
            content=(
                '{"verdict":"false_positive","confidence":0.92,'
                '"rationale":"No hay ruta explotable en runtime.",'
                '"suggested_state":"En Revision"}'
            ),
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


@pytest.mark.asyncio
async def test_list_vulnerabilidads_filter_fuente_and_pagination(client: AsyncClient, auth_headers: dict):
    a = {**SAMPLE_PAYLOAD, "fuente": "DAST", "titulo": "DAST issue"}
    b = {**SAMPLE_PAYLOAD, "fuente": "SAST", "titulo": "SAST issue"}
    assert (await client.post(BASE_URL, headers=auth_headers, json=a)).status_code == 201
    assert (await client.post(BASE_URL, headers=auth_headers, json=b)).status_code == 201
    r = await client.get(f"{BASE_URL}?fuente=DAST&page=1&page_size=20", headers=auth_headers)
    assert r.status_code == 200
    j = r.json()
    assert all(x["fuente"] == "DAST" for x in j["data"])
    assert j["meta"]["total"] >= 1
    assert j["pagination"]["page"] == 1


@pytest.mark.asyncio
async def test_list_vulnerabilidads_reincidencia_por_cwe(client: AsyncClient, auth_headers: dict):
    p = {**SAMPLE_PAYLOAD, "cwe_id": "CWE-400"}
    assert (await client.post(BASE_URL, headers=auth_headers, json={**p, "titulo": "dup1"})).status_code == 201
    assert (await client.post(BASE_URL, headers=auth_headers, json={**p, "titulo": "dup2"})).status_code == 201
    r = await client.get(f"{BASE_URL}?reincidencia=true&page_size=100", headers=auth_headers)
    assert r.status_code == 200
    rows = r.json()["data"]
    assert len(rows) == 2
    assert {x["cwe_id"] for x in rows} == {"CWE-400"}
