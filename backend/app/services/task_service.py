"""Task service — async CRUD with enforced per-user ownership."""

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.base import BaseService

task_svc = BaseService[Task, TaskCreate, TaskUpdate](
    Task,
    owner_field="user_id",
    audit_action_prefix="task",
)
