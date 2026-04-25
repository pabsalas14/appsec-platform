"""E1 — Motor de evaluación de indicadores."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_evaluate_indicador_formula_by_id(client: AsyncClient, auth_headers: dict):
    payload = {
        "code": "EVAL-001",
        "nombre": "Test count",
        "motor": "multi",
        "formula": {"type": "count", "entity": "vulnerabilidad"},
        "periodicidad": "monthly",
    }
    r = await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    assert r.status_code == 201
    fid = r.json()["data"]["id"]
    r2 = await client.get(f"/api/v1/indicadores_formulas/{fid}/evaluate", headers=auth_headers)
    assert r2.status_code == 200
    body = r2.json()
    assert body["status"] == "success"
    assert "value" in body["data"]
    assert "status" in body["data"]


@pytest.mark.asyncio
async def test_calculate_indicador_by_code(client: AsyncClient, auth_headers: dict):
    payload = {
        "code": "EVAL-002",
        "nombre": "By code",
        "motor": "multi",
        "formula": {"type": "count", "entity": "vulnerabilidad"},
        "periodicidad": "monthly",
    }
    await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    r = await client.get("/api/v1/indicadores/EVAL-002/calculate", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()["data"]
    assert d["code"] == "EVAL-002"
    assert "value" in d
    assert "status" in d


@pytest.mark.asyncio
async def test_indicador_trend_y_aggregate(client: AsyncClient, auth_headers: dict):
    payload = {
        "code": "EVAL-TREND-1",
        "nombre": "trend",
        "motor": "multi",
        "formula": {"type": "count", "entity": "vulnerabilidad"},
        "periodicidad": "monthly",
    }
    await client.post("/api/v1/indicadores_formulas", json=payload, headers=auth_headers)
    rt = await client.get(
        "/api/v1/indicadores/EVAL-TREND-1/trend?days=3", headers=auth_headers
    )
    assert rt.status_code == 200
    assert "trend_7d" in rt.json()["data"]
    ra = await client.get(
        "/api/v1/indicadores/EVAL-TREND-1/aggregate", headers=auth_headers
    )
    assert ra.status_code == 200
    assert "value" in ra.json()["data"]
