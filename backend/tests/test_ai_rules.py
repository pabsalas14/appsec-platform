"""Test AI Automation Rules (FASE 8) — endpoints, validations, and business logic."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ai_rules_list_empty(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test listing empty AI rules."""
    response = await client.get("/api/v1/admin/ai-rules", headers=admin_auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    assert isinstance(body["data"], list)
    assert body["meta"]["total"] == 0


@pytest.mark.asyncio
async def test_ai_rules_create(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test creating an AI rule."""
    payload = {
        "name": "Critical Vuln Alert",
        "description": "Send notification on critical vulnerability",
        "trigger_type": "on_vulnerability_created",
        "trigger_config": {"severity": "critical"},
        "action_type": "send_notification",
        "action_config": {"message_template": "Critical vulnerability found"},
        "enabled": True,
        "max_retries": 3,
        "timeout_seconds": 30,
    }

    response = await client.post(
        "/api/v1/admin/ai-rules",
        json=payload,
        headers=admin_auth_headers,
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Critical Vuln Alert"
    assert data["trigger_type"] == "on_vulnerability_created"
    assert data["action_type"] == "send_notification"
    assert data["enabled"] is True


@pytest.mark.asyncio
async def test_ai_rules_create_invalid_trigger_type(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test creating a rule with invalid trigger type."""
    payload = {
        "name": "Invalid Rule",
        "trigger_type": "invalid_trigger",
        "action_type": "send_notification",
    }

    response = await client.post(
        "/api/v1/admin/ai-rules",
        json=payload,
        headers=admin_auth_headers,
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_ai_rules_test_endpoint(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test the rule test/dry-run endpoint."""
    payload = {
        "name": "Test Rule",
        "trigger_type": "on_vulnerability_created",
        "trigger_config": {"severity": "critical"},
        "action_type": "send_notification",
        "action_config": {"message": "Test"},
        "enabled": True,
    }

    create_response = await client.post(
        "/api/v1/admin/ai-rules",
        json=payload,
        headers=admin_auth_headers,
    )
    assert create_response.status_code == 201
    rule_id = create_response.json()["data"]["id"]

    test_payload = {"data": {"test": "data"}}
    response = await client.post(
        f"/api/v1/admin/ai-rules/{rule_id}/test",
        json=test_payload,
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "success"
    assert data["dry_run"] is True
    assert data["rule_id"] == rule_id


@pytest.mark.asyncio
async def test_ai_rules_get_trigger_types(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test getting available trigger types."""
    response = await client.get(
        "/api/v1/admin/ai-rules/metadata/triggers",
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "triggers" in data
    assert len(data["triggers"]) > 0

    trigger = data["triggers"][0]
    assert "id" in trigger
    assert "label" in trigger
    assert "description" in trigger
    assert "configurable_fields" in trigger


@pytest.mark.asyncio
async def test_ai_rules_get_action_types(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test getting available action types."""
    response = await client.get(
        "/api/v1/admin/ai-rules/metadata/actions",
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "actions" in data
    assert len(data["actions"]) > 0

    action = data["actions"][0]
    assert "id" in action
    assert "label" in action
    assert "description" in action
    assert "configurable_fields" in action


@pytest.mark.asyncio
async def test_ai_rules_filter_by_enabled(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Test filtering rules by enabled status."""
    for enabled in [True, False]:
        payload = {
            "name": f"Rule {'Enabled' if enabled else 'Disabled'}",
            "trigger_type": "on_vulnerability_created",
            "action_type": "send_notification",
            "enabled": enabled,
        }
        r = await client.post(
            "/api/v1/admin/ai-rules",
            json=payload,
            headers=admin_auth_headers,
        )
        assert r.status_code == 201, r.text

    response = await client.get(
        "/api/v1/admin/ai-rules?enabled=true",
        headers=admin_auth_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["enabled"] is True


@pytest.mark.asyncio
async def test_ai_rules_authorization_non_admin(client: AsyncClient, auth_headers: dict[str, str]):
    """Test that non-admin users cannot access AI rules endpoints."""
    response = await client.get("/api/v1/admin/ai-rules", headers=auth_headers)
    assert response.status_code in (403, 401)
