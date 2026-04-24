"""RevisionSourceCode schemas — Pydantic v2.

evidencia_sha256 almacena el hash SHA-256 del archivo de evidencia (A3).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

RESULTADOS = {"Cumple", "No Cumple", "Parcial", "No Aplica"}


class RevisionSourceCodeBase(BaseModel):
    programa_sc_id: UUID
    control_sc_id: UUID
    fecha_revision: datetime
    resultado: str = Field(..., description="Cumple | No Cumple | Parcial | No Aplica")
    evidencia_filename: Optional[str] = Field(None, max_length=500)
    evidencia_sha256: Optional[str] = Field(None, max_length=64, description="SHA-256 hex del archivo (A3)")
    notas: Optional[str] = None

    @field_validator("evidencia_sha256")
    @classmethod
    def validate_sha256(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) != 64:
            raise ValueError("evidencia_sha256 debe ser un hash SHA-256 de 64 caracteres hex")
        return v

    def model_post_init(self, __context) -> None:
        if self.resultado not in RESULTADOS:
            raise ValueError(f"resultado debe ser uno de {sorted(RESULTADOS)}")


class RevisionSourceCodeCreate(RevisionSourceCodeBase):
    """Fields required to create a revision_source_code. user_id is set from auth context."""
    pass


class RevisionSourceCodeUpdate(BaseModel):
    """All fields optional for partial updates."""
    fecha_revision: Optional[datetime] = None
    resultado: Optional[str] = None
    evidencia_filename: Optional[str] = Field(None, max_length=500)
    evidencia_sha256: Optional[str] = Field(None, max_length=64)
    notas: Optional[str] = None

    @field_validator("evidencia_sha256")
    @classmethod
    def validate_sha256(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) != 64:
            raise ValueError("evidencia_sha256 debe ser un hash SHA-256 de 64 caracteres hex")
        return v

    def model_post_init(self, __context) -> None:
        if self.resultado is not None and self.resultado not in RESULTADOS:
            raise ValueError(f"resultado debe ser uno de {sorted(RESULTADOS)}")


class RevisionSourceCodeRead(RevisionSourceCodeBase):
    """Full revision_source_code representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
