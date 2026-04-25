"""EjecucionMAST CRUD endpoints — MAST execution (Módulo 4)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.ejecucion_mast import EjecucionMAST
from app.models.user import User
from app.schemas.ejecucion_mast import EjecucionMASTCreate, EjecucionMASTRead, EjecucionMASTUpdate
from app.services.ejecucion_mast_service import ejecucion_mast_svc

router = APIRouter()


@router.get("")
async def list_ejecucion_masts(
    aplicacion_movil_id: UUID | None = Query(None, description="Filter by aplicacion_movil_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List ejecuciones MAST owned by the current user, optionally filtered by aplicacion móvil."""
    filters: dict = {"user_id": current_user.id}
    if aplicacion_movil_id is not None:
        filters["aplicacion_movil_id"] = aplicacion_movil_id
    items = await ejecucion_mast_svc.list(db, filters=filters)
    return success([EjecucionMASTRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_ejecucion_mast(
    entity: EjecucionMAST = Depends(require_ownership(ejecucion_mast_svc)),
):
    """Get a single owned ejecucion_mast by ID (404 if not owned)."""
    return success(EjecucionMASTRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_ejecucion_mast(
    entity_in: EjecucionMASTCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new ejecucion_mast for the current user."""
    entity = await ejecucion_mast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(EjecucionMASTRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_ejecucion_mast(
    entity_in: EjecucionMASTUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EjecucionMAST = Depends(require_ownership(ejecucion_mast_svc)),
):
    """Partially update an owned ejecucion_mast (404 if not owned)."""
    updated = await ejecucion_mast_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(EjecucionMASTRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_ejecucion_mast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EjecucionMAST = Depends(require_ownership(ejecucion_mast_svc)),
):
    """Delete an owned ejecucion_mast (404 if not owned)."""
    await ejecucion_mast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "EjecucionMAST deleted"})
