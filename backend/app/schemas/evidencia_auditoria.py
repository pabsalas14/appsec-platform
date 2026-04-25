"""EvidenciaAuditoria schema — audit evidence with SHA-256 hash."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class EvidenciaAuditoriaBase(BaseModel):
    """Base schema for EvidenciaAuditoria."""

    nombre_archivo: str = Field(..., min_length=1, max_length=255)
    tipo_evidencia: str = Field(..., min_length=1, max_length=100)
    url_archivo: str = Field(..., max_length=512)
    hash_sha256: str = Field(..., max_length=64)
    auditoria_id: UUID = Field(...)


class EvidenciaAuditoriaCreate(EvidenciaAuditoriaBase):
    """Schema for creating EvidenciaAuditoria."""

    pass


class EvidenciaAuditoriaUpdate(BaseModel):
    """Schema for updating EvidenciaAuditoria (all fields optional)."""

    nombre_archivo: str | None = Field(None, min_length=1, max_length=255)
    tipo_evidencia: str | None = Field(None, min_length=1, max_length=100)
    url_archivo: str | None = Field(None, max_length=512)
    hash_sha256: str | None = Field(None, max_length=64)


class EvidenciaAuditoriaRead(EvidenciaAuditoriaBase):
    """Schema for reading EvidenciaAuditoria."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
