"""Tests for FiltroGuardado — Bloque B, Fase 16."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_filtro_guardado(client: AsyncClient, auth_headers: dict):
    """Test creating a new filtro guardado."""
    payload = {
        "nombre": "Vulnerabilidades Críticas SLA Vencido",
        "modulo": "vulnerabilities",
        "parametros": {
            "severidad": "CRITICA",
            "sla_status": "overdue",
            "estado": "Abierta",
        },
        "compartido": False,
    }
    response = await client.post("/api/v1/filtros_guardados", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["nombre"] == payload["nombre"]


@pytest.mark.asyncio
async def test_list_filtros_guardados(client: AsyncClient, auth_headers: dict):
    """Test listing filtros guardados."""
    response = await client.get("/api/v1/filtros_guardados", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_filtro_guardado_json_parametros(client: AsyncClient, auth_headers: dict):
    """Test that filtro guardado stores complex JSON parametros."""
    complex_params = {
        "filters": {
            "severidad": ["CRITICA", "ALTA"],
            "estado": "Abierta",
            "responsable_id": None,
        },
        "sort": {"field": "fecha_creacion", "order": "desc"},
        "pagination": {"page": 1, "page_size": 50},
    }
    payload = {
        "nombre": "Mi Filtro Personalizado",
        "modulo": "vulnerabilities",
        "parametros": complex_params,
    }
    response = await client.post("/api/v1/filtros_guardados", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["parametros"] == complex_params


@pytest.mark.asyncio
async def test_filtro_guardado_shared_flag(client: AsyncClient, auth_headers: dict):
    """Test that filtro guardado can be marked as compartido."""
    payload = {
        "nombre": "Filtro Compartido del Equipo",
        "modulo": "releases",
        "parametros": {"estado": "Pendiente Aprobación"},
        "compartido": True,
    }
    response = await client.post("/api/v1/filtros_guardados", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["compartido"] == True


@pytest.mark.asyncio
async def test_filtro_guardado_multiple_modulos(client: AsyncClient, auth_headers: dict):
    """Test that filtro guardado supports different modulos."""
    modulos = ["vulnerabilities", "releases", "initiatives", "auditorias", "temas_emergentes"]
    
    for modulo in modulos:
        payload = {
            "nombre": f"Filtro {modulo}",
            "modulo": modulo,
            "parametros": {"test": "value"},
        }
        response = await client.post("/api/v1/filtros_guardados", json=payload, headers=auth_headers)
        assert response.status_code == 201
        assert response.json()["data"]["modulo"] == modulo


@pytest.mark.asyncio
async def test_idor_protection_filtro_guardado(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    """Test IDOR protection for filtro guardado."""
    payload = {
        "nombre": "Mi Filtro Personal",
        "modulo": "vulnerabilities",
        "parametros": {"test": "value"},
    }
    response = await client.post("/api/v1/filtros_guardados", json=payload, headers=auth_headers)
    filtro_id = response.json()["data"]["id"]

    # Try to access as different user
    response = await client.get(f"/api/v1/filtros_guardados/{filtro_id}", headers=other_auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_filtro_guardado(client: AsyncClient, auth_headers: dict):
    """Test updating a filtro guardado."""
    # Create
    payload = {
        "nombre": "Original Name",
        "modulo": "vulnerabilities",
        "parametros": {"test": "value"},
    }
    response = await client.post("/api/v1/filtros_guardados", json=payload, headers=auth_headers)
    filtro_id = response.json()["data"]["id"]
    
    # Update
    update_payload = {
        "nombre": "Updated Name",
        "parametros": {"test": "updated_value", "new_field": "new"},
    }
    response = await client.patch(
        f"/api/v1/filtros_guardados/{filtro_id}",
        json=update_payload,
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["nombre"] == "Updated Name"
    assert data["parametros"]["new_field"] == "new"
