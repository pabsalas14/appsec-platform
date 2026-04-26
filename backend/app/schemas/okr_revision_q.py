"""OkrRevisionQ schemas — Pydantic v2."""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_Q_STATES = ("draft", "en_revision", "aprobado", "editado", "rechazado", "cerrado")
QState = Literal["draft", "en_revision", "aprobado", "editado", "rechazado", "cerrado"]


class OkrRevisionQBase(BaseModel):
    subcompromiso_id: UUID
    quarter: str
    avance_reportado: float = Field(ge=0, le=100)
    avance_validado: Optional[float] = Field(default=None, ge=0, le=100)
    comentario_colaborador: Optional[str] = None
    feedback_evaluador: Optional[str] = None
    estado: QState = "draft"

    @field_validator("quarter")
    @classmethod
    def validate_quarter(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if cleaned not in {"Q1", "Q2", "Q3", "Q4"}:
            raise ValueError("quarter debe ser Q1, Q2, Q3 o Q4")
        return cleaned


class OkrRevisionQCreate(OkrRevisionQBase):
    """Fields required to create a okr_revision_q. user_id is set from auth context."""
    pass


class OkrRevisionQUpdate(BaseModel):
    """All fields optional for partial updates."""
    subcompromiso_id: Optional[UUID] = None
    quarter: Optional[str] = None
    avance_reportado: Optional[float] = Field(default=None, ge=0, le=100)
    avance_validado: Optional[float] = Field(default=None, ge=0, le=100)
    comentario_colaborador: Optional[str] = None
    feedback_evaluador: Optional[str] = None
    estado: Optional[QState] = None

    @field_validator("quarter")
    @classmethod
    def validate_optional_quarter(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip().upper()
        if cleaned not in {"Q1", "Q2", "Q3", "Q4"}:
            raise ValueError("quarter debe ser Q1, Q2, Q3 o Q4")
        return cleaned


class OkrRevisionQRead(OkrRevisionQBase):
    """Full okr_revision_q representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class OkrRevisionSubmitPayload(BaseModel):
    comentario_colaborador: Optional[str] = None


class OkrRevisionApprovePayload(BaseModel):
    avance_validado: float = Field(ge=0, le=100)
    feedback_evaluador: Optional[str] = None


class OkrRevisionEditadoPayload(BaseModel):
    avance_validado: float = Field(ge=0, le=100)
    feedback_evaluador: Optional[str] = None


class OkrRevisionRejectPayload(BaseModel):
    feedback_evaluador: str = Field(min_length=1)
