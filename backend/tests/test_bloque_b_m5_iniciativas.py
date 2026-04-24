"""Tests for M5 (Iniciativas) — Bloque B, Fase 13."""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import uuid4

from app.models.iniciativa import Iniciativa
from app.schemas.iniciativa import IniciativaCreate, IniciativaUpdate


@pytest.mark.asyncio
async def test_create_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test creating a new iniciativa."""
    payload = {
        "titulo": "Test Iniciativa",
        "descripcion": "Test description",
        "tipo": "RFI",
        "estado": "En Progreso",
        "fecha_inicio": "2026-04-24T00:00:00Z",
        "fecha_fin_estimada": "2026-06-24T00:00:00Z",
    }
    response = await client.post("/api/v1/iniciativas", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["titulo"] == payload["titulo"]


@pytest.mark.asyncio
async def test_list_iniciativas(client: AsyncClient, auth_headers: dict):
    """Test listing iniciativas."""
    response = await client.get("/api/v1/iniciativas", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_get_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test getting a single iniciativa by ID."""
    # Create an iniciativa first
    payload = {
        "titulo": "Test Iniciativa",
        "descripcion": "Test",
        "tipo": "RFI",
        "estado": "En Progreso",
    }
    response = await client.post("/api/v1/iniciativas", json=payload, headers=auth_headers)
    iniciativa_id = response.json()["data"]["id"]
    
    # Get it
    response = await client.get(f"/api/v1/iniciativas/{iniciativa_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["id"] == iniciativa_id


@pytest.mark.asyncio
async def test_update_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test updating an iniciativa."""
    # Create
    payload = {
        "titulo": "Test Iniciativa",
        "descripcion": "Test",
        "tipo": "RFI",
        "estado": "En Progreso",
    }
    response = await client.post("/api/v1/iniciativas", json=payload, headers=auth_headers)
    iniciativa_id = response.json()["data"]["id"]
    
    # Update
    update_payload = {"estado": "Completada"}
    response = await client.patch(
        f"/api/v1/iniciativas/{iniciativa_id}",
        json=update_payload,
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["data"]["estado"] == "Completada"


@pytest.mark.asyncio
async def test_delete_iniciativa(client: AsyncClient, auth_headers: dict):
    """Test soft-deleting an iniciativa."""
    # Create
    payload = {
        "titulo": "Test Iniciativa",
        "descripcion": "Test",
        "tipo": "RFI",
        "estado": "En Progreso",
    }
    response = await client.post("/api/v1/iniciativas", json=payload, headers=auth_headers)
    iniciativa_id = response.json()["data"]["id"]
    
    # Delete
    response = await client.delete(f"/api/v1/iniciativas/{iniciativa_id}", headers=auth_headers)
    assert response.status_code == 200
    
    # Verify deleted (404 on get)
    response = await client.get(f"/api/v1/iniciativas/{iniciativa_id}", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_idor_protection_iniciativa(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    """Test IDOR protection: users can't access other users' iniciativas."""
    # Create as user 1
    payload = {
        "titulo": "Test Iniciativa",
        "descripcion": "Test",
        "tipo": "RFI",
        "estado": "En Progreso",
    }
    response = await client.post("/api/v1/iniciativas", json=payload, headers=auth_headers)
    iniciativa_id = response.json()["data"]["id"]
    
    # Try to access as user 2 (should fail with 404)
    response = await client.get(f"/api/v1/iniciativas/{iniciativa_id}", headers=other_auth_headers)
    assert response.status_code == 404
