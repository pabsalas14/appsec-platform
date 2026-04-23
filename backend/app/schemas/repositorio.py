"""Repositorio schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.core.validators import SSRFHttpUrl


class RepositorioBase(BaseModel):
    nombre: str
    url: SSRFHttpUrl
    plataforma: str
    rama_default: str
    activo: bool = True
    celula_id: UUID


class RepositorioCreate(RepositorioBase):
    """Fields required to create a repositorio. user_id is set from auth context."""
    pass


class RepositorioUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    url: Optional[SSRFHttpUrl] = None
    plataforma: Optional[str] = None
    rama_default: Optional[str] = None
    activo: Optional[bool] = None
    celula_id: Optional[UUID] = None


class RepositorioRead(RepositorioBase):
    """Full repositorio representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
