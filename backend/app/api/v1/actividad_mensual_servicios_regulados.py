"""ActividadMensualServiciosRegulados CRUD endpoints (BRD §5.5)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.actividad_mensual_servicios_regulados import ActividadMensualServiciosRegulados
from app.models.user import User
from app.schemas.actividad_mensual_servicios_regulados import (
    ActividadMensualServiciosReguladosCreate,
    ActividadMensualServiciosReguladosRead,
    ActividadMensualServiciosReguladosUpdate,
)
from app.services.actividad_mensual_servicios_regulados_service import actividad_mensual_servicios_regulados_svc
from app.services.json_setting import get_json_setting

router = APIRouter()


@router.get("/config/scoring")
async def get_scoring_config(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    sr_cfg = await get_json_setting(db, "scoring.servicios_regulados_mensual", {})
    pesos = await get_json_setting(db, "scoring.pesos_severidad", {})
    sub_estados: list[str] = []
    if isinstance(sr_cfg, dict):
        raw = sr_cfg.get("sub_estados_mes")
        if isinstance(raw, list):
            sub_estados = [str(x).strip() for x in raw if str(x).strip()]
    return success({"sub_estados_mes": sub_estados, "pesos_severidad": pesos if isinstance(pesos, dict) else {}})


@router.get("")
async def list_actividad_mensual_servicios_regulados(
    servicio_regulado_registro_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters: dict = {"user_id": current_user.id}
    if servicio_regulado_registro_id is not None:
        filters["servicio_regulado_registro_id"] = servicio_regulado_registro_id
    items = await actividad_mensual_servicios_regulados_svc.list(db, filters=filters)
    return success([ActividadMensualServiciosReguladosRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_actividad_mensual_servicios_regulados(
    entity: ActividadMensualServiciosRegulados = Depends(require_ownership(actividad_mensual_servicios_regulados_svc)),
):
    return success(ActividadMensualServiciosReguladosRead.model_validate(entity).model_dump(mode="json"))


@router.post("")
async def create_actividad_mensual_servicios_regulados(
    entity_in: ActividadMensualServiciosReguladosCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await actividad_mensual_servicios_regulados_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(ActividadMensualServiciosReguladosRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_actividad_mensual_servicios_regulados(
    entity_in: ActividadMensualServiciosReguladosUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualServiciosRegulados = Depends(require_ownership(actividad_mensual_servicios_regulados_svc)),
):
    updated = await actividad_mensual_servicios_regulados_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(ActividadMensualServiciosReguladosRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_actividad_mensual_servicios_regulados(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: ActividadMensualServiciosRegulados = Depends(require_ownership(actividad_mensual_servicios_regulados_svc)),
):
    await actividad_mensual_servicios_regulados_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "ActividadMensualServiciosRegulados deleted"})
