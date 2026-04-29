"""Detective Agent — Análisis forense de Git timeline y patrones de commits."""

from __future__ import annotations

import re
from datetime import datetime, time
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.code_security_event import CodeSecurityEvent


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
    """Run Detective Agent to analyze Git timeline and create forensic events.

    Args:
        review_id: UUID of the code security review
        inspector_findings: List of findings from Inspector Agent
        commits: List of commit data from Git
        db: Database session

    Returns:
        List of created CodeSecurityEvent instances
    """
    logger.info("detective.start", extra={"review_id": review_id, "commits_count": len(commits)})

    events = []

    # Sort commits by timestamp (oldest first)
    sorted_commits = sorted(commits, key=lambda c: c["timestamp"])

    # Track author activity for anomalies
    author_file_history = {}

    for i, commit in enumerate(sorted_commits):
        commit_time = commit["timestamp"]
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
