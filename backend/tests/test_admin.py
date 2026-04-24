"""Smoke tests for the admin surface (ADR-0008)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_non_admin_cannot_list_users(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.get("/api/v1/admin/users", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_users(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    resp = await client.get("/api/v1/admin/users", headers=admin_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert "pagination" in body


@pytest.mark.asyncio
async def test_admin_can_upsert_system_setting(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    list_resp = await client.get("/api/v1/admin/settings", headers=admin_auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["data"]) >= 1

    resp = await client.put(
        "/api/v1/admin/settings/app.display_name",
        headers=admin_auth_headers,
        json={"value": "Custom Framework"},
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["data"]["value"] == "Custom Framework"


@pytest.mark.asyncio
async def test_admin_audit_logs_endpoint(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    resp = await client.get("/api/v1/audit-logs", headers=admin_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert "pagination" in body


@pytest.mark.asyncio
async def test_non_admin_cannot_manage_ia_config(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.get("/api/v1/admin/ia-config", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_get_and_update_ia_config(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    get_resp = await client.get("/api/v1/admin/ia-config", headers=admin_auth_headers)
    assert get_resp.status_code == 200, get_resp.text
    assert get_resp.json()["data"]["proveedor_activo"] in {
        "ollama",
        "anthropic",
        "openai",
        "openrouter",
    }

    put_resp = await client.put(
        "/api/v1/admin/ia-config",
        headers=admin_auth_headers,
        json={
            "proveedor_activo": "openrouter",
            "modelo": "meta-llama/llama-3.1-8b-instruct",
            "temperatura": 0.2,
            "max_tokens": 2048,
            "timeout_segundos": 45,
            "sanitizar_datos_paga": True,
        },
    )
    assert put_resp.status_code == 200, put_resp.text
    updated = put_resp.json()["data"]
    assert updated["proveedor_activo"] == "openrouter"
    assert updated["max_tokens"] == 2048


@pytest.mark.asyncio
async def test_admin_can_test_ia_config_dry_run(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    resp = await client.post(
        "/api/v1/admin/ia-config/test-call",
        headers=admin_auth_headers,
        json={"prompt": "Resume el estado AppSec en 1 línea", "dry_run": True},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["dry_run"] is True
    assert "provider" in data
    assert "model" in data
    assert "content" in data


@pytest.mark.asyncio
async def test_non_admin_cannot_test_ia_config(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.post(
        "/api/v1/admin/ia-config/test-call",
        headers=auth_headers,
        json={"prompt": "Hola", "dry_run": True},
    )
    assert resp.status_code == 403
