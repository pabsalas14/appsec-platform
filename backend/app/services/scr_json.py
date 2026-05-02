"""Utilidades JSON tolerantes para respuestas LLM SCR."""

from __future__ import annotations

import json
import re
from typing import Any


def parse_llm_json(content: str, *, default: Any) -> Any:
    """Parsea JSON aunque el modelo lo envuelva en markdown o texto adicional."""
    raw = (content or "").strip()
    if not raw:
        return default
    candidates = [raw]
    fenced = re.search(r"```(?:json)?\s*(.*?)```", raw, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        candidates.insert(0, fenced.group(1).strip())
    for opener, closer in (("{", "}"), ("[", "]")):
        start = raw.find(opener)
        end = raw.rfind(closer)
        if start >= 0 and end > start:
            candidates.append(raw[start : end + 1])
    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return default


def normalize_fiscal_report(data: dict[str, Any]) -> dict[str, Any]:
    """Acepta tanto el contrato viejo como el nuevo de Fiscal."""
    return {
        "executive_summary": data.get("executive_summary") or data.get("resumen_ejecutivo") or "",
        "risk_assessment": data.get("risk_assessment") or data.get("severidad_global") or "LOW",
        "attack_narrative": data.get("attack_narrative") or data.get("conclusion") or "",
        "key_findings": data.get("key_findings") or data.get("evidencia_clave") or [],
        "recommendations": data.get("recommendations") or data.get("pasos_remediacion") or [],
        "confidence_level": data.get("confidence_level") or data.get("confianza_global") or "MEDIUM",
    }
