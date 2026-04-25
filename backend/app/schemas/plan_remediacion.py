"""PlanRemediacion schema — remediation plan."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PlanRemediacionBase(BaseModel):
    """Base schema for PlanRemediacion."""

    descripcion: str = Field(..., min_length=1)
    acciones_recomendadas: str = Field(..., min_length=1)
    responsable: str = Field(..., min_length=1, max_length=255)
    fecha_limite: datetime = Field(...)
    estado: str = Field(..., min_length=1, max_length=100)
    auditoria_id: UUID = Field(...)


class PlanRemediacionCreate(PlanRemediacionBase):
    """Schema for creating PlanRemediacion."""

    pass


class PlanRemediacionUpdate(BaseModel):
    """Schema for updating PlanRemediacion (all fields optional)."""

    descripcion: str | None = Field(None, min_length=1)
    acciones_recomendadas: str | None = Field(None, min_length=1)
    responsable: str | None = Field(None, min_length=1, max_length=255)
    fecha_limite: datetime | None = None
    estado: str | None = Field(None, min_length=1, max_length=100)


class PlanRemediacionRead(PlanRemediacionBase):
    """Schema for reading PlanRemediacion."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
