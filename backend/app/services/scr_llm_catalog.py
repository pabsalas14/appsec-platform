"""Catálogo y utilidades de proveedores LLM soportados por SCR."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.exceptions import BadRequestException

ANTHROPIC_DEFAULT_MODEL = "claude-sonnet-4-5"
ANTHROPIC_FALLBACK_MODELS = [
    "claude-sonnet-4-5",
    "claude-sonnet-4-20250514",
    "claude-opus-4-1",
    "claude-opus-4-20250514",
]

LLM_PROVIDER_CATALOG: dict[str, dict[str, Any]] = {
    "anthropic": {
        "label": "Anthropic",
        "models": [
            *ANTHROPIC_FALLBACK_MODELS,
            "claude-sonnet-4-6",
            "claude-3-5-haiku-20241022",
        ],
        "requires_api_key": True,
        "supports_dynamic_models": False,
    },
    "openai": {
        "label": "OpenAI",
        "models": ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini"],
        "requires_api_key": True,
        "supports_dynamic_models": True,
        "default_base_url": "https://api.openai.com/v1",
    },
    "openrouter": {
        "label": "OpenRouter",
        "models": ["openrouter/auto", "anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-2.0-flash"],
        "requires_api_key": True,
        "supports_dynamic_models": True,
        "default_base_url": "https://openrouter.ai/api/v1",
    },
    "litellm": {
        "label": "LiteLLM",
        "models": ["gpt-4o", "claude-3-5-sonnet", "gemini-2.0-flash", "custom-model"],
        "requires_api_key": False,
        "supports_dynamic_models": True,
        "default_base_url": "http://localhost:4000",
    },
    "ollama": {
        "label": "Ollama",
        "models": ["llama3.2", "llama3.1", "mistral", "codellama", "qwen2.5-coder"],
        "requires_api_key": False,
        "supports_dynamic_models": True,
        "default_base_url": "http://localhost:11434",
    },
    "lmstudio": {
        "label": "LM Studio",
        "models": ["local-model"],
        "requires_api_key": False,
        "supports_dynamic_models": True,
        "default_base_url": "http://localhost:1234/v1",
    },
    "gemini": {
        "label": "Google Gemini",
        "models": ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
        "requires_api_key": True,
        "supports_dynamic_models": True,
        "default_base_url": "https://generativelanguage.googleapis.com/v1",
    },
    "nvidia_nim": {
        "label": "NVIDIA NIM",
        "models": ["meta/llama-3.1-70b-instruct", "mistralai/mixtral-8x7b-instruct-v0.1", "custom-nim-model"],
        "requires_api_key": True,
        "supports_dynamic_models": True,
        "default_base_url": "https://integrate.api.nvidia.com/v1",
    },
}


def normalize_provider(provider: str) -> str:
    normalized = (provider or "").strip().lower().replace("-", "_")
    if normalized not in LLM_PROVIDER_CATALOG:
        raise BadRequestException(f"Proveedor no soportado: {provider}")
    return normalized


def provider_catalog_payload() -> list[dict[str, Any]]:
    return [{"provider": key, **value} for key, value in LLM_PROVIDER_CATALOG.items()]


def default_base_url(provider: str) -> str | None:
    return LLM_PROVIDER_CATALOG[normalize_provider(provider)].get("default_base_url")


def normalize_model(provider: str, model: str | None) -> str:
    normalized_provider = normalize_provider(provider)
    requested = (model or "").strip()
    if normalized_provider != "anthropic":
        return requested or str((LLM_PROVIDER_CATALOG[normalized_provider].get("models") or [""])[0])
    retired_aliases = {
        "claude-3-5-sonnet": ANTHROPIC_DEFAULT_MODEL,
        "claude-3-5-sonnet-20241022": ANTHROPIC_DEFAULT_MODEL,
        "claude-opus-4-1": "claude-opus-4-1",
    }
    return retired_aliases.get(requested, requested or ANTHROPIC_DEFAULT_MODEL)


async def fetch_provider_models(provider: str, *, api_key: str = "", base_url: str | None = None) -> list[str]:
    """Carga modelos desde el proveedor cuando existe API pública; si falla retorna catálogo estático."""
    normalized = normalize_provider(provider)
    catalog = LLM_PROVIDER_CATALOG[normalized]
    fallback = list(catalog.get("models") or [])
    base = (base_url or catalog.get("default_base_url") or "").rstrip("/")

    try:
        headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
        timeout = 10.0
        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            if normalized == "ollama":
                response = await client.get(f"{base}/api/tags")
                response.raise_for_status()
                return [str(row.get("name")) for row in response.json().get("models", []) if row.get("name")] or fallback

            if normalized == "gemini":
                response = await client.get(f"{base}/models", params={"key": api_key})
                response.raise_for_status()
                rows = response.json().get("models", [])
                return [str(row.get("name", "")).replace("models/", "") for row in rows if row.get("name")] or fallback

            response = await client.get(f"{base}/models")
            response.raise_for_status()
            rows = response.json().get("data", [])
            return [str(row.get("id")) for row in rows if row.get("id")] or fallback
    except Exception:
        return fallback
