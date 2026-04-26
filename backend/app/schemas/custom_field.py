"""Custom Field schemas."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CustomFieldBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    field_type: str = Field(..., min_length=1, max_length=50)
    entity_type: str = Field(..., min_length=1, max_length=100)
    label: str | None = Field(None, max_length=255)
    description: str | None = None
    is_required: bool = False
    is_searchable: bool = False
    config: str | None = None


class CustomFieldCreate(CustomFieldBase):
    pass


class CustomFieldUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    field_type: str | None = Field(None, min_length=1, max_length=50)
    label: str | None = None
    description: str | None = None
    is_required: bool | None = None
    is_searchable: bool | None = None
    config: str | None = None


class CustomFieldRead(CustomFieldBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
