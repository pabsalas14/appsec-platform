"""AI Provider abstraction and runtime execution helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.system_setting import SystemSetting
from app.schemas.ia_config import IAConfigRead

IA_KEYS_DEFAULTS = {
    "ia.proveedor_activo": "ollama",
    "ia.modelo": "llama3.1:8b",
    "ia.temperatura": 0.3,
    "ia.max_tokens": 4096,
    "ia.timeout_segundos": 60,
    "ia.sanitizar_datos_paga": True,
}


class IAProviderError(RuntimeError):
    """Raised when provider configuration or invocation fails."""


@dataclass(slots=True)
class IAResult:
    provider: str
    model: str
    content: str
    usage: dict[str, int] | None = None
    raw: dict[str, Any] | None = None


class BaseIAProvider:
    provider_name: str

    def __init__(self, config: IAConfigRead):
        self.config = config

    async def generate(self, prompt: str) -> IAResult:
        raise NotImplementedError


class OllamaProvider(BaseIAProvider):
    provider_name = "ollama"

    async def generate(self, prompt: str) -> IAResult:
        url = f"{settings.OLLAMA_URL.rstrip('/')}/api/generate"
        payload = {
            "model": self.config.modelo,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": self.config.temperatura,
            },
        }
        async with httpx.AsyncClient(timeout=self.config.timeout_segundos) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            body = resp.json()
        return IAResult(
            provider=self.provider_name,
            model=self.config.modelo,
            content=body.get("response", ""),
            raw=body,
        )


class OpenAIProvider(BaseIAProvider):
    provider_name = "openai"

    async def generate(self, prompt: str) -> IAResult:
        if not settings.OPENAI_API_KEY:
            raise IAProviderError("OPENAI_API_KEY no configurada.")
        payload = {
            "model": self.config.modelo,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.config.temperatura,
            "max_tokens": self.config.max_tokens,
        }
        headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
        async with httpx.AsyncClient(timeout=self.config.timeout_segundos) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            body = resp.json()
        choice = body.get("choices", [{}])[0]
        message = choice.get("message", {})
        usage_raw = body.get("usage", {})
        usage = {
            "prompt_tokens": int(usage_raw.get("prompt_tokens", 0)),
            "completion_tokens": int(usage_raw.get("completion_tokens", 0)),
            "total_tokens": int(usage_raw.get("total_tokens", 0)),
        }
        return IAResult(
            provider=self.provider_name,
            model=self.config.modelo,
            content=message.get("content", ""),
            usage=usage,
            raw=body,
        )


class AnthropicProvider(BaseIAProvider):
    provider_name = "anthropic"

    async def generate(self, prompt: str) -> IAResult:
        if not settings.ANTHROPIC_API_KEY:
            raise IAProviderError("ANTHROPIC_API_KEY no configurada.")
        payload = {
            "model": self.config.modelo,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperatura,
            "messages": [{"role": "user", "content": prompt}],
        }
        headers = {
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
        }
        async with httpx.AsyncClient(timeout=self.config.timeout_segundos) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            body = resp.json()
        content_blocks = body.get("content", [])
        text_parts = [block.get("text", "") for block in content_blocks if block.get("type") == "text"]
        usage_raw = body.get("usage", {})
        usage = {
            "prompt_tokens": int(usage_raw.get("input_tokens", 0)),
            "completion_tokens": int(usage_raw.get("output_tokens", 0)),
            "total_tokens": int(usage_raw.get("input_tokens", 0))
            + int(usage_raw.get("output_tokens", 0)),
        }
        return IAResult(
            provider=self.provider_name,
            model=self.config.modelo,
            content="\n".join([p for p in text_parts if p]),
            usage=usage,
            raw=body,
        )


class OpenRouterProvider(BaseIAProvider):
    provider_name = "openrouter"

    async def generate(self, prompt: str) -> IAResult:
        if not settings.OPENROUTER_API_KEY:
            raise IAProviderError("OPENROUTER_API_KEY no configurada.")
        payload = {
            "model": self.config.modelo,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": self.config.temperatura,
            "max_tokens": self.config.max_tokens,
        }
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "HTTP-Referer": "https://appsec-platform.local",
            "X-Title": "appsec-platform",
        }
        async with httpx.AsyncClient(timeout=self.config.timeout_segundos) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            body = resp.json()
        choice = body.get("choices", [{}])[0]
        message = choice.get("message", {})
        usage_raw = body.get("usage", {})
        usage = {
            "prompt_tokens": int(usage_raw.get("prompt_tokens", 0)),
            "completion_tokens": int(usage_raw.get("completion_tokens", 0)),
            "total_tokens": int(usage_raw.get("total_tokens", 0)),
        }
        return IAResult(
            provider=self.provider_name,
            model=self.config.modelo,
            content=message.get("content", ""),
            usage=usage,
            raw=body,
        )


PROVIDER_MAP = {
    "ollama": OllamaProvider,
    "openai": OpenAIProvider,
    "anthropic": AnthropicProvider,
    "openrouter": OpenRouterProvider,
}


async def read_ia_config(db: AsyncSession) -> IAConfigRead:
    rows = (
        await db.execute(
            select(SystemSetting).where(SystemSetting.key.in_(list(IA_KEYS_DEFAULTS.keys())))
        )
    ).scalars().all()
    values = {row.key: row.value for row in rows}
    return IAConfigRead(
        proveedor_activo=values.get("ia.proveedor_activo", IA_KEYS_DEFAULTS["ia.proveedor_activo"]),
        modelo=values.get("ia.modelo", IA_KEYS_DEFAULTS["ia.modelo"]),
        temperatura=values.get("ia.temperatura", IA_KEYS_DEFAULTS["ia.temperatura"]),
        max_tokens=values.get("ia.max_tokens", IA_KEYS_DEFAULTS["ia.max_tokens"]),
        timeout_segundos=values.get(
            "ia.timeout_segundos", IA_KEYS_DEFAULTS["ia.timeout_segundos"]
        ),
        sanitizar_datos_paga=values.get(
            "ia.sanitizar_datos_paga", IA_KEYS_DEFAULTS["ia.sanitizar_datos_paga"]
        ),
    )


async def run_prompt(
    db: AsyncSession,
    *,
    prompt: str,
    dry_run: bool = False,
) -> IAResult:
    cfg = await read_ia_config(db)
    provider_cls = PROVIDER_MAP.get(cfg.proveedor_activo)
    if provider_cls is None:
        raise IAProviderError(f"Proveedor IA no soportado: {cfg.proveedor_activo}")

    if dry_run:
        return IAResult(
            provider=cfg.proveedor_activo,
            model=cfg.modelo,
            content="Dry run: configuración válida, ejecución omitida.",
            usage=None,
            raw={"dry_run": True},
        )

    provider = provider_cls(cfg)
    return await provider.generate(prompt)
