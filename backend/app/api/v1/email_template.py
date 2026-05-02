"""API endpoints for email template management (admin)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.response import success
from app.models.user import User
from app.schemas.email_template import (
    EmailTemplateCreate,
    EmailTemplateResponse,
    EmailTemplateUpdate,
)
from app.services.email_template_service import email_template_svc

router = APIRouter()


@router.get("")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """List all email templates (backoffice)."""
    templates = await email_template_svc.list(db)
    return success([EmailTemplateResponse.model_validate(t).model_dump(mode="json") for t in templates])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_template(
    payload: EmailTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Create email template."""
    template = await email_template_svc.create(db, payload)
    return success(EmailTemplateResponse.model_validate(template).model_dump(mode="json"))


@router.get("/{template_id}")
async def get_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Get email template by ID."""
    template = await email_template_svc.get(db, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plantilla no encontrada.")
    return success(EmailTemplateResponse.model_validate(template).model_dump(mode="json"))


@router.patch("/{template_id}")
async def update_template(
    template_id: uuid.UUID,
    payload: EmailTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Update email template."""
    template = await email_template_svc.update(db, template_id, payload)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plantilla no encontrada.")
    return success(EmailTemplateResponse.model_validate(template).model_dump(mode="json"))


@router.delete("/{template_id}")
async def delete_template(
    template_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_backoffice),
):
    """Delete email template."""
    deleted_ok = await email_template_svc.delete(db, template_id)
    if not deleted_ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plantilla no encontrada.")
    return success(None, meta={"message": "Plantilla eliminada"})
