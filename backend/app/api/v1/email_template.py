"""API endpoints for email template management (S18)."""

from __future__ import annotations

import uuid

from app.api.dependencies import get_current_user, get_db
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.email_template import (
    EmailTemplateCreate,
    EmailTemplateResponse,
    EmailTemplateUpdate,
)
from app.services.email_template_service import email_template_svc

router = APIRouter(prefix="/api/v1/email-templates", tags=["email_notifications"])


@router.get("", response_model=list[EmailTemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all active email templates (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    templates = await email_template_svc.list(db)
    return templates


@router.post("", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: EmailTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create email template (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    template = await email_template_svc.create(db, payload)
    return template


@router.get("/{template_id}", response_model=EmailTemplateResponse)
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get email template by ID (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    template = await email_template_svc.get(db, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return template


@router.patch("/{template_id}", response_model=EmailTemplateResponse)
async def update_template(
    template_id: uuid.UUID,
    payload: EmailTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update email template (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    template = await email_template_svc.update(db, template_id, payload)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete email template (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    success = await email_template_svc.delete(db, template_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
