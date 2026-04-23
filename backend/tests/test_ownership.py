"""
Framework-wide IDOR / ownership tests.

For every "owned" entity (``BaseService.owner_field != None``), a second user
must get 404 (not 200 / 403) when touching a resource that belongs to the
first user. This prevents enumeration and privilege escalation.

If you add a new owned entity, register it in ``OWNED_ENTITIES`` below.
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from httpx import AsyncClient


async def _create_task(client: AsyncClient, headers: dict[str, str]) -> str:
    resp = await client.post(
        "/api/v1/tasks",
        headers=headers,
        json={"title": "A owned", "description": "", "completed": False},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]["id"]


async def _create_project(client: AsyncClient, headers: dict[str, str]) -> str:
    resp = await client.post(
        "/api/v1/projects",
        headers=headers,
        json={"name": "A owned project", "description": "", "status": "active"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["data"]["id"]


OWNED_ENTITIES = [
    pytest.param(
        "tasks",
        _create_task,
        "/api/v1/tasks/{id}",
        id="tasks",
    ),
    pytest.param(
        "projects",
        _create_project,
        "/api/v1/projects/{id}",
        id="projects",
    ),
]


@pytest.mark.asyncio
@pytest.mark.parametrize("method", ["GET", "PATCH", "DELETE"])
@pytest.mark.parametrize("name, creator, path_tpl", OWNED_ENTITIES)
async def test_idor_returns_404_for_other_user(
    client: AsyncClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
    method: str,
    name: str,
    creator,
    path_tpl: str,
):
    """User B must not see/modify User A's resources — they should 404."""
    resource_id = await creator(client, auth_headers)
    url = path_tpl.format(id=resource_id)

    if method == "GET":
        resp = await client.get(url, headers=other_auth_headers)
    elif method == "PATCH":
        resp = await client.patch(url, headers=other_auth_headers, json={"title": "pwn"})
    else:
        resp = await client.delete(url, headers=other_auth_headers)

    assert resp.status_code == 404, (
        f"IDOR leak on {method} {url}: expected 404, got {resp.status_code} "
        f"({resp.text})"
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("name, creator, path_tpl", OWNED_ENTITIES)
async def test_list_is_scoped_to_user(
    client: AsyncClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
    name: str,
    creator,
    path_tpl: str,
):
    """User B must not see User A's resources in the list endpoint."""
    await creator(client, auth_headers)

    list_url = path_tpl.rsplit("/{id}", 1)[0]
    resp = await client.get(list_url, headers=other_auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] == []


@pytest.mark.asyncio
async def test_get_nonexistent_task_returns_404(
    client: AsyncClient, auth_headers: dict[str, str]
):
    resp = await client.get(f"/api/v1/tasks/{uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


def test_base_service_never_commits():
    """Static guard: BaseService CRUD must not invoke ``db.commit``.

    Transaction ownership is in ``get_db`` (see ADR-0003). If a service calls
    ``commit`` it breaks atomicity and can hide partial writes.
    """
    import inspect

    from app.services.base import BaseService

    for name in ("create", "update", "delete"):
        src = inspect.getsource(getattr(BaseService, name))
        assert "commit(" not in src, (
            f"BaseService.{name} must not call db.commit(); "
            f"get_db() owns the transaction."
        )
