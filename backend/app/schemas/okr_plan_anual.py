"""OkrPlanAnual schemas — Pydantic v2."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OkrPlanAnualBase(BaseModel):
    colaborador_id: UUID
    evaluador_id: UUID
    ano: int
    estado: str
    fecha_aprobado: Optional[datetime] = None
    aprobado_por_id: Optional[UUID] = None


class OkrPlanAnualCreate(OkrPlanAnualBase):
    """Fields required to create a okr_plan_anual. user_id is set from auth context."""
    pass


class OkrPlanAnualUpdate(BaseModel):
    """All fields optional for partial updates."""
    colaborador_id: Optional[UUID] = None
    evaluador_id: Optional[UUID] = None
    ano: Optional[int] = None
    estado: Optional[str] = None
    fecha_aprobado: Optional[datetime] = None
    aprobado_por_id: Optional[UUID] = None


class OkrPlanAnualRead(OkrPlanAnualBase):
    """Full okr_plan_anual representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
