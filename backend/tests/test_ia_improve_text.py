"""Tests for IA Writing Assistant endpoint /ia/improve-text."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_improve_text_preview(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Preview endpoint returns improved text without calling real provider."""
    payload = {"text": "texto de prueba para mejorar", "tone": "formal"}
    response = await client.post("/api/v1/ia/improve-text/preview", json=payload, headers=admin_auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "success"
    data = body["data"]
    assert data["original"] == payload["text"]
    assert "[PREVIEW]" in data["improved"]
    assert data["tone"] == "formal"
    assert data["language"] == "es"


@pytest.mark.asyncio
async def test_improve_text_preview_all_tones(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Preview endpoint accepts all valid tone values."""
    for tone in ("formal", "tecnico", "ejecutivo", "conciso"):
        payload = {"text": "texto ejemplo", "tone": tone}
        r = await client.post("/api/v1/ia/improve-text/preview", json=payload, headers=admin_auth_headers)
        assert r.status_code == 200, f"tone={tone} failed"
        assert r.json()["data"]["tone"] == tone


@pytest.mark.asyncio
async def test_improve_text_preview_both_languages(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Preview endpoint accepts 'es' and 'en' language values."""
    for lang in ("es", "en"):
        payload = {"text": "sample text", "language": lang}
        r = await client.post("/api/v1/ia/improve-text/preview", json=payload, headers=admin_auth_headers)
        assert r.status_code == 200
        assert r.json()["data"]["language"] == lang


@pytest.mark.asyncio
async def test_improve_text_preview_with_context(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Preview endpoint accepts optional context field."""
    payload = {"text": "vulnerabilidad crítica encontrada", "context": "reporte ejecutivo"}
    r = await client.post("/api/v1/ia/improve-text/preview", json=payload, headers=admin_auth_headers)
    assert r.status_code == 200
    assert r.json()["data"]["original"] == payload["text"]


@pytest.mark.asyncio
async def test_improve_text_empty_text_rejected(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Empty text should fail validation."""
    payload = {"text": "", "tone": "formal"}
    r = await client.post("/api/v1/ia/improve-text/preview", json=payload, headers=admin_auth_headers)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_improve_text_invalid_tone_rejected(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Unknown tone value should fail validation."""
    payload = {"text": "texto válido", "tone": "casual"}
    r = await client.post("/api/v1/ia/improve-text/preview", json=payload, headers=admin_auth_headers)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_improve_text_unauthenticated(client: AsyncClient):
    """Unauthenticated request should return 401."""
    payload = {"text": "texto de prueba"}
    r = await client.post("/api/v1/ia/improve-text/preview", json=payload)
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_improve_text_real_mocked(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Real endpoint uses provider and returns improved text."""
    from app.services.ia_provider import RunPromptResult

    mock_result = RunPromptResult(
        content="Texto mejorado de forma profesional.",
        provider="ollama",
        model="llama3.1:8b",
    )

    with patch("app.api.v1.ia.run_prompt", new_callable=AsyncMock, return_value=mock_result):
        payload = {"text": "texto original", "tone": "ejecutivo"}
        r = await client.post("/api/v1/ia/improve-text", json=payload, headers=admin_auth_headers)
        assert r.status_code == 200
        data = r.json()["data"]
        assert data["improved"] == "Texto mejorado de forma profesional."
        assert data["provider"] == "ollama"


@pytest.mark.asyncio
async def test_improve_text_provider_unavailable(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """503 when IA provider is unavailable."""
    from app.services.ia_provider import IAProviderError

    with patch("app.api.v1.ia.run_prompt", new_callable=AsyncMock, side_effect=IAProviderError("timeout")):
        payload = {"text": "texto original"}
        r = await client.post("/api/v1/ia/improve-text", json=payload, headers=admin_auth_headers)
        assert r.status_code == 503
