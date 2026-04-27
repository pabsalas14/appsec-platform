"""ActividadMensualSourceCode CRUD endpoints (BRD §5.4)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.actividad_mensual_source_code import ActividadMensualSourceCode
from app.models.user import User
from app.schemas.actividad_mensual_source_code import (
    ActividadMensualSourceCodeCreate,
    ActividadMensualSourceCodeRead,
    ActividadMensualSourceCodeUpdate,
)
from app.services.actividad_mensual_source_code_service import actividad_mensual_source_code_svc
from app.services.json_setting import get_json_setting

router = APIRouter()


@router.get("/config/scoring")
async def get_scoring_config(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    sc_cfg = await get_json_setting(db, "scoring.source_code_mensual", {})
    pesos = await get_json_setting(db, "scoring.pesos_severidad", {})
    sub_estados: list[str] = []
    if isinstance(sc_cfg, dict):
        raw = sc_cfg.get("sub_estados_mes")
        if isinstance(raw, list):
            sub_estados = [str(x).strip() for x in raw if str(x).strip()]
    return success({"sub_estados_mes": sub_estados, "pesos_severidad": pesos if isinstance(pesos, dict) else {}})


@router.get("")
async def list_actividad_mensual_source_codes(
    programa_source_code_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters: dict = {"user_id": current_user.id}
    if programa_source_code_id is not None:
        filters["programa_source_code_id"] = programa_source_code_id
    items = await actividad_mensual_source_code_svc.list(db, filters=filters)
    return success([ActividadMensualSourceCodeRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_actividad_mensual_source_code(
    entity: ActividadMensualSourceCode = Depends(require_ownership(actividad_mensual_source_code_svc)),
):
    return success(ActividadMensualSourceCodeRead.model_validate(entity).model_dump(mode="json"))


@router.post("")
async def create_actividad_mensual_source_code(
    entity_in: ActividadMensualSourceCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await actividad_mensual_source_code_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ActividadMensualSourceCodeRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_actividad_mensual_source_code(
    entity_in: ActividadMensualSourceCodeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualSourceCode = Depends(require_ownership(actividad_mensual_source_code_svc)),
):
    updated = await actividad_mensual_source_code_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(ActividadMensualSourceCodeRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_actividad_mensual_source_code(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualSourceCode = Depends(require_ownership(actividad_mensual_source_code_svc)),
):
    await actividad_mensual_source_code_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ActividadMensualSourceCode deleted"})
