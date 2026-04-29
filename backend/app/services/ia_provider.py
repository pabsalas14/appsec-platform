"""
Phase 22-24: AI Provider Abstraction & Integration
Multi-provider support: Ollama, Anthropic, OpenAI, OpenRouter
"""

import asyncio
import json
import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum, StrEnum
from typing import Any, cast

import httpx
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.ia_config import IAConfigRead, IAProvider
from app.services.json_setting import get_json_setting

logger = logging.getLogger(__name__)


class AIProviderType(StrEnum):
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    OPENROUTER = "openrouter"
    LITELLM = "litellm"


class AIResponse(BaseModel):
    """Unified response from any AI provider"""

    content: str
    tokens_used: int | None = None
    provider: str
    timestamp: Any


class AmenazaResponse(BaseModel):
    """Response schema for threat modeling"""

    stride: str
    threat: str
    dread_damage: int
    dread_reproducibility: int
    dread_exploitability: int
    dread_affected_users: int
    dread_discoverability: int
    mitigations: list[str]


class ClassificationResponse(BaseModel):
    """Response schema for FP triage"""

    classification: str  # Probable False Positive, Requires Review, Confirmed Vulnerability
    confidence: float
    justificacion: str


class AIProvider(ABC):
    """Abstract base class for AI providers"""

    def __init__(self, timeout_seconds: int = 30, max_retries: int = 3):
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AIResponse:
        """Generate response from prompt"""
        pass

    @abstractmethod
    async def classify(
        self,
        text: str,
        categories: list[str],
    ) -> dict[str, Any]:
        """Classify text into categories"""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if provider is available"""
        pass

    async def _retry_with_backoff(
        self,
        coro: Any,
        max_retries: int | None = None,
    ) -> Any:
        """Retry with exponential backoff"""
        retries = max_retries or self.max_retries
        delay = 1

        for attempt in range(retries):
            try:
                return await asyncio.wait_for(coro, timeout=self.timeout_seconds)
            except TimeoutError:
                logger.warning(f"Attempt {attempt + 1} timeout - provider took > {self.timeout_seconds}s")
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2
            except Exception as e:
                logger.error(f"Attempt {attempt + 1} failed: {e}")
                if attempt == retries - 1:
                    raise
                await asyncio.sleep(delay)
                delay *= 2


class OllamaProvider(AIProvider):
    """Local Ollama provider"""

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama2",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.base_url = base_url
        self.model = model
        self.client = httpx.AsyncClient(timeout=self.timeout_seconds)

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AIResponse:
        """Generate using Ollama"""

        full_prompt = f"{system}\n\n{prompt}" if system else prompt

        payload = {
            "model": self.model,
            "prompt": full_prompt,
            "temperature": temperature,
            "stream": False,
        }

        async def call():
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return AIResponse(
                content=data.get("response", ""),
                tokens_used=data.get("eval_count"),
                provider="ollama",
                timestamp=None,
            )

        return await self._retry_with_backoff(call())

    async def classify(self, text: str, categories: list[str]) -> dict[str, Any]:
        """Classify using Ollama"""

        prompt = f"Classify the following text into one of these categories: {', '.join(categories)}\n\nText: {text}\n\nCategory:"

        response = await self.generate(
            prompt=prompt,
            temperature=0.1,
        )

        classification = response.content.strip().split("\n")[0].lower()
        return {
            "classification": classification,
            "provider": "ollama",
        }

    async def health_check(self) -> bool:
        """Check Ollama availability"""

        try:
            response = await self.client.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False


class AnthropicProvider(AIProvider):
    """Anthropic Claude provider"""

    def __init__(
        self,
        api_key: str,
        model: str = "claude-opus",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(
            headers={"x-api-key": api_key},
            timeout=self.timeout_seconds,
        )

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AIResponse:
        """Generate using Anthropic"""

        payload = {
            "model": self.model,
            "max_tokens": max_tokens or 1024,
            "temperature": temperature,
            "system": system or "",
            "messages": [{"role": "user", "content": prompt}],
        }

        async def call():
            response = await self.client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return AIResponse(
                content=data["content"][0]["text"],
                tokens_used=data.get("usage", {}).get("output_tokens"),
                provider="anthropic",
                timestamp=None,
            )

        return await self._retry_with_backoff(call())

    async def classify(self, text: str, categories: list[str]) -> dict[str, Any]:
        """Classify using Anthropic"""

        prompt = f"Classify the following text into one of these categories: {', '.join(categories)}\n\nText: {text}\n\nRespond with ONLY the category name."

        response = await self.generate(
            prompt=prompt,
            temperature=0.1,
        )

        classification = response.content.strip().lower()
        return {
            "classification": classification,
            "provider": "anthropic",
        }

    async def health_check(self) -> bool:
        """Check Anthropic API availability"""

        try:
            # Simple call to verify API key and connectivity
            payload = {
                "model": self.model,
                "max_tokens": 10,
                "messages": [{"role": "user", "content": "test"}],
            }
            response = await self.client.post(
                "https://api.anthropic.com/v1/messages",
                json=payload,
                timeout=5,
            )
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Anthropic health check failed: {e}")
            return False


class OpenAIProvider(AIProvider):
    """OpenAI provider"""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=self.timeout_seconds,
        )

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AIResponse:
        """Generate using OpenAI"""

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 1024,
        }

        async def call():
            response = await self.client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return AIResponse(
                content=data["choices"][0]["message"]["content"],
                tokens_used=data.get("usage", {}).get("completion_tokens"),
                provider="openai",
                timestamp=None,
            )

        return await self._retry_with_backoff(call())

    async def classify(self, text: str, categories: list[str]) -> dict[str, Any]:
        """Classify using OpenAI"""

        prompt = f"Classify: {text}\nCategories: {', '.join(categories)}\nAnswer:"

        response = await self.generate(
            prompt=prompt,
            temperature=0.1,
        )

        return {
            "classification": response.content.strip().lower(),
            "provider": "openai",
        }

    async def health_check(self) -> bool:
        """Check OpenAI API availability"""

        try:
            response = await self.client.get(
                "https://api.openai.com/v1/models",
                timeout=5,
            )
            return response.status_code == 200
        except Exception:
            return False


class OpenRouterProvider(AIProvider):
    """OpenRouter proxy provider"""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-3.5-turbo",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.api_key = api_key
        self.model = model
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=self.timeout_seconds,
        )

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AIResponse:
        """Generate using OpenRouter"""

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens or 1024,
        }

        async def call():
            response = await self.client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return AIResponse(
                content=data["choices"][0]["message"]["content"],
                tokens_used=data.get("usage", {}).get("completion_tokens"),
                provider="openrouter",
                timestamp=None,
            )

        return await self._retry_with_backoff(call())

    async def classify(self, text: str, categories: list[str]) -> dict[str, Any]:
        """Classify using OpenRouter"""

        prompt = f"Classify: {text}\nCategories: {', '.join(categories)}"

        response = await self.generate(prompt=prompt, temperature=0.1)

        return {
            "classification": response.content.strip().lower(),
            "provider": "openrouter",
        }

    async def health_check(self) -> bool:
        """Check OpenRouter API availability"""

        try:
            response = await self.client.get(
                "https://openrouter.ai/api/v1/models",
                timeout=5,
            )
            return response.status_code == 200
        except Exception:
            return False


class LiteLLMProvider(AIProvider):
    """LiteLLM provider for accessing multiple LLMs through a unified interface"""

    def __init__(
        self,
        api_key: str = "",
        model: str = "gpt-3.5-turbo",
        base_url: str = "http://localhost:4000",
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Authorization": f"Bearer {api_key}"} if api_key else {},
            timeout=self.timeout_seconds,
        )

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> AIResponse:
        """Generate using LiteLLM"""

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        async def call():
            response = await self.client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()
            return AIResponse(
                content=data["choices"][0]["message"]["content"],
                tokens_used=data.get("usage", {}).get("completion_tokens"),
                provider="litellm",
                timestamp=None,
            )

        return await self._retry_with_backoff(call())

    async def classify(self, text: str, categories: list[str]) -> dict[str, Any]:
        """Classify using LiteLLM"""

        prompt = f"Classify the following text into one of these categories: {', '.join(categories)}\n\nText: {text}\n\nCategory:"

        response = await self.generate(
            prompt=prompt,
            temperature=0.1,
        )

        classification = response.content.strip().lower()
        return {
            "classification": classification,
            "provider": "litellm",
        }

    async def health_check(self) -> bool:
        """Check LiteLLM availability"""

        try:
            response = await self.client.get("/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"LiteLLM health check failed: {e}")
            return False


def get_ai_provider(
    provider_type: AIProviderType,
    **kwargs,
) -> AIProvider:
    """Factory function to get AI provider instance"""

    providers = {
        AIProviderType.OLLAMA: OllamaProvider,
        AIProviderType.ANTHROPIC: AnthropicProvider,
        AIProviderType.OPENAI: OpenAIProvider,
        AIProviderType.OPENROUTER: OpenRouterProvider,
        AIProviderType.LITELLM: LiteLLMProvider,
    }

    provider_class = providers.get(provider_type)
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider_type}")

    return provider_class(**kwargs)


# ─── Runtime: administración, triage y pruebas (expuesto vía `app.api.v1`) ───


class IAProviderError(RuntimeError):
    """Fallo al invocar el proveedor IA configurado."""


@dataclass(frozen=True, slots=True)
class RunPromptResult:
    content: str
    provider: str
    model: str


def _as_ia_provider_id(raw: str) -> str:
    s = (raw or "ollama").strip().lower()
    return s if s in ("ollama", "anthropic", "openai", "openrouter") else "ollama"


async def read_ia_config(db: AsyncSession) -> IAConfigRead:
    """Lectura efectiva de claves `ia.*` (admin / defaults)."""
    p = _as_ia_provider_id(str(await get_json_setting(db, "ia.proveedor_activo", "ollama")))
    return IAConfigRead(
        proveedor_activo=cast(IAProvider, p),
        modelo=str(await get_json_setting(db, "ia.modelo", "llama3.1:8b")),
        temperatura=float(await get_json_setting(db, "ia.temperatura", 0.3)),
        max_tokens=int(await get_json_setting(db, "ia.max_tokens", 4096)),
        timeout_segundos=int(await get_json_setting(db, "ia.timeout_segundos", 60)),
        sanitizar_datos_paga=bool(await get_json_setting(db, "ia.sanitizar_datos_paga", True)),
    )


async def run_prompt(
    db: AsyncSession,
    *,
    prompt: str,
    dry_run: bool = True,
) -> RunPromptResult:
    """
    Envía un prompt al proveedor activo, o responde con JSON fijo en simulación.
    `dry_run=True` nunca sale de la red (sólo estructura coherente con triage).
    """
    cfg = await read_ia_config(db)
    if dry_run:
        body = {
            "verdict": "needs_review",
            "confidence": 0.5,
            "rationale": "Simulación (dry run): no se llamó a ningún proveedor externo.",
            "suggested_state": None,
        }
        return RunPromptResult(
            content=json.dumps(body, ensure_ascii=False),
            provider=cfg.proveedor_activo.value
            if isinstance(cfg.proveedor_activo, Enum)
            else str(cfg.proveedor_activo),
            model=cfg.modelo,
        )
    p = cfg.proveedor_activo.value if isinstance(cfg.proveedor_activo, Enum) else str(cfg.proveedor_activo)
    if p == "ollama":
        base = os.environ.get("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        oll = OllamaProvider(
            base_url=base,
            model=cfg.modelo,
            timeout_seconds=cfg.timeout_segundos,
        )
        try:
            r = await oll.generate(
                prompt,
                temperature=cfg.temperatura,
                max_tokens=cfg.max_tokens,
            )
        except Exception as exc:
            logger.exception("ia.run_prompt.ollama_failed", extra={"event": "ia.run_prompt.ollama_failed"})
            raise IAProviderError(str(exc)) from exc
        return RunPromptResult(content=r.content, provider=r.provider, model=cfg.modelo)
    if p in ("openai", "anthropic", "openrouter"):
        key = (
            os.environ.get("OPENAI_API_KEY")
            or os.environ.get("ANTHROPIC_API_KEY")
            or os.environ.get("OPENROUTER_API_KEY", "")
        )
        if not key:
            raise IAProviderError("Falta variable de entorno de API (OPENAI/ANTHROPIC/OPENROUTER).")
        try:
            ptype = {
                "openai": AIProviderType.OPENAI,
                "anthropic": AIProviderType.ANTHROPIC,
                "openrouter": AIProviderType.OPENROUTER,
            }[p]
        except KeyError as err:
            raise IAProviderError(f"Proveedor no soportado: {p}") from err
        prov = get_ai_provider(ptype, api_key=key, model=cfg.modelo, timeout_seconds=cfg.timeout_segundos)
        try:
            r = await prov.generate(
                prompt,
                temperature=cfg.temperatura,
                max_tokens=cfg.max_tokens,
            )
        except Exception as exc:
            logger.exception("ia.run_prompt.remote_failed", extra={"event": "ia.run_prompt.remote_failed"})
            raise IAProviderError(str(exc)) from exc
        return RunPromptResult(content=r.content, provider=r.provider, model=cfg.modelo)
    raise IAProviderError(f"Proveedor no soportado: {p}")
