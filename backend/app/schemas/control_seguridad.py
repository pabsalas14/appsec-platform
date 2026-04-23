"""ControlSeguridad schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ControlSeguridadBase(BaseModel):
    nombre: str
    tipo: str
    descripcion: Optional[str] = None
    obligatorio: bool = False


class ControlSeguridadCreate(ControlSeguridadBase):
    """Fields required to create a control_seguridad. user_id is set from auth context."""
    pass


class ControlSeguridadUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    tipo: Optional[str] = None
    descripcion: Optional[str] = None
    obligatorio: Optional[bool] = None


class ControlSeguridadRead(ControlSeguridadBase):
    """Full control_seguridad representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
