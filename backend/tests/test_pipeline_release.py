"""Smoke + IDOR tests para PipelineRelease (Módulo 8)."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/pipeline_releases"


# ─── Helpers ─────────────────────────────────────────────────────────────────

async def _create_repositorio(client: AsyncClient, headers: dict) -> str:
    """Crea subdireccion → celula → repositorio. Retorna repositorio_id."""
    sub = await client.post(
        "/api/v1/subdireccions", headers=headers,
        json={"nombre": f"Sub {uuid4().hex[:6]}", "codigo": uuid4().hex[:6]},
    )
    sub_id = sub.json()["data"]["id"]
    cel = await client.post(
        "/api/v1/celulas", headers=headers,
        json={"nombre": f"Cel {uuid4().hex[:6]}", "tipo": "Desarrollo", "subdireccion_id": sub_id},
    )
    cel_id = cel.json()["data"]["id"]
    repo = await client.post(
        "/api/v1/repositorios", headers=headers,
        json={
            "nombre": f"Repo {uuid4().hex[:6]}",
            "url": f"https://github.com/test/{uuid4().hex[:8]}",
            "plataforma": "GitHub",
            "rama_default": "main",
            "celula_id": cel_id,
        },
    )
    assert repo.status_code == 201, repo.text
    return repo.json()["data"]["id"]


def _payload(repositorio_id: str) -> dict:
    return {
        "repositorio_id": repositorio_id,
        "rama": "feature/auth-improvements",
        "commit_sha": "abc123def456",
        "tipo": "SAST",
        "resultado": "Pendiente",
        "herramienta": "Semgrep",
    }


# ─── Tests ───────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_pipeline_release(client: AsyncClient, auth_headers: dict):
    repo_id = await _create_repositorio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(repo_id))
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["tipo"] == "SAST"
    assert data["resultado"] == "Pendiente"


@pytest.mark.asyncio
async def test_list_pipeline_releases_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_filter_by_repositorio_id(client: AsyncClient, auth_headers: dict):
    repo_id = await _create_repositorio(client, auth_headers)
    await client.post(BASE_URL, headers=auth_headers, json=_payload(repo_id))

    resp = await client.get(f"{BASE_URL}?repositorio_id={repo_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) == 1


@pytest.mark.asyncio
async def test_pipeline_release_invalid_tipo(client: AsyncClient, auth_headers: dict):
    repo_id = await _create_repositorio(client, auth_headers)
    bad = {**_payload(repo_id), "tipo": "INVALID"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_pipeline_release_invalid_resultado(client: AsyncClient, auth_headers: dict):
    repo_id = await _create_repositorio(client, auth_headers)
    bad = {**_payload(repo_id), "resultado": "UNKNOWN"}
    resp = await client.post(BASE_URL, headers=auth_headers, json=bad)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_pipeline_release_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_pipeline_release_idor_protected(
    client: AsyncClient, auth_headers: dict, other_auth_headers: dict
):
    repo_id = await _create_repositorio(client, auth_headers)
    resp = await client.post(BASE_URL, headers=auth_headers, json=_payload(repo_id))
    assert resp.status_code == 201, resp.text
    rid = resp.json()["data"]["id"]

    for method, args in [("GET", {}), ("PATCH", {"json": {}}), ("DELETE", {})]:
        r = await client.request(method, f"{BASE_URL}/{rid}", headers=other_auth_headers, **args)
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"
