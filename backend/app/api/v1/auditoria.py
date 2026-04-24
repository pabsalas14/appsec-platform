"""Auditoria CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.user import User
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaCreate, AuditoriaRead, AuditoriaUpdate
from app.services.auditoria_service import auditoria_svc

router = APIRouter()


@router.get("")
async def list_auditorias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List auditorias owned by the current user."""
    items = await auditoria_svc.list(db, filters={"user_id": current_user.id})
    return success([AuditoriaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_auditoria(
    entity: Auditoria = Depends(require_ownership(auditoria_svc)),
):
    """Get a single owned auditoria by ID (404 if not owned)."""
    return success(AuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_auditoria(
    entity_in: AuditoriaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new auditoria for the current user."""
    entity = await auditoria_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(AuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_auditoria(
    entity_in: AuditoriaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Auditoria = Depends(require_ownership(auditoria_svc)),
):
    """Partially update an owned auditoria (404 if not owned)."""
    updated = await auditoria_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(AuditoriaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_auditoria(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: Auditoria = Depends(require_ownership(auditoria_svc)),
):
    """Delete an owned auditoria (404 if not owned)."""
    await auditoria_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Auditoria deleted"})
