"""Inspector Agent — Detección de patrones maliciosos en código usando LLM."""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.services.ia_provider import AIProviderType, get_ai_provider

# Patrones de malicia a detectar
MALICIOUS_PATTERNS = {
    "EXEC_ENV_BACKDOOR": "Ejecución oculta vía variables de entorno o configuración",
    "INJECTION_VULNERABILITY": "Vulnerabilidades de inyección de código",
    "LOGIC_BOMB": "Código que ejecuta condicionalmente para causar daño",
    "OBFUSCATED_CODE": "Código deliberadamente ofuscado para ocultar funcionalidad",
    "PRIVILEGE_ESCALATION": "Intentos de elevar privilegios",
    "DATA_EXFILTRATION": "Código que exfiltra datos sensibles",
    "SUPPLY_CHAIN_ATTACK": "Dependencias o imports sospechosos",
    "TIMING_ATTACK": "Código que explota side-channels de timing",
    "HARDCODED_SECRETS": "Secretos hardcodeados en el código",
    "SUSPICIOUS_PERMISSIONS": "Solicitudes de permisos sospechosas",
}

# Severidad basada en patrón
PATTERN_SEVERITY = {
    "EXEC_ENV_BACKDOOR": "CRITICO",
    "INJECTION_VULNERABILITY": "ALTO",
    "LOGIC_BOMB": "CRITICO",
    "OBFUSCATED_CODE": "MEDIO",
    "PRIVILEGE_ESCALATION": "ALTO",
    "DATA_EXFILTRATION": "CRITICO",
    "SUPPLY_CHAIN_ATTACK": "ALTO",
    "TIMING_ATTACK": "MEDIO",
    "HARDCODED_SECRETS": "ALTO",
    "SUSPICIOUS_PERMISSIONS": "MEDIO",
}


def _build_inspector_system_prompt() -> str:
    """Construye el prompt del sistema para Inspector Agent."""
    patterns_list = "\n".join(
        f"  - {k}: {v}" for k, v in MALICIOUS_PATTERNS.items()
    )
    return f"""Eres un experto en seguridad de código especializado en detectar patrones maliciosos.
Tu rol es analizar código fuente e identificar:

{patterns_list}

IMPORTANTE:
- Responde SOLO en JSON válido
- Si no hay hallazgos maliciosos, retorna: {{"findings": []}}
- Cada hallazgo debe tener: archivo, linea_inicio, linea_fin, tipo_malicia, confianza (0-1), descripcion, codigo_snippet, impacto, explotabilidad
- Sé específico: incluye líneas exactas y fragmentos de código problemático
- Confianza: 0.9+ si es evidencia clara, 0.6-0.9 si hay indicadores fuertes, <0.6 si es sospecha"""


def _build_inspector_prompt(code_chunks: list[tuple[str, str]]) -> str:
    """Construye el prompt para análisis de código.

    Args:
        code_chunks: Lista de (filepath, contenido) del código a analizar
    """
    files_text = "\n\n".join(
        f"--- Archivo: {filepath} ---\n{content[:1000]}..."  # Primeros 1000 chars
        if len(content) > 1000 else f"--- Archivo: {filepath} ---\n{content}"
        for filepath, content in code_chunks
    )

    return f"""Analiza el siguiente código en busca de patrones maliciosos:

{files_text}

Responde en JSON con esta estructura:
{{
  "findings": [
    {{
      "archivo": "path/to/file.py",
      "linea_inicio": 10,
      "linea_fin": 15,
      "tipo_malicia": "EXEC_ENV_BACKDOOR",
      "confianza": 0.85,
      "descripcion": "...",
      "codigo_snippet": "...",
      "impacto": "...",
      "explotabilidad": "..."
    }}
  ]
}}"""


async def run_inspector_real(
    *,
    rutas_fuente: dict[str, str],
    db: AsyncSession | None = None,
    provider: AIProviderType = AIProviderType.ANTHROPIC,
    model: str = "claude-opus-4-1",
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> list[dict[str, Any]]:
    """Inspector Agent real — Detecta patrones maliciosos usando LLM.

    Args:
        rutas_fuente: Dict {filepath: contenido} del código fuente
        db: AsyncSession (opcional, para configuración de BD)
        provider: Tipo de proveedor LLM
        model: Modelo a usar
        temperature: Temperatura para generación
        max_tokens: Máximo de tokens en respuesta

    Returns:
        Lista de hallazgos detectados
    """

    if not rutas_fuente:
        logger.warning("scr.inspector.empty_source", extra={"event": "scr.inspector.empty_source"})
        return []

    try:
        # Preparar chunks de código (máximo 5 archivos para no saturar el LLM)
        code_chunks = [
            (filepath, content)
            for filepath, content in list(rutas_fuente.items())[:5]
        ]

        # Inicializar proveedor LLM
        # Para Anthropic, necesitamos la API key del entorno o configuración
        import os

        if provider == AIProviderType.ANTHROPIC:
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
            if not api_key:
                logger.warning(
                    "scr.inspector.no_api_key",
                    extra={"event": "scr.inspector.no_api_key", "provider": "anthropic"}
                )
                return await run_inspector_stub(rutas_fuente=rutas_fuente)

            llm_provider = get_ai_provider(
                provider,
                api_key=api_key,
                model=model,
            )
        elif provider == AIProviderType.OLLAMA:
            llm_provider = get_ai_provider(
                provider,
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                model=model,
            )
        else:
            api_key = os.getenv(f"{provider.upper()}_API_KEY", "")
            if not api_key:
                logger.warning(
                    "scr.inspector.no_api_key",
                    extra={"event": "scr.inspector.no_api_key", "provider": provider}
                )
                return await run_inspector_stub(rutas_fuente=rutas_fuente)

            llm_provider = get_ai_provider(provider, api_key=api_key, model=model)

        # Construir prompts
        system_prompt = _build_inspector_system_prompt()
        user_prompt = _build_inspector_prompt(code_chunks)

        # Llamar al LLM
        logger.info(
            "scr.inspector.llm_call",
            extra={
                "event": "scr.inspector.llm_call",
                "provider": provider,
                "model": model,
                "files_count": len(code_chunks),
            }
        )

        response = await llm_provider.generate(
            prompt=user_prompt,
            system=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        # Parsear respuesta
        try:
            result = json.loads(response.content)
            findings_raw = result.get("findings", [])
        except json.JSONDecodeError:
            logger.error(
                "scr.inspector.json_parse_error",
                extra={"event": "scr.inspector.json_parse_error", "content": response.content[:200]}
            )
            return await run_inspector_stub(rutas_fuente=rutas_fuente)

        # Enriquecer hallazgos con severidad y validar
        findings = []
        for finding in findings_raw:
            if not isinstance(finding, dict):
                continue

            tipo = finding.get("tipo_malicia", "OBFUSCATED_CODE")
            severidad = PATTERN_SEVERITY.get(tipo, "MEDIO")

            enriched = {
                "archivo": str(finding.get("archivo", "unknown.py")),
                "linea_inicio": int(finding.get("linea_inicio", 1)),
                "linea_fin": int(finding.get("linea_fin", 1)),
                "tipo_malicia": tipo,
                "severidad": severidad,
                "confianza": float(finding.get("confianza", 0.7)),
                "descripcion": str(finding.get("descripcion", "")),
                "codigo_snippet": str(finding.get("codigo_snippet", "")),
                "impacto": str(finding.get("impacto", "")),
                "explotabilidad": str(finding.get("explotabilidad", "")),
                "remediacion_sugerida": str(finding.get("remediacion_sugerida", "Revisión humana recomendada")),
                "estado": "DETECTED",
            }
            findings.append(enriched)

        logger.info(
            "scr.inspector.complete",
            extra={
                "event": "scr.inspector.complete",
                "findings_count": len(findings),
                "provider": provider,
            }
        )

        return findings

    except Exception as e:
        logger.error(
            "scr.inspector.error",
            extra={"event": "scr.inspector.error", "error": str(e)[:200]}
        )
        # Fallback a stub
        return await run_inspector_stub(rutas_fuente=rutas_fuente)


async def run_inspector_stub(*, rutas_fuente: dict[str, str]) -> list[dict[str, Any]]:
    """Stub Inspector: Fallback cuando LLM no está disponible."""
    _: dict[str, str] = rutas_fuente
    return [
        {
            "archivo": "scratchpad/scr_placeholder.py",
            "linea_inicio": 1,
            "linea_fin": 3,
            "tipo_malicia": "EXEC_ENV_BACKDOOR",
            "severidad": "CRITICO",
            "confianza": 0.62,
            "descripcion": "Stub Inspector — patrón de malicia plausible (stub). Integrar prompts LLM en producción.",
            "codigo_snippet": '# placeholder: os.environ["AUTHORIZED_IDS"] ...',
            "impacto": "Ejecución de flujo sensible sin revisión igualitaria.",
            "explotabilidad": "Requiere conocer variable de control interna.",
            "remediacion_sugerida": "Revisión humana focalizada en intención y contexto organizacional.",
            "estado": "DETECTED",
        }
    ]
