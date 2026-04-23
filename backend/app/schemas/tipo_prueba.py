"""TipoPrueba schemas — Pydantic v2.

categoria must be one of: SAST, DAST, SCA, TM, MAST.
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

CategoriaValida = Literal["SAST", "DAST", "SCA", "TM", "MAST"]


class TipoPruebaBase(BaseModel):
    nombre: str
    categoria: CategoriaValida
    descripcion: Optional[str] = None


class TipoPruebaCreate(TipoPruebaBase):
    """Fields required to create a tipo_prueba. user_id is set from auth context."""
    pass


class TipoPruebaUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre: Optional[str] = None
    categoria: Optional[CategoriaValida] = None
    descripcion: Optional[str] = None


class TipoPruebaRead(TipoPruebaBase):
    """Full tipo_prueba representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
