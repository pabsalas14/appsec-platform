"""Smoke tests — task CRUD endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_tasks_empty(client: AsyncClient, auth_headers: dict):
    """GET /api/v1/tasks/ should return empty list initially."""
    resp = await client.get("/api/v1/tasks", headers=auth_headers)
    assert resp.status_code == 200

    body = resp.json()
    assert body["status"] == "success"
    assert body["data"] == []


@pytest.mark.asyncio
async def test_create_task(client: AsyncClient, auth_headers: dict):
    """POST /api/v1/tasks/ should create a new task."""
    resp = await client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Test Task",
        "description": "A test task",
        "completed": False,
    })
    assert resp.status_code == 201

    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["title"] == "Test Task"
    assert body["data"]["completed"] is False
    assert "id" in body["data"]
    assert "user_id" in body["data"]
    assert "created_at" in body["data"]


@pytest.mark.asyncio
async def test_create_and_list_tasks(client: AsyncClient, auth_headers: dict):
    """Creating tasks should make them appear in the list."""
    # Create two tasks
    await client.post("/api/v1/tasks", headers=auth_headers, json={"title": "Task 1", "description": "", "completed": False})
    await client.post("/api/v1/tasks", headers=auth_headers, json={"title": "Task 2", "description": "", "completed": False})

    resp = await client.get("/api/v1/tasks", headers=auth_headers)
    assert resp.status_code == 200

    body = resp.json()
    assert len(body["data"]) == 2
    titles = {t["title"] for t in body["data"]}
    assert titles == {"Task 1", "Task 2"}


@pytest.mark.asyncio
async def test_get_task(client: AsyncClient, auth_headers: dict):
    """GET /api/v1/tasks/{id} should return the specific task."""
    # Create
    create_resp = await client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Single Task",
        "description": "Details",
        "completed": False,
    })
    task_id = create_resp.json()["data"]["id"]

    # Get
    resp = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["title"] == "Single Task"


@pytest.mark.asyncio
async def test_get_task_not_found(client: AsyncClient, auth_headers: dict):
    """GET /api/v1/tasks/{nonexistent} should return 404."""
    from uuid import uuid4
    resp = await client.get(f"/api/v1/tasks/{uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_task(client: AsyncClient, auth_headers: dict):
    """PATCH /api/v1/tasks/{id} should partially update the task."""
    # Create
    create_resp = await client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Original Title",
        "description": "",
        "completed": False,
    })
    task_id = create_resp.json()["data"]["id"]

    # Update title only
    resp = await client.patch(f"/api/v1/tasks/{task_id}", headers=auth_headers, json={
        "title": "Updated Title",
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["title"] == "Updated Title"
    assert resp.json()["data"]["completed"] is False  # unchanged


@pytest.mark.asyncio
async def test_toggle_task_completed(client: AsyncClient, auth_headers: dict):
    """PATCH completed flag should toggle task status."""
    create_resp = await client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Toggle Me",
        "description": "",
        "completed": False,
    })
    task_id = create_resp.json()["data"]["id"]

    # Toggle to completed
    resp = await client.patch(f"/api/v1/tasks/{task_id}", headers=auth_headers, json={
        "completed": True,
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["completed"] is True


@pytest.mark.asyncio
async def test_delete_task(client: AsyncClient, auth_headers: dict):
    """DELETE /api/v1/tasks/{id} should remove the task."""
    # Create
    create_resp = await client.post("/api/v1/tasks", headers=auth_headers, json={
        "title": "Delete Me",
        "description": "",
        "completed": False,
    })
    task_id = create_resp.json()["data"]["id"]

    # Delete
    resp = await client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["data"] is None

    # Verify gone
    get_resp = await client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_task_not_found(client: AsyncClient, auth_headers: dict):
    """DELETE /api/v1/tasks/{nonexistent} should return 404."""
    from uuid import uuid4
    resp = await client.delete(f"/api/v1/tasks/{uuid4()}", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_tasks_require_auth(client: AsyncClient):
    """All task endpoints should return 401 without auth."""
    from uuid import uuid4

    assert (await client.get("/api/v1/tasks")).status_code == 401
    assert (await client.post("/api/v1/tasks", json={"title": "x", "description": "", "completed": False})).status_code == 401
    assert (await client.get(f"/api/v1/tasks/{uuid4()}")).status_code == 401
    assert (await client.patch(f"/api/v1/tasks/{uuid4()}", json={"title": "x"})).status_code == 401
    assert (await client.delete(f"/api/v1/tasks/{uuid4()}")).status_code == 401
