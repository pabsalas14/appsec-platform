"""G2 — Reglas de notificación."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_procesar_reglas_requires_backoffice(client: AsyncClient, auth_headers: dict):
    r = await client.post("/api/v1/notificacions/procesar-reglas", headers=auth_headers)
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_procesar_reglas_admin_ok(client: AsyncClient, admin_auth_headers: dict):
    r = await client.post("/api/v1/notificacions/procesar-reglas", headers=admin_auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "success"
    d = r.json()["data"]
    assert "sla_riesgo_creadas" in d
    assert "tema_estancado_creadas" in d
    assert "vulnerabilidad_inactiva_creadas" in d
    assert "iniciativa_vencida_creadas" in d
    assert "plan_remediacion_vencido_creadas" in d
