"""Admin API for Risk Scoring Configuration."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.logging import logger
from app.models.risk_scoring_config import RiskScoringConfig
from app.models.user import User
from app.services.base import BaseService

router = APIRouter()


class RiskScoringConfigCreate(BaseModel):
    nombre_config: str
    weight_hidden_commits: int = Field(default=10, ge=0, le=100)
    weight_timing_anomalies: int = Field(default=15, ge=0, le=100)
    weight_critical_files: int = Field(default=20, ge=0, le=100)
    weight_mass_changes: int = Field(default=15, ge=0, le=100)
    weight_author_anomalies: int = Field(default=15, ge=0, le=100)
    weight_rapid_succession: int = Field(default=10, ge=0, le=100)
    weight_force_push: int = Field(default=25, ge=0, le=100)
    weight_dependency_changes: int = Field(default=20, ge=0, le=100)
    weight_external_merges: int = Field(default=15, ge=0, le=100)


class RiskScoringConfigUpdate(BaseModel):
    nombre_config: str | None = None
    weight_hidden_commits: int | None = Field(default=None, ge=0, le=100)
    weight_timing_anomalies: int | None = Field(default=None, ge=0, le=100)
    weight_critical_files: int | None = Field(default=None, ge=0, le=100)
    weight_mass_changes: int | None = Field(default=None, ge=0, le=100)
    weight_author_anomalies: int | None = Field(default=None, ge=0, le=100)
    weight_rapid_succession: int | None = Field(default=None, ge=0, le=100)
    weight_force_push: int | None = Field(default=None, ge=0, le=100)
    weight_dependency_changes: int | None = Field(default=None, ge=0, le=100)
    weight_external_merges: int | None = Field(default=None, ge=0, le=100)
    activa: bool | None = None


class RiskScoringConfigRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    nombre_config: str
    weight_hidden_commits: int
    weight_timing_anomalies: int
    weight_critical_files: int
    weight_mass_changes: int
    weight_author_anomalies: int
    weight_rapid_succession: int
    weight_force_push: int
    weight_dependency_changes: int
    weight_external_merges: int
    activa: bool
    created_at: Any
    updated_at: Any


risk_scoring_svc = BaseService[RiskScoringConfig, RiskScoringConfigCreate, RiskScoringConfigUpdate](
    RiskScoringConfig,
    owner_field="user_id",
    audit_action_prefix="risk_scoring_config",
)


@router.get("")
async def list_risk_scoring_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """List all risk scoring configurations."""
    stmt = select(RiskScoringConfig).where(RiskScoringConfig.user_id == current_user.id)
    result = await db.execute(stmt)
    configs = result.scalars().all()
    return [RiskScoringConfigRead.model_validate(c).model_dump(mode="json") for c in configs]


@router.get("/{config_id}")
async def get_risk_scoring_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Get a specific risk scoring configuration."""
    stmt = select(RiskScoringConfig).where(
        RiskScoringConfig.id == config_id,
        RiskScoringConfig.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()
    if not config:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Configuración de scoring no encontrada.")
    return RiskScoringConfigRead.model_validate(config).model_dump(mode="json")


@router.post("")
async def create_risk_scoring_config(
    config_in: RiskScoringConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Create a new risk scoring configuration."""
    stmt = select(RiskScoringConfig).where(
        RiskScoringConfig.user_id == current_user.id,
        RiskScoringConfig.activa == True,
    )
    result = await db.execute(stmt)
    existing_active = result.scalars().all()

    if existing_active:
        for c in existing_active:
            c.activa = False

    config = RiskScoringConfig(
        user_id=current_user.id,
        nombre_config=config_in.nombre_config,
        weight_hidden_commits=config_in.weight_hidden_commits,
        weight_timing_anomalies=config_in.weight_timing_anomalies,
        weight_critical_files=config_in.weight_critical_files,
        weight_mass_changes=config_in.weight_mass_changes,
        weight_author_anomalies=config_in.weight_author_anomalies,
        weight_rapid_succession=config_in.weight_rapid_succession,
        weight_force_push=config_in.weight_force_push,
        weight_dependency_changes=config_in.weight_dependency_changes,
        weight_external_merges=config_in.weight_external_merges,
        activa=True,
    )
    db.add(config)
    await db.flush()

    logger.info(
        "risk_scoring_config.created",
        extra={"config_id": str(config.id), "user_id": str(current_user.id)},
    )

    return RiskScoringConfigRead.model_validate(config).model_dump(mode="json")


@router.patch("/{config_id}")
async def update_risk_scoring_config(
    config_id: uuid.UUID,
    config_in: RiskScoringConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Update a risk scoring configuration."""
    stmt = select(RiskScoringConfig).where(
        RiskScoringConfig.id == config_id,
        RiskScoringConfig.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Configuración de scoring no encontrada.")

    update_data = config_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    await db.flush()

    logger.info(
        "risk_scoring_config.updated",
        extra={"config_id": str(config.id), "user_id": str(current_user.id)},
    )

    return RiskScoringConfigRead.model_validate(config).model_dump(mode="json")


@router.delete("/{config_id}")
async def delete_risk_scoring_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Delete a risk scoring configuration."""
    stmt = select(RiskScoringConfig).where(
        RiskScoringConfig.id == config_id,
        RiskScoringConfig.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Configuración de scoring no encontrada.")

    await db.delete(config)
    await db.flush()

    logger.info(
        "risk_scoring_config.deleted",
        extra={"config_id": str(config_id), "user_id": str(current_user.id)},
    )

    return {"deleted": True}


@router.post("/{config_id}/activate")
async def activate_risk_scoring_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Activate a risk scoring configuration (deactivates others)."""
    stmt = select(RiskScoringConfig).where(
        RiskScoringConfig.id == config_id,
        RiskScoringConfig.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Configuración de scoring no encontrada.")

    deactivate_stmt = (
        update(RiskScoringConfig)
        .where(RiskScoringConfig.user_id == current_user.id, RiskScoringConfig.activa == True)
        .values(activa=False)
    )
    await db.execute(deactivate_stmt)

    config.activa = True
    await db.flush()

    logger.info(
        "risk_scoring_config.activated",
        extra={"config_id": str(config.id), "user_id": str(current_user.id)},
    )

    return {"activated": True, "config_id": str(config.id)}
