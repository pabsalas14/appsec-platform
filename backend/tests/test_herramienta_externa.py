"""Admin-only CRUD + A5/A7 tests for the herramienta_externa entity."""

from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from app.core.encryption import decrypt_string
from app.database import async_session

BASE_URL = "/api/v1/admin/herramientas-externas"

SAMPLE_PAYLOAD = {
    "nombre": "GitHub Enterprise",
    "tipo": "SAST",
    "url_base": "https://api.github.com",
    "api_token": "ghp_1234567890abcdef",
}


@pytest.mark.asyncio
async def test_create_and_mask_herramienta_externa(client: AsyncClient, admin_auth_headers: dict):
    # 1. Create integration as Admin
    resp = await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]

    assert data["nombre"] == SAMPLE_PAYLOAD["nombre"]
    # [A7] Data Masking Verification — API Token MUST be masked in response
    assert data["api_token"] == "********"

    # 2. Verify [A5] At-Rest Encryption deeply in database
    resource_id = data["id"]
    async with async_session() as db:
        stmt = text("SELECT api_token FROM herramienta_externas WHERE id = :id")
        result = await db.execute(stmt, {"id": resource_id})
        raw_db_value = result.scalar_one()

        # Raw value on disk MUST NOT be plaintext and MUST start with Fernet signature
        assert raw_db_value != SAMPLE_PAYLOAD["api_token"]
        assert raw_db_value.startswith("gAAAAA")
        assert decrypt_string(raw_db_value) == SAMPLE_PAYLOAD["api_token"]


@pytest.mark.asyncio
async def test_list_herramientas(client: AsyncClient, admin_auth_headers: dict):
    await client.post(BASE_URL, headers=admin_auth_headers, json=SAMPLE_PAYLOAD)
    resp = await client.get(BASE_URL, headers=admin_auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()["data"]) >= 1
    # Ensure items listed are masked too
    assert resp.json()["data"][0]["api_token"] == "********"


@pytest.mark.asyncio
async def test_herramienta_externa_requires_admin(client: AsyncClient, auth_headers: dict):
    # Standard user MUST be forbidden
    assert (await client.get(BASE_URL, headers=auth_headers)).status_code == 403
    assert (await client.post(BASE_URL, headers=auth_headers, json=SAMPLE_PAYLOAD)).status_code == 403
    assert (await client.delete(f"{BASE_URL}/{uuid4()}", headers=auth_headers)).status_code == 403

    # Unauthenticated MUST be unauthorized / forbidden
    assert (await client.get(BASE_URL)).status_code in [401, 403]
