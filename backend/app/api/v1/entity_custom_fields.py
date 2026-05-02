"""Custom field values for owned entities — authenticated users (ADR-0016 / P04)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import success
from app.models.custom_field import CustomField, CustomFieldValue
from app.models.user import User
from app.schemas.custom_field import CustomFieldRead
from app.services.audit_service import record as audit_record
from app.services.activo_web_service import activo_web_svc
from app.services.auditoria_service import auditoria_svc
from app.services.custom_field_service import custom_field_svc
from app.services.hallazgo_pipeline_service import hallazgo_pipeline_svc
from app.services.iniciativa_service import iniciativa_svc
from app.services.plan_remediacion_service import plan_remediacion_svc
from app.services.repositorio_service import repositorio_svc
from app.services.service_release_service import service_release_svc
from app.services.tema_emergente_service import tema_emergente_svc
from app.services.vulnerabilidad_service import vulnerabilidad_svc

router = APIRouter()

ENTITY_SERVICES = {
    "vulnerabilidad": vulnerabilidad_svc,
    "repositorio": repositorio_svc,
    "activo_web": activo_web_svc,
    "service_release": service_release_svc,
    "plan_remediacion": plan_remediacion_svc,
    "tema_emergente": tema_emergente_svc,
    "auditoria": auditoria_svc,
    "iniciativa": iniciativa_svc,
    "hallazgo_pipeline": hallazgo_pipeline_svc,
}


async def _ensure_owned(
    entity_type: str,
    entity_id: uuid.UUID,
    *,
    db: AsyncSession,
    current_user: User,
):
    svc = ENTITY_SERVICES.get(entity_type)
    if svc is None:
        raise NotFoundException("Tipo de entidad no soportado")
    row = await svc.get(db, entity_id, scope={"user_id": current_user.id})
    if row is None:
        raise NotFoundException("Recurso no encontrado")
    return row


async def _bundle_values(db: AsyncSession, entity_type: str, entity_id: uuid.UUID) -> dict:
    fields_rows = await db.scalars(
        select(CustomField).where(
            CustomField.entity_type == entity_type,
            CustomField.deleted_at.is_(None),
        ),
    )
    values_rows = await db.scalars(
        select(CustomFieldValue).where(
            CustomFieldValue.entity_type == entity_type,
            CustomFieldValue.entity_id == entity_id,
            CustomFieldValue.deleted_at.is_(None),
        ),
    )
    vals = values_rows.all()
    values_dict = {str(v.field_id): v.value for v in vals}
    fields_list = list(fields_rows.all())
    return {
        "entity_type": entity_type,
        "entity_id": str(entity_id),
        "fields": [CustomFieldRead.model_validate(f).model_dump(mode="json") for f in fields_list],
        "values": values_dict,
    }


@router.get("/{entity_type}/{entity_id}")
async def get_entity_custom_field_values(
    entity_type: str,
    entity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_owned(entity_type, entity_id, db=db, current_user=current_user)
    bundle = await _bundle_values(db, entity_type, entity_id)
    logger.info(
        "entity_custom_field.list",
        extra={"event": "entity_custom_field.list", "entity_type": entity_type, "entity_id": str(entity_id)},
    )
    return success(bundle)


@router.patch("/{entity_type}/{entity_id}/{field_id}")
async def set_entity_custom_field_value(
    entity_type: str,
    entity_id: uuid.UUID,
    field_id: uuid.UUID,
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await _ensure_owned(entity_type, entity_id, db=db, current_user=current_user)

    field = await custom_field_svc.get(db, field_id)
    if not field or field.entity_type != entity_type:
        raise NotFoundException("Campo personalizado no encontrado")

    value_query = select(CustomFieldValue).where(
        CustomFieldValue.field_id == field_id,
        CustomFieldValue.entity_id == entity_id,
        CustomFieldValue.entity_type == entity_type,
        CustomFieldValue.deleted_at.is_(None),
    )
    value_record = await db.scalar(value_query)

    if value_record:
        value_record.value = payload.get("value")
    else:
        value_record = CustomFieldValue(
            field_id=field_id,
            entity_type=entity_type,
            entity_id=entity_id,
            value=payload.get("value"),
        )
        db.add(value_record)

    await db.flush()
    await audit_record(
        db,
        action="custom_field_value.user_update",
        entity_type="custom_field_value",
        entity_id=str(field_id),
        actor_id=current_user.id,
        metadata={"parent_entity_type": entity_type, "parent_entity_id": str(entity_id)},
    )
    logger.info(
        "entity_custom_field.set_value",
        extra={
            "event": "entity_custom_field.set_value",
            "field_id": str(field_id),
            "entity_type": entity_type,
            "entity_id": str(entity_id),
        },
    )
    return success({"field_id": str(field_id), "value": value_record.value})
