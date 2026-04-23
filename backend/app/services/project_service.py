"""Project service — async CRUD with enforced per-user ownership."""

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.base import BaseService

project_svc = BaseService[Project, ProjectCreate, ProjectUpdate](
    Project,
    owner_field="user_id",
    audit_action_prefix="project",
)
