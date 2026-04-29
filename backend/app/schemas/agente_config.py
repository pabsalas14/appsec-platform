"""Schemas for agent configuration customization."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from uuid import UUID


class AgentePatronBase(BaseModel):
    """Base schema for agent pattern."""

    tipo: str = Field(..., description="Tipo de patrón (ej: EXEC_ENV_BACKDOOR)")
    descripcion: str = Field(..., description="Descripción del patrón a detectar")
    severidad: str = Field(..., description="Nivel de severidad: CRITICO, ALTO, MEDIO, BAJO")


class AgenteConfigBase(BaseModel):
    """Base schema for agent configuration."""

    agente_tipo: str = Field(..., description="Tipo de agente: inspector, fiscal, detective")
    usuario_id: Optional[UUID] = Field(None, description="ID del usuario (opcional)")
    revision_id: Optional[UUID] = Field(None, description="ID de la revisión (opcional)")
    patrones_personalizados: Optional[Dict[str, str]] = Field(
        None, description="Patrones personalizados en formato {tipo: descripcion}"
    )
    prompt_sistema_personalizado: Optional[str] = Field(None, description="Prompt del sistema personalizado")
    parametros_llm: Optional[Dict[str, Any]] = Field(None, description="Parámetros de LLM personalizados")
    proveedor_preferido: Optional[str] = Field(None, description="Proveedor LLM preferido")
    activo: bool = Field(True, description="Si la configuración está activa")


class AgenteConfigCreate(AgenteConfigBase):
    """Schema for creating agent configuration."""

    pass


class AgenteConfigUpdate(BaseModel):
    """Schema for updating agent configuration."""

    patrones_personalizados: Optional[Dict[str, str]] = None
    prompt_sistema_personalizado: Optional[str] = None
    parametros_llm: Optional[Dict[str, Any]] = None
    proveedor_preferido: Optional[str] = None
    activo: Optional[bool] = None


class AgenteConfigRead(AgenteConfigBase):
    """Schema for reading agent configuration."""

    id: UUID
    creado_en: str
    actualizado_en: str

    class Config:
        from_attributes = True


class AgenteConfigList(BaseModel):
    """Schema for listing agent configurations."""

    items: List[AgenteConfigRead]
    total: int
    page: int
    size: int
