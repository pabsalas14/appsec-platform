"""Pydantic schemas for email templates."""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EmailTemplateCreate(BaseModel):
    """Create email template payload."""

    nombre: str = Field(..., min_length=1, max_length=100)
    asunto: str = Field(..., min_length=1, max_length=255)
    cuerpo_html: str = Field(..., min_length=1)
    variables: list[str] = Field(default_factory=list)
    descripcion: str | None = None
    activo: bool = True


class EmailTemplateUpdate(BaseModel):
    """Update email template payload (partial)."""

    asunto: str | None = Field(None, min_length=1, max_length=255)
    cuerpo_html: str | None = Field(None, min_length=1)
    variables: list[str] | None = None
    descripcion: str | None = None
    activo: bool | None = None


class EmailTemplateResponse(BaseModel):
    """Email template response."""

    id: uuid.UUID
    nombre: str
    asunto: str
    cuerpo_html: str
    variables: list[str] | None
    descripcion: str | None
    activo: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SendEmailRequest(BaseModel):
    """Request to send a manual email."""

    usuario_id: uuid.UUID | None = None  # If None, use current user
    email: str = Field(..., min_length=5)
    template_nombre: str = Field(..., min_length=1)
    variables: dict[str, str] = Field(default_factory=dict)
    es_urgente: bool = False  # Flag for priority queue
