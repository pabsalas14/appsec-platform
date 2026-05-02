"""Admin — cierre de periodo y freeze mensual (spec 35)."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import ConflictException, NotFoundException
from app.core.logging import logger
from app.core.response import success
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.services.audit_service import record as audit_record

router = APIRouter()


class CerrarPeriodoBody(BaseModel):
    anio: int = Field(ge=2000, le=2100)
    mes: int = Field(ge=1, le=12)


@router.post("/freeze/cerrar-periodo")
async def cerrar_periodo_freeze(
    body: CerrarPeriodoBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Registra un mes/año en `periodo.freeze.periodos_cerrados` (tabla histórica inmutable vía auditoría)."""
    row = (await db.execute(select(SystemSetting).where(SystemSetting.key == "periodo.freeze"))).scalar_one_or_none()
    if row is None:
        raise NotFoundException("periodo.freeze")

    val = row.value if isinstance(row.value, dict) else {}
    cerrados = list(val.get("periodos_cerrados") or [])
    tag = {"anio": body.anio, "mes": body.mes, "cerrado_at": datetime.now(UTC).isoformat()}
    if any(
        isinstance(x, dict) and x.get("anio") == body.anio and x.get("mes") == body.mes for x in cerrados
    ):
        raise ConflictException(f"El periodo {body.anio}-{body.mes:02d} ya está registrado como cerrado")

    cerrados.append(tag)
    val["periodos_cerrados"] = cerrados
    row.value = val
    await db.flush()

    logger.info(
        "admin.operacion.freeze.cerrar_periodo",
        extra={
            "event": "admin.operacion.freeze.cerrar_periodo",
            "user_id": str(current_user.id),
            "anio": body.anio,
            "mes": body.mes,
        },
    )
    await audit_record(
        db,
        action="periodo.freeze.cerrar",
        entity_type="system_settings",
        entity_id="periodo.freeze",
        metadata={"entrada": tag, "total": len(cerrados)},
    )
    return success({"entrada": tag, "total_periodos_cerrados": len(cerrados)})
