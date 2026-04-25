"""FlujoEstatus schema — dynamic state transitions."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FlujoEstatusBase(BaseModel):
    """Base schema for FlujoEstatus."""

    entity_type: str = Field(..., min_length=1, max_length=100)
    from_status: str = Field(..., min_length=1, max_length=100)
    to_status: str = Field(..., min_length=1, max_length=100)
    allowed: bool = Field(default=True)
    requires_justification: bool = Field(default=False)
    requires_approval: bool = Field(default=False)


class FlujoEstatusCreate(FlujoEstatusBase):
    """Schema for creating FlujoEstatus."""

    pass


class FlujoEstatusUpdate(BaseModel):
    """Schema for updating FlujoEstatus (all fields optional)."""

    entity_type: str | None = Field(None, min_length=1, max_length=100)
    from_status: str | None = Field(None, min_length=1, max_length=100)
    to_status: str | None = Field(None, min_length=1, max_length=100)
    allowed: bool | None = None
    requires_justification: bool | None = None
    requires_approval: bool | None = None


class FlujoEstatusRead(FlujoEstatusBase):
    """Schema for reading FlujoEstatus."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
