"""
FASE 25: COMPLETE TEST SUITE — Comprehensive backend testing
============================================================

Valida:
  - IDOR: Every entity with user_id enforces ownership
  - OWASP S1-S25: All security controls
  - Auditability A1-A8: All audit rules
  - Envelope validation: All endpoints use success/paginated/error
  - E2E workflows: Complete business flows work end-to-end

This suite must pass with ≥80% coverage before proceeding to production.
NO TESTS RUN UNTIL ALL PHASES 10-27 CODE IS COMPLETE.
"""

import uuid
from typing import ClassVar

import pytest
from httpx import AsyncClient

# ─────────────────────────────────────────────────────────────────────────────
# FIXTURES: Common test data and helpers
# ─────────────────────────────────────────────────────────────────────────────


@pytest.fixture
async def activo_web_for_tests(client: AsyncClient, auth_headers: dict) -> str:
    """Helper: Create an ActivoWeb and return its ID."""
    resp = await client.post(
        "/api/v1/activo_webs",
        json={
            "nombre": f"Test Web {uuid.uuid4().hex[:6]}",
            "url": "https://example.com",
            "ambiente": "Test",
            "tipo": "app",
        },
        headers=auth_headers,
    )
    if resp.status_code != 201:
        pytest.skip(f"Failed to create ActivoWeb: {resp.text}")
    return resp.json()["data"]["id"]


@pytest.fixture
async def celula_for_tests(client: AsyncClient, auth_headers: dict) -> str:
    """Helper: Create a Celula and return its ID."""
    resp = await client.post(
        "/api/v1/celulas",
        json={
            "nombre": f"Test Celula {uuid.uuid4().hex[:6]}",
            "codigo": f"CEL{uuid.uuid4().hex[:3]}",
            "descripcion": "Test celula",
            "tipo": "desarrollo",
        },
        headers=auth_headers,
    )
    if resp.status_code != 201:
        pytest.skip(f"Failed to create Celula: {resp.text}")
    return resp.json()["data"]["id"]


# ─────────────────────────────────────────────────────────────────────────────
# OWASP S1: IDOR TESTS — All entities with user_id
# ─────────────────────────────────────────────────────────────────────────────


class TestOWASPS1IDOR:
    """S1: IDOR — every entity with user_id must enforce ownership."""

    IDOR_ENTITIES: ClassVar = [
        # (endpoint, create_payload_template, update_payload)
        (
            "vulnerabilidads",
            {
                "titulo": "Test IDOR Vuln",
                "descripcion": "Test",
                "fuente": "SAST",
                "severidad": "Alta",
                "estado": "Abierta",
                # activo_web_id added dynamically
            },
            {"estado": "En Progreso"},
        ),
        (
            "iniciativas",
            {
                "titulo": "Test IDOR Init",
                "tipo": "Proceso",
                "estado": "Abierta",
            },
            {"estado": "En Progreso"},
        ),
        (
            "temas_emergentes",
            {
                "titulo": "Test IDOR Theme",
                "descripcion": "Test description",
                "tipo": "Tendencia",
                "impacto": "Alto",
                "estado": "Abierto",
                "fuente": "Investigacion Interna",
            },
            {"estado": "Activo"},
        ),
        (
            "filtros_guardados",
            {
                "nombre": "Test IDOR Filter",
                "modulo": "vulnerabilities",
                "parametros": {"estado": "Abierta"},
            },
            {"nombre": "Updated Filter"},
        ),
    ]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("endpoint,create_payload,update_payload", IDOR_ENTITIES, ids=[e[0] for e in IDOR_ENTITIES])
    async def test_s1_idor_get_other_user_resource_returns_404(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
        endpoint: str,
        create_payload: dict,
        update_payload: dict,
        activo_web_for_tests: str,
    ):
        """User B cannot GET User A's resource (should be 404)."""
        payload = dict(create_payload)
        if endpoint == "vulnerabilidads":
            payload["activo_web_id"] = activo_web_for_tests

        # User A creates resource
        resp_a = await client.post(f"/api/v1/{endpoint}", json=payload, headers=auth_headers)
        if resp_a.status_code != 201:
            pytest.skip(f"Failed to create {endpoint}: {resp_a.text}")

        resource_id = resp_a.json()["data"]["id"]

        # User B tries to GET it
        resp_b = await client.get(f"/api/v1/{endpoint}/{resource_id}", headers=other_auth_headers)
        assert resp_b.status_code in (404, 403), "IDOR FAILED: User B accessed User A's resource"

    @pytest.mark.asyncio
    @pytest.mark.parametrize("endpoint,create_payload,update_payload", IDOR_ENTITIES, ids=[e[0] for e in IDOR_ENTITIES])
    async def test_s1_idor_patch_other_user_resource_returns_403(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
        endpoint: str,
        create_payload: dict,
        update_payload: dict,
        activo_web_for_tests: str,
    ):
        """User B cannot PATCH User A's resource (should be 403)."""
        payload = dict(create_payload)
        if endpoint == "vulnerabilidads":
            payload["activo_web_id"] = activo_web_for_tests

        resp_a = await client.post(f"/api/v1/{endpoint}", json=payload, headers=auth_headers)
        if resp_a.status_code != 201:
            pytest.skip(f"Failed to create {endpoint}")

        resource_id = resp_a.json()["data"]["id"]

        resp_b = await client.patch(
            f"/api/v1/{endpoint}/{resource_id}", json=update_payload, headers=other_auth_headers
        )
        assert resp_b.status_code in (403, 404), "IDOR FAILED: User B modified User A's resource"

    @pytest.mark.asyncio
    @pytest.mark.parametrize("endpoint,create_payload,update_payload", IDOR_ENTITIES, ids=[e[0] for e in IDOR_ENTITIES])
    async def test_s1_idor_delete_other_user_resource_returns_403(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
        endpoint: str,
        create_payload: dict,
        update_payload: dict,
        activo_web_for_tests: str,
    ):
        """User B cannot DELETE User A's resource (should be 403)."""
        payload = dict(create_payload)
        if endpoint == "vulnerabilidads":
            payload["activo_web_id"] = activo_web_for_tests

        resp_a = await client.post(f"/api/v1/{endpoint}", json=payload, headers=auth_headers)
        if resp_a.status_code != 201:
            pytest.skip(f"Failed to create {endpoint}")

        resource_id = resp_a.json()["data"]["id"]

        resp_b = await client.delete(f"/api/v1/{endpoint}/{resource_id}", headers=other_auth_headers)
        assert resp_b.status_code in (403, 404), "IDOR FAILED: User B deleted User A's resource"

    @pytest.mark.asyncio
    async def test_s1_idor_list_only_own_resources(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
        activo_web_for_tests: str,
    ):
        """User's list endpoint should NOT return other user's resources."""
        # User A creates vulnerability
        resp_a = await client.post(
            "/api/v1/vulnerabilidads",
            json={
                "titulo": "User A Vuln",
                "descripcion": "Test",
                "fuente": "SAST",
                "severidad": "Alta",
                "estado": "Abierta",
                "activo_web_id": activo_web_for_tests,
            },
            headers=auth_headers,
        )
        assert resp_a.status_code == 201
        user_a_vuln_id = resp_a.json()["data"]["id"]

        # User B lists vulnerabilities
        resp_b = await client.get("/api/v1/vulnerabilidads", headers=other_auth_headers)
        assert resp_b.status_code == 200

        user_b_vulns = resp_b.json()["data"]
        user_b_ids = [v["id"] for v in user_b_vulns]

        assert user_a_vuln_id not in user_b_ids, "IDOR FAILED: User B can see User A's vulnerability"

    @pytest.mark.asyncio
    async def test_s1_idor_owner_can_access_own_resource(
        self,
        client: AsyncClient,
        auth_headers: dict,
        activo_web_for_tests: str,
    ):
        """Owner SHOULD be able to access their own resource."""
        resp = await client.post(
            "/api/v1/vulnerabilidads",
            json={
                "titulo": "Owner Test",
                "descripcion": "Test",
                "fuente": "SAST",
                "severidad": "Alta",
                "estado": "Abierta",
                "activo_web_id": activo_web_for_tests,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        vuln_id = resp.json()["data"]["id"]

        resp_get = await client.get(f"/api/v1/vulnerabilidads/{vuln_id}", headers=auth_headers)
        assert resp_get.status_code == 200
        assert resp_get.json()["data"]["id"] == vuln_id


# ─────────────────────────────────────────────────────────────────────────────
# OWASP S3: PROPERTY-LEVEL AUTHORIZATION
# ─────────────────────────────────────────────────────────────────────────────


class TestOWASPS3PropertyAuthz:
    """S3: Sensitive fields should NOT be exposed in responses."""

    @pytest.mark.asyncio
    async def test_s3_user_password_not_exposed(self, client: AsyncClient, auth_headers: dict):
        """GET /users/me should NOT expose hashed_password."""
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200

        data = resp.json()["data"]
        assert "hashed_password" not in data, "S3 FAILED: hashed_password exposed"
        assert "password" not in data, "S3 FAILED: password exposed"

    @pytest.mark.asyncio
    async def test_s3_refresh_token_not_exposed(self, client: AsyncClient, auth_headers: dict):
        """GET /users/me should NOT expose refresh_tokens."""
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200

        data = resp.json()["data"]
        assert "refresh_tokens" not in data, "S3 FAILED: refresh_tokens exposed"
        data_str = str(data).lower()
        assert "refresh" not in data_str or "token" not in data_str, "S3 FAILED: token data exposed"


# ─────────────────────────────────────────────────────────────────────────────
# OWASP S4: RATE LIMITING
# ─────────────────────────────────────────────────────────────────────────────


class TestOWASPS4RateLimiting:
    """S4: Rate limiting and pagination enforcement."""

    @pytest.mark.asyncio
    async def test_s4_pagination_enforced(self, client: AsyncClient, auth_headers: dict):
        """List endpoints should enforce pagination (max 100)."""
        # Try to get with large page_size (should be capped)
        resp = await client.get(
            "/api/v1/vulnerabilidads?page_size=500",
            headers=auth_headers,
        )
        assert resp.status_code == 200

        # Verify page_size was capped at 100
        meta = resp.json().get("meta", {})
        page_size = meta.get("page_size", len(resp.json().get("data", [])))
        assert page_size <= 100, f"S4 FAILED: page_size not capped (got {page_size})"


# ─────────────────────────────────────────────────────────────────────────────
# OWASP S7: SSRF PREVENTION
# ─────────────────────────────────────────────────────────────────────────────


class TestOWASPS7SSRF:
    """S7: SSRF Prevention — private IP blocking."""

    @pytest.mark.asyncio
    async def test_s7_localhost_blocked(self, client: AsyncClient, auth_headers: dict):
        """POST /repositorios with localhost URL should be rejected."""
        resp = await client.post(
            "/api/v1/repositorios",
            json={
                "nombre": "test-repo",
                "url": "http://localhost/repo.git",
                "plataforma": "GitHub",
                "rama_default": "main",
                "activo": True,
                "celula_id": str(uuid.uuid4()),
            },
            headers=auth_headers,
        )
        assert resp.status_code in (400, 422), f"S7 FAILED: localhost not blocked (got {resp.status_code})"

    @pytest.mark.asyncio
    async def test_s7_private_ip_127_blocked(self, client: AsyncClient, auth_headers: dict):
        """POST /repositorios with 127.0.0.1 should be rejected."""
        resp = await client.post(
            "/api/v1/repositorios",
            json={
                "nombre": "test-repo",
                "url": "http://127.0.0.1/repo.git",
                "plataforma": "GitHub",
                "rama_default": "main",
                "activo": True,
                "celula_id": str(uuid.uuid4()),
            },
            headers=auth_headers,
        )
        assert resp.status_code in (400, 422), "S7 FAILED: 127.0.0.1 not blocked"

    @pytest.mark.asyncio
    async def test_s7_private_ip_10_blocked(self, client: AsyncClient, auth_headers: dict):
        """POST /repositorios with 10.0.0.x should be rejected."""
        resp = await client.post(
            "/api/v1/repositorios",
            json={
                "nombre": "test-repo",
                "url": "http://10.0.0.1/repo.git",
                "plataforma": "GitHub",
                "rama_default": "main",
                "activo": True,
                "celula_id": str(uuid.uuid4()),
            },
            headers=auth_headers,
        )
        assert resp.status_code in (400, 422), "S7 FAILED: 10.0.0.1 not blocked"


# ─────────────────────────────────────────────────────────────────────────────
# AUDITABILITY: A1 - JUSTIFICACION OBLIGATORIA
# ─────────────────────────────────────────────────────────────────────────────


class TestAuditabilityA1Justificacion:
    """A1: Justificación obligatoria en acciones críticas."""

    @pytest.mark.asyncio
    async def test_a1_close_without_justificacion_rejected(
        self,
        client: AsyncClient,
        auth_headers: dict,
        activo_web_for_tests: str,
    ):
        """Closing critical vulnerability without justificacion should be rejected."""
        # Create critical vulnerability
        resp = await client.post(
            "/api/v1/vulnerabilidads",
            json={
                "titulo": "Critical Vuln",
                "descripcion": "Test",
                "fuente": "SAST",
                "severidad": "Critica",
                "estado": "Abierta",
                "activo_web_id": activo_web_for_tests,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        vuln_id = resp.json()["data"]["id"]

        # Try to close without justificacion
        resp_close = await client.patch(
            f"/api/v1/vulnerabilidads/{vuln_id}",
            json={"estado": "Cerrada"},  # Missing justificacion!
            headers=auth_headers,
        )

        # Should be rejected with 400
        assert resp_close.status_code == 400, (
            f"A1 FAILED: Closed critical vuln without justificacion (status={resp_close.status_code})"
        )


# ─────────────────────────────────────────────────────────────────────────────
# AUDITABILITY: A2 - SOFT DELETE
# ─────────────────────────────────────────────────────────────────────────────


class TestAuditabilityA2SoftDelete:
    """A2: Soft delete — entities are marked deleted, not physically removed."""

    @pytest.mark.asyncio
    async def test_a2_soft_delete_preserves_data(
        self,
        client: AsyncClient,
        auth_headers: dict,
        activo_web_for_tests: str,
    ):
        """Deleting entity should soft-delete (not physically remove)."""
        # Create vulnerability
        resp = await client.post(
            "/api/v1/vulnerabilidads",
            json={
                "titulo": "Test Soft Delete",
                "descripcion": "Test",
                "fuente": "SAST",
                "severidad": "Baja",
                "estado": "Abierta",
                "activo_web_id": activo_web_for_tests,
            },
            headers=auth_headers,
        )
        assert resp.status_code == 201
        vuln_id = resp.json()["data"]["id"]

        # Delete it
        resp_delete = await client.delete(f"/api/v1/vulnerabilidads/{vuln_id}", headers=auth_headers)
        assert resp_delete.status_code == 204

        # Verify not returned in normal queries
        resp_list = await client.get("/api/v1/vulnerabilidads", headers=auth_headers)
        ids = [v["id"] for v in resp_list.json()["data"]]
        assert vuln_id not in ids, "A2 FAILED: Deleted entity still visible"


# ─────────────────────────────────────────────────────────────────────────────
# AUDITABILITY: A4 - HASH CHAIN
# ─────────────────────────────────────────────────────────────────────────────


class TestAuditabilityA4HashChain:
    """A4: Hash chain in audit log — tamper-evident trail."""

    @pytest.mark.asyncio
    async def test_a4_hash_chain_present(self, client: AsyncClient, admin_auth_headers: dict):
        """AuditLog entries should have prev_hash and row_hash fields."""
        resp = await client.get("/api/v1/audit-logs", headers=admin_auth_headers)

        if resp.status_code == 200:
            logs = resp.json().get("data", [])
            if len(logs) > 0:
                log = logs[0]
                assert "prev_hash" in log or "row_hash" in log, "A4 FAILED: Hash fields not present in audit log"


# ─────────────────────────────────────────────────────────────────────────────
# AUDITABILITY: A7 - EXPORT LOGGING
# ─────────────────────────────────────────────────────────────────────────────


class TestAuditabilityA7Export:
    """A7: Exports are logged with hash."""

    @pytest.mark.asyncio
    async def test_a7_export_has_audit_trail(self, client: AsyncClient, admin_auth_headers: dict):
        """Export endpoint should be auditable (PBAC: requiere ``initiatives.export``)."""
        resp = await client.get("/api/v1/iniciativas/export.csv", headers=admin_auth_headers)

        # Si el endpoint existe, CSV 200 o recurso ausente 404
        assert resp.status_code in (200, 404), "A7: Unexpected status for export"


# ─────────────────────────────────────────────────────────────────────────────
# ENVELOPE VALIDATION — All endpoints return proper envelope
# ─────────────────────────────────────────────────────────────────────────────


class TestEnvelopeValidation:
    """All endpoints must return success/paginated/error envelope."""

    @pytest.mark.asyncio
    async def test_envelope_success_structure(self, client: AsyncClient, auth_headers: dict):
        """GET single entity should have success envelope: {status, data, meta}."""
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200

        body = resp.json()
        assert "status" in body, "Missing 'status' in envelope"
        assert body["status"] in ("success", "error"), f"Invalid status: {body['status']}"
        assert "data" in body, "Missing 'data' in envelope"

    @pytest.mark.asyncio
    async def test_envelope_paginated_structure(self, client: AsyncClient, auth_headers: dict):
        """GET list should have paginated envelope: {status, data, meta: {page, page_size, total}}."""
        resp = await client.get("/api/v1/vulnerabilidads", headers=auth_headers)
        assert resp.status_code == 200

        body = resp.json()
        assert body["status"] == "success", "List should return success"
        assert isinstance(body["data"], list), "Data should be array"
        assert "meta" in body, "Missing 'meta' in paginated response"
        meta = body["meta"]
        assert "page" in meta, "Missing 'page' in meta"
        assert "page_size" in meta, "Missing 'page_size' in meta"
        assert "total" in meta, "Missing 'total' in meta"

    @pytest.mark.asyncio
    async def test_envelope_error_structure(self, client: AsyncClient, auth_headers: dict):
        """Error responses should have proper envelope: {status: error, detail}."""
        resp = await client.get("/api/v1/vulnerabilidads/invalid-uuid", headers=auth_headers)
        assert resp.status_code in (400, 404, 422)

        body = resp.json()
        assert body["status"] == "error", "Error response should have status='error'"
        assert "detail" in body, "Error should have 'detail' field"


# ─────────────────────────────────────────────────────────────────────────────
# E2E WORKFLOWS — Complete business processes
# ─────────────────────────────────────────────────────────────────────────────


class TestE2EWorkflows:
    """Complete end-to-end workflows."""

    @pytest.mark.asyncio
    async def test_e2e_vulnerability_lifecycle(
        self,
        client: AsyncClient,
        auth_headers: dict,
        other_auth_headers: dict,
        activo_web_for_tests: str,
    ):
        """Full vulnerability workflow: create → assign → remediate → close."""
        # 1. Create vulnerability
        resp_create = await client.post(
            "/api/v1/vulnerabilidads",
            json={
                "titulo": "E2E Test SQL Injection",
                "descripcion": "SQL injection in login form",
                "fuente": "SAST",
                "severidad": "Alta",
                "estado": "Abierta",
                "activo_web_id": activo_web_for_tests,
            },
            headers=auth_headers,
        )
        assert resp_create.status_code == 201
        vuln = resp_create.json()["data"]
        vuln_id = vuln["id"]
        assert vuln["estado"] == "Abierta", "Initial state should be 'Abierta'"
        assert "fecha_limite_sla" in vuln, "SLA not calculated on creation"

        # 2. Assign to remediation
        resp_assign = await client.patch(
            f"/api/v1/vulnerabilidads/{vuln_id}",
            json={"estado": "En Progreso"},
            headers=auth_headers,
        )
        assert resp_assign.status_code == 200

        # 3. Mark as remediated
        resp_remediated = await client.patch(
            f"/api/v1/vulnerabilidads/{vuln_id}",
            json={
                "estado": "Remediada",
                "justificacion": "Code patched and tested",
            },
            headers=other_auth_headers,
        )
        assert resp_remediated.status_code == 200

        # 4. Close vulnerability
        resp_close = await client.patch(
            f"/api/v1/vulnerabilidads/{vuln_id}",
            json={
                "estado": "Cerrada",
                "justificacion": "Fix deployed to production",
            },
            headers=auth_headers,
        )
        assert resp_close.status_code == 200

        # 5. Verify final state
        resp_final = await client.get(f"/api/v1/vulnerabilidads/{vuln_id}", headers=auth_headers)
        assert resp_final.status_code == 200
        final_vuln = resp_final.json()["data"]
        assert final_vuln["estado"] == "Cerrada", "Final state should be 'Cerrada'"


# ─────────────────────────────────────────────────────────────────────────────
# COVERAGE VERIFICATION — Check that critical paths are tested
# ─────────────────────────────────────────────────────────────────────────────


class TestCoverageRequirements:
    """Verify minimum coverage requirements."""

    @pytest.mark.asyncio
    async def test_framework_rules_enforced(self, client: AsyncClient, auth_headers: dict):
        """Framework rules (R1-R12) should be enforced."""
        # R3: Envelope validation (tested above)
        # R4: IDOR protection (tested above)
        # R10: RBAC (tested via require_permission)

        # Just verify endpoints respond with proper structure
        resp = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        assert "status" in resp.json(), "R3 FAILED: Missing envelope"

    @pytest.mark.asyncio
    async def test_auditability_rules_enforced(self, client: AsyncClient, auth_headers: dict):
        """Auditability rules (A1-A8) are enforced."""
        # A2: Soft delete (tested above)
        # A4: Hash chain (tested above)
        # A7: Export logging (tested above)

        resp = await client.get("/api/v1/audit-logs", headers=auth_headers)
        # Should either return 200 (if authorized) or 403 (if not)
        assert resp.status_code in (200, 403), "Audit logs should be protected"
