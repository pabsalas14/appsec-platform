"""Direccion CRUD endpoints — organizational top-level catalog."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.direccion import Direccion
from app.models.user import User
from app.schemas.direccion import DireccionCreate, DireccionRead, DireccionUpdate
from app.services.direccion_service import direccion_svc

router = APIRouter()


@router.get("")
async def list_direccions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CATALOGS.VIEW)),
):
    items = await direccion_svc.list(db, filters={"user_id": current_user.id})
    return success([DireccionRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_direccion(
    _: User = Depends(require_permission(P.CATALOGS.VIEW)),
    entity: Direccion = Depends(require_ownership(direccion_svc)),
):
    return success(DireccionRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_direccion(
    entity_in: DireccionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CATALOGS.CREATE)),
):
    entity = await direccion_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(DireccionRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_direccion(
    entity_in: DireccionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CATALOGS.EDIT)),
    entity: Direccion = Depends(require_ownership(direccion_svc)),
):
    updated = await direccion_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(DireccionRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_direccion(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CATALOGS.DELETE)),
    entity: Direccion = Depends(require_ownership(direccion_svc)),
):
    await direccion_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "Direccion deleted"})
