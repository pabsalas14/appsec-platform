"""Fiscal Agent — Genera reportes ejecutivos con narrativa de riesgo y síntesis."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.services.ia_provider import AIProviderType, get_ai_provider


def _build_fiscal_system_prompt() -> str:
    """Build system prompt for Fiscal Agent."""
    return """Eres un analista de seguridad senior especializado en reportes ejecutivos.
Tu rol es sintetizar hallazgos técnicos en narrativa clara para directivos.

INSTRUCCIONES:
- Genera narrativa ejecutiva concisa pero completa
- Enfócate en IMPACTO al negocio, no en detalles técnicos
- Identifica PATRONES de ataque y TIMELINE
- Asigna nivel de RIESGO basado en evidencia
- Proporciona RECOMENDACIONES accionables

FORMATO DE RESPUESTA (JSON estricto):
{
  "executive_summary": "Resumen de 2-3 párrafos",
  "risk_assessment": "HIGH|CRITICAL|MEDIUM|LOW",
  "attack_narrative": "Narrativa cronológica del ataque",
  "key_findings": ["Lista de hallazgos principales"],
  "recommendations": ["Lista de recomendaciones"],
  "confidence_level": "HIGH|MEDIUM|LOW"
}
"""


def _build_fiscal_user_prompt(
    findings: list[CodeSecurityFinding],
    events: list[CodeSecurityEvent],
    review_title: str,
) -> str:
    """Build user prompt with findings and events data."""
    findings_summary = []
    for f in findings[:10]:
        findings_summary.append(
            {
                "file": f.archivo,
                "type": f.tipo_malicia,
                "severity": f.severidad,
                "confidence": f.confianza,
                "description": f.descripcion[:200] + "..." if len(f.descripcion) > 200 else f.descripcion,
            }
        )

    events_summary = []
    for e in events[:20]:
        events_summary.append(
            {
                "timestamp": e.event_ts.isoformat(),
                "author": e.autor,
                "file": e.archivo,
                "risk_level": e.nivel_riesgo,
                "indicators": e.indicadores,
                "description": e.descripcion[:150] + "..."
                if e.descripcion and len(e.descripcion) > 150
                else e.descripcion,
            }
        )

    return f"""REVISIÓN: {review_title}

HALLAZGOS INSPECTOR ({len(findings)} total):
{json.dumps(findings_summary, indent=2, ensure_ascii=False)}

EVENTOS FORENSES ({len(events)} total):
{json.dumps(events_summary, indent=2, ensure_ascii=False)}

Genera el reporte ejecutivo siguiendo las instrucciones del system prompt.
"""


def _calculate_overall_risk(findings: list[CodeSecurityFinding], events: list[CodeSecurityEvent]) -> str:
    """Calculate overall risk level from findings and events."""
    critical_findings = sum(1 for f in findings if f.severidad == "CRITICO")
    high_findings = sum(1 for f in findings if f.severidad == "ALTO")
    critical_events = sum(1 for e in events if e.nivel_riesgo == "CRITICAL")
    high_events = sum(1 for e in events if e.nivel_riesgo == "HIGH")

    if critical_findings > 0 or critical_events > 2:
        return "CRITICAL"
    elif high_findings > 2 or critical_events > 0 or high_events > 3:
        return "HIGH"
    elif high_findings > 0 or high_events > 0:
        return "MEDIUM"
    else:
        return "LOW"


async def run_fiscal_agent(
    *,
    review_id: str,
    review_title: str,
    db: AsyncSession,
) -> CodeSecurityReport:
    """Run Fiscal Agent to generate executive report.

    Args:
        review_id: UUID of the code security review
        review_title: Title of the review
        db: Database session

    Returns:
        Created CodeSecurityReport instance
    """
    logger.info("fiscal.start", extra={"review_id": review_id})

    findings_result = await db.execute(select(CodeSecurityFinding).where(CodeSecurityFinding.review_id == review_id))
    findings = findings_result.scalars().all()

    events_result = await db.execute(select(CodeSecurityEvent).where(CodeSecurityEvent.review_id == review_id))
    events = events_result.scalars().all()

    logger.info(
        "fiscal.data_loaded",
        extra={
            "review_id": review_id,
            "findings_count": len(findings),
            "events_count": len(events),
        },
    )

    overall_risk = _calculate_overall_risk(findings, events)

    if not findings and not events:
        report_data = {
            "executive_summary": "No se encontraron hallazgos de seguridad en el análisis.",
            "risk_assessment": "LOW",
            "attack_narrative": "Sin evidencia de actividad maliciosa.",
            "key_findings": [],
            "recommendations": ["Mantener prácticas de desarrollo seguro."],
            "confidence_level": "HIGH",
        }
    else:
        try:
            ai_provider = get_ai_provider(AIProviderType.ANTHROPIC)
            system_prompt = _build_fiscal_system_prompt()
            user_prompt = _build_fiscal_user_prompt(findings, events, review_title)

            response = await ai_provider.generate(
                prompt=user_prompt,
                system=system_prompt,
                max_tokens=2000,
                temperature=0.3,
            )

            report_data = json.loads(response.content.strip())

            if report_data.get("risk_assessment") != overall_risk:
                logger.warning(
                    "fiscal.risk_override",
                    extra={
                        "ai_risk": report_data.get("risk_assessment"),
                        "calculated_risk": overall_risk,
                    },
                )
                report_data["risk_assessment"] = overall_risk

        except Exception as e:
            logger.error("fiscal.ai_failed", extra={"error": str(e), "review_id": review_id})
            report_data = {
                "executive_summary": f"Análisis completado. Se encontraron {len(findings)} hallazgos técnicos y {len(events)} eventos forenses. Riesgo calculado: {overall_risk}.",
                "risk_assessment": overall_risk,
                "attack_narrative": "Análisis técnico detectó patrones potencialmente maliciosos. Revisión manual recomendada.",
                "key_findings": [f"{f.tipo_malicia} en {f.archivo}" for f in findings[:5]],
                "recommendations": [
                    "Revisar hallazgos técnicos en detalle",
                    "Investigar timeline de commits",
                    "Implementar controles adicionales de seguridad",
                ],
                "confidence_level": "MEDIUM",
            }

    report = CodeSecurityReport(
        review_id=review_id,
        titulo=f"Reporte Ejecutivo - {review_title}",
        resumen_ejecutivo=report_data["executive_summary"],
        evaluacion_riesgo=report_data["risk_assessment"],
        narrativa_ataque=report_data["attack_narrative"],
        hallazgos_clave=report_data["key_findings"],
        recomendaciones=report_data["recommendations"],
        nivel_confianza=report_data["confidence_level"],
        metadata={
            "findings_count": len(findings),
            "events_count": len(events),
            "generated_at": datetime.now().isoformat(),
        },
    )

    db.add(report)
    await db.flush()

    logger.info("fiscal.report_created", extra={"review_id": review_id, "report_id": str(report.id)})

    return report
