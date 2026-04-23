"""
Tests for the persistent audit log (ADR-0007).

Covers:
- ``BaseService`` with ``audit_action_prefix`` writes one row per
  ``create`` / ``update`` / ``delete``.
- Each row carries ``actor_user_id``, ``entity_type`` and a ``request_id``
  that matches the ``X-Request-ID`` echoed on the response.
- Listing is admin-only: non-admin users get 403.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from app.models.audit_log import AuditLog


@pytest.mark.asyncio
async def test_task_crud_creates_three_audit_entries(
    client: AsyncClient,
    auth_headers: dict[str, str],
    _session_factory: async_sessionmaker[AsyncSession],
):
    """A full create → update → delete cycle writes 3 audit rows for tasks."""
    # Create
    resp = await client.post(
        "/api/v1/tasks",
        headers={**auth_headers, "X-Request-ID": "rid-test-create"},
        json={"title": "audited", "description": "x", "completed": False},
    )
    assert resp.status_code == 201, resp.text
    task_id = resp.json()["data"]["id"]

    # Update
    resp = await client.patch(
        f"/api/v1/tasks/{task_id}",
        headers={**auth_headers, "X-Request-ID": "rid-test-update"},
        json={"completed": True},
    )
    assert resp.status_code == 200

    # Delete
    resp = await client.delete(
        f"/api/v1/tasks/{task_id}",
        headers={**auth_headers, "X-Request-ID": "rid-test-delete"},
    )
    assert resp.status_code == 200

    async with _session_factory() as session:
        rows = (
            await session.execute(
                select(AuditLog)
                .where(AuditLog.entity_id == task_id)
                .order_by(AuditLog.ts.asc())
            )
        ).scalars().all()

    actions = [r.action for r in rows]
    assert actions == ["task.create", "task.update", "task.delete"], actions

    assert all(r.actor_user_id is not None for r in rows)
    assert all(r.entity_type == "tasks" for r in rows)
    rids = [r.request_id for r in rows]
    assert rids == ["rid-test-create", "rid-test-update", "rid-test-delete"]


@pytest.mark.asyncio
async def test_audit_log_list_requires_admin(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.get("/api/v1/audit-logs", headers=auth_headers)
    assert resp.status_code == 403
    body = resp.json()
    assert body["status"] == "error"


@pytest.mark.asyncio
async def test_audit_log_list_works_for_admin(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    auth_headers: dict[str, str],
):
    # Make sure there is at least one audit entry to read.
    await client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "admin-sees-me", "description": "", "completed": False},
    )

    resp = await client.get("/api/v1/audit-logs", headers=admin_auth_headers)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "success"
    assert "pagination" in body
    assert isinstance(body["data"], list)
    assert any(entry["action"] == "task.create" for entry in body["data"])


@pytest.mark.asyncio
async def test_audit_log_filter_by_action(
    client: AsyncClient,
    admin_auth_headers: dict[str, str],
    auth_headers: dict[str, str],
):
    created = await client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"title": "filtered", "description": "", "completed": False},
    )
    task_id = created.json()["data"]["id"]
    await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)

    resp = await client.get(
        "/api/v1/audit-logs",
        headers=admin_auth_headers,
        params={"action": "task.delete"},
    )
    assert resp.status_code == 200
    rows = resp.json()["data"]
    assert rows, "expected at least one task.delete row"
    assert all(r["action"] == "task.delete" for r in rows)
