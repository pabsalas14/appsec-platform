"""Organizacion schemas — Pydantic v2 (organización GitHub/Atlassian bajo gerencia, BRD §3.1)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrganizacionBase(BaseModel):
    nombre: str
    codigo: str
    descripcion: str | None = None
    gerencia_id: UUID
    plataforma: str = Field(default="GitHub", max_length=100)
    url_base: str | None = Field(default=None, max_length=500)
    responsable: str | None = Field(default=None, max_length=255)


class OrganizacionCreate(OrganizacionBase):
    """Fields required to create a organizacion. user_id is set from auth context."""

    pass


class OrganizacionUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: str | None = None
    codigo: str | None = None
    descripcion: str | None = None
    gerencia_id: UUID | None = None
    plataforma: str | None = Field(default=None, max_length=100)
    url_base: str | None = Field(default=None, max_length=500)
    responsable: str | None = Field(default=None, max_length=255)


class OrganizacionRead(OrganizacionBase):
    """Full organizacion representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
