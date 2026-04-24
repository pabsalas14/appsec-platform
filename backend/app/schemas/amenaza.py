"""Amenaza schemas — Pydantic v2.

score_total se calcula automáticamente en el service como promedio de los 5 campos DREAD.
El campo se omite en Create/Update y se incluye en Read (calculado por el service).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

CATEGORIAS_STRIDE = {"Spoofing", "Tampering", "Repudiation", "Information Disclosure", "Denial of Service", "Elevation of Privilege"}
ESTADOS_AMENAZA = {"Abierta", "Mitigada", "Aceptada", "Transferida", "En Revision"}


class AmenazaBase(BaseModel):
    sesion_id: UUID
    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: Optional[str] = None
    categoria_stride: str = Field(..., description="STRIDE category")
    # DREAD scoring 1-10
    dread_damage: int = Field(..., ge=1, le=10, description="Damage potential (1-10)")
    dread_reproducibility: int = Field(..., ge=1, le=10, description="Reproducibility (1-10)")
    dread_exploitability: int = Field(..., ge=1, le=10, description="Exploitability (1-10)")
    dread_affected_users: int = Field(..., ge=1, le=10, description="Affected users (1-10)")
    dread_discoverability: int = Field(..., ge=1, le=10, description="Discoverability (1-10)")
    estado: str = Field(..., description="Abierta | Mitigada | Aceptada | Transferida | En Revision")

    def model_post_init(self, __context) -> None:
        if self.categoria_stride not in CATEGORIAS_STRIDE:
            raise ValueError(f"categoria_stride debe ser uno de {sorted(CATEGORIAS_STRIDE)}")
        if self.estado not in ESTADOS_AMENAZA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_AMENAZA)}")


class AmenazaCreate(AmenazaBase):
    """Fields required to create an amenaza. score_total is calculated automatically."""
    pass


class AmenazaUpdate(BaseModel):
    """All fields optional for partial updates. score_total is recalculated automatically."""
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = None
    categoria_stride: Optional[str] = None
    dread_damage: Optional[int] = Field(None, ge=1, le=10)
    dread_reproducibility: Optional[int] = Field(None, ge=1, le=10)
    dread_exploitability: Optional[int] = Field(None, ge=1, le=10)
    dread_affected_users: Optional[int] = Field(None, ge=1, le=10)
    dread_discoverability: Optional[int] = Field(None, ge=1, le=10)
    estado: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if self.categoria_stride is not None and self.categoria_stride not in CATEGORIAS_STRIDE:
            raise ValueError(f"categoria_stride debe ser uno de {sorted(CATEGORIAS_STRIDE)}")
        if self.estado is not None and self.estado not in ESTADOS_AMENAZA:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_AMENAZA)}")


class AmenazaRead(AmenazaBase):
    """Full amenaza representation returned from the API. Includes calculated score_total."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    score_total: Optional[float] = None
    created_at: datetime
    updated_at: datetime
