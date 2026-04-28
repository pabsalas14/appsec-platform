"""OkrPlanAnual schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OkrPlanAnualBase(BaseModel):
    colaborador_id: UUID
    evaluador_id: UUID
    ano: int
    estado: str
    fecha_aprobado: datetime | None = None
    aprobado_por_id: UUID | None = None


class OkrPlanAnualCreate(OkrPlanAnualBase):
    """Fields required to create a okr_plan_anual. user_id is set from auth context."""
    pass


class OkrPlanAnualUpdate(BaseModel):
    """All fields optional for partial updates."""
    colaborador_id: UUID | None = None
    evaluador_id: UUID | None = None
    ano: int | None = None
    estado: str | None = None
    fecha_aprobado: datetime | None = None
    aprobado_por_id: UUID | None = None


class OkrPlanAnualRead(OkrPlanAnualBase):
    """Full okr_plan_anual representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
