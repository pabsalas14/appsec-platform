"""HallazgoAuditoria CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hallazgo_auditoria import HallazgoAuditoria
from app.models.user import User
from app.schemas.hallazgo_auditoria import HallazgoAuditoriaCreate, HallazgoAuditoriaRead, HallazgoAuditoriaUpdate
from app.services.auditoria_cierre import try_autocerrar_auditoria
from app.services.hallazgo_auditoria_service import hallazgo_auditoria_svc

router = APIRouter()


@router.get("")
async def list_hallazgo_auditorias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List hallazgo auditorias owned by the current user."""
    items = await hallazgo_auditoria_svc.list(db, filters={"user_id": current_user.id})
    return success([HallazgoAuditoriaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_hallazgo_auditoria(
    entity: HallazgoAuditoria = Depends(require_ownership(hallazgo_auditoria_svc)),
):
    """Get a single owned hallazgo auditoria by ID (404 if not owned)."""
    return success(HallazgoAuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_auditoria(
    entity_in: HallazgoAuditoriaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hallazgo auditoria for the current user."""
    entity = await hallazgo_auditoria_svc.create(db, entity_in, extra={"user_id": current_user.id})
    await try_autocerrar_auditoria(db, auditoria_id=entity.auditoria_id)
    return success(HallazgoAuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_auditoria(
    entity_in: HallazgoAuditoriaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoAuditoria = Depends(require_ownership(hallazgo_auditoria_svc)),
):
    """Partially update an owned hallazgo auditoria (404 if not owned)."""
    updated = await hallazgo_auditoria_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    if updated:
        await try_autocerrar_auditoria(db, auditoria_id=updated.auditoria_id)
    return success(HallazgoAuditoriaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_auditoria(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoAuditoria = Depends(require_ownership(hallazgo_auditoria_svc)),
):
    """Delete an owned hallazgo auditoria (404 if not owned)."""
    aid = entity.auditoria_id
    await hallazgo_auditoria_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    await try_autocerrar_auditoria(db, auditoria_id=aid)
    return success(None, meta={"message": "HallazgoAuditoria deleted"})
