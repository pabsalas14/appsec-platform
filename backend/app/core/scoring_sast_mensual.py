"""Cálculo de score mensual SAST a partir de conteos y pesos admin (BRD B1)."""

from __future__ import annotations

from typing import Any

_DEFAULT_PESOS: dict[str, float] = {
    "critica": 40.0,
    "alta": 30.0,
    "media": 20.0,
    "baja": 10.0,
}


def _coerce_pesos(raw: Any) -> dict[str, float]:
    if not isinstance(raw, dict):
        return dict(_DEFAULT_PESOS)
    out: dict[str, float] = {}
    for k, v in _DEFAULT_PESOS.items():
        val = raw.get(k)
        try:
            out[k] = float(val) if val is not None else v
        except (TypeError, ValueError):
            out[k] = v
    return out


def compute_sast_mensual_score(
    criticos: int,
    altos: int,
    medios: int,
    bajos: int,
    *,
    pesos_severidad: Any,
) -> float:
    """Score 0-100: sin hallazgos = 100; con hallazgos, penaliza severidades según pesos.

    Usa `scoring.pesos_severidad` (critica, alta, media, baja) normalizando el riesgo
    frente al peor caso (todos con severidad de mayor peso).
    """
    c = max(0, criticos)
    a = max(0, altos)
    m = max(0, medios)
    bj = max(0, bajos)
    total = c + a + m + bj
    if total == 0:
        return 100.0

    pesos = _coerce_pesos(pesos_severidad)
    p_max = max(pesos.values()) if pesos else 1.0
    if p_max <= 0:
        return 100.0

    raw = c * pesos["critica"] + a * pesos["alta"] + m * pesos["media"] + bj * pesos["baja"]
    # Penalización media por hallazgo relativa a la peor severidad
    norm = raw / (total * p_max)
    score = 100.0 * (1.0 - min(1.0, max(0.0, norm)))
    return max(0.0, min(100.0, round(score, 2)))
