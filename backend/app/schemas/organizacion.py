"""Organizacion schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrganizacionBase(BaseModel):
nombre: str
codigo: str
descripcion: str


class OrganizacionCreate(OrganizacionBase):
    """Fields required to create a organizacion. user_id is set from auth context."""
    pass


class OrganizacionUpdate(BaseModel):
    """All fields optional for partial updates."""
nombre: Optional[str] = None
codigo: Optional[str] = None
descripcion: Optional[str] = None


class OrganizacionRead(OrganizacionBase):
    """Full organizacion representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
