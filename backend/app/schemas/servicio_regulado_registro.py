"""ServicioReguladoRegistro schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

CICLOS = {"Q1", "Q2", "Q3", "Q4", "Anual"}
ESTADOS_REGISTRO = {"Pendiente", "En Revision", "Cumplido", "No Cumplido", "Parcial"}


class ServicioReguladoRegistroBase(BaseModel):
    servicio_id: UUID
    nombre_regulacion: str = Field(..., min_length=1, max_length=255)
    ciclo: str = Field(..., description="Q1 | Q2 | Q3 | Q4 | Anual")
    ano: int = Field(..., ge=2000, le=2100)
    estado: str = Field(default="Pendiente", description="Pendiente | En Revision | Cumplido | No Cumplido | Parcial")

    def model_post_init(self, _: dict) -> None:
        if self.ciclo not in CICLOS:
            raise ValueError(f"ciclo debe ser uno de {sorted(CICLOS)}")
        if self.estado not in ESTADOS_REGISTRO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_REGISTRO)}")


class ServicioReguladoRegistroCreate(ServicioReguladoRegistroBase):
    """Fields required to create a servicio_regulado_registro. user_id is set from auth context."""

    pass


class ServicioReguladoRegistroUpdate(BaseModel):
    """All fields optional for partial updates."""

    nombre_regulacion: str | None = Field(None, min_length=1, max_length=255)
    ciclo: str | None = None
    ano: int | None = Field(None, ge=2000, le=2100)
    estado: str | None = None

    def model_post_init(self, _: dict) -> None:
        if self.ciclo is not None and self.ciclo not in CICLOS:
            raise ValueError(f"ciclo debe ser uno de {sorted(CICLOS)}")
        if self.estado is not None and self.estado not in ESTADOS_REGISTRO:
            raise ValueError(f"estado debe ser uno de {sorted(ESTADOS_REGISTRO)}")


class ServicioReguladoRegistroRead(ServicioReguladoRegistroBase):
    """Full servicio_regulado_registro representation returned from the API."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
