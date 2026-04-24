"""Smoke + IDOR tests for the sesion_threat_modeling entity — generated."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

from app.services.ia_provider import IAResult
from tests.graph_helpers import create_programa_tm_id, create_sesion_tm_id


BASE_URL = "/api/v1/sesion_threat_modelings"


@pytest.mark.asyncio
async def test_create_sesion_threat_modeling(client: AsyncClient, auth_headers: dict):
    pt = await create_programa_tm_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_tm_id": pt,
        "fecha": "2024-03-01T10:00:00+00:00",
        "participantes": "Alice, Bob",
        "contexto": "API review",
        "estado": "Completada",
        "ia_utilizada": False,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_sesion_threat_modelings_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_sesion_threat_modeling_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_sesion_threat_modeling_idor_protected(
    client: AsyncClient,
    auth_headers: dict,
    other_auth_headers: dict,
):
    pt = await create_programa_tm_id(client, auth_headers)
    SAMPLE_PAYLOAD = {
        "programa_tm_id": pt,
        "fecha": "2024-03-01T10:00:00+00:00",
        "participantes": "Alice, Bob",
        "contexto": "API review",
        "estado": "Completada",
        "ia_utilizada": False,
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)
    resource_id = resp.json()["data"]["id"]

    for method, args in [
        ("GET", {}),
        ("PATCH", {"json": {}}),
        ("DELETE", {}),
    ]:
        r = await client.request(
            method, f"{BASE_URL}/{resource_id}", headers=other_auth_headers, **args
        )
        assert r.status_code == 404, f"IDOR leak on {method}: {r.text}"


@pytest.mark.asyncio
async def test_sesion_threat_modeling_ia_suggest_requires_permission(
    client: AsyncClient,
    auth_headers: dict,
):
    sid = await create_sesion_tm_id(client, auth_headers)
    resp = await client.post(
        f"{BASE_URL}/{sid}/ia/suggest",
        headers=auth_headers,
        json={"dry_run": True},
    )
    assert resp.status_code == 403
    assert "ia.execute" in resp.text


@pytest.mark.asyncio
async def test_sesion_threat_modeling_ia_suggest_dry_run_success(
    client: AsyncClient,
    admin_auth_headers: dict,
):
    sid = await create_sesion_tm_id(client, admin_auth_headers)
    resp = await client.post(
        f"{BASE_URL}/{sid}/ia/suggest",
        headers=admin_auth_headers,
        json={"dry_run": True, "contexto_adicional": "API financiera"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["dry_run"] is True
    assert "provider" in data
    assert "model" in data
    assert "content" in data
    assert isinstance(data["suggested_threats"], list)


@pytest.mark.asyncio
async def test_sesion_threat_modeling_ia_suggest_marks_session_as_ai_used(
    client: AsyncClient,
    admin_auth_headers: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    sid = await create_sesion_tm_id(client, admin_auth_headers)

    async def _fake_run_prompt(*args, **kwargs):
        return IAResult(
            provider="openai",
            model="gpt-4o-mini",
            content="- Spoofing por token expirado\n- Tampering en payload de webhook",
            usage={"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        )

    monkeypatch.setattr("app.api.v1.sesion_threat_modeling.run_prompt", _fake_run_prompt)

    resp = await client.post(
        f"{BASE_URL}/{sid}/ia/suggest",
        headers=admin_auth_headers,
        json={"dry_run": False},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["dry_run"] is False
    assert len(data["suggested_threats"]) >= 1

    session_resp = await client.get(f"{BASE_URL}/{sid}", headers=admin_auth_headers)
    assert session_resp.status_code == 200
    assert session_resp.json()["data"]["ia_utilizada"] is True


@pytest.mark.asyncio
async def test_sesion_threat_modeling_ia_suggest_creates_amenazas_when_requested(
    client: AsyncClient,
    admin_auth_headers: dict,
    monkeypatch: pytest.MonkeyPatch,
):
    sid = await create_sesion_tm_id(client, admin_auth_headers)

    async def _fake_run_prompt(*args, **kwargs):
        return IAResult(
            provider="openai",
            model="gpt-4o-mini",
            content=(
                '{"threats":[{"titulo":"Replay en callback","descripcion":"Sin nonce",'
                '"categoria_stride":"Tampering","dread_damage":7,"dread_reproducibility":8,'
                '"dread_exploitability":7,"dread_affected_users":6,"dread_discoverability":6,'
                '"estado":"Abierta"}]}'
            ),
            usage={"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
        )

    monkeypatch.setattr("app.api.v1.sesion_threat_modeling.run_prompt", _fake_run_prompt)

    resp = await client.post(
        f"{BASE_URL}/{sid}/ia/suggest",
        headers=admin_auth_headers,
        json={"dry_run": False, "crear_amenazas": True},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert len(data["created_amenaza_ids"]) == 1
    assert "Replay en callback" in data["suggested_threats"]

    amenazas_resp = await client.get(f"/api/v1/amenazas?sesion_id={sid}", headers=admin_auth_headers)
    assert amenazas_resp.status_code == 200
    amenazas = amenazas_resp.json()["data"]
    assert len(amenazas) == 1
    assert amenazas[0]["titulo"] == "Replay en callback"
