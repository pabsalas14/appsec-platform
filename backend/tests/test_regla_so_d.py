"""Tests for ReglaSoD — SoD rules are admin-only config."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/admin/regla-sods"


@pytest.mark.asyncio
async def test_regla_sod_requires_admin(client: AsyncClient, auth_headers: dict):
    """Regular user cannot access SoD rules."""
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_regla_sod_requires_auth(client: AsyncClient):
    """Unauthenticated requests are rejected."""
    assert (await client.get(BASE_URL)).status_code == 401


@pytest.mark.asyncio
async def test_admin_can_list_regla_sods(client: AsyncClient, admin_auth_headers: dict):
    """Admin can list SoD rules (initially empty)."""
    resp = await client.get(BASE_URL, headers=admin_auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_admin_can_create_regla_sod(client: AsyncClient, admin_auth_headers: dict):
    """Admin creates a SoD rule and it appears in the list."""
    payload = {
        "accion": "test.approve",
        "descripcion": "Aprobador distinto del creador",
        "enabled": True,
        "alcance": "global",
    }
    resp = await client.post(BASE_URL, headers=admin_auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["accion"] == "test.approve"
    assert data["enabled"] is True


@pytest.mark.asyncio
async def test_admin_can_update_regla_sod(client: AsyncClient, admin_auth_headers: dict):
    """Admin can toggle a SoD rule on/off."""
    # Create
    payload = {"accion": "test.update.toggle", "enabled": True}
    create_resp = await client.post(BASE_URL, headers=admin_auth_headers, json=payload)
    assert create_resp.status_code == 201, create_resp.text
    rid = create_resp.json()["data"]["id"]

    # Disable
    patch_resp = await client.patch(f"{BASE_URL}/{rid}", headers=admin_auth_headers, json={"enabled": False})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["data"]["enabled"] is False


@pytest.mark.asyncio
async def test_admin_can_soft_delete_regla_sod(client: AsyncClient, admin_auth_headers: dict):
    """Soft-deleted SoD rule no longer appears in list."""
    payload = {"accion": "test.delete.me", "enabled": True}
    create_resp = await client.post(BASE_URL, headers=admin_auth_headers, json=payload)
    assert create_resp.status_code == 201
    rid = create_resp.json()["data"]["id"]

    del_resp = await client.delete(f"{BASE_URL}/{rid}", headers=admin_auth_headers)
    assert del_resp.status_code == 200

    get_resp = await client.get(f"{BASE_URL}/{rid}", headers=admin_auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_regla_sod_default_enabled_true(client: AsyncClient, admin_auth_headers: dict):
    """enabled defaults to True when not supplied."""
    payload = {"accion": "test.default.enabled"}
    resp = await client.post(BASE_URL, headers=admin_auth_headers, json=payload)
    assert resp.status_code == 201, resp.text
    assert resp.json()["data"]["enabled"] is True
