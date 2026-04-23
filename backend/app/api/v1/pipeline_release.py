"""PipelineRelease CRUD endpoints (Módulo 8 — Operación)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.pipeline_release import PipelineRelease
from app.models.user import User
from app.schemas.pipeline_release import (
    PipelineReleaseCreate,
    PipelineReleaseRead,
    PipelineReleaseUpdate,
)
from app.services.pipeline_release_service import pipeline_release_svc

router = APIRouter()


@router.get("")
async def list_pipeline_releases(
    repositorio_id: Optional[UUID] = Query(default=None),
    service_release_id: Optional[UUID] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista pipelines del usuario. Filtrar por ?repositorio_id= o ?service_release_id=."""
    filters: dict = {"user_id": current_user.id}
    if repositorio_id:
        filters["repositorio_id"] = repositorio_id
    if service_release_id:
        filters["service_release_id"] = service_release_id
    items = await pipeline_release_svc.list(db, filters=filters)
    return success(
        [PipelineReleaseRead.model_validate(x).model_dump(mode="json") for x in items]
    )


@router.get("/{id}")
async def get_pipeline_release(
    entity: PipelineRelease = Depends(require_ownership(pipeline_release_svc)),
):
    return success(PipelineReleaseRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_pipeline_release(
    entity_in: PipelineReleaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await pipeline_release_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(PipelineReleaseRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_pipeline_release(
    entity_in: PipelineReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PipelineRelease = Depends(require_ownership(pipeline_release_svc)),
):
    updated = await pipeline_release_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(PipelineReleaseRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_pipeline_release(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: PipelineRelease = Depends(require_ownership(pipeline_release_svc)),
):
    await pipeline_release_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "PipelineRelease eliminado"})
