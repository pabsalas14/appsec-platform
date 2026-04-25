"""RevisionTercero schemas — Pydantic v2."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TIPOS_VALIDOS = [
    "Pentest",
    "Auditoria de Codigo",
    "Evaluacion de Arquitectura",
    "Revision de Configuracion",
    "Otro",
]

ESTADOS_VALIDOS = [
    "Planificada",
    "En Curso",
    "Completada",
    "Cancelada",
]


class RevisionTerceroBase(BaseModel):
    nombre_empresa: str
    tipo: str
    servicio_id: UUID | None = None
    activo_web_id: UUID | None = None
    fecha_inicio: datetime
    fecha_fin: datetime | None = None
    estado: str = "Planificada"
    informe_filename: str | None = None
    # SHA-256 del informe para integridad (A3)
    informe_sha256: str | None = Field(default=None, max_length=64)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str) -> str:
        if v not in TIPOS_VALIDOS:
            raise ValueError(
                f"tipo '{v}' inválido. Valores permitidos: {TIPOS_VALIDOS}"
            )
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str) -> str:
        if v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}"
            )
        return v

    @model_validator(mode="after")
    def validate_activo(self) -> "RevisionTerceroBase":
        """Al menos servicio_id o activo_web_id debe estar presente."""
        if self.servicio_id is None and self.activo_web_id is None:
            raise ValueError(
                "Debe especificar servicio_id o activo_web_id (o ambos)."
            )
        return self


class RevisionTerceroCreate(RevisionTerceroBase):
    """Fields required to create a revision_tercero. user_id is set from auth context."""
    pass


class RevisionTerceroUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre_empresa: str | None = None
    tipo: str | None = None
    servicio_id: UUID | None = None
    activo_web_id: UUID | None = None
    fecha_inicio: datetime | None = None
    fecha_fin: datetime | None = None
    estado: str | None = None
    informe_filename: str | None = None
    informe_sha256: str | None = Field(default=None, max_length=64)

    @field_validator("tipo")
    @classmethod
    def validate_tipo(cls, v: str | None) -> str | None:
        if v is not None and v not in TIPOS_VALIDOS:
            raise ValueError(
                f"tipo '{v}' inválido. Valores permitidos: {TIPOS_VALIDOS}"
            )
        return v

    @field_validator("estado")
    @classmethod
    def validate_estado(cls, v: str | None) -> str | None:
        if v is not None and v not in ESTADOS_VALIDOS:
            raise ValueError(
                f"estado '{v}' inválido. Valores permitidos: {ESTADOS_VALIDOS}"
            )
        return v


class RevisionTerceroRead(RevisionTerceroBase):
    """Full revision_tercero representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
