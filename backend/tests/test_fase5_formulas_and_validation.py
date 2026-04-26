"""Smoke tests for Fase 5: Formulas and Validation Rules."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


# ========================================
# FORMULA ENDPOINTS TESTS
# ========================================

@pytest.mark.asyncio
async def test_non_admin_cannot_list_formulas(client: AsyncClient, auth_headers: dict[str, str]):
    """Non-admin users cannot access formula endpoints."""
    resp = await client.get("/api/v1/admin/formulas", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_formulas(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Admin can list all formulas."""
    resp = await client.get("/api/v1/admin/formulas", headers=admin_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert "data" in body
    assert "items" in body["data"]
    assert "total" in body["data"]


@pytest.mark.asyncio
async def test_admin_can_create_formula(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Admin can create a new formula."""
    payload = {
        "nombre": "Test CVSS Formula",
        "description": "Calcula ajuste de CVSS",
        "formula_text": "IF(severidad == 'CRITICA', 10, 5)",
        "motor": "formula_engine",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/formulas",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["nombre"] == "Test CVSS Formula"
    assert body["data"]["enabled"] is True
    assert "id" in body["data"]
    assert "created_at" in body["data"]


@pytest.mark.asyncio
async def test_admin_can_create_formula_with_supported_functions(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can create formula using supported functions."""
    payload = {
        "nombre": "Calculate Days Between",
        "formula_text": "days_between('2025-01-01', '2025-01-31')",
        "motor": "formula_engine",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/formulas",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_admin_cannot_create_formula_with_invalid_syntax(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin cannot create formula with unbalanced parentheses."""
    payload = {
        "nombre": "Invalid Formula",
        "formula_text": "IF(severidad == 'CRITICA', 10",  # Missing closing paren
        "motor": "formula_engine",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/formulas",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_admin_can_get_single_formula(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can retrieve a single formula by ID."""
    # Create a formula first
    create_payload = {
        "nombre": "Get Formula Test",
        "formula_text": "IF(1 == 1, 100, 0)",
        "motor": "formula_engine",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/formulas",
        headers=admin_auth_headers,
        json=create_payload,
    )
    assert create_resp.status_code == 201
    formula_id = create_resp.json()["data"]["id"]

    # Get the formula
    get_resp = await client.get(
        f"/api/v1/admin/formulas/{formula_id}",
        headers=admin_auth_headers,
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == formula_id
    assert get_resp.json()["data"]["nombre"] == "Get Formula Test"


@pytest.mark.asyncio
async def test_admin_can_update_formula(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Admin can update an existing formula."""
    # Create a formula
    create_payload = {
        "nombre": "Original Name",
        "formula_text": "IF(1 == 1, 100, 0)",
        "motor": "formula_engine",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/formulas",
        headers=admin_auth_headers,
        json=create_payload,
    )
    formula_id = create_resp.json()["data"]["id"]

    # Update the formula
    update_payload = {
        "nombre": "Updated Name",
        "enabled": False,
    }
    update_resp = await client.patch(
        f"/api/v1/admin/formulas/{formula_id}",
        headers=admin_auth_headers,
        json=update_payload,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["nombre"] == "Updated Name"
    assert update_resp.json()["data"]["enabled"] is False


@pytest.mark.asyncio
async def test_admin_can_delete_formula(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Admin can delete (soft delete) a formula."""
    # Create a formula
    create_payload = {
        "nombre": "To Delete",
        "formula_text": "1 + 1",
        "motor": "formula_engine",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/formulas",
        headers=admin_auth_headers,
        json=create_payload,
    )
    formula_id = create_resp.json()["data"]["id"]

    # Delete it
    delete_resp = await client.delete(
        f"/api/v1/admin/formulas/{formula_id}",
        headers=admin_auth_headers,
    )
    assert delete_resp.status_code == 204


@pytest.mark.asyncio
async def test_admin_can_test_formula(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Admin can test a formula with sample data."""
    payload = {
        "formula_text": "IF(severidad == 'CRITICA', 10, 5)",
        "data": {"severidad": "CRITICA"},
    }
    resp = await client.post(
        "/api/v1/admin/formulas/test",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["success"] is True
    assert body["data"]["result"] == 10


@pytest.mark.asyncio
async def test_admin_can_test_formula_with_failure(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin gets error when testing invalid formula."""
    payload = {
        "formula_text": "IF(1 == 1, 100",  # Invalid
        "data": {},
    }
    resp = await client.post(
        "/api/v1/admin/formulas/test",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["success"] is False
    assert body["data"]["error"] is not None


@pytest.mark.asyncio
async def test_admin_can_get_supported_functions(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can retrieve list of supported formula functions."""
    resp = await client.get(
        "/api/v1/admin/formulas/functions/supported",
        headers=admin_auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    functions = body["data"]
    assert len(functions) >= 13  # At least 13 supported functions

    # Verify key functions exist
    func_names = [f["name"] for f in functions]
    assert "IF" in func_names
    assert "days_between" in func_names
    assert "sum" in func_names
    assert "avg" in func_names
    assert "percentage" in func_names


# ========================================
# VALIDATION RULES ENDPOINTS TESTS
# ========================================

@pytest.mark.asyncio
async def test_non_admin_cannot_list_validation_rules(
    client: AsyncClient, auth_headers: dict[str, str]
):
    """Non-admin users cannot access validation rule endpoints."""
    resp = await client.get("/api/v1/admin/validation-rules", headers=auth_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_list_validation_rules(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Admin can list all validation rules."""
    resp = await client.get("/api/v1/admin/validation-rules", headers=admin_auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert "data" in body
    assert "items" in body["data"]
    assert "total" in body["data"]


@pytest.mark.asyncio
async def test_admin_can_create_required_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can create a 'required' type validation rule."""
    payload = {
        "nombre": "Critical must have SLA",
        "entity_type": "vulnerabilidad",
        "rule_type": "required",
        "condition": {"field": "sla_days"},
        "error_message": "Critical vulnerabilities must have SLA defined",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["nombre"] == "Critical must have SLA"
    assert body["data"]["entity_type"] == "vulnerabilidad"
    assert body["data"]["rule_type"] == "required"
    assert "id" in body["data"]


@pytest.mark.asyncio
async def test_admin_can_create_regex_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can create a 'regex' type validation rule."""
    payload = {
        "nombre": "Email format validation",
        "entity_type": "usuario",
        "rule_type": "regex",
        "condition": {
            "field": "email",
            "pattern": r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
        },
        "error_message": "Invalid email format",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_admin_can_create_conditional_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can create a 'conditional' type validation rule."""
    payload = {
        "nombre": "CRITICA must have mitigation",
        "entity_type": "vulnerabilidad",
        "rule_type": "conditional",
        "condition": {
            "field": "severidad",
            "op": "==",
            "value": "CRITICA",
            "then_check": {"field": "mitigacion_plan", "op": "!=", "value": None},
        },
        "error_message": "Critical vulnerabilities must have a mitigation plan",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_admin_can_create_formula_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can create a 'formula' type validation rule."""
    payload = {
        "nombre": "CVSS score must be > 7 for CRITICA",
        "entity_type": "vulnerabilidad",
        "rule_type": "formula",
        "condition": {
            "formula": "IF(severidad == 'CRITICA', cvss_score > 7, True)"
        },
        "error_message": "CRITICA vulnerabilities must have CVSS > 7",
        "enabled": True,
    }
    resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=payload,
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_admin_can_get_single_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can retrieve a single validation rule by ID."""
    # Create a rule first
    create_payload = {
        "nombre": "Test Rule",
        "entity_type": "test_entity",
        "rule_type": "required",
        "condition": {"field": "name"},
        "error_message": "Name is required",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Get the rule
    get_resp = await client.get(
        f"/api/v1/admin/validation-rules/{rule_id}",
        headers=admin_auth_headers,
    )
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == rule_id
    assert get_resp.json()["data"]["nombre"] == "Test Rule"


@pytest.mark.asyncio
async def test_admin_can_update_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can update an existing validation rule."""
    # Create a rule
    create_payload = {
        "nombre": "Original Rule",
        "entity_type": "test",
        "rule_type": "required",
        "condition": {"field": "name"},
        "error_message": "Original message",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Update the rule
    update_payload = {
        "nombre": "Updated Rule",
        "error_message": "Updated message",
        "enabled": False,
    }
    update_resp = await client.patch(
        f"/api/v1/admin/validation-rules/{rule_id}",
        headers=admin_auth_headers,
        json=update_payload,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["nombre"] == "Updated Rule"
    assert update_resp.json()["data"]["error_message"] == "Updated message"
    assert update_resp.json()["data"]["enabled"] is False


@pytest.mark.asyncio
async def test_admin_can_delete_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can delete (soft delete) a validation rule."""
    # Create a rule
    create_payload = {
        "nombre": "To Delete",
        "entity_type": "test",
        "rule_type": "required",
        "condition": {"field": "name"},
        "error_message": "Test",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Delete it
    delete_resp = await client.delete(
        f"/api/v1/admin/validation-rules/{rule_id}",
        headers=admin_auth_headers,
    )
    assert delete_resp.status_code == 204


@pytest.mark.asyncio
async def test_admin_can_test_required_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can test a 'required' validation rule."""
    # Create a required rule
    create_payload = {
        "nombre": "Test Required",
        "entity_type": "test",
        "rule_type": "required",
        "condition": {"field": "email"},
        "error_message": "Email is required",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Test with valid data (has email)
    test_resp = await client.post(
        f"/api/v1/admin/validation-rules/{rule_id}/test",
        headers=admin_auth_headers,
        json={"data": {"email": "test@example.com"}},
    )
    assert test_resp.status_code == 200
    body = test_resp.json()
    assert body["data"]["valid"] is True


@pytest.mark.asyncio
async def test_admin_can_test_required_validation_rule_failure(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin gets failure when test data doesn't satisfy required rule."""
    # Create a required rule
    create_payload = {
        "nombre": "Test Required",
        "entity_type": "test",
        "rule_type": "required",
        "condition": {"field": "email"},
        "error_message": "Email is required",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Test with invalid data (missing email)
    test_resp = await client.post(
        f"/api/v1/admin/validation-rules/{rule_id}/test",
        headers=admin_auth_headers,
        json={"data": {"name": "Test"}},
    )
    assert test_resp.status_code == 200
    body = test_resp.json()
    assert body["data"]["valid"] is False
    assert "Email is required" in body["data"]["message"]


@pytest.mark.asyncio
async def test_admin_can_test_regex_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can test a 'regex' validation rule."""
    create_payload = {
        "nombre": "Email Regex",
        "entity_type": "test",
        "rule_type": "regex",
        "condition": {
            "field": "email",
            "pattern": r"^[\w\.-]+@[\w\.-]+\.\w+$",
        },
        "error_message": "Invalid email",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Test valid email
    test_resp = await client.post(
        f"/api/v1/admin/validation-rules/{rule_id}/test",
        headers=admin_auth_headers,
        json={"data": {"email": "test@example.com"}},
    )
    assert test_resp.status_code == 200
    assert test_resp.json()["data"]["valid"] is True


@pytest.mark.asyncio
async def test_admin_can_test_conditional_validation_rule(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Admin can test a 'conditional' validation rule."""
    create_payload = {
        "nombre": "Conditional Test",
        "entity_type": "test",
        "rule_type": "conditional",
        "condition": {
            "field": "status",
            "op": "==",
            "value": "active",
            "then_check": {"field": "plan", "op": "!=", "value": None},
        },
        "error_message": "Active items must have a plan",
        "enabled": True,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Test with status="active" and plan set (should pass)
    test_resp = await client.post(
        f"/api/v1/admin/validation-rules/{rule_id}/test",
        headers=admin_auth_headers,
        json={"data": {"status": "active", "plan": "Q1 2025"}},
    )
    assert test_resp.status_code == 200
    assert test_resp.json()["data"]["valid"] is True


@pytest.mark.asyncio
async def test_disabled_validation_rule_always_passes(
    client: AsyncClient, admin_auth_headers: dict[str, str]
):
    """Disabled validation rules should always pass validation."""
    create_payload = {
        "nombre": "Disabled Rule",
        "entity_type": "test",
        "rule_type": "required",
        "condition": {"field": "name"},
        "error_message": "Name required",
        "enabled": False,
    }
    create_resp = await client.post(
        "/api/v1/admin/validation-rules",
        headers=admin_auth_headers,
        json=create_payload,
    )
    rule_id = create_resp.json()["data"]["id"]

    # Test with empty data (should still pass because rule is disabled)
    test_resp = await client.post(
        f"/api/v1/admin/validation-rules/{rule_id}/test",
        headers=admin_auth_headers,
        json={"data": {}},
    )
    assert test_resp.status_code == 200
    assert test_resp.json()["data"]["valid"] is True
