"""EjecucionDast schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

AMBIENTES = {"Desarrollo", "Staging", "QA", "Produccion"}
RESULTADOS = {"Pendiente", "Exitosa", "Fallida", "En Progreso"}


class EjecucionDastBase(BaseModel):
    programa_dast_id: UUID
    fecha_inicio: datetime
    fecha_fin: datetime | None = None
    ambiente: str = Field(..., description="Desarrollo | Staging | QA | Produccion")
    herramienta: str | None = Field(None, max_length=100)
    resultado: str = Field(..., description="Pendiente | Exitosa | Fallida | En Progreso")
    notas: str | None = None

    @model_validator(mode="after")
    def validate_fechas(self) -> "EjecucionDastBase":
        if self.fecha_fin is not None and self.fecha_fin < self.fecha_inicio:
            raise ValueError("fecha_fin debe ser posterior a fecha_inicio")
        return self

    def model_post_init(self, _: dict) -> None:
        if self.ambiente not in AMBIENTES:
            raise ValueError(f"ambiente debe ser uno de {sorted(AMBIENTES)}")
        if self.resultado not in RESULTADOS:
            raise ValueError(f"resultado debe ser uno de {sorted(RESULTADOS)}")


class EjecucionDastCreate(EjecucionDastBase):
    """Fields required to create a ejecucion_dast. user_id is set from auth context."""
    pass


class EjecucionDastUpdate(BaseModel):
    """All fields optional for partial updates."""
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    ambiente: str | None = None
    herramienta: str | None = Field(None, max_length=100)
    resultado: str | None = None
    notas: str | None = None

    def model_post_init(self, _: dict) -> None:
        if self.ambiente is not None and self.ambiente not in AMBIENTES:
            raise ValueError(f"ambiente debe ser uno de {sorted(AMBIENTES)}")
        if self.resultado is not None and self.resultado not in RESULTADOS:
            raise ValueError(f"resultado debe ser uno de {sorted(RESULTADOS)}")


class EjecucionDastRead(EjecucionDastBase):
    """Full ejecucion_dast representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
