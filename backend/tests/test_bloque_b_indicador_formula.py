"""Tests for IndicadorFormula — Bloque B, Fase 15."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_indicador_formula(client: AsyncClient, auth_headers: dict):
    """Test creating a new indicador formula."""
    payload = {
        "code": "XXX-001",
        "nombre": "Vulnerabilidades Críticas Identificadas",
        "motor": "multi",
        "formula": {"type": "count", "entity": "hallazgo", "filters": [{"field": "severidad", "value": "CRITICA"}]},
        "sla_config": {"CRITICA": 7, "ALTA": 30, "MEDIA": 60, "BAJA": 90},
        "threshold_green": 5,
        "threshold_yellow": 10,
        "threshold_red": 0,
        "periodicidad": "monthly",
    }
    response = await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["data"]["code"] == "XXX-001"


@pytest.mark.asyncio
async def test_list_indicador_formulas(client: AsyncClient, auth_headers: dict):
    """Test listing indicador formulas."""
    response = await client.get("/api/v1/indicadores_formulas", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert isinstance(data["data"], list)


@pytest.mark.asyncio
async def test_indicador_formula_json_formula(client: AsyncClient, auth_headers: dict):
    """Test that indicador formula stores complex JSON formula."""
    complex_formula = {
        "type": "aggregate",
        "aggregation": "sum",
        "items": [
            {"type": "count", "entity": "hallazgo", "filters": [{"field": "severidad", "value": "CRITICA"}]},
            {"type": "count", "entity": "hallazgo", "filters": [{"field": "severidad", "value": "ALTA"}]}
        ]
    }
    payload = {
        "code": "KRI0025",
        "nombre": "Control Deficiente Score",
        "motor": "multi",
        "formula": complex_formula,
        "sla_config": {"DEFAULT": 30},
        "periodicidad": "quarterly",
    }
    response = await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["formula"] == complex_formula


@pytest.mark.asyncio
async def test_indicador_formula_thresholds(client: AsyncClient, auth_headers: dict):
    """Test that indicador formula stores thresholds for semaphore."""
    payload = {
        "code": "XXX-002",
        "nombre": "Test Indicator",
        "motor": "SAST",
        "formula": {"type": "count"},
        "threshold_green": 0,
        "threshold_yellow": 50,
        "threshold_red": 100,
        "periodicidad": "monthly",
    }
    response = await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["threshold_green"] == 0
    assert data["threshold_yellow"] == 50
    assert data["threshold_red"] == 100


@pytest.mark.asyncio
async def test_idor_protection_indicador_formula(client: AsyncClient, auth_headers: dict, other_auth_headers: dict):
    """Test IDOR protection for indicador formula."""
    payload = {
        "code": "TEST-001",
        "nombre": "Test Indicator",
        "motor": "DAST",
        "formula": {"type": "count"},
        "periodicidad": "monthly",
    }
    response = await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    formula_id = response.json()["data"]["id"]

    # Try to access as different user
    response = await client.get(f"/api/v1/indicadores_formulas/{formula_id}", headers=other_auth_headers)
    assert response.status_code == 404
