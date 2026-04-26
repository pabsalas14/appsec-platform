"""Test AI Automation Rules (FASE 8) — endpoints, validations, and business logic."""

import pytest
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.models.ai_rule import AIRule
from app.schemas.ai_rule import AIRuleCreate, AIRuleUpdate


@pytest.mark.asyncio
async def test_ai_rules_list_empty(async_client, admin_user):
    """Test listing empty AI rules."""
    response = await async_client.get(
        "/api/v1/admin/ai-rules",
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["total"] == 0
    assert data["data"]["items"] == []


@pytest.mark.asyncio
async def test_ai_rules_create(async_client, admin_user, db: AsyncSession):
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
    
    response = await async_client.post(
        "/api/v1/admin/ai-rules",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == "Critical Vuln Alert"
    assert data["trigger_type"] == "on_vulnerability_created"
    assert data["action_type"] == "send_notification"
    assert data["enabled"] is True


@pytest.mark.asyncio
async def test_ai_rules_create_invalid_trigger_type(async_client, admin_user):
    """Test creating a rule with invalid trigger type."""
    payload = {
        "name": "Invalid Rule",
        "trigger_type": "invalid_trigger",
        "action_type": "send_notification",
    }
    
    response = await async_client.post(
        "/api/v1/admin/ai-rules",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_ai_rules_test_endpoint(async_client, admin_user, db: AsyncSession):
    """Test the rule test/dry-run endpoint."""
    # First create a rule
    payload = {
        "name": "Test Rule",
        "trigger_type": "on_vulnerability_created",
        "trigger_config": {"severity": "critical"},
        "action_type": "send_notification",
        "action_config": {"message": "Test"},
        "enabled": True,
    }
    
    create_response = await async_client.post(
        "/api/v1/admin/ai-rules",
        json=payload,
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    rule_id = create_response.json()["data"]["id"]
    
    # Test the rule
    test_payload = {"data": {"test": "data"}}
    response = await async_client.post(
        f"/api/v1/admin/ai-rules/{rule_id}/test",
        json=test_payload,
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "success"
    assert data["dry_run"] is True
    assert data["rule_id"] == rule_id


@pytest.mark.asyncio
async def test_ai_rules_get_trigger_types(async_client, admin_user):
    """Test getting available trigger types."""
    response = await async_client.get(
        "/api/v1/admin/ai-rules/metadata/triggers",
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "triggers" in data
    assert len(data["triggers"]) > 0
    
    # Check structure
    trigger = data["triggers"][0]
    assert "id" in trigger
    assert "label" in trigger
    assert "description" in trigger
    assert "configurable_fields" in trigger


@pytest.mark.asyncio
async def test_ai_rules_get_action_types(async_client, admin_user):
    """Test getting available action types."""
    response = await async_client.get(
        "/api/v1/admin/ai-rules/metadata/actions",
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "actions" in data
    assert len(data["actions"]) > 0
    
    # Check structure
    action = data["actions"][0]
    assert "id" in action
    assert "label" in action
    assert "description" in action
    assert "configurable_fields" in action


@pytest.mark.asyncio
async def test_ai_rules_filter_by_enabled(async_client, admin_user):
    """Test filtering rules by enabled status."""
    # Create two rules with different enabled status
    for enabled in [True, False]:
        payload = {
            "name": f"Rule {'Enabled' if enabled else 'Disabled'}",
            "trigger_type": "on_vulnerability_created",
            "action_type": "send_notification",
            "enabled": enabled,
        }
        await async_client.post(
            "/api/v1/admin/ai-rules",
            json=payload,
            headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
        )
    
    # Filter by enabled=True
    response = await async_client.get(
        "/api/v1/admin/ai-rules?enabled=true",
        headers={"Authorization": f"Bearer {admin_user.get('access_token', '')}"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data["items"]) == 1
    assert data["items"][0]["enabled"] is True


@pytest.mark.asyncio
async def test_ai_rules_authorization_non_admin(async_client, user_token):
    """Test that non-admin users cannot access AI rules endpoints."""
    response = await async_client.get(
        "/api/v1/admin/ai-rules",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    # Should be 403 Forbidden (no admin role)
    assert response.status_code in [403, 401]
