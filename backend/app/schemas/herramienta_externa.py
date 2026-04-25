"""HerramientaExterna schemas — Pydantic v2."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

ValidTipos = Literal['SAST', 'DAST', 'SCA', 'TM', 'MAST', 'Terceros', 'CI/CD', 'BugBounty', 'VulnerabilityManager']


class HerramientaExternaBase(BaseModel):
    nombre: str = Field(..., max_length=255)
    tipo: ValidTipos
    url_base: str | None = Field(None, max_length=255)


class HerramientaExternaCreate(HerramientaExternaBase):
    """Fields required to create a herramienta_externa. user_id is set from auth context."""
    api_token: str | None = Field(None, max_length=255)


class HerramientaExternaUpdate(BaseModel):
    """All fields optional for partial updates."""
    nombre: str | None = Field(None, max_length=255)
    tipo: ValidTipos | None = None
    url_base: str | None = Field(None, max_length=255)
    api_token: str | None = Field(None, max_length=255)


class HerramientaExternaRead(HerramientaExternaBase):
    """Full herramienta_externa representation returned from the API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    api_token: str | None = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode='after')
    def mask_api_token(self) -> 'HerramientaExternaRead':
        """[A7] Data Masking Frontend — Nunca exponer credenciales en crudo.
        
        Siempre se entrega enmascarado hacia el front-end a menos que esté None.
        En DB se guarda cifrado (A5), al cargar a RAM es texto plano, 
        y al serializar a JSON se vuelve ***** para la UI.
        """
        if self.api_token:
            self.api_token = "********"
        return self
