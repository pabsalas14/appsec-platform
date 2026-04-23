"""RevisionTercero CRUD endpoints (Módulo 8 — Operación)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.revision_tercero import RevisionTercero
from app.models.user import User
from app.schemas.revision_tercero import (
    RevisionTerceroCreate,
    RevisionTerceroRead,
    RevisionTerceroUpdate,
)
from app.services.revision_tercero_service import revision_tercero_svc

router = APIRouter()


@router.get("")
async def list_revision_terceros(
    servicio_id: Optional[UUID] = Query(default=None),
    activo_web_id: Optional[UUID] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista revisiones. Filtrar por ?servicio_id= o ?activo_web_id=."""
    filters: dict = {"user_id": current_user.id}
    if servicio_id:
        filters["servicio_id"] = servicio_id
    if activo_web_id:
        filters["activo_web_id"] = activo_web_id
    items = await revision_tercero_svc.list(db, filters=filters)
    return success(
        [RevisionTerceroRead.model_validate(x).model_dump(mode="json") for x in items]
    )


@router.get("/{id}")
async def get_revision_tercero(
    entity: RevisionTercero = Depends(require_ownership(revision_tercero_svc)),
):
    return success(RevisionTerceroRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_revision_tercero(
    entity_in: RevisionTerceroCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await revision_tercero_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(RevisionTerceroRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_revision_tercero(
    entity_in: RevisionTerceroUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: RevisionTercero = Depends(require_ownership(revision_tercero_svc)),
):
    updated = await revision_tercero_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(RevisionTerceroRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_revision_tercero(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: RevisionTercero = Depends(require_ownership(revision_tercero_svc)),
):
    await revision_tercero_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "RevisionTercero eliminada"})
