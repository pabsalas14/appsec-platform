"""Runtime LLM resuelto (BD o env) para agentes SCR."""

from __future__ import annotations

import os
from dataclasses import dataclass

from app.services.ia_provider import AIProvider, AIProviderType, get_ai_provider
from app.services.scr_llm_catalog import ANTHROPIC_DEFAULT_MODEL, default_base_url, normalize_model


@dataclass(frozen=True, slots=True)
class ScrLlmRuntime:
    provider: AIProviderType
    model: str
    api_key: str
    temperature: float
    max_tokens: int
    timeout_seconds: int
    base_url: str | None = None


def get_ai_provider_for_scr_runtime(
    llm: ScrLlmRuntime | None,
    *,
    env_fallback_model: str = ANTHROPIC_DEFAULT_MODEL,
) -> AIProvider:
    """
    Instancia de proveedor para agentes SCR: config de plataforma (BD) o env (Anthropic).
    """
    if llm is not None:
        base_url = llm.base_url or default_base_url(llm.provider.value)
        if llm.provider == AIProviderType.OLLAMA and not llm.base_url:
            base_url = os.getenv("OLLAMA_BASE_URL", base_url or "http://localhost:11434")
        kwargs = {"model": normalize_model(llm.provider.value, llm.model), "timeout_seconds": llm.timeout_seconds}
        if base_url and llm.provider != AIProviderType.ANTHROPIC:
            kwargs["base_url"] = base_url
        if llm.api_key:
            kwargs["api_key"] = llm.api_key
        return get_ai_provider(llm.provider, **kwargs)

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        msg = "ANTHROPIC_API_KEY no está definida y no hay configuración LLM en plataforma"
        raise ValueError(msg)
    return get_ai_provider(
        AIProviderType.ANTHROPIC,
        api_key=api_key,
        model=normalize_model("anthropic", env_fallback_model),
    )
