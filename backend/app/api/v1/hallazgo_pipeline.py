"""HallazgoPipeline CRUD endpoints (Módulo 8 — Operación)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.hallazgo_pipeline import HallazgoPipeline
from app.models.user import User
from app.schemas.hallazgo_pipeline import (
    HallazgoPipelineCreate,
    HallazgoPipelineRead,
    HallazgoPipelineUpdate,
)
from app.services.hallazgo_pipeline_service import hallazgo_pipeline_svc

router = APIRouter()


@router.get("")
async def list_hallazgo_pipelines(
    pipeline_release_id: UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista hallazgos de pipeline. Filtrar por ?pipeline_release_id=<uuid>."""
    filters: dict = {"user_id": current_user.id}
    if pipeline_release_id:
        filters["pipeline_release_id"] = pipeline_release_id
    items = await hallazgo_pipeline_svc.list(db, filters=filters)
    return success(
        [HallazgoPipelineRead.model_validate(x).model_dump(mode="json") for x in items]
    )


@router.get("/{id}")
async def get_hallazgo_pipeline(
    entity: HallazgoPipeline = Depends(require_ownership(hallazgo_pipeline_svc)),
):
    return success(HallazgoPipelineRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_pipeline(
    entity_in: HallazgoPipelineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await hallazgo_pipeline_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(HallazgoPipelineRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_pipeline(
    entity_in: HallazgoPipelineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoPipeline = Depends(require_ownership(hallazgo_pipeline_svc)),
):
    updated = await hallazgo_pipeline_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(HallazgoPipelineRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoPipeline = Depends(require_ownership(hallazgo_pipeline_svc)),
):
    await hallazgo_pipeline_svc.delete(
        db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id
    )
    return success(None, meta={"message": "HallazgoPipeline eliminado"})
