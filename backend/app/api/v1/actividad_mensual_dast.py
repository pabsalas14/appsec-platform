"""ActividadMensualDast CRUD endpoints (BRD §5.2)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.actividad_mensual_dast import ActividadMensualDast
from app.models.user import User
from app.schemas.actividad_mensual_dast import (
    ActividadMensualDastCreate,
    ActividadMensualDastRead,
    ActividadMensualDastUpdate,
)
from app.services.actividad_mensual_dast_service import actividad_mensual_dast_svc
from app.services.json_setting import get_json_setting

router = APIRouter()


@router.get("/config/scoring")
async def get_scoring_config(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    dast_cfg = await get_json_setting(db, "scoring.dast_mensual", {})
    pesos = await get_json_setting(db, "scoring.pesos_severidad", {})
    sub_estados: list[str] = []
    if isinstance(dast_cfg, dict):
        raw = dast_cfg.get("sub_estados_mes")
        if isinstance(raw, list):
            sub_estados = [str(x).strip() for x in raw if str(x).strip()]
    return success({"sub_estados_mes": sub_estados, "pesos_severidad": pesos if isinstance(pesos, dict) else {}})


@router.get("")
async def list_actividad_mensual_dasts(
    programa_dast_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters: dict = {"user_id": current_user.id}
    if programa_dast_id is not None:
        filters["programa_dast_id"] = programa_dast_id
    items = await actividad_mensual_dast_svc.list(db, filters=filters)
    return success([ActividadMensualDastRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_actividad_mensual_dast(
    entity: ActividadMensualDast = Depends(require_ownership(actividad_mensual_dast_svc)),
):
    return success(ActividadMensualDastRead.model_validate(entity).model_dump(mode="json"))


@router.post("")
async def create_actividad_mensual_dast(
    entity_in: ActividadMensualDastCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await actividad_mensual_dast_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ActividadMensualDastRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_actividad_mensual_dast(
    entity_in: ActividadMensualDastUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualDast = Depends(require_ownership(actividad_mensual_dast_svc)),
):
    updated = await actividad_mensual_dast_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(ActividadMensualDastRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_actividad_mensual_dast(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualDast = Depends(require_ownership(actividad_mensual_dast_svc)),
):
    await actividad_mensual_dast_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ActividadMensualDast deleted"})
