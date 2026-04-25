"""Smoke tests for self-service profile + password endpoints (ADR-0008)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_patch_me_updates_profile(client: AsyncClient, auth_headers: dict[str, str]):
    resp = await client.patch(
        "/api/v1/auth/me",
        headers=auth_headers,
        json={"full_name": "Jane Test", "email": "jane.renamed@example.com"},
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()["data"]
    assert data["full_name"] == "Jane Test"
    assert data["email"] == "jane.renamed@example.com"


@pytest.mark.asyncio
async def test_change_password_requires_current(client: AsyncClient, auth_headers: dict[str, str]):
    resp = await client.post(
        "/api/v1/auth/me/password",
        headers=auth_headers,
        json={"current_password": "nope", "new_password": "Newpass123"},
    )
    assert resp.status_code == 401

    resp = await client.post(
        "/api/v1/auth/me/password",
        headers=auth_headers,
        json={"current_password": "Testpass123", "new_password": "Newpass123"},
    )
    assert resp.status_code == 200, resp.text
