"""ActivoWeb schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.core.validators import SSRFHttpUrl


class ActivoWebBase(BaseModel):
    nombre: str
    url: SSRFHttpUrl
    ambiente: str
    tipo: str
    celula_id: UUID


class ActivoWebCreate(ActivoWebBase):
    """Fields required to create a activo_web. user_id is set from auth context."""
    pass


class ActivoWebUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    url: Optional[SSRFHttpUrl] = None
    ambiente: Optional[str] = None
    tipo: Optional[str] = None
    celula_id: Optional[UUID] = None


class ActivoWebRead(ActivoWebBase):
    """Full activo_web representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
