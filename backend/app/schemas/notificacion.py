"""Notificacion schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class NotificacionBase(BaseModel):
    titulo: str
    cuerpo: str | None = None
    leida: bool = False


class NotificacionCreate(NotificacionBase):
    """Fields required to create a notificacion. user_id is set from auth context."""

    pass


class NotificacionUpdate(BaseModel):
    """All fields optional for partial updates."""

    titulo: str | None = None
    cuerpo: str | None = None
    leida: bool | None = None


class NotificacionRead(NotificacionBase):
    """Full notificacion representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
