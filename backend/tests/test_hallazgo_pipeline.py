"""Smoke + IDOR tests para HallazgoPipeline (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_repositorio_id

BASE_URL = "/api/v1/hallazgo_pipelines"


# ─── Helpers ─────────────────────────────────────────────────────────────────


async def _create_pipeline_release(client: AsyncClient, headers: dict) -> str:
    """Crea repositorio → pipeline_release. Retorna pipeline_id."""
    repo_id = await create_repositorio_id(client, headers)
    pipeline = await client.post(
        "/api/v1/pipeline_releases",
        headers=headers,
        json={
            "repositorio_id": repo_id,
            "rama": "main",
            "scan_id": "scan-e2e-pipeline",
            "tipo": "SAST",
            "resultado": "Pendiente",
        },
    )
    assert pipeline.status_code == 201, pipeline.text
    return pipeline.json()["data"]["id"]


def _payload(pipeline_id: str) -> dict:
    return {
        "pipeline_release_id": pipeline_id,
        "titulo": "SQL Injection en endpoint de usuarios",
        "descripcion": "Parámetro no sanitizado en consulta SQL",
        "severidad": "Alta",
        "archivo": "app/api/users.py",
        "linea": 42,
        "regla": "sql-injection",
        "scan_id": "scan-owasp-2025-01",
        "estado": "Abierto",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_hallazgo_pipeline(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["severidad"] == "Alta"
    assert data["estado"] == "Abierto"
    assert data["scan_id"] == "scan-owasp-2025-01"


@pytest.mark.asyncio
async def test_hallazgo_pipeline_duplicate_p14_rejected(client: AsyncClient, auth_headers: dict):
    """C2 / P14: no duplicar el mismo título+archivo+línea+scan bajo un pipeline."""
    pid = await _create_pipeline_release(client, auth_headers)
    pl = _payload(pid)
    r1 = await client.post(BASE_URL, headers=auth_headers, json=pl)
    assert r1.status_code == 201
    r2 = await client.post(BASE_URL, headers=auth_headers, json=pl)
    assert r2.status_code == 422


@pytest.mark.asyncio
async def test_filter_hallazgo_by_scan_id(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))
    resp = await client.get(
        f"{BASE_URL}?scan_id=scan-owasp-2025-01",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1
    assert resp.json()["data"][0]["scan_id"] == "scan-owasp-2025-01"


@pytest.mark.asyncio
async def test_list_hallazgo_pipelines_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_filter_by_pipeline_release_id(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))

    resp = await client.get(f"{BASE_URL}?pipeline_release_id={pid}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


@pytest.mark.asyncio
async def test_hallazgo_pipeline_invalid_severidad(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    bad = {**_payload(pid), "severidad": "Extrema"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_import_csv_hallazgo_match_scan_y_rama(client: AsyncClient, auth_headers: dict):
    """C2: import plantilla + match scan_id + branch → pipeline L1."""
    pid = await _create_pipeline_release(client, auth_headers)
    detail = await client.get(f"/api/v1/pipeline_releases/{pid}", headers=auth_headers)
    assert detail.status_code == 200
    rama = detail.json()["data"]["rama"]
    scan = detail.json()["data"].get("scan_id") or "scan-e2e-pipeline"
    body = f"scan_id,branch,titulo,severidad,archivo,linea,regla,estado\n{scan},{rama},Inj,Alta,a.py,1,r1,Abierto\n"
    import io

    r = await client.post(
        f"{BASE_URL}/import-csv",
        headers=auth_headers,
        files={"file": ("h.csv", io.BytesIO(body.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201, r.text
    payload = r.json()["data"]
    assert payload["importados"] == 1
    assert payload.get("rechazados", 0) == 0
    assert payload.get("errores") == []


@pytest.mark.asyncio
async def test_import_csv_p14_second_pass_duplicate_rejected(client: AsyncClient, auth_headers: dict):
    """P14: la segunda carga con la misma fila duplicada no inserta; devuelve rechazo y motivo."""
    pid = await _create_pipeline_release(client, auth_headers)
    detail = await client.get(f"/api/v1/pipeline_releases/{pid}", headers=auth_headers)
    assert detail.status_code == 200
    rama = detail.json()["data"]["rama"]
    scan = detail.json()["data"].get("scan_id") or "scan-e2e-pipeline"
    body = f"scan_id,branch,titulo,severidad,archivo,linea,regla,estado\n{scan},{rama},Dup,Alta,dup.py,9,r1,Abierto\n"
    import io

    files = {"file": ("h.csv", io.BytesIO(body.encode("utf-8")), "text/csv")}
    r1 = await client.post(f"{BASE_URL}/import-csv", headers=auth_headers, files=files)
    assert r1.status_code == 201, r1.text
    assert r1.json()["data"]["importados"] == 1
    r2 = await client.post(f"{BASE_URL}/import-csv", headers=auth_headers, files=files)
    assert r2.status_code == 201, r2.text
    p2 = r2.json()["data"]
    assert p2["importados"] == 0
    assert p2["rechazados"] >= 1
    assert any("duplicado" in e.get("motivo", "").lower() for e in p2.get("errores", []))


@pytest.mark.asyncio
async def test_import_csv_p14_no_match_rejected_with_log(client: AsyncClient, auth_headers: dict):
    body = "scan_id,branch,titulo,severidad,archivo,linea,regla,estado\nNO-HAY,main,X,Alta,a.py,1,r1,Abierto\n"
    import io

    r = await client.post(
        f"{BASE_URL}/import-csv",
        headers=auth_headers,
        files={"file": ("h.csv", io.BytesIO(body.encode("utf-8")), "text/csv")},
    )
    assert r.status_code == 201, r.text
    p = r.json()["data"]
    assert p["importados"] == 0
    assert p["rechazados"] == 1
    assert p["errores"] and "inventario" in p["errores"][0]["motivo"].lower()


@pytest.mark.asyncio
async def test_hallazgo_pipeline_invalid_estado(client: AsyncClient, auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    bad = {**_payload(pid), "estado": "Invalido"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_hallazgo_pipeline_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_hallazgo_pipeline_idor_protected(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    pid = await _create_pipeline_release(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(pid))
    assert resp.status_code == 201, resp.text
    hid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{hid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
