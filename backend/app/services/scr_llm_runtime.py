"""Runtime LLM resuelto (BD o env) para agentes SCR.

Este módulo proporciona la abstracción de LLM para todos los agentes SCR (Inspector, Detective, Fiscal).
Soporta múltiples proveedores: Anthropic, OpenAI, Ollama, OpenRouter, LiteLLM, Nvidia NIM, Google Gemini, LM Studio.

Características:
- Resolución de config de BD o variables de entorno
- Fallback automático a Anthropic si no hay config
- Soporte para base URLs personalizadas (self-hosted Ollama, LiteLLM, etc)
- Integración con error handler para retry y fallback de proveedores
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from app.core.logging import logger
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
    """Instancia de proveedor para agentes SCR: config de plataforma (BD) o env (Anthropic).

    Estrategia de resolución:
    1. Si llm != None: Usa config de BD (provider, model, api_key, timeout, base_url)
    2. Si llm == None: Intenta env variables (ANTHROPIC_API_KEY, etc)
    3. Si no hay env: Usa fallback ANTHROPIC_DEFAULT_MODEL

    Args:
        llm (ScrLlmRuntime | None): Config LLM desde BD o None para env fallback
        env_fallback_model (str): Modelo Anthropic de fallback (default: claude-3-5-sonnet)

    Returns:
        AIProvider: Instancia de proveedor configurado y listo para usar

    Raises:
        ValueError: Si no hay API key disponible para el provider elegido

    Example:
        >>> # Desde BD config
        >>> provider = get_ai_provider_for_scr_runtime(
        ...     llm=ScrLlmRuntime(
        ...         provider=AIProviderType.OPENAI,
        ...         model="gpt-4",
        ...         api_key="sk-...",
        ...         temperature=0.3,
        ...         max_tokens=4000,
        ...         timeout_seconds=30
        ...     )
        ... )
        >>> # Desde env (fallback)
        >>> provider = get_ai_provider_for_scr_runtime(llm=None)
        # Uses ANTHROPIC_API_KEY from environment
    """
    if llm is not None:
        logger.info(
            "llm.runtime.from_config",
            extra={
                "provider": llm.provider.value,
                "model": llm.model,
                "timeout_seconds": llm.timeout_seconds,
                "has_base_url": llm.base_url is not None,
            },
        )

        base_url = llm.base_url or default_base_url(llm.provider.value)
        if llm.provider == AIProviderType.OLLAMA and not llm.base_url:
            base_url = os.getenv("OLLAMA_BASE_URL", base_url or "http://localhost:11434")

        kwargs = {"model": normalize_model(llm.provider.value, llm.model), "timeout_seconds": llm.timeout_seconds}
        if base_url and llm.provider != AIProviderType.ANTHROPIC:
            kwargs["base_url"] = base_url
        if llm.api_key:
            kwargs["api_key"] = llm.api_key

        try:
            provider = get_ai_provider(llm.provider, **kwargs)
            logger.info("llm.runtime.configured", extra={"provider": llm.provider.value})
            return provider
        except Exception as e:
            logger.error(
                "llm.runtime.config_failed",
                extra={"provider": llm.provider.value, "error": str(e)},
            )
            raise

    # Fallback a variables de entorno
    logger.info("llm.runtime.from_env", extra={"fallback_model": env_fallback_model})

    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        msg = "ANTHROPIC_API_KEY no está definida y no hay configuración LLM en plataforma"
        logger.error("llm.runtime.no_api_key", extra={"error": msg})
        raise ValueError(msg)

    provider = get_ai_provider(
        AIProviderType.ANTHROPIC,
        api_key=api_key,
        model=normalize_model("anthropic", env_fallback_model),
    )
    logger.info("llm.runtime.env_fallback_success", extra={"model": env_fallback_model})
    return provider
