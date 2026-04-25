"""Agregación de severidades SAST a conteos por actividad mensual (BRD B2)."""

from __future__ import annotations

# HallazgoSast.severidad: texto libre; normalizamos a cubetas BRD
_CRIT = frozenset(
    {
        "critica",
        "crítica",
        "critico",
        "crítico",
        "critic",
        "critical",
        "c",
    }
)
_ALTA = frozenset(
    {
        "alta",
        "alto",
        "high",
        "h",
        "major",
    }
)
_MEDIA = frozenset(
    {
        "media",
        "medio",
        "medium",
        "m",
    }
)
_BAJA = frozenset(
    {
        "baja",
        "bajo",
        "low",
        "l",
        "info",
        "informativa",
    }
)


def bucket_severidad_hallazgo_sast(severidad: str) -> str | None:
    """Devuelve 'criticos' | 'altos' | 'medios' | 'bajos' o None si no reconocida."""
    x = severidad.strip().lower()
    if x in _CRIT:
        return "criticos"
    if x in _ALTA:
        return "altos"
    if x in _MEDIA:
        return "medios"
    if x in _BAJA:
        return "bajos"
    return None


def aggregate_hallazgo_labels(severities: list[str]) -> dict[str, int]:
    c = a = m = bj = 0
    for s in severities:
        b = bucket_severidad_hallazgo_sast(s)
        if b == "criticos":
            c += 1
        elif b == "altos":
            a += 1
        elif b == "medios":
            m += 1
        elif b == "bajos":
            bj += 1
    return {"criticos": c, "altos": a, "medios": m, "bajos": bj, "total": c + a + m + bj}
