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
