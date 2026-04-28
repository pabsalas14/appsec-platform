"""SLA policy helpers for vulnerability lifecycle.

Centraliza resolución de días SLA por motor/severidad con fallback a catálogo
global, para evitar reglas hardcodeadas en routers/servicios.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.json_setting import get_json_setting


def _norm(value: str | None) -> str:
    return (value or "").strip().lower().replace("á", "a")


def _severity_keys(severity: str | None) -> list[str]:
    s = _norm(severity)
    out = [s]
    aliases = {
        "critica": ["critica", "critical"],
        "alta": ["alta", "high"],
        "media": ["media", "medium"],
        "baja": ["baja", "low"],
        "informativa": ["informativa", "info", "informational"],
        "info": ["informativa", "info", "informational"],
    }
    for canon, keys in aliases.items():
        if s in keys:
            out = [*keys, canon]
            break
    # preserve order while deduplicating
    seen: set[str] = set()
    dedup: list[str] = []
    for k in out:
        if k and k not in seen:
            seen.add(k)
            dedup.append(k)
    return dedup


def _motor_keys(motor: str | None) -> list[str]:
    m = _norm(motor).upper()
    if not m:
        return []
    # Compat legado: TM/ThreatModeling
    if m in {"TM", "THREATMODELING", "THREAT_MODELING"}:
        return ["TM", "THREATMODELING"]
    return [m]


async def resolve_sla_days(db: AsyncSession, *, motor: str | None, severity: str | None) -> int | None:
    """Resolve SLA days with priority:
    1) sla.por_motor[motor][severity]
    2) sla.severidades[*].sla_dias
    """
    sev_keys = _severity_keys(severity)
    if not sev_keys:
        return None

    per_motor = await get_json_setting(db, "sla.por_motor", {})
    if isinstance(per_motor, dict):
        for mk in _motor_keys(motor):
            raw = per_motor.get(mk)
            if isinstance(raw, dict):
                lowered = {str(k).strip().lower(): v for k, v in raw.items()}
                for sk in sev_keys:
                    val = lowered.get(sk)
                    if isinstance(val, (int, float)) and int(val) > 0:
                        return int(val)

    global_sev = await get_json_setting(db, "sla.severidades", [])
    if isinstance(global_sev, list):
        for row in global_sev:
            if not isinstance(row, dict):
                continue
            ids = {_norm(str(row.get("id", ""))), _norm(str(row.get("label", "")))}
            if any(sk in ids for sk in sev_keys):
                raw_days = row.get("sla_dias")
                if isinstance(raw_days, (int, float)) and int(raw_days) > 0:
                    return int(raw_days)
    return None


def compute_deadline(days: int, *, start_at: datetime | None = None) -> datetime:
    base = start_at or datetime.now(UTC)
    return base + timedelta(days=max(0, int(days)))


def status_disables_sla(status_id: str | None) -> bool:
    s = _norm(status_id)
    return s in {"riesgo_aceptado", "excepcion", "falso_positivo", "cerrada", "remediada"}
