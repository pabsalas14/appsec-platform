"""OkrRevisionQ schemas — Pydantic v2."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

VALID_Q_STATES = ("draft", "en_revision", "aprobado", "editado", "rechazado", "cerrado")
QState = Literal["draft", "en_revision", "aprobado", "editado", "rechazado", "cerrado"]


class OkrRevisionQBase(BaseModel):
    subcompromiso_id: UUID
    quarter: str
    avance_reportado: float = Field(ge=0, le=100)
    avance_validado: float | None = Field(default=None, ge=0, le=100)
    comentario_colaborador: str | None = None
    feedback_evaluador: str | None = None
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

    subcompromiso_id: UUID | None = None
    quarter: str | None = None
    avance_reportado: float | None = Field(default=None, ge=0, le=100)
    avance_validado: float | None = Field(default=None, ge=0, le=100)
    comentario_colaborador: str | None = None
    feedback_evaluador: str | None = None
    estado: QState | None = None

    @field_validator("quarter")
    @classmethod
    def validate_optional_quarter(cls, value: str | None) -> str | None:
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
    comentario_colaborador: str | None = None


class OkrRevisionApprovePayload(BaseModel):
    avance_validado: float = Field(ge=0, le=100)
    feedback_evaluador: str | None = None


class OkrRevisionEditadoPayload(BaseModel):
    avance_validado: float = Field(ge=0, le=100)
    feedback_evaluador: str | None = None


class OkrRevisionRejectPayload(BaseModel):
    feedback_evaluador: str = Field(min_length=1)
