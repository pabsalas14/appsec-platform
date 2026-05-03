"""Tests for granular widget-level permissions."""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_widget_permissions_unauthenticated(client: AsyncClient):
    """Permission endpoints require authentication."""
    r = await client.get(f"/api/v1/admin/query-builder/widgets/{uuid4()}/permissions")
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_set_widget_permissions_unauthenticated(client: AsyncClient):
    """PUT permissions requires authentication."""
    payload = {"visibility": "public", "shared_with_roles": [], "shared_with_user_ids": []}
    r = await client.put(
        f"/api/v1/admin/query-builder/widgets/{uuid4()}/permissions",
        json=payload,
    )
    assert r.status_code in (401, 403)


@pytest.mark.asyncio
async def test_get_widget_permissions_not_found(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Non-existent widget returns 404."""
    r = await client.get(
        f"/api/v1/admin/query-builder/widgets/{uuid4()}/permissions",
        headers=admin_auth_headers,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_set_widget_permissions_not_found(client: AsyncClient, admin_auth_headers: dict[str, str]):
    """Setting permissions on a non-existent widget returns 404."""
    payload = {
        "visibility": "shared",
        "shared_with_roles": ["analyst"],
        "shared_with_user_ids": [],
        "can_edit_roles": [],
        "can_edit_user_ids": [],
    }
    r = await client.put(
        f"/api/v1/admin/query-builder/widgets/{uuid4()}/permissions",
        json=payload,
        headers=admin_auth_headers,
    )
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_widget_permissions_schema_valid():
    """WidgetPermissions schema validates correctly."""
    from app.schemas.saved_widget import WidgetPermissions

    p = WidgetPermissions(
        visibility="shared",
        shared_with_roles=["admin", "analyst"],
        shared_with_user_ids=[],
        can_edit_roles=[],
        can_edit_user_ids=[],
    )
    assert p.visibility == "shared"
    assert "admin" in p.shared_with_roles


@pytest.mark.asyncio
async def test_widget_permissions_default_private():
    """Default visibility is private."""
    from app.schemas.saved_widget import WidgetPermissions

    p = WidgetPermissions()
    assert p.visibility == "private"
    assert p.shared_with_roles == []
    assert p.shared_with_user_ids == []


@pytest.mark.asyncio
async def test_widget_permissions_invalid_visibility():
    """Invalid visibility value is rejected."""
    from pydantic import ValidationError

    from app.schemas.saved_widget import WidgetPermissions

    with pytest.raises(ValidationError):
        WidgetPermissions(visibility="world")  # type: ignore[arg-type]
