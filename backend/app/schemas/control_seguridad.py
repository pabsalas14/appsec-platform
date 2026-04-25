"""ControlSeguridad schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ControlSeguridadBase(BaseModel):
    nombre: str
    tipo: str
    descripcion: str | None = None
    obligatorio: bool = False


class ControlSeguridadCreate(ControlSeguridadBase):
    """Fields required to create a control_seguridad. user_id is set from auth context."""

    pass


class ControlSeguridadUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    tipo: str | None = None
    descripcion: str | None = None
    obligatorio: bool | None = None


class ControlSeguridadRead(ControlSeguridadBase):
    """Full control_seguridad representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
