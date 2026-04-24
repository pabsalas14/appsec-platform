"""Schemas for IA provider runtime configuration."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


IAProvider = Literal["ollama", "anthropic", "openai", "openrouter"]


class IAConfigRead(BaseModel):
    proveedor_activo: IAProvider
    modelo: str
    temperatura: float = Field(ge=0, le=1)
    max_tokens: int = Field(gt=0)
    timeout_segundos: int = Field(gt=0)
    sanitizar_datos_paga: bool


class IAConfigUpdate(BaseModel):
    proveedor_activo: IAProvider | None = None
    modelo: str | None = None
    temperatura: float | None = Field(default=None, ge=0, le=1)
    max_tokens: int | None = Field(default=None, gt=0)
    timeout_segundos: int | None = Field(default=None, gt=0)
    sanitizar_datos_paga: bool | None = None


class IATestCallRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=8000)
    dry_run: bool = True


class IATestCallRead(BaseModel):
    provider: IAProvider
    model: str
    content: str
    usage: dict[str, int] | None = None
    dry_run: bool = False
