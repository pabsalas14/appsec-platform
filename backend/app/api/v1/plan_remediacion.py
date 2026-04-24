"""PlanRemediacion CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.user import User
from app.models.plan_remediacion import PlanRemediacion
from app.schemas.plan_remediacion import PlanRemediacionCreate, PlanRemediacionRead, PlanRemediacionUpdate
from app.services.plan_remediacion_service import plan_remediacion_svc

router = APIRouter()


@router.get("")
async def list_plan_remediaciones(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List plan remediaciones owned by the current user."""
    items = await plan_remediacion_svc.list(db, filters={"user_id": current_user.id})
    return success([PlanRemediacionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_plan_remediacion(
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Get a single owned plan remediacion by ID (404 if not owned)."""
    return success(PlanRemediacionRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_plan_remediacion(
    entity_in: PlanRemediacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new plan remediacion for the current user."""
    entity = await plan_remediacion_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(PlanRemediacionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_plan_remediacion(
    entity_in: PlanRemediacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Partially update an owned plan remediacion (404 if not owned)."""
    updated = await plan_remediacion_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(PlanRemediacionRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_plan_remediacion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PlanRemediacion = Depends(require_ownership(plan_remediacion_svc)),
):
    """Delete an owned plan remediacion (404 if not owned)."""
    await plan_remediacion_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "PlanRemediacion deleted"})
