"""RegulacionControl schemas — Pydantic v2.

Catálogo de controles por regulación (CNBV, ISO 27001, PCI-DSS, etc.).
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RegulacionControlBase(BaseModel):
    nombre_regulacion: str = Field(..., min_length=1, max_length=255)
    nombre_control: str = Field(..., min_length=1, max_length=255)
    descripcion: str | None = None
    obligatorio: bool = True


class RegulacionControlCreate(RegulacionControlBase):
    """Fields required to create a regulacion_control. user_id is set from auth context."""
    pass


class RegulacionControlUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre_regulacion: str | None = Field(None, min_length=1, max_length=255)
    nombre_control: str | None = Field(None, min_length=1, max_length=255)
    descripcion: str | None = None
    obligatorio: bool | None = None


class RegulacionControlRead(RegulacionControlBase):
    """Full regulacion_control representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
