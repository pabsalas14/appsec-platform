"""Tests for @mention notification service."""

from __future__ import annotations

from uuid import uuid4

import pytest

from app.services.mention_service import extract_mentions


# ── extract_mentions ──────────────────────────────────────────────────────────


def test_extract_no_mentions():
    assert extract_mentions("texto sin menciones") == []


def test_extract_single_mention():
    result = extract_mentions("Hola @juan.perez, revisa esto")
    assert "juan.perez" in result


def test_extract_multiple_mentions():
    result = extract_mentions("@alice y @bob deben revisar esto")
    assert "alice" in result
    assert "bob" in result


def test_extract_deduplicated():
    result = extract_mentions("@alice @alice @alice")
    assert result.count("alice") == 1


def test_extract_case_insensitive():
    result = extract_mentions("Hola @Alice")
    assert "alice" in result


def test_extract_email_format():
    result = extract_mentions("Mencionar a @user.name-123")
    assert "user.name-123" in result


def test_extract_empty_text():
    assert extract_mentions("") == []


def test_extract_none_like_empty():
    assert extract_mentions(None) == []  # type: ignore[arg-type]


def test_extract_at_symbol_alone():
    result = extract_mentions("texto con @ solo")
    assert result == []


def test_extract_max_mentions():
    # Build text with 30 mentions
    text = " ".join(f"@user{i}" for i in range(30))
    result = extract_mentions(text)
    assert len(result) <= 20


# ── Integration-style test (endpoint smoke) ───────────────────────────────────


@pytest.mark.asyncio
async def test_actualizacion_tema_create_unauthenticated(client):
    """Verify endpoint exists and requires auth."""
    payload = {
        "tema_id": str(uuid4()),
        "titulo": "Actualización con @mención",
        "contenido": "Hola @user1, por favor revisa este tema.",
    }
    r = await client.post("/api/v1/actualizacion_temas", json=payload)
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_actualizacion_tema_create_invalid(client, admin_auth_headers):
    """Missing required field returns 422."""
    payload = {"titulo": "Sin tema_id"}
    r = await client.post("/api/v1/actualizacion_temas", json=payload, headers=admin_auth_headers)
    assert r.status_code == 422
