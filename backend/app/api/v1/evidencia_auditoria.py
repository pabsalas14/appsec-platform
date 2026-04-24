"""EvidenciaAuditoria CRUD endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.user import User
from app.models.evidencia_auditoria import EvidenciaAuditoria
from app.schemas.evidencia_auditoria import EvidenciaAuditoriaCreate, EvidenciaAuditoriaRead, EvidenciaAuditoriaUpdate
from app.services.evidencia_auditoria_service import evidencia_auditoria_svc

router = APIRouter()


@router.get("")
async def list_evidencia_auditorias(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List evidencia auditorias owned by the current user."""
    items = await evidencia_auditoria_svc.list(db, filters={"user_id": current_user.id})
    return success([EvidenciaAuditoriaRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_evidencia_auditoria(
    entity: EvidenciaAuditoria = Depends(require_ownership(evidencia_auditoria_svc)),
):
    """Get a single owned evidencia auditoria by ID (404 if not owned)."""
    return success(EvidenciaAuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_evidencia_auditoria(
    entity_in: EvidenciaAuditoriaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new evidencia auditoria for the current user."""
    entity = await evidencia_auditoria_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(EvidenciaAuditoriaRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_evidencia_auditoria(
    entity_in: EvidenciaAuditoriaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EvidenciaAuditoria = Depends(require_ownership(evidencia_auditoria_svc)),
):
    """Partially update an owned evidencia auditoria (404 if not owned)."""
    updated = await evidencia_auditoria_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(EvidenciaAuditoriaRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_evidencia_auditoria(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EvidenciaAuditoria = Depends(require_ownership(evidencia_auditoria_svc)),
):
    """Delete an owned evidencia auditoria (404 if not owned)."""
    await evidencia_auditoria_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "EvidenciaAuditoria deleted"})
