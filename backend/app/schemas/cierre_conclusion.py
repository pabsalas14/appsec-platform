"""CierreConclusion schema — closure/conclusion for emerging topic."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


class CierreConclusionBase(BaseModel):
    """Base schema for CierreConclusion."""

    titulo: str = Field(..., min_length=1, max_length=255)
    conclusion: str = Field(..., min_length=1)
    recomendaciones: Optional[str] = Field(None)
    fecha_cierre: datetime = Field(...)
    tema_id: UUID = Field(...)


class CierreConclusionCreate(CierreConclusionBase):
    """Schema for creating CierreConclusion."""

    pass


class CierreConclusionUpdate(BaseModel):
    """Schema for updating CierreConclusion (all fields optional)."""

    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    conclusion: Optional[str] = Field(None, min_length=1)
    recomendaciones: Optional[str] = Field(None)
    fecha_cierre: Optional[datetime] = None


class CierreConclusionRead(CierreConclusionBase):
    """Schema for reading CierreConclusion."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
