"""API endpoints for user notification preferences (S18)."""

from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.user_preferences_service import user_preferences_svc

router = APIRouter(prefix="/api/v1/user-preferences", tags=["notifications"])


class NotificationPreferencesResponse(BaseModel):
    """User notification preferences."""

    notificaciones_automaticas: bool
    email_notificaciones: dict
    digest_type: str
    digest_hour_utc: int


class UpdatePreferencesRequest(BaseModel):
    """Request to update preferences."""

    notificaciones_automaticas: bool | None = None
    email_notificaciones: dict | None = None
    digest_type: str | None = None
    digest_hour_utc: int | None = None


class EnableEmailChannelRequest(BaseModel):
    """Request to enable email channel for notification types."""

    notification_types: list[str] | None = Field(
        None,
        description="List of notification types to enable (sla_vencida, vulnerabilidad_critica, etc.)",
    )
    all_types: bool = Field(False, description="If true, enable all notification types")


@router.get("", response_model=NotificationPreferencesResponse)
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's notification preferences."""
    prefs = await user_preferences_svc.get_preferences(db, current_user.id)
    return prefs


@router.patch("", response_model=NotificationPreferencesResponse)
async def update_preferences(
    payload: UpdatePreferencesRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's notification preferences."""
    # Filter out None values
    prefs = {k: v for k, v in payload.model_dump().items() if v is not None}

    if not prefs:
        # Return current if no updates
        return await user_preferences_svc.get_preferences(db, current_user.id)

    updated = await user_preferences_svc.set_preferences(db, current_user.id, prefs)
    return updated


@router.post("/email/enable", response_model=NotificationPreferencesResponse)
async def enable_email_notifications(
    payload: EnableEmailChannelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enable email notifications for specific types."""
    updated = await user_preferences_svc.enable_email_channel(
        db,
        current_user.id,
        notification_types=payload.notification_types,
        all_types=payload.all_types,
    )
    return updated


@router.post("/email/disable", response_model=NotificationPreferencesResponse)
async def disable_email_notifications(
    payload: EnableEmailChannelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Disable email notifications for specific types."""
    updated = await user_preferences_svc.disable_email_channel(
        db,
        current_user.id,
        notification_types=payload.notification_types,
        all_types=payload.all_types,
    )
    return updated
