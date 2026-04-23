"""Task CRUD endpoints — framework demo of owned entity pattern."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.task_service import task_svc

router = APIRouter()


@router.get("")
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    project_id: uuid.UUID | None = Query(
        default=None, description="Filter tasks by parent project"
    ),
):
    """List tasks for the current user, optionally filtered by project."""
    filters: dict = {"user_id": current_user.id}
    if project_id is not None:
        filters["project_id"] = project_id
    tasks = await task_svc.list(db, filters=filters)
    return success([TaskRead.model_validate(t).model_dump(mode="json") for t in tasks])


@router.get("/{id}")
async def get_task(
    task: Task = Depends(require_ownership(task_svc)),
):
    """Get a single owned task by ID (404 if not owned)."""
    return success(TaskRead.model_validate(task).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new task for the current user."""
    task = await task_svc.create(db, task_in, extra={"user_id": current_user.id})
    return success(TaskRead.model_validate(task).model_dump(mode="json"))


@router.patch("/{id}")
async def update_task(
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    task: Task = Depends(require_ownership(task_svc)),
):
    """Partially update an owned task (404 if not owned)."""
    updated = await task_svc.update(
        db, task.id, task_in, scope={"user_id": current_user.id}
    )
    return success(TaskRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_task(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    task: Task = Depends(require_ownership(task_svc)),
):
    """Delete an owned task (404 if not owned)."""
    await task_svc.delete(db, task.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Task deleted"})
