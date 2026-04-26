"""Admin IA Configuration endpoints — multi-provider IA settings."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.core.response import paginated, success
from app.models.configuracion_ia import ConfiguracionIA
from app.models.user import User
from app.schemas.configuracion_ia import (
    ConfiguracionIACreate,
    ConfiguracionIAList,
    ConfiguracionIARead,
    ConfiguracionIAUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.configuracion_ia_service import configuracion_ia_svc

router = APIRouter()


@router.get("", response_model=ConfiguracionIAList)
async def list_configs(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    """List all IA provider configurations (paginated)."""
    rows = await configuracion_ia_svc.list(db, skip=skip, limit=limit)
    total = await db.scalar(select(func.count()).select_from(ConfiguracionIA))
    logger.info("configuracion_ia.list", extra={"skip": skip, "limit": limit, "total": total})
    return paginated(
        [ConfiguracionIARead.model_validate(r).model_dump(mode="json") for r in rows],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_config(
    payload: ConfiguracionIACreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Create a new IA provider configuration."""
    encrypted_key = payload.api_key

    schema = ConfiguracionIACreate(
        provider=payload.provider,
        api_key=encrypted_key,
        model=payload.model,
        temperatura=payload.temperatura,
        max_tokens=payload.max_tokens,
        enabled=payload.enabled,
    )

    config = await configuracion_ia_svc.create(db, schema)
    await audit_record(
        db,
        action="configuracion_ia.create",
        entity_type="configuracion_ia",
        entity_id=str(config.id),
        metadata={
            "provider": config.provider,
            "model": config.model,
        },
    )
    logger.info("configuracion_ia.create", extra={"config_id": str(config.id), "provider": config.provider})
    return success(ConfiguracionIARead.model_validate(config).model_dump(mode="json"))


@router.get("/{config_id}")
async def get_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Retrieve a single IA configuration."""
    config = await configuracion_ia_svc.get(db, config_id)
    if not config:
        raise NotFoundException("Configuration not found")
    return success(ConfiguracionIARead.model_validate(config).model_dump(mode="json"))


@router.patch("/{config_id}")
async def update_config(
    config_id: uuid.UUID,
    payload: ConfiguracionIAUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Update a IA configuration."""
    config = await configuracion_ia_svc.get(db, config_id)
    if not config:
        raise NotFoundException("Configuration not found")

    old_values = {
        "provider": config.provider,
        "model": config.model,
        "enabled": config.enabled,
    }

    config = await configuracion_ia_svc.update(db, config_id, payload)
    await audit_record(
        db,
        action="configuracion_ia.update",
        entity_type="configuracion_ia",
        entity_id=str(config_id),
        metadata={
            "changes": {
                "provider": {"old": old_values["provider"], "new": config.provider},
                "model": {"old": old_values["model"], "new": config.model},
                "enabled": {"old": old_values["enabled"], "new": config.enabled},
            }
        },
    )
    logger.info("configuracion_ia.update", extra={"config_id": str(config_id)})
    return success(ConfiguracionIARead.model_validate(config).model_dump(mode="json"))


@router.delete("/{config_id}", status_code=204)
async def delete_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Delete a IA configuration (hard delete)."""
    config = await configuracion_ia_svc.get(db, config_id)
    if not config:
        raise NotFoundException("Configuration not found")

    await configuracion_ia_svc.delete(db, config_id)
    await audit_record(
        db,
        action="configuracion_ia.delete",
        entity_type="configuracion_ia",
        entity_id=str(config_id),
        metadata={"provider": config.provider},
    )
    logger.info("configuracion_ia.delete", extra={"config_id": str(config_id)})
    return None
