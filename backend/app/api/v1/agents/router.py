"""API endpoints for agent configuration management."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.models.agente_config import AgenteConfig
from app.models.user import User
from app.schemas.agente_config import (
    AgenteConfigCreate,
    AgenteConfigList,
    AgenteConfigRead,
    AgenteConfigUpdate,
)
from app.core.response import success

router = APIRouter()


@router.get("", response_model=AgenteConfigList)
async def list_agent_configs(
    agente_tipo: Optional[str] = Query(None, description="Filter by agent type"),
    usuario_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    revision_id: Optional[UUID] = Query(None, description="Filter by review ID"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgenteConfigList:
    """List agent configurations with optional filters."""
    query = select(AgenteConfig).where(AgenteConfig.activo == True)

    # Apply filters
    if agente_tipo:
        query = query.where(AgenteConfig.agente_tipo == agente_tipo)
    if usuario_id:
        query = query.where(AgenteConfig.usuario_id == usuario_id)
    if revision_id:
        query = query.where(AgenteConfig.revision_id == revision_id)

    # Get total count
    count_query = select(AgenteConfig.id).where(AgenteConfig.activo == True)
    if agente_tipo:
        count_query = count_query.where(AgenteConfig.agente_tipo == agente_tipo)
    if usuario_id:
        count_query = count_query.where(AgenteConfig.usuario_id == usuario_id)
    if revision_id:
        count_query = count_query.where(AgenteConfig.revision_id == revision_id)

    total_result = await db.execute(count_query)
    total = len(total_result.scalars().all())

    # Apply pagination and get results
    query = query.offset(skip).limit(limit).order_by(AgenteConfig.creado_en.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return AgenteConfigList(
        items=[AgenteConfigRead.model_validate(item) for item in items],
        total=total,
        page=(skip // limit) + 1,
        size=limit,
    )


@router.post("", response_model=AgenteConfigRead, status_code=status.HTTP_201_CREATED)
async def create_agent_config(
    config_data: AgenteConfigCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgenteConfigRead:
    """Create a new agent configuration."""
    # Validate that either usuario_id or revision_id is provided (or neither for global config)
    if config_data.usuario_id is None and config_data.revision_id is None:
        # Global configuration - check if user has admin permissions
        if not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can create global agent configurations",
            )
    elif config_data.usuario_id is not None:
        # User-specific configuration - validate user owns it or is admin
        if config_data.usuario_id != current_user.id and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to create configuration for this user",
            )
    elif config_data.revision_id is not None:
        # Review-specific configuration - additional validation could be added here
        pass

    # Check if similar configuration already exists
    stmt = select(AgenteConfig).where(
        and_(
            AgenteConfig.agente_tipo == config_data.agente_tipo,
            AgenteConfig.usuario_id == config_data.usuario_id,
            AgenteConfig.revision_id == config_data.revision_id,
            AgenteConfig.activo == True,
        )
    )
    result = await db.execute(stmt)
    existing_config = result.scalar_one_or_none()

    if existing_config:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An active configuration already exists for agent type '{config_data.agente_tipo}' "
            f"with the specified user and review filters",
        )

    # Create new configuration
    db_config = AgenteConfig(**config_data.model_dump())
    db.add(db_config)
    await db.flush()
    await db.refresh(db_config)

    return AgenteConfigRead.model_validate(db_config)


@router.get("/{config_id}", response_model=AgenteConfigRead)
async def get_agent_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgenteConfigRead:
    """Get a specific agent configuration by ID."""
    stmt = select(AgenteConfig).where(
        and_(
            AgenteConfig.id == config_id,
            AgenteConfig.activo == True,
        )
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent configuration with ID {config_id} not found",
        )

    # Check permissions
    if config.usuario_id is not None and config.usuario_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this configuration",
        )

    return AgenteConfigRead.model_validate(config)


@router.put("/{config_id}", response_model=AgenteConfigRead)
async def update_agent_config(
    config_id: UUID,
    config_data: AgenteConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgenteConfigRead:
    """Update an existing agent configuration."""
    # Get existing configuration
    stmt = select(AgenteConfig).where(
        and_(
            AgenteConfig.id == config_id,
            AgenteConfig.activo == True,
        )
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent configuration with ID {config_id} not found",
        )

    # Check permissions
    if config.usuario_id is not None and config.usuario_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this configuration",
        )

    # Update fields
    update_data = config_data.model_dump(exclude_unset=True)
    if update_data:
        stmt = update(AgenteConfig).where(AgenteConfig.id == config_id).values(**update_data, actualizado_en=func.now())
        await db.execute(stmt)
        await db.flush()
        await db.refresh(config)

    return AgenteConfigRead.model_validate(config)


@router.delete("/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent_config(
    config_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete (deactivate) an agent configuration."""
    # Get existing configuration
    stmt = select(AgenteConfig).where(
        and_(
            AgenteConfig.id == config_id,
            AgenteConfig.activo == True,
        )
    )
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent configuration with ID {config_id} not found",
        )

    # Check permissions
    if config.usuario_id is not None and config.usuario_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this configuration",
        )

    # Soft delete
    stmt = update(AgenteConfig).where(AgenteConfig.id == config_id).values(activo=False, actualizado_en=func.now())
    await db.execute(stmt)
    await db.flush()


# Import func for now() usage
from sqlalchemy import func
