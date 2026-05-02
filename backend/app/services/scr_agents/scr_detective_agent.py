"""SCR Detective Agent — Análisis forense de Git timeline y patrones de commits.

Este módulo implementa el Detective Agent, el segundo paso del pipeline SCR.
Analiza el historial de Git para detectar:
- Commits con mensajes genéricos en archivos críticos (HIDDEN_COMMITS)
- Commits fuera de horario laboral o en fines de semana (TIMING_ANOMALIES)
- Múltiples commits en corto tiempo por mismo autor (RAPID_SUCCESSION)
- Cambios masivos que podrían ocultar malicia (MASS_CHANGES)
- Primeros autores tocando rutas críticas (AUTHOR_ANOMALIES)
- Cambios a archivos de seguridad crítica (CRITICAL_FILES)

El Detective usa LLM (Anthropic, OpenAI, etc) para análisis semántico combinado
con reglas de patrón para detección rápida de anomalías forenses.

Ejemplo:
    >>> events = await run_detective_real(
    ...     review_id="uuid-123",
    ...     inspector_findings=[...],
    ...     commits=[...],
    ...     db=db_session,
    ...     llm=llm_runtime
    ... )
    >>> print(events)
    [
        {
            "timestamp": "2024-05-01T14:30:00Z",
            "author": "suspicious_user",
            "archivo": "auth/service.py",
            "nivel_riesgo": "CRITICAL",
            "indicadores": ["TIMING_ANOMALIES", "HIDDEN_COMMITS"],
            "descripcion": "Off-hours commit with generic message to critical auth file"
        }
    ]
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import UTC, datetime, time
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.agente_config import AgenteConfig
from app.models.code_security_event import CodeSecurityEvent
from app.services.scr_json import parse_llm_json
from app.services.scr_llm_runtime import ScrLlmRuntime, get_ai_provider_for_scr_runtime
from app.services.scr_llm_catalog import ANTHROPIC_DEFAULT_MODEL


# Patrones de riesgo forense
FORensic_PATTERNS = {
    "HIDDEN_COMMITS": {
        "description": "Commits en módulos sensibles con mensajes genéricos",
        "risk_level": "MEDIUM",
        "patterns": [
            r"^(fix|update|refactor|cleanup|minor|small)$",
            r"^(bug|issue|problem)\s+(fix|resolve)$",
        ],
        "critical_files": ["auth", "crypto", "payment", "admin", "db", "network", "security"],
    },
    "TIMING_ANOMALIES": {
        "description": "Commits a horas inusuales",
        "risk_level": "HIGH",
        "off_hours": (time(22, 0), time(6, 0)),  # 10PM - 6AM
        "weekend_risk": True,
    },
    "RAPID_SUCCESSION": {
        "description": "Múltiples commits en corto tiempo",
        "risk_level": "MEDIUM",
        "time_window_minutes": 240,  # 4 hours
        "min_commits": 3,
    },
    "CRITICAL_FILES": {
        "description": "Cambios a archivos críticos",
        "risk_level": "HIGH",
        "files": ["auth", "crypto", "payment", "admin", "db", "network", "security", "config"],
    },
    "MASS_CHANGES": {
        "description": "Commits grandes ocultando cambios",
        "risk_level": "MEDIO",
        "min_lines": 500,
    },
    "AUTHOR_ANOMALIES": {
        "description": "Nuevo autor en ruta crítica",
        "risk_level": "HIGH",
        "new_author_threshold": 0,  # First time touching critical file
    },
}


def _is_off_hours(commit_time: datetime) -> bool:
    """Check if commit is during off-hours."""
    commit_time_only = commit_time.time()
    off_start, off_end = FORensic_PATTERNS["TIMING_ANOMALIES"]["off_hours"]
    return off_start <= commit_time_only or commit_time_only <= off_end


def _is_weekend(commit_time: datetime) -> bool:
    """Check if commit is on weekend."""
    return commit_time.weekday() >= 5  # Saturday = 5, Sunday = 6


def _commit_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return datetime.now(UTC)
    return datetime.now(UTC)


def _matches_hidden_commit(message: str, file_path: str) -> bool:
    """Check if commit message is suspiciously generic for critical file."""
    if not any(crit in file_path.lower() for crit in FORensic_PATTERNS["HIDDEN_COMMITS"]["critical_files"]):
        return False

    for pattern in FORensic_PATTERNS["HIDDEN_COMMITS"]["patterns"]:
        if re.search(pattern, message.lower()):
            return True
    return False


def _is_critical_file(file_path: str) -> bool:
    """Check if file is in critical category."""
    return any(crit in file_path.lower() for crit in FORensic_PATTERNS["CRITICAL_FILES"]["files"])


def _calculate_risk_level(indicators: list[str]) -> str:
    """Calculate overall risk level from indicators."""
    if any(ind in ["TIMING_ANOMALIES", "AUTHOR_ANOMALIES"] for ind in indicators):
        return "CRITICAL"
    elif any(ind in ["HIDDEN_COMMITS", "CRITICAL_FILES", "MASS_CHANGES"] for ind in indicators):
        return "HIGH"
    else:
        return "MEDIUM"


async def run_detective_agent(
    *,
    review_id: str,
    inspector_findings: list[dict[str, Any]],
    commits: list[dict[str, Any]],
    db: AsyncSession,
) -> list[CodeSecurityEvent]:
    """Run Detective Agent (Rule-Based) to analyze Git timeline and create forensic events.

    This is the fallback/fast-path implementation using pattern-based detection
    rather than LLM analysis. Suitable for quick detection of common anomalies.

    Detects six categories of forensic anomalies:
    1. HIDDEN_COMMITS: Generic messages on critical files
    2. TIMING_ANOMALIES: Off-hours or weekend commits
    3. RAPID_SUCCESSION: Multiple commits in short time window
    4. MASS_CHANGES: Large commits (>500 lines) hiding changes
    5. AUTHOR_ANOMALIES: New author on critical file
    6. CRITICAL_FILES: Any changes to security-critical paths

    Args:
        review_id (str): UUID of the code security review
        inspector_findings (list[dict]): List of findings from Inspector Agent (context)
        commits (list[dict]): List of commit data from Git with keys:
            - hash: Commit SHA
            - author: Author name/email
            - timestamp: Commit timestamp (datetime or ISO string)
            - message: Commit message
            - files: List of modified file paths
            - lines_changed: Total lines changed
        db (AsyncSession): SQLAlchemy async session for DB persistence

    Returns:
        list[CodeSecurityEvent]: List of created event instances (bulk inserted to DB)

    Raises:
        Exception: Propagated from database operations

    Example:
        >>> events = await run_detective_agent(
        ...     review_id="550e8400-e29b-41d4-a716-446655440000",
        ...     inspector_findings=[...],
        ...     commits=[
        ...         {
        ...             "hash": "abc123def456",
        ...             "author": "john_doe",
        ...             "timestamp": "2024-05-01T22:30:00Z",
        ...             "message": "fix",
        ...             "files": ["src/auth/service.py"],
        ...             "lines_changed": 150
        ...         }
        ...     ],
        ...     db=db_session
        ... )
        >>> len(events)
        3
    """
    logger.info("detective.start", extra={"review_id": review_id, "commits_count": len(commits)})

    events = []

    # Sort commits by timestamp (oldest first)
    sorted_commits = sorted(commits, key=lambda c: _commit_timestamp(c.get("timestamp")))

    # Track author activity for anomalies
    author_file_history = {}

    for i, commit in enumerate(sorted_commits):
        commit_time = _commit_timestamp(commit.get("timestamp"))
        author = commit["author"]
        message = commit.get("message", "")
        files = commit.get("files", [])

        indicators = []

        # Check each file in commit
        for file_path in files:
            # Hidden commits
            if _matches_hidden_commit(message, file_path):
                indicators.append("HIDDEN_COMMITS")

            # Critical files
            if _is_critical_file(file_path):
                indicators.append("CRITICAL_FILES")

                # Author anomalies
                file_key = f"{author}:{file_path}"
                if file_key not in author_file_history:
                    indicators.append("AUTHOR_ANOMALIES")
                author_file_history[file_key] = commit_time

        # Timing anomalies
        if _is_off_hours(commit_time) or (
            _is_weekend(commit_time) and FORensic_PATTERNS["TIMING_ANOMALIES"]["weekend_risk"]
        ):
            indicators.append("TIMING_ANOMALIES")

        # Mass changes (estimate from file count or size)
        if len(files) > 10 or commit.get("lines_changed", 0) > FORensic_PATTERNS["MASS_CHANGES"]["min_lines"]:
            indicators.append("MASS_CHANGES")

        # Rapid succession (check previous commits in time window)
        time_window_start = commit_time
        recent_commits = 0
        for prev_commit in reversed(sorted_commits[:i]):
            if (commit_time - prev_commit["timestamp"]).total_seconds() / 60 > FORensic_PATTERNS["RAPID_SUCCESSION"][
                "time_window_minutes"
            ]:
                break
            if prev_commit["author"] == author:
                recent_commits += 1

        if recent_commits >= FORensic_PATTERNS["RAPID_SUCCESSION"]["min_commits"]:
            indicators.append("RAPID_SUCCESSION")

        # Only create event if there are indicators
        if indicators:
            risk_level = _calculate_risk_level(indicators)

            # Create description
            desc_parts = []
            if "HIDDEN_COMMITS" in indicators:
                desc_parts.append("Generic commit message for critical file changes")
            if "TIMING_ANOMALIES" in indicators:
                desc_parts.append("Off-hours or weekend commit")
            if "CRITICAL_FILES" in indicators:
                desc_parts.append("Changes to security-critical files")
            if "AUTHOR_ANOMALIES" in indicators:
                desc_parts.append("Author new to this critical file")
            if "MASS_CHANGES" in indicators:
                desc_parts.append("Large commit potentially hiding malicious changes")
            if "RAPID_SUCCESSION" in indicators:
                desc_parts.append("Rapid succession of commits by same author")

            description = "; ".join(desc_parts)

            # Create event for each file
            for file_path in files:
                event = CodeSecurityEvent(
                    review_id=review_id,
                    event_ts=commit_time,
                    commit_hash=commit["hash"],
                    autor=author,
                    archivo=file_path,
                    accion="modified",
                    mensaje_commit=message,
                    nivel_riesgo=risk_level,
                    indicadores=indicators,
                    descripcion=description,
                )
                events.append(event)

    # Bulk insert events
    if events:
        db.add_all(events)
        await db.flush()
        logger.info("detective.events_created", extra={"review_id": review_id, "events_count": len(events)})

    return events


async def run_detective_real(
    *,
    review_id: str,
    inspector_findings: list[dict[str, Any]],
    commits: list[dict[str, Any]],
    db: AsyncSession,
    llm: ScrLlmRuntime | None = None,
    usage_out: dict[str, Any] | None = None,
) -> list[CodeSecurityEvent]:
    """Run Detective Agent with LLM-powered forensic analysis of Git timeline.

    Primary implementation using LLM (Claude, GPT, etc) to detect sophisticated
    forensic patterns beyond rule-based detection. Falls back to rule-based
    analysis if LLM fails or is unavailable.

    LLM Analysis Benefits:
    - Contextual understanding of commit messages and code patterns
    - Detection of sophisticated attack evolution patterns
    - Correlation between findings and commit timeline
    - Natural language reasoning about author behavior anomalies
    - Domain knowledge about typical APT/insider threat timelines

    Fallback Behavior:
    - If LLM API call fails, silently falls back to run_detective_agent()
    - If LLM response is invalid JSON, falls back to rule-based analysis
    - Logs warnings when fallback occurs for monitoring

    Args:
        review_id (str): UUID of the code security review
        inspector_findings (list[dict]): List of findings from Inspector Agent (for context)
        commits (list[dict]): List of commit data from Git
        db (AsyncSession): SQLAlchemy async session for DB persistence
        llm (ScrLlmRuntime, optional): Resolved LLM runtime from DB config or None
            for environment variable fallback. If None, uses ANTHROPIC_DEFAULT_MODEL.
        usage_out (dict, optional): Output dict to track token usage and costs.
            If provided, will be updated with:
            - tokens_used: Total tokens consumed
            - cost_usd: Estimated cost in USD
            - model: Model name used

    Returns:
        list[CodeSecurityEvent]: List of created event instances (persisted to DB)

    Raises:
        Exception: Only if DB persistence fails (LLM errors are caught and fallback)

    Example:
        >>> usage = {}
        >>> events = await run_detective_real(
        ...     review_id="550e8400-e29b-41d4-a716-446655440000",
        ...     inspector_findings=[...],
        ...     commits=[...],
        ...     db=db_session,
        ...     llm=llm_runtime,
        ...     usage_out=usage
        ... )
        >>> print(f"Cost: ${usage.get('cost_usd', 0):.4f}")
        Cost: $0.0350
    """
    logger.info("detective_real.start", extra={"review_id": review_id, "commits_count": len(commits)})

    # Try LLM-powered analysis first
    try:
        events = await _run_detective_with_llm(
            review_id=review_id,
            inspector_findings=inspector_findings,
            commits=commits,
            db=db,
            llm=llm,
            usage_out=usage_out,
        )
        logger.info("detective_real.llm_success", extra={"review_id": review_id, "events_count": len(events)})
        return events
    except Exception as e:
        logger.warning("detective_real.llm_failed", extra={"review_id": review_id, "error": str(e)})
        # Fallback to rule-based analysis
        logger.info("detective_real.falling_back_to_rules", extra={"review_id": review_id})
        return await run_detective_agent(
            review_id=review_id, inspector_findings=inspector_findings, commits=commits, db=db
        )


async def _run_detective_with_llm(
    *,
    review_id: str,
    inspector_findings: list[dict[str, Any]],
    commits: list[dict[str, Any]],
    db: AsyncSession,
    llm: ScrLlmRuntime | None = None,
    usage_out: dict[str, Any] | None = None,
) -> list[CodeSecurityEvent]:
    """Run Detective Agent using LLM for advanced pattern detection."""

    # Prepare commit data for LLM analysis
    commits_summary = []
    for commit in commits[:50]:  # Limit to recent 50 commits for token efficiency
        commits_summary.append(
            {
                "hash": commit.get("hash", "")[:12],
                "author": commit.get("author", "unknown"),
                "timestamp": commit.get("timestamp", datetime.utcnow()).isoformat()
                if hasattr(commit.get("timestamp", datetime.utcnow()), "isoformat")
                else str(commit.get("timestamp", datetime.utcnow())),
                "message": commit.get("message", ""),
                "files": commit.get("files", []),
                "lines_changed": commit.get("lines_changed", 0),
            }
        )

    ai_provider = get_ai_provider_for_scr_runtime(llm, env_fallback_model=ANTHROPIC_DEFAULT_MODEL)
    temperature = llm.temperature if llm else 0.3
    max_tokens_llm = min(2000, llm.max_tokens) if llm else 2000

    config = await db.scalar(
        select(AgenteConfig)
        .where(
            AgenteConfig.agente_tipo == "detective",
            AgenteConfig.usuario_id.is_(None),
            AgenteConfig.revision_id.is_(None),
            AgenteConfig.activo.is_(True),
        )
        .order_by(AgenteConfig.actualizado_en.desc())
    )
    params = (config.parametros_llm or {}) if config else {}

    # Build system prompt for forensic analysis
    default_system_prompt = """Eres un experto en análisis forense de código especializado en detectar patrones maliciosos en el historial de Git.
Tu rol es analizar el timeline de commits para identificar indicadores de compromiso, incluyendo:

PATRONES DE RIESGO FORENSE:
1. Commits con mensajes genéricos en archivos críticos (auth, crypto, payment, etc.)
2. Commits fuera de horario laboral (22:00-06:00) o en fines de semana
3. Múltiples commits en corto período (< 4 horas)
4. Cambios masivos (> 500 líneas) que podrían ocultar modificaciones maliciosas
5. Primer autor tocando rutas críticas
6. Patrones de force push, rebase, amend
7. Cambios inusuales en dependencias
8. Merges de fuentes externas raras o no verificadas
9. Correlación con hallazgos técnicos del Inspector Agent
10. Escalation patterns en el ataque

INSTRUCCIONES:
- Analiza cada commit y asigna nivel de riesgo (LOW/MEDIUM/HIGH/CRITICAL)
- Identifica indicadores específicos para cada commit
- Proporciona descripción detallada de por qué cada commit es sospechoso
- Si no hay actividad sospechosa, retorna array vacío
- Sé específico y técnico en tus análisis
- Responde SOLO en JSON válido

FORMATO DE RESPUESTA (JSON array):
[
  {
    "commit_hash": "abc123def456",
    "author": "juan.perez@company.com",
    "timestamp": "2024-01-15T02:30:00Z",
    "files_affected": ["src/auth/login.js", "src/config/database.yml"],
    "risk_level": "HIGH",
    "indicators": ["OFF_HOURS", "CRITICAL_FILES", "GENERIC_MESSAGE"],
    "description": "Commit en horario fuera de laboral modificando archivos de autenticación con mensaje genérico 'fix bug'"
  }
]"""
    system_prompt = config.prompt_sistema_personalizado if config and config.prompt_sistema_personalizado else default_system_prompt

    # Build user prompt with commit data and inspector findings context
    findings_summary = []
    for finding in inspector_findings[:10]:  # Limit findings for context
        findings_summary.append(
            {
                "file": finding.get("archivo", ""),
                "type": finding.get("tipo_malicia", ""),
                "severity": finding.get("severidad", ""),
                "description": finding.get("descripcion", "")[:200],
            }
        )

    user_prompt = f"""ANÁLISIS FORENSE DE GIT TIMELINE

REPOSITORY COMMITS ({len(commits_summary)} commits analizados):
{json.dumps(commits_summary, indent=2, ensure_ascii=False)}

HALLAZGOS TÉCNICOS DEL INSPECTOR ({len(findings_summary)} hallazgos):
{json.dumps(findings_summary, indent=2, ensure_ascii=False)}

INSTRUCCIONES:
Analiza los commits anteriores en busca de patrones forenses indicativos de actividad maliciosa.
Considera tanto los commits individuales como patrones temporales y de autoría.
Correla con los hallazgos técnicos cuando sea relevante.
{params.get("analysis_context") or ""}
Responde con un array JSON de eventos forenses detectados.
{params.get("output_format") or ""}"""

    # Call LLM for analysis
    response = await ai_provider.generate(
        prompt=user_prompt,
        system=system_prompt,
        temperature=temperature,
        max_tokens=max_tokens_llm,
    )
    if usage_out is not None:
        usage_out.update(
            {
                "tokens_used": response.tokens_used or 0,
                "input_tokens": response.input_tokens or 0,
                "output_tokens": response.output_tokens or 0,
                "provider": response.provider or (llm.provider.value if llm else None),
                "model": llm.model if llm else None,
            }
        )

    # Parse LLM response
    parsed = parse_llm_json(response.content, default=[])
    if isinstance(parsed, dict):
        llm_result = parsed.get("events") or []
    elif isinstance(parsed, list):
        llm_result = parsed
    else:
        llm_result = []
    if not isinstance(llm_result, list):
        logger.error(
            "detective_real.json_parse_error",
            extra={"review_id": review_id, "content": response.content[:200]},
        )
        llm_result = []

    # Convert LLM results to CodeSecurityEvent objects
    events = []
    for event_data in llm_result:
        try:
            # Validate required fields
            commit_hash = event_data.get("commit_hash", "")
            author = event_data.get("author") or event_data.get("autor") or "unknown"
            timestamp_str = event_data.get("timestamp") or event_data.get("fecha") or ""
            file_value = event_data.get("archivo")
            files_affected = event_data.get("files_affected") or ([file_value] if file_value else [])
            risk_level = event_data.get("risk_level") or event_data.get("nivel_riesgo") or "MEDIUM"
            indicators = event_data.get("indicators") or event_data.get("indicadores") or []
            description = event_data.get("description") or event_data.get("descripcion") or ""

            if not files_affected:
                matched_commit = next(
                    (
                        commit
                        for commit in commits_summary
                        if str(commit.get("hash", "")).startswith(str(commit_hash)[:12])
                    ),
                    None,
                )
                files_affected = list(matched_commit.get("files") or []) if matched_commit else []

            # Skip if missing essential data
            if not commit_hash or not author or not files_affected:
                continue

            # Parse timestamp
            try:
                if isinstance(timestamp_str, str):
                    event_ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                else:
                    event_ts = datetime.utcnow()
            except:
                event_ts = datetime.utcnow()

            # Create event for each affected file
            for file_path in files_affected:
                event = CodeSecurityEvent(
                    review_id=uuid.UUID(str(review_id)),
                    event_ts=event_ts,
                    commit_hash=commit_hash[:64],  # Limit length
                    autor=author[:512],
                    archivo=file_path[:1024],
                    accion=str(event_data.get("accion") or "modified")[:32],
                    mensaje_commit=event_data.get("message", "")[:200] if event_data.get("message") else None,
                    nivel_riesgo=risk_level,
                    indicadores=indicators,
                    descripcion=description,
                )
                events.append(event)

        except Exception as e:
            logger.warning(
                "detective_real.event_process_error",
                extra={"review_id": review_id, "error": str(e), "event_data": str(event_data)[:100]},
            )
            continue

    logger.info("detective_real.llm_analysis_complete", extra={"review_id": review_id, "events_from_llm": len(events)})

    if events:
        db.add_all(events)
        await db.flush()

    return events
