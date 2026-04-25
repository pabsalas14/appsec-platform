"""Smoke + export (A7) para temas emergentes — Módulo 7."""

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/temas_emergentes"

SAMPLE = {
    "titulo": "Tema de prueba",
    "descripcion": "Descripcion larga suficiente para el validador mínimo.",
    "tipo": "tecnologico",
    "impacto": "alto",
    "estado": "abierto",
    "fuente": "internal",
}


@pytest.mark.asyncio
async def test_create_tema_emergente(client: AsyncClient, auth_headers: dict):
    resp = await client.post(BASE_URL, headers=auth_headers, json=SAMPLE)
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_temas_emergentes_export_forbidden_user(client: AsyncClient, readonly_auth_headers: dict[str, str]):
    resp = await client.get(f"{BASE_URL}/export.csv", headers=readonly_auth_headers)
    assert resp.status_code == 403
    assert "emerging_themes.export" in resp.text


@pytest.mark.asyncio
async def test_temas_emergentes_export_csv_admin(client: AsyncClient, admin_auth_headers: dict):
    await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE)
    r = await client.get(f"{BASE_URL}/export.csv", headers=admin_auth_headers)
    assert r.status_code == 200, r.text
    assert "titulo" in r.text
    assert SAMPLE["titulo"] in r.text
