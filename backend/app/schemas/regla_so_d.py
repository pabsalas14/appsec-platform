"""ReglaSoD schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReglaSoDBase(BaseModel):
    accion: str
    descripcion: Optional[str] = None
    enabled: bool = True
    alcance: Optional[str] = None


class ReglaSoDCreate(ReglaSoDBase):
    """Fields required to create a ReglaSoD. user_id is set from auth context."""
    pass


class ReglaSoDUpdate(BaseModel):
    """All fields optional for partial updates."""

    accion: Optional[str] = None
    descripcion: Optional[str] = None
    enabled: Optional[bool] = None
    alcance: Optional[str] = None


class ReglaSoDRead(ReglaSoDBase):
    """Full ReglaSoD representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
