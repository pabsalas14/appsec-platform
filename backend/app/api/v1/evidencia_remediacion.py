"""EvidenciaRemediacion endpoints — CRUD con integridad SHA-256 (A3)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.evidencia_remediacion import EvidenciaRemediacion
from app.models.user import User
from app.schemas.evidencia_remediacion import (
    EvidenciaRemediacionCreate,
    EvidenciaRemediacionRead,
    EvidenciaRemediacionUpdate,
)
from app.services.evidencia_remediacion_service import evidencia_remediacion_svc

router = APIRouter()


@router.get("")
async def list_evidencias(
    vulnerabilidad_id: UUID | None = Query(None, description="Filtrar por vulnerabilidad"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista evidencias de remediación. Puede filtrarse por vulnerabilidad_id."""
    filters: dict = {"user_id": current_user.id}
    if vulnerabilidad_id:
        filters["vulnerabilidad_id"] = vulnerabilidad_id
    items = await evidencia_remediacion_svc.list(db, filters=filters)
    return success([EvidenciaRemediacionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_evidencia(
    entity: EvidenciaRemediacion = Depends(require_ownership(evidencia_remediacion_svc)),
):
    """Obtiene una evidencia de remediación por ID."""
    return success(EvidenciaRemediacionRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_evidencia(
    entity_in: EvidenciaRemediacionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra una evidencia de remediación.

    El sha256 debe ser calculado por el cliente o pre-calculado al subir el archivo.
    Se almacena para verificación de integridad (A3).
    """
    entity = await evidencia_remediacion_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(EvidenciaRemediacionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_evidencia(
    entity_in: EvidenciaRemediacionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EvidenciaRemediacion = Depends(require_ownership(evidencia_remediacion_svc)),
):
    """Actualiza la descripción de una evidencia (el archivo y hash son inmutables)."""
    updated = await evidencia_remediacion_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(EvidenciaRemediacionRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_evidencia(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: EvidenciaRemediacion = Depends(require_ownership(evidencia_remediacion_svc)),
):
    """Soft-delete de una evidencia de remediación (A2)."""
    await evidencia_remediacion_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "EvidenciaRemediacion eliminada"})
