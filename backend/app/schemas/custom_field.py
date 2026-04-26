"""Custom Field schemas — FASE 4."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Field type enum: text, number, date, select, boolean, url, user_ref
FIELD_TYPES = ["text", "number", "date", "select", "boolean", "url", "user_ref"]


class CustomFieldBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Campo único por entity_type")
    field_type: str = Field(..., min_length=1, max_length=50, description="Tipo de dato del campo")
    entity_type: str = Field(..., min_length=1, max_length=100)
    label: str | None = Field(None, max_length=255)
    description: str | None = None
    is_required: bool = Field(False, description="Si el campo es obligatorio")
    is_searchable: bool = Field(False, description="Si el campo es searchable en listados")
    config: str | None = Field(None, description="JSON: {options: [select], default_value, pattern [url], etc}")


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
    deleted_at: datetime | None = None


class CustomFieldList(BaseModel):
    """Paginated list response."""
    status: str = "success"
    data: list[CustomFieldRead]
    meta: dict = {}
    pagination: dict = {}  # {page, page_size, total, total_pages}


class CustomFieldValueBase(BaseModel):
    field_id: UUID
    entity_type: str
    entity_id: UUID
    value: str | None = None


class CustomFieldValueCreate(CustomFieldValueBase):
    pass


class CustomFieldValueUpdate(BaseModel):
    value: str | None = None


class CustomFieldValueRead(CustomFieldValueBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
