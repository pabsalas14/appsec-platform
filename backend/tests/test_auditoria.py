"""Smoke + export (A7) — auditorías internas (Módulo 6)."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/auditorias"

SAMPLE = {
    "titulo": "Auditoria interna Q1",
    "tipo": "interna",
    "alcance": "Aplicaciones de pagos y APIs expuestas.",
    "fecha_inicio": "2026-01-10T00:00:00+00:00",
    "fecha_fin": "2026-02-10T00:00:00+00:00",
    "estado": "En curso",
}


@pytest.mark.asyncio
async def test_create_and_list_auditoria(client: AsyncClient, auth_headers: dict):
    c = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert c.status_code == 201, c.text
    r = await client.get(BASE_URL, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) >= 1
    assert data[0]["titulo"] == SAMPLE["titulo"]


@pytest.mark.asyncio
async def test_auditoria_export_forbidden_user(client: AsyncClient, readonly_auth_headers: dict[str, str]):
    r = await client.get(f"{BASE_URL}/export.csv", headers=readonly_auth_headers)
    assert r.status_code == 403
    assert "audits.export" in r.text


@pytest.mark.asyncio
async def test_auditoria_export_csv_admin(client: AsyncClient, admin_auth_headers: dict):
    await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE)
    r = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    assert "titulo" in r.text.lower() or "Auditoria interna" in r.text
