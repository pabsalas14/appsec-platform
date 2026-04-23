"""Project CRUD endpoints — second owned-entity demo (relation target for Task)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.services.project_service import project_svc

router = APIRouter()


@router.get("")
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List projects owned by the current user."""
    items = await project_svc.list(db, filters={"user_id": current_user.id})
    return success(
        [ProjectRead.model_validate(x).model_dump(mode="json") for x in items]
    )


@router.get("/{id}")
async def get_project(
    entity: Project = Depends(require_ownership(project_svc)),
):
    """Get a single owned project by ID (404 if not owned)."""
    return success(ProjectRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_project(
    entity_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project for the current user."""
    entity = await project_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(ProjectRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_project(
    entity_in: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Project = Depends(require_ownership(project_svc)),
):
    """Partially update an owned project (404 if not owned)."""
    updated = await project_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(ProjectRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_project(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Project = Depends(require_ownership(project_svc)),
):
    """Delete an owned project (404 if not owned)."""
    await project_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Project deleted"})
