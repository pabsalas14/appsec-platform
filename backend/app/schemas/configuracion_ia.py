"""ConfiguracionIA schemas — pydantic models for API validation."""

from __future__ import annotations

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ConfiguracionIABase(BaseModel):
    """Shared fields."""

    provider: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=256)
    temperatura: float = Field(ge=0.0, le=2.0, default=0.7)
    max_tokens: int = Field(ge=1, le=1000000, default=4096)
    enabled: bool = False


class ConfiguracionIACreate(ConfiguracionIABase):
    """Payload for POST /configuraciones-ia."""

    api_key: str = Field(min_length=1)


class ConfiguracionIAUpdate(BaseModel):
    """Payload for PATCH /configuraciones-ia/{id}."""

    api_key: str | None = Field(default=None, min_length=1)
    model: str | None = None
    temperatura: float | None = Field(default=None, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1, le=1000000)
    enabled: bool | None = None


class ConfiguracionIARead(ConfiguracionIABase):
    """Response model for GET /configuraciones-ia/{id} (key NOT exposed)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


class ConfiguracionIAList(BaseModel):
    """Response model for GET /configuraciones-ia (paginated list)."""

    model_config = ConfigDict(from_attributes=True)

    items: list[ConfiguracionIARead]
    total: int
    skip: int
    limit: int


__all__ = [
    "ConfiguracionIACreate",
    "ConfiguracionIARead",
    "ConfiguracionIAUpdate",
    "ConfiguracionIAList",
]
