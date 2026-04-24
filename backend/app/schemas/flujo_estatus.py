"""FlujoEstatus schema — dynamic state transitions."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


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

    entity_type: Optional[str] = Field(None, min_length=1, max_length=100)
    from_status: Optional[str] = Field(None, min_length=1, max_length=100)
    to_status: Optional[str] = Field(None, min_length=1, max_length=100)
    allowed: Optional[bool] = None
    requires_justification: Optional[bool] = None
    requires_approval: Optional[bool] = None


class FlujoEstatusRead(FlujoEstatusBase):
    """Schema for reading FlujoEstatus."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
