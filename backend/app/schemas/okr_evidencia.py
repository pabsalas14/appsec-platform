"""OkrEvidencia schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OkrEvidenciaBase(BaseModel):
    revision_q_id: UUID
    attachment_id: Optional[UUID] = None
    url_evidencia: Optional[str] = None
    nombre_archivo: Optional[str] = None
    tipo_evidencia: str


class OkrEvidenciaCreate(OkrEvidenciaBase):
    """Fields required to create a okr_evidencia. user_id is set from auth context."""
    pass


class OkrEvidenciaUpdate(BaseModel):
    """All fields optional for partial updates."""
    revision_q_id: Optional[UUID] = None
    attachment_id: Optional[UUID] = None
    url_evidencia: Optional[str] = None
    nombre_archivo: Optional[str] = None
    tipo_evidencia: Optional[str] = None


class OkrEvidenciaRead(OkrEvidenciaBase):
    """Full okr_evidencia representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
