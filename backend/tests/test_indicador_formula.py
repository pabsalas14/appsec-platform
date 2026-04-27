"""Tests for IndicadorFormula — KPI calculation formulas."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/indicador_formulas"

SAMPLE = {
    "code": "VULN_CLOSURE_RATE",
    "nombre": "Vulnerability Closure Rate",
    "motor": "sql",
    "formula": {
        "query": "SELECT COUNT(*) as cerradas FROM vulnerabilidad WHERE estado='cerrada'",
    },
    "periodicidad": "mensual",
    "threshold_green": 80,
    "threshold_yellow": 50,
    "threshold_red": 20,
}


@pytest.mark.asyncio
async def test_create_indicador_formula(client: AsyncClient, auth_headers: dict):
    """Test creating a KPI formula."""
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "success"
    assert data["data"]["code"] == "VULN_CLOSURE_RATE"


@pytest.mark.asyncio
async def test_list_indicador_formulas(client: AsyncClient, auth_headers: dict):
    """Test listing KPI formulas."""
    await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json()["data"], list)


@pytest.mark.asyncio
async def test_get_indicador_formula(client: AsyncClient, auth_headers: dict):
    """Test getting a specific KPI formula."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    formula_id = create_resp.json()["data"]["id"]

    resp = await client.get(f"{BASE_URL}/{formula_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["id"] == formula_id


@pytest.mark.asyncio
async def test_update_indicador_formula(client: AsyncClient, auth_headers: dict):
    """Test updating a KPI formula."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    formula_id = create_resp.json()["data"]["id"]

    update_payload = {
        "threshold_green": 85,
        "threshold_yellow": 55,
        "threshold_red": 25,
    }
    resp = await client.patch(f"{BASE_URL}/{formula_id}", headers=auth_headers, json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["data"]["threshold_green"] == 85


@pytest.mark.asyncio
async def test_delete_indicador_formula(client: AsyncClient, auth_headers: dict):
    """Test deleting a KPI formula (soft delete)."""
    create_resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    formula_id = create_resp.json()["data"]["id"]

    resp = await client.delete(f"{BASE_URL}/{formula_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = await client.get(f"{BASE_URL}/{formula_id}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_motor_values(client: AsyncClient, auth_headers: dict):
    """Test different motor values."""
    motores = ["sql", "python", "formula", "manual"]
    for motor in motores:
        payload = {**SAMPLE, "motor": motor, "code": f"KPI_{motor.upper()}"}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201


@pytest.mark.asyncio
async def test_periodicidad_values(client: AsyncClient, auth_headers: dict):
    """Test different periodicidad values."""
    periodicidades = ["diaria", "semanal", "mensual", "trimestral", "anual"]
    for periodicidad in periodicidades:
        payload = {**SAMPLE, "periodicidad": periodicidad, "code": f"KPI_{periodicidad}"}
        resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
        assert resp.status_code == 201


@pytest.mark.asyncio
async def test_threshold_ordering(client: AsyncClient, auth_headers: dict):
    """Test that threshold_green > threshold_yellow > threshold_red."""
    payload = {
        **SAMPLE,
        "threshold_green": 90,
        "threshold_yellow": 70,
        "threshold_red": 40,
        "code": "KPI_THRESHOLDS",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_complex_json_formula(client: AsyncClient, auth_headers: dict):
    """Test storing complex JSON formula."""
    complex_formula = {
        "query": "SELECT ...",
        "aggregation": "sum",
        "groupBy": ["celula", "organizacion"],
        "filters": {
            "severidad": ["CRITICA", "ALTA"],
            "estado": "Abierta",
        },
        "transformation": {
            "multiply": 100,
            "round": 2,
        },
    }
    payload = {
        **SAMPLE,
        "formula": complex_formula,
        "code": "KPI_COMPLEX",
    }
    resp = await client.post(BASE_URL, headers=auth_headers, json=payload)
    assert resp.status_code == 201
