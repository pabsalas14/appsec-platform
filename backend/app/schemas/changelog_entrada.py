"""ChangelogEntrada schemas — Pydantic v2."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ValidTipos = Literal["feature", "bugfix", "improvement", "security", "breaking"]


class ChangelogEntradaBase(BaseModel):
    version: str = Field(..., max_length=50)
    titulo: str = Field(..., max_length=255)
    descripcion: str
    tipo: ValidTipos
    fecha_publicacion: datetime | None = None
    publicado: bool = False


class ChangelogEntradaCreate(ChangelogEntradaBase):
    """Fields required to create a changelog_entrada. user_id is set from auth context."""
    pass


class ChangelogEntradaUpdate(BaseModel):
    """All fields optional for partial updates."""
    version: str | None = Field(None, max_length=50)
    titulo: str | None = Field(None, max_length=255)
    descripcion: str | None = None
    tipo: ValidTipos | None = None
    fecha_publicacion: datetime | None = None
    publicado: bool | None = None


class ChangelogEntradaRead(ChangelogEntradaBase):
    """Full changelog_entrada representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

