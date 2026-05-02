"""Inspector Agent — Detección de patrones maliciosos en código usando LLM."""

from __future__ import annotations

import json
import os
from typing import Any, Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.agente_config import AgenteConfig
from app.services.ia_provider import AIProviderType, get_ai_provider
from app.services.scr_json import parse_llm_json
from app.services.scr_llm_catalog import ANTHROPIC_DEFAULT_MODEL, LLM_PROVIDER_CATALOG, default_base_url, normalize_model

DEFAULT_MALICIOUS_PATTERNS = {
    "EXEC_ENV_BACKDOOR": "Ejecución oculta vía variables de entorno o configuración",
    "LOGIC_BOMB": "Código que ejecuta condicionalmente para causar daño",
    "OBFUSCATED_CODE": "Código deliberadamente ofuscado para ocultar funcionalidad",
    "PRIVILEGE_ESCALATION": "Intentos de elevar privilegios",
    "DATA_EXFILTRATION": "Código que exfiltra datos sensibles",
    "SUPPLY_CHAIN_ATTACK": "Dependencias o imports sospechosos",
    "TIMING_ATTACK": "Código que explota side-channels de timing",
    "SUSPICIOUS_PERMISSIONS": "Solicitudes de permisos sospechosas",
    "DEFERRED_EXECUTION": "Código diseñado para ejecutarse en un momento futuro o bajo condiciones específicas",
    "DYNAMIC_CODE_EXECUTION": "Uso de eval(), exec(), o similares para ejecutar código dinámicamente desde cadenas",
}

DEFAULT_PATTERN_SEVERITY = {
    "EXEC_ENV_BACKDOOR": "CRITICO",
    "LOGIC_BOMB": "CRITICO",
    "OBFUSCATED_CODE": "MEDIO",
    "PRIVILEGE_ESCALATION": "ALTO",
    "DATA_EXFILTRATION": "CRITICO",
    "SUPPLY_CHAIN_ATTACK": "ALTO",
    "TIMING_ATTACK": "MEDIO",
    "SUSPICIOUS_PERMISSIONS": "MEDIO",
    "DEFERRED_EXECUTION": "ALTO",
    "DYNAMIC_CODE_EXECUTION": "ALTO",
}


def _build_inspector_system_prompt(patterns: Dict[str, str]) -> str:
    """Construye el prompt del sistema para Inspector Agent."""
    patterns_list = "\n".join(f"  - {k}: {v}" for k, v in patterns.items())
    return f"""Eres un experto en seguridad de código especializado en detectar patrones maliciosos.
Tu rol es analizar código fuente e identificar:

{patterns_list}

IMPORTANTE:
- Responde SOLO en JSON válido
- Si no hay hallazgos maliciosos, retorna: {{"findings": []}}
- Cada hallazgo debe tener: archivo, linea_inicio, linea_fin, tipo_malicia, confianza (0-1), descripcion, codigo_snippet, impacto, explotabilidad
- Sé específico: incluye líneas exactas y fragmentos de código problemático
- Confianza: 0.9+ si es evidencia clara, 0.6-0.9 si hay indicadores fuertes, <0.6 si es sospecha"""


def _chunk_source_files(source_files: dict[str, str], *, max_chunk_chars: int = 12000, max_chunks: int = 50) -> list[tuple[str, str]]:
    chunks: list[tuple[str, str]] = []
    for filepath, content in source_files.items():
        if filepath.startswith("_"):
            continue
        text = content or ""
        if not text.strip():
            continue
        for start in range(0, len(text), max_chunk_chars):
            suffix = "" if start == 0 else f"#parte-{(start // max_chunk_chars) + 1}"
            chunks.append((f"{filepath}{suffix}", text[start : start + max_chunk_chars]))
            if len(chunks) >= max_chunks:
                return chunks
    return chunks


def _build_inspector_prompt(code_chunks: list[tuple[str, str]], analysis_context: str | None = None, output_format: str | None = None) -> str:
    """Construye el prompt para análisis de código."""
    files_text = "\n\n".join(
        f"--- Archivo: {filepath} ---\n{content}"
        for filepath, content in code_chunks
    )

    return f"""Analiza el siguiente código en busca de patrones maliciosos:

{files_text}

{analysis_context or ""}

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
}}
{output_format or ""}"""


async def run_inspector_real(
    *,
    rutas_fuente: dict[str, str],
    db: AsyncSession | None = None,
    provider: AIProviderType = AIProviderType.ANTHROPIC,
    model: str = ANTHROPIC_DEFAULT_MODEL,
    temperature: float = 0.3,
    max_tokens: int = 4096,
    timeout_seconds: int = 120,
    api_key_override: str | None = None,
    base_url_override: str | None = None,
    usage_out: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Inspector Agent real — Detecta patrones maliciosos usando LLM."""

    if not rutas_fuente:
        logger.warning("scr.inspector.empty_source", extra={"event": "scr.inspector.empty_source"})
        return []

    try:
        max_chunks = int(os.getenv("SCR_INSPECTOR_MAX_CHUNKS", "50"))
        max_chunk_chars = int(os.getenv("SCR_INSPECTOR_MAX_CHARS_PER_CHUNK", "12000"))
        code_chunks = _chunk_source_files(rutas_fuente, max_chunk_chars=max_chunk_chars, max_chunks=max_chunks)

        patterns = DEFAULT_MALICIOUS_PATTERNS.copy()
        pattern_severity = DEFAULT_PATTERN_SEVERITY.copy()
        system_prompt_override = None
        analysis_context = None
        output_format = None

        if db is not None:
            stmt = (
                select(AgenteConfig)
                .where(AgenteConfig.agente_tipo == "inspector", AgenteConfig.activo == True)
                .order_by(AgenteConfig.creado_en.desc())
                .limit(1)
            )

            result = await db.execute(stmt)
            config = result.scalar_one_or_none()

            if config and config.patrones_personalizados:
                patterns.update(config.patrones_personalizados)
            if config and config.prompt_sistema_personalizado:
                system_prompt_override = config.prompt_sistema_personalizado
            if config and config.parametros_llm:
                for disabled_pattern in config.parametros_llm.get("disabled_patterns") or []:
                    patterns.pop(str(disabled_pattern), None)
                analysis_context = config.parametros_llm.get("analysis_context")
                output_format = config.parametros_llm.get("output_format")

        model = normalize_model(provider.value, model)

        if provider == AIProviderType.ANTHROPIC:
            api_key = (api_key_override or "").strip() or os.getenv("ANTHROPIC_API_KEY", "")
            if not api_key:
                logger.warning(
                    "scr.inspector.no_api_key", extra={"event": "scr.inspector.no_api_key", "provider": "anthropic"}
                )
                return []

            llm_provider = get_ai_provider(
                provider,
                api_key=api_key,
                model=model,
                timeout_seconds=timeout_seconds,
            )
        elif provider == AIProviderType.OLLAMA:
            llm_provider = get_ai_provider(
                provider,
                base_url=base_url_override or os.getenv("OLLAMA_BASE_URL", default_base_url(provider.value) or "http://localhost:11434"),
                model=model,
                timeout_seconds=timeout_seconds,
            )
        else:
            env_name = f"{provider.value.upper()}_API_KEY"
            api_key = (api_key_override or "").strip() or os.getenv(env_name, "")
            requires_api_key = bool(LLM_PROVIDER_CATALOG.get(provider.value, {}).get("requires_api_key"))
            if requires_api_key and not api_key:
                logger.warning(
                    "scr.inspector.no_api_key", extra={"event": "scr.inspector.no_api_key", "provider": provider}
                )
                return []

            kwargs = {"model": model, "timeout_seconds": timeout_seconds}
            if api_key:
                kwargs["api_key"] = api_key
            base_url = base_url_override or default_base_url(provider.value)
            if base_url:
                kwargs["base_url"] = base_url
            llm_provider = get_ai_provider(provider, **kwargs)

        system_prompt = system_prompt_override or _build_inspector_system_prompt(patterns)
        user_prompt = _build_inspector_prompt(code_chunks, analysis_context=analysis_context, output_format=output_format)

        logger.info(
            "scr.inspector.llm_call",
            extra={
                "event": "scr.inspector.llm_call",
                "provider": provider,
                "model": model,
                "files_count": len(code_chunks),
            },
        )

        response = await llm_provider.generate(
            prompt=user_prompt,
            system=system_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        if usage_out is not None:
            usage_out.update(
                {
                    "tokens_used": response.tokens_used or 0,
                    "input_tokens": response.input_tokens or 0,
                    "output_tokens": response.output_tokens or 0,
                    "provider": response.provider or provider.value,
                    "model": model,
                }
            )

        result = parse_llm_json(response.content, default={})
        findings_raw = result.get("findings", []) if isinstance(result, dict) else []
        if not isinstance(result, dict):
            logger.error(
                "scr.inspector.json_parse_error",
                extra={"event": "scr.inspector.json_parse_error", "content": response.content[:200]},
            )
            raise ValueError("Inspector no devolvió JSON válido")

        findings = []
        for finding in findings_raw:
            if not isinstance(finding, dict):
                continue

            tipo = finding.get("tipo_malicia", "OBFUSCATED_CODE")
            severidad = pattern_severity.get(tipo, "MEDIO")

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
            },
        )

        return findings

    except Exception as e:
        logger.error("scr.inspector.error", extra={"event": "scr.inspector.error", "error": str(e)[:200]})
        return []


async def run_inspector_stub(*, rutas_fuente: dict[str, str]) -> list[dict[str, Any]]:
    """Fallback sin datos simulados: no genera hallazgos ficticios."""
    _: dict[str, str] = rutas_fuente
    return []
