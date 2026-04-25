"""
Phase 22-24: AI Provider Abstraction & Integration
Multi-provider support: Ollama, Anthropic, OpenAI, OpenRouter
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional
from enum import Enum

import aiohttp
import httpx
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)


class AIProviderType(str, Enum):
    OLLAMA = "ollama"
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    OPENROUTER = "openrouter"


class AIResponse(BaseModel):
    """Unified response from any AI provider"""
    content: str
    tokens_used: Optional[int] = None
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
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
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
        max_retries: int = None,
    ) -> Any:
        """Retry with exponential backoff"""
        retries = max_retries or self.max_retries
        delay = 1

        for attempt in range(retries):
            try:
                return await asyncio.wait_for(coro, timeout=self.timeout_seconds)
            except asyncio.TimeoutError:
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
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
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
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
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
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
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
        system: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
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
    }

    provider_class = providers.get(provider_type)
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider_type}")

    return provider_class(**kwargs)
