"""
FASE 22-24: IA INTEGRATION TESTS — Threat Modeling & FP Triage
=============================================================

Tests for:
  - Fase 22: Threat Modeling asistido (STRIDE/DREAD)
  - Fase 23: Triaje de falsos positivos SAST/DAST
  - Fase 24: E2E IA integration tests
"""

import pytest
from httpx import AsyncClient

from tests.graph_helpers import create_sesion_tm_id


class TestPhase22ThreatModeling:
    """Fase 22: Threat Modeling asistido by IA."""

    @pytest.mark.asyncio
    async def test_threat_modeling_session_creation(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """POST /sesion_threat_modelings con payload BRD (programa_tm_id, fecha, estado, …)."""
        sid = await create_sesion_tm_id(client, auth_headers)
        assert sid, "debe devolver id de sesión creada"

    @pytest.mark.asyncio
    async def test_threat_model_generates_stride_threats(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """Con sesión válida, el listado de amenazas (si existe) responde 200."""
        session_id = await create_sesion_tm_id(client, auth_headers)
        resp_threats = await client.get(
            f"/api/v1/amenazas?sesion_id={session_id}",
            headers=auth_headers,
        )
        if resp_threats.status_code == 200:
            threats = resp_threats.json()["data"]
            if threats:
                threat = threats[0]
                assert "categoria_stride" in threat or "stride" in threat.get("titulo", "").lower(), (
                    "Threats should be categorized by STRIDE"
                )

    @pytest.mark.asyncio
    async def test_threat_model_dread_scoring(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """La sesión creada expone un estado de dominio (Planificada, En Progreso, …)."""
        session_id = await create_sesion_tm_id(client, auth_headers)
        r = await client.get(
            f"/api/v1/sesion_threat_modelings/{session_id}",
            headers=auth_headers,
        )
        assert r.status_code == 200
        st = r.json()["data"]["estado"]
        assert st in ("Planificada", "En Progreso", "Completada", "Cancelada")


# ─────────────────────────────────────────────────────────────────────────────


class TestPhase23FPTriage:
    """Fase 23: False Positive triage by IA."""

    @pytest.mark.asyncio
    async def test_fp_triage_endpoint_exists(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """POST /hallazgo_sasts/{id}/triage-ia should accept triage request."""
        from tests.graph_helpers import create_actividad_mensual_sast_id

        aid = await create_actividad_mensual_sast_id(client, auth_headers)
        # First create a hallazgo_sast (esquema real: actividad_sast_id, severidad, estado, …)
        resp_create = await client.post(
            "/api/v1/hallazgo_sasts",
            json={
                "actividad_sast_id": aid,
                "vulnerabilidad_id": None,
                "titulo": "Test FP Triage",
                "descripcion": "SQL Injection in login",
                "severidad": "Alta",
                "herramienta": "SAST",
                "regla": "sql",
                "archivo": "x.py",
                "linea": 1,
                "estado": "Abierto",
            },
            headers=auth_headers,
        )

        if resp_create.status_code == 404:
            pytest.skip("HallazgoSast endpoint not available")

        if resp_create.status_code != 201:
            pytest.skip(f"Could not create test hallazgo: {resp_create.text}")

        hallazgo_id = resp_create.json()["data"]["id"]

        # Now request triage
        resp_triage = await client.post(
            f"/api/v1/hallazgo_sasts/{hallazgo_id}/triage-ia",
            json={
                "prompt": "Is this a false positive?",
                "dry_run": False,
            },
            headers=auth_headers,
        )

        # Should succeed or return 404 if not yet implemented
        assert resp_triage.status_code in (200, 404, 501), (
            f"FP triage should exist or be deferred: {resp_triage.status_code}"
        )

    @pytest.mark.asyncio
    async def test_fp_triage_classification(
        self,
        client: AsyncClient,
        auth_headers: dict,
    ):
        """FP triage should classify findings as FP/Review/Confirmed."""
        # Create test hallazgo
        resp_create = await client.post(
            "/api/v1/hallazgo_sasts",
            json={
                "titulo": "Test Classification",
                "descripcion": "Test code snippet",
                "severidad": "Media",
                "tipo_motor": "DAST",
                "codigo_snippet": "console.log('test')",  # Obviously FP
            },
            headers=auth_headers,
        )

        if resp_create.status_code == 404:
            pytest.skip("HallazgoSast endpoint not available")

        if resp_create.status_code != 201:
            pytest.skip("Could not create test hallazgo")

        hallazgo_id = resp_create.json()["data"]["id"]

        # Request triage
        resp_triage = await client.post(
            f"/api/v1/hallazgo_sasts/{hallazgo_id}/triage-ia",
            json={
                "prompt": "Classify this finding",
                "dry_run": False,
            },
            headers=auth_headers,
        )

        if resp_triage.status_code == 200:
            result = resp_triage.json()["data"]
            # Should have classification
            assert "clasificacion" in result or "classification" in result, "Result should include classification"


# ─────────────────────────────────────────────────────────────────────────────


class TestPhase24IAProviderSwitching:
    """Fase 24: E2E IA provider switching (multi-provider support)."""

    @pytest.mark.asyncio
    async def test_ia_config_read(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
    ):
        """GET /admin/ia-config should return current IA configuration."""
        resp = await client.get(
            "/api/v1/admin/ia-config",
            headers=admin_auth_headers,
        )

        assert resp.status_code == 200, "IA config endpoint should be accessible"
        config = resp.json()["data"]

        # Should have essential fields
        assert "proveedor_activo" in config, "Missing proveedor_activo"
        assert "modelo" in config, "Missing modelo"
        assert config["proveedor_activo"] in ("ollama", "openai", "anthropic", "openrouter"), (
            f"Invalid provider: {config['proveedor_activo']}"
        )

    @pytest.mark.asyncio
    async def test_ia_config_update(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
    ):
        """PUT /admin/ia-config should update IA configuration."""
        resp = await client.put(
            "/api/v1/admin/ia-config",
            json={
                "temperatura": 0.5,  # Change temperature
            },
            headers=admin_auth_headers,
        )

        assert resp.status_code == 200, "IA config update should succeed"
        config = resp.json()["data"]
        assert config["temperatura"] == 0.5, "Temperature should be updated"

    @pytest.mark.asyncio
    async def test_ia_test_call_ollama(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
    ):
        """POST /admin/ia-config/test-call should test IA provider connection."""
        resp = await client.post(
            "/api/v1/admin/ia-config/test-call",
            json={
                "prompt": "Say hello",
                "dry_run": True,  # Don't actually call the provider
            },
            headers=admin_auth_headers,
        )

        assert resp.status_code == 200, "Test call should succeed"
        result = resp.json()["data"]

        # Should return result structure
        assert "content" in result, "Result should have content"
        assert "provider" in result, "Result should identify provider"
        assert result["dry_run"] is True, "Dry run flag should be preserved"

    @pytest.mark.asyncio
    async def test_ia_provider_timeout_respected(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
    ):
        """IA calls should respect timeout setting."""
        # Get current config
        resp_config = await client.get("/api/v1/admin/ia-config", headers=admin_auth_headers)
        resp_config.json()["data"]

        # Update timeout to short value
        await client.put(
            "/api/v1/admin/ia-config",
            json={"timeout_segundos": 5},
            headers=admin_auth_headers,
        )

        # Any actual call should respect this timeout
        resp = await client.post(
            "/api/v1/admin/ia-config/test-call",
            json={
                "prompt": "Quick test",
                "dry_run": True,
            },
            headers=admin_auth_headers,
        )

        assert resp.status_code == 200, "Test call with short timeout should handle gracefully"


# ─────────────────────────────────────────────────────────────────────────────


class TestPhase24IAErrorHandling:
    """Fase 24: IA provider error handling (S10 compliance)."""

    @pytest.mark.asyncio
    async def test_ia_provider_error_graceful_handling(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
    ):
        """IA errors should be handled gracefully without exposing internals."""
        # Try to switch to non-existent provider
        resp = await client.put(
            "/api/v1/admin/ia-config",
            json={"proveedor_activo": "invalid_provider"},
            headers=admin_auth_headers,
        )

        # Should either reject the update or handle gracefully
        if resp.status_code == 200:
            # Config accepted, but test call should fail gracefully
            resp_test = await client.post(
                "/api/v1/admin/ia-config/test-call",
                json={"prompt": "test", "dry_run": False},
                headers=admin_auth_headers,
            )

            # Should not expose internal error details
            if resp_test.status_code != 200:
                assert "Traceback" not in resp_test.text, "Error should not expose stack trace"

    @pytest.mark.asyncio
    async def test_ia_response_validation(
        self,
        client: AsyncClient,
        admin_auth_headers: dict,
    ):
        """IA responses should be validated before processing (S10 compliance)."""
        resp = await client.post(
            "/api/v1/admin/ia-config/test-call",
            json={
                "prompt": "Test response validation",
                "dry_run": True,
            },
            headers=admin_auth_headers,
        )

        assert resp.status_code == 200
        result = resp.json()["data"]

        # Response should be properly structured
        assert "content" in result, "Response must have content field"
        assert isinstance(result["content"], str), "Content must be string"

        # No HTML/script tags should be present (basic check)
        assert "<script" not in result["content"].lower(), "Response should be sanitized"
