"""OkrCierreQ schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OkrCierreQBase(BaseModel):
    plan_id: UUID
    quarter: str
    retroalimentacion_general: str = Field(min_length=1)
    cerrado_at: datetime

    @field_validator("quarter")
    @classmethod
    def validate_quarter(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if cleaned not in {"Q1", "Q2", "Q3", "Q4"}:
            raise ValueError("quarter debe ser Q1, Q2, Q3 o Q4")
        return cleaned


class OkrCierreQCreate(OkrCierreQBase):
    """Fields required to create a okr_cierre_q. user_id is set from auth context."""
    pass


class OkrCierreQUpdate(BaseModel):
    """All fields optional for partial updates."""
    plan_id: Optional[UUID] = None
    quarter: Optional[str] = None
    retroalimentacion_general: Optional[str] = Field(default=None, min_length=1)
    cerrado_at: Optional[datetime] = None

    @field_validator("quarter")
    @classmethod
    def validate_optional_quarter(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        cleaned = value.strip().upper()
        if cleaned not in {"Q1", "Q2", "Q3", "Q4"}:
            raise ValueError("quarter debe ser Q1, Q2, Q3 o Q4")
        return cleaned


class OkrCierreQRead(OkrCierreQBase):
    """Full okr_cierre_q representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class OkrCloseQuarterPayload(BaseModel):
    quarter: str
    retroalimentacion_general: str = Field(min_length=1)

    @field_validator("quarter")
    @classmethod
    def validate_close_quarter(cls, value: str) -> str:
        cleaned = value.strip().upper()
        if cleaned not in {"Q1", "Q2", "Q3", "Q4"}:
            raise ValueError("quarter debe ser Q1, Q2, Q3 o Q4")
        return cleaned
