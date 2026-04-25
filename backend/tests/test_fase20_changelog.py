"""
Fase 20 — ChangelogEntrada Tests.

Tests:
1. super_admin can create a changelog entry
2. Regular user cannot create (403)
3. Published entries visible to all authenticated users
4. Unpublished entries hidden from regular users
5. super_admin can update (publish/unpublish)
6. super_admin can delete
7. tipo validation rejects invalid values
"""

import pytest
from httpx import AsyncClient

CHANGELOG_URL = "/api/v1/changelog_entradas"

VALID_ENTRY = {
    "version": "1.0.0",
    "titulo": "Initial Release",
    "descripcion": "First stable version of the AppSec Platform",
    "tipo": "feature",
    "publicado": True,
}


@pytest.mark.asyncio
async def test_admin_can_create_changelog(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """super_admin/admin can create changelog entries."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    resp = await client.post(
        CHANGELOG_URL,
        json=VALID_ENTRY,
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()["data"]
    assert data["version"] == "1.0.0"
    assert data["titulo"] == "Initial Release"
    assert data["tipo"] == "feature"
    assert data["publicado"] is True


@pytest.mark.asyncio
async def test_regular_user_cannot_create_changelog(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Regular user should get 403 trying to create a changelog entry."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    resp = await client.post(
        CHANGELOG_URL,
        json=VALID_ENTRY,
        headers={**auth_headers, **csrf},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_published_entries_visible_to_all(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    auth_headers: dict[str, str],
):
    """Published entries should be visible to any authenticated user."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    # Admin creates published entry
    resp = await client.post(
        CHANGELOG_URL,
        json=VALID_ENTRY,
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 201

    # Regular user can list published entries
    resp = await client.get(CHANGELOG_URL, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data) >= 1
    assert data[0]["publicado"] is True


@pytest.mark.asyncio
async def test_draft_entries_hidden_from_regular_list(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    auth_headers: dict[str, str],
):
    """Unpublished (draft) entries should NOT appear in the regular list."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    draft = {**VALID_ENTRY, "publicado": False, "titulo": "Draft Entry"}
    resp = await client.post(
        CHANGELOG_URL,
        json=draft,
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 201

    # Regular user should not see drafts
    resp = await client.get(CHANGELOG_URL, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()["data"]
    titles = [e["titulo"] for e in data]
    assert "Draft Entry" not in titles


@pytest.mark.asyncio
async def test_admin_can_update_changelog(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """Admin can update (e.g. publish/unpublish) a changelog entry."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    resp = await client.post(
        CHANGELOG_URL,
        json={**VALID_ENTRY, "publicado": False},
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 201
    entry_id = resp.json()["data"]["id"]

    # Publish it
    resp = await client.patch(
        f"{CHANGELOG_URL}/{entry_id}",
        json={"publicado": True},
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["publicado"] is True


@pytest.mark.asyncio
async def test_admin_can_delete_changelog(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """Admin can delete a changelog entry."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    resp = await client.post(
        CHANGELOG_URL,
        json=VALID_ENTRY,
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 201
    entry_id = resp.json()["data"]["id"]

    resp = await client.delete(
        f"{CHANGELOG_URL}/{entry_id}",
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_invalid_tipo_rejected(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
):
    """Invalid tipo should be rejected by Pydantic validation."""
    csrf = {"X-CSRF-Token": client.cookies.get("csrf_token", "")}
    bad_entry = {**VALID_ENTRY, "tipo": "invalid_type"}
    resp = await client.post(
        CHANGELOG_URL,
        json=bad_entry,
        headers={**admin_auth_headers, **csrf},
    )
    assert resp.status_code == 422
