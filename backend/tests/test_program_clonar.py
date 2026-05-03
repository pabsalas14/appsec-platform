"""Tests for program cloning endpoints — /programa_*/{id}/clonar."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from httpx import AsyncClient


def _make_programa_sast(user_id, repositorio_id=None):
    from datetime import datetime

    p = MagicMock()
    p.id = uuid4()
    p.user_id = user_id
    p.repositorio_id = repositorio_id or uuid4()
    p.nombre = "Programa SAST 2025"
    p.ano = 2025
    p.descripcion = "Descripción de prueba"
    p.estado = "Activo"
    p.metadatos_motor = {"motor": "SonarQube"}
    p.created_at = datetime.now()
    p.updated_at = datetime.now()
    p.deleted_at = None
    return p


# ── Smoke tests for clone endpoint registration ───────────────────────────────


@pytest.mark.asyncio
async def test_clonar_programa_sast_unauthenticated(client: AsyncClient):
    """Clone endpoint requires authentication."""
    r = await client.post(f"/api/v1/programa_sasts/{uuid4()}/clonar")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_clonar_programa_dast_unauthenticated(client: AsyncClient):
    """DAST clone endpoint requires authentication."""
    r = await client.post(f"/api/v1/programa_dasts/{uuid4()}/clonar")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_clonar_programa_source_code_unauthenticated(client: AsyncClient):
    """Source code clone endpoint requires authentication."""
    r = await client.post(f"/api/v1/programa_source_codes/{uuid4()}/clonar")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_clonar_programa_threat_modeling_unauthenticated(client: AsyncClient):
    """Threat modeling clone endpoint requires authentication."""
    r = await client.post(f"/api/v1/programa_threat_modelings/{uuid4()}/clonar")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_clonar_programa_sast_not_found(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Clone of a non-existent program returns 404."""
    r = await client.post(f"/api/v1/programa_sasts/{uuid4()}/clonar", headers=admin_auth_headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_clonar_programa_dast_not_found(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Clone of a non-existent DAST program returns 404."""
    r = await client.post(f"/api/v1/programa_dasts/{uuid4()}/clonar", headers=admin_auth_headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_clonar_programa_source_code_not_found(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Clone of a non-existent source code program returns 404."""
    r = await client.post(f"/api/v1/programa_source_codes/{uuid4()}/clonar", headers=admin_auth_headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_clonar_programa_threat_modeling_not_found(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Clone of a non-existent threat modeling program returns 404."""
    r = await client.post(f"/api/v1/programa_threat_modelings/{uuid4()}/clonar", headers=admin_auth_headers)
    assert r.status_code == 404
