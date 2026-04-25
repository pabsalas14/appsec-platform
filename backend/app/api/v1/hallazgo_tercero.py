"""HallazgoTercero CRUD endpoints (Módulo 8 — Operación)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hallazgo_tercero import HallazgoTercero
from app.models.user import User
from app.schemas.hallazgo_tercero import (
    HallazgoTerceroCreate,
    HallazgoTerceroRead,
    HallazgoTerceroUpdate,
)
from app.services.hallazgo_tercero_service import hallazgo_tercero_svc

router = APIRouter()


@router.get("")
async def list_hallazgo_terceros(
    revision_tercero_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista hallazgos de tercero. Filtrar por ?revision_tercero_id=<uuid>."""
    filters: dict = {"user_id": current_user.id}
    if revision_tercero_id:
        filters["revision_tercero_id"] = revision_tercero_id
    items = await hallazgo_tercero_svc.list(db, filters=filters)
    return success(
        [HallazgoTerceroRead.model_validate(x).model_dump(mode="json") for x in items]
    )


@router.get("/{id}")
async def get_hallazgo_tercero(
    entity: HallazgoTercero = Depends(require_ownership(hallazgo_tercero_svc)),
):
    return success(HallazgoTerceroRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_tercero(
    entity_in: HallazgoTerceroCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await hallazgo_tercero_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(HallazgoTerceroRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_tercero(
    entity_in: HallazgoTerceroUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoTercero = Depends(require_ownership(hallazgo_tercero_svc)),
):
    updated = await hallazgo_tercero_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(HallazgoTerceroRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_tercero(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoTercero = Depends(require_ownership(hallazgo_tercero_svc)),
):
    await hallazgo_tercero_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "HallazgoTercero eliminado"})
