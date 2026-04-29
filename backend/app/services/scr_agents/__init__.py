"""
Agentes SCR (Inspector, Detective, Fiscal) — prompts orientados a **malicia**, no secrets/SAST CWE genéricos.

Fase 5: integración opcional con `ia_provider`; stubs deterministas para desarrollo/tests.
"""

from __future__ import annotations

import hashlib
import uuid
from typing import Any


def fingerprint_for_finding(review_uuid: uuid.UUID, archivo: str, linea: int, tipo: str) -> str:
    raw = f"{review_uuid}:{archivo}:{linea}:{tipo}"
    return hashlib.sha256(raw.encode()).hexdigest()[:48]


async def run_inspector_stub(*, rutas_fuente: dict[str, str]) -> list[dict[str, Any]]:
    """Stub Inspector: ejemplo de hallazgo de malicia (puerta trasera sintética)."""
    _: dict[str, str] = rutas_fuente  # uso futuro: chunk LLM sobre archivos reales
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
        }
    ]


async def run_detective_stub(
    *,
    inspector_rows: list[dict[str, Any]],
    commits: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    """Detective stub — correlación con commits reales (si existen) o sintética.

    En producción, esto será reemplazado por análisis real de patrones forenses.
    Por ahora, convierte commits reales a formato de eventos.
    """
    _: list = inspector_rows

    # Si no hay commits, retornar stub sintético
    if not commits:
        return [
            {
                "commit_hash": "stub" + hashlib.sha256(b"d").hexdigest()[:8],
                "autor": "scr-stub-detector@appsec.platform",
                "archivo": "scratchpad/scr_placeholder.py",
                "accion": "MODIFIED",
                "mensaje_commit": "stub: ejemplo forense",
                "nivel_riesgo": "ALTO",
                "indicadores": ["OFF_HOURS", "STUB_DEMO"],
                "descripcion": "Evento forense de demostración (sin Git real hasta fase siguiente).",
            }
        ]

    # Usar commits reales: convertir a formato de eventos
    events = []
    for c in commits[:20]:  # Limitar a 20 commits
        # Simple heuristic: detectar indicadores
        indicadores = []
        msg = c.get("mensaje", "").lower()
        author = c.get("autor", "").lower()

        # Simple pattern matching (stub - reemplazar con ML en producción)
        if "merge" in msg:
            indicadores.append("MERGE_PATTERN")
        if "revert" in msg or "rollback" in msg:
            indicadores.append("REVERT_PATTERN")
        if len(msg) < 10:
            indicadores.append("GENERIC_MESSAGE")
        if "bot" in author or "ci" in author:
            indicadores.append("BOT_AUTHOR")

        events.append(
            {
                "commit_hash": c.get("commit_hash", "")[:40],
                "autor": c.get("autor", "unknown")[:100],
                "archivo": "multiple",  # Detective real analizaría archivos reales del commit
                "accion": "MODIFIED",
                "mensaje_commit": c.get("mensaje", "")[:200],
                "nivel_riesgo": "BAJO" if not indicadores else "MEDIO",
                "indicadores": indicadores if indicadores else ["NORMAL_COMMIT"],
                "descripcion": f"Commit por {c.get('autor', 'unknown')}: {c.get('mensaje', '')[:100]}",
            }
        )

    return events


async def run_fiscal_stub(
    *,
    findings: list[dict[str, Any]],
    forensic: list[dict[str, Any]],
    titulo: str,
) -> dict[str, Any]:
    """Resumen ejecutivo mínimo (Fiscal stub)."""
    crit = sum(1 for f in findings if f.get("severidad") == "CRITICO")
    alto = sum(1 for f in findings if f.get("severidad") == "ALTO")
    _: list = forensic
    return {
        "resumen_ejecutivo": f"Síntesis stub para «{titulo}»: {len(findings)} indicio(s) de malicia; verificar tras integración IA.",
        "desglose_severidad": {"critico": crit, "alto": alto, "medio": 0, "bajo": max(0, len(findings) - crit - alto)},
        "narrativa_evolucion": "Stub temporal hasta pipeline Git + LLM conectados.",
        "pasos_remediacion": [
            {"orden": 1, "paso": "Validación humana de contexto antes de embargo.", "urgencia": "ALTA"}
        ],
        "puntuacion_riesgo_global": min(100, len(findings) * 31),
    }
