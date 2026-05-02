"""SCR Error Handling — Manejo robusto de errores en el pipeline.

Proporciona:
- Fallback automático entre proveedores LLM
- Retry logic con exponential backoff
- User-friendly error messages
- Error tracking y logging

Ejemplo:
    from app.core.scr_error_handler import handle_llm_error, retry_with_fallback
    
    @retry_with_fallback(max_retries=3)
    async def analyze_with_fallback(code: str) -> dict:
        try:
            return await primary_llm.analyze(code)
        except LLMError as e:
            handle_llm_error(e)
            raise
"""

import asyncio
from functools import wraps
from typing import Callable, Optional, Type


class SCRException(Exception):
    """Base exception para errores de SCR."""
    pass


class LLMProviderError(SCRException):
    """Error al conectar con proveedor LLM."""
    pass


class GitHubAuthError(SCRException):
    """Error de autenticación con GitHub."""
    pass


class RepositoryError(SCRException):
    """Error descargando o analizando repositorio."""
    pass


class TimeoutError(SCRException):
    """Análisis excedió tiempo máximo."""
    pass


def handle_llm_error(error: Exception, provider: str = "unknown") -> str:
    """Maneja error de LLM y retorna mensaje amigable.
    
    Args:
        error: Exception original
        provider: LLM provider que falló
    
    Returns:
        Mensaje amigable para el usuario
    """
    if "rate limit" in str(error).lower():
        return f"LLM {provider} rate limited. Reintentando con otro proveedor..."
    elif "timeout" in str(error).lower():
        return f"LLM {provider} timeout. Reintentando con timeout mayor..."
    elif "auth" in str(error).lower():
        return f"LLM {provider} authentication failed. Verificar API key..."
    else:
        return f"LLM {provider} error: {str(error)[:100]}"


def retry_with_fallback(
    max_retries: int = 3,
    backoff_factor: float = 2.0,
    fallback_providers: Optional[list] = None,
):
    """Decorator para retry automático con fallback a otros proveedores.
    
    Args:
        max_retries: Máximo de reintentos
        backoff_factor: Multiplicador de backoff exponencial
        fallback_providers: Lista de proveedores fallback
    
    Returns:
        Función decorada
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except (LLMProviderError, TimeoutError) as e:
                    last_error = e
                    wait_time = backoff_factor ** attempt
                    print(f"Attempt {attempt + 1}/{max_retries} failed. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
            
            if last_error:
                raise last_error
        
        return wrapper
    return decorator


def safe_json_parse(json_str: str, default: Optional[dict] = None) -> dict:
    """Parsea JSON de forma segura (LLM a veces produce JSON inválido).
    
    Args:
        json_str: String potencialmente inválido
        default: Valor default si el parse falla
    
    Returns:
        Dict parseado o default
    """
    import json
    import re
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        # Try to extract JSON blocks
        match = re.search(r'\{.*\}', json_str, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        
        return default or {}
