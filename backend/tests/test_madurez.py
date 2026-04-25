"""E2 — Madurez."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_madurez_summary(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/v1/madurez/summary", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()["data"]
    assert "score" in d
    assert "counts" in d
    assert d["max"] == 100.0


@pytest.mark.asyncio
async def test_madurez_export_csv(client: AsyncClient, auth_headers: dict):
    r = await client.get("/api/v1/madurez/export.csv", headers=auth_headers)
    assert r.status_code == 200
    assert "score" in r.text
    assert "vulnerabilidades_total" in r.text
