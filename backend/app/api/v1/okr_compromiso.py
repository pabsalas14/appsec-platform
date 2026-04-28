"""OkrCompromiso CRUD endpoints with weight consistency rules."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.okr_compromiso import OkrCompromiso
from app.models.user import User
from app.schemas.okr_compromiso import OkrCompromisoCreate, OkrCompromisoRead, OkrCompromisoUpdate
from app.services.okr_compromiso_service import okr_compromiso_svc

router = APIRouter()


@router.get("")
async def list_okr_compromisos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List okr_compromisos owned by the current user."""
    items = await okr_compromiso_svc.list(db, filters={"user_id": current_user.id})
    return success([OkrCompromisoRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_okr_compromiso(
    entity: OkrCompromiso = Depends(require_ownership(okr_compromiso_svc)),
):
    """Get a single owned okr_compromiso by ID (404 if not owned)."""
    return success(OkrCompromisoRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_okr_compromiso(
    entity_in: OkrCompromisoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new okr_compromiso for the current user."""
    current_total = (
        await db.execute(
            select(func.coalesce(func.sum(OkrCompromiso.peso_global), 0)).where(
                OkrCompromiso.plan_id == entity_in.plan_id,
                OkrCompromiso.deleted_at.is_(None),
            )
        )
    ).scalar_one()
    if int(current_total) + int(entity_in.peso_global) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La suma de peso_global por plan no puede exceder 100",
        )

    entity = await okr_compromiso_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(OkrCompromisoRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_okr_compromiso(
    entity_in: OkrCompromisoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: OkrCompromiso = Depends(require_ownership(okr_compromiso_svc)),
):
    """Partially update an owned okr_compromiso (404 if not owned)."""
    updated = await okr_compromiso_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(OkrCompromisoRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_okr_compromiso(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: OkrCompromiso = Depends(require_ownership(okr_compromiso_svc)),
):
    """Delete an owned okr_compromiso (404 if not owned)."""
    await okr_compromiso_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "OkrCompromiso deleted"})
