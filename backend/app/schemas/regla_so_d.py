"""ReglaSoD schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReglaSoDBase(BaseModel):
    accion: str
    descripcion: str | None = None
    enabled: bool = True
    alcance: str | None = None


class ReglaSoDCreate(ReglaSoDBase):
    """Fields required to create a ReglaSoD. user_id is set from auth context."""

    pass


class ReglaSoDUpdate(BaseModel):
    """All fields optional for partial updates."""

    accion: str | None = None
    descripcion: str | None = None
    enabled: bool | None = None
    alcance: str | None = None


class ReglaSoDRead(ReglaSoDBase):
    """Full ReglaSoD representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
