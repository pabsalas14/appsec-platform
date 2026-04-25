"""Smoke tests for ChangelogEntrada — mutations require admin; list is authenticated read."""

from uuid import uuid4

import pytest
from httpx import AsyncClient

BASE_URL = "/api/v1/changelog_entradas"

VALID_PAYLOAD = {
    "version": "0.9.0",
    "titulo": "Test entry",
    "descripcion": "Desc",
    "tipo": "feature",
    "publicado": False,
}


@pytest.mark.asyncio
async def test_create_changelog_entrada(client: AsyncClient, admin_auth_headers: dict):
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    resp = await client.post(
        BASE_URL,
        headers={**admin_auth_headers, **csrf},
        json=VALID_PAYLOAD,
    )
    assert resp.status_code == 201, resp.text
    assert resp.json()["status"] == "success"


@pytest.mark.asyncio
async def test_list_changelog_entradas_empty(client: AsyncClient, auth_headers: dict):
    resp = await client.get(BASE_URL, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_changelog_entrada_requires_auth(client: AsyncClient):
    assert (await client.get(BASE_URL)).status_code == 401
    assert (await client.get(f"{BASE_URL}/{uuid4()}")).status_code == 401


@pytest.mark.asyncio
async def test_non_admin_cannot_create_changelog_entrada(client: AsyncClient, auth_headers: dict):
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    resp = await client.post(
        BASE_URL,
        headers={**auth_headers, **csrf},
        json=VALID_PAYLOAD,
    )
    assert resp.status_code == 403
