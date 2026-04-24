"""ControlSourceCode schemas — Pydantic v2.

Catálogo de controles de seguridad de código fuente (branch protection,
code signing, secret scanning, dependency review, etc.).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

TIPOS_CONTROL = {
    "Branch Protection",
    "Code Signing",
    "Secret Scanning",
    "Dependency Review",
    "SAST Integration",
    "Code Review",
    "Otro",
}


class ControlSourceCodeBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=255)
    tipo: str = Field(..., max_length=100)
    descripcion: Optional[str] = None
    obligatorio: bool = True

    def model_post_init(self, __context) -> None:
        if self.tipo not in TIPOS_CONTROL:
            raise ValueError(f"tipo debe ser uno de {sorted(TIPOS_CONTROL)}")


class ControlSourceCodeCreate(ControlSourceCodeBase):
    """Fields required to create a control_source_code. user_id is set from auth context."""
    pass


class ControlSourceCodeUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    tipo: Optional[str] = Field(None, max_length=100)
    descripcion: Optional[str] = None
    obligatorio: Optional[bool] = None

    def model_post_init(self, __context) -> None:
        if self.tipo is not None and self.tipo not in TIPOS_CONTROL:
            raise ValueError(f"tipo debe ser uno de {sorted(TIPOS_CONTROL)}")


class ControlSourceCodeRead(ControlSourceCodeBase):
    """Full control_source_code representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
