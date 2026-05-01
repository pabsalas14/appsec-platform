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


async def run_fiscal_real(
    *,
    review_id: str,
    review_title: str,
    db: AsyncSession,
) -> CodeSecurityReport:
    """Run Fiscal Agent with LLM-powered executive report generation.

    Uses LLM to synthesize technical findings into business-focused executive reports
    with attack narratives, risk assessments, and actionable recommendations.
    Falls back to enhanced stub when LLM is unavailable.

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
        # Try LLM-powered analysis first
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

            # Validate and enhance LLM response
            report_data = _validate_and_enhance_fiscal_report(report_data, findings, events, overall_risk)

        except Exception as e:
            logger.error("fiscal.ai_failed", extra={"error": str(e), "review_id": review_id})
            # Enhanced fallback when LLM fails
            report_data = _generate_enhanced_fallback_report(findings, events, review_title, overall_risk)

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


def _validate_and_enhance_fiscal_report(
    report_data: dict[str, Any], findings: list[CodeSecurityFinding], events: list[CodeSecurityEvent], overall_risk: str
) -> dict[str, Any]:
    """Validate and enhance LLM-generated fiscal report."""
    # Ensure required fields exist with defaults
    report_data.setdefault("executive_summary", "Análisis de seguridad completado.")
    report_data.setdefault("risk_assessment", overall_risk)
    report_data.setdefault("attack_narrative", "Se analizó el historial de commits y hallazgos técnicos.")
    report_data.setdefault("key_findings", [])
    report_data.setdefault("recommendations", [])
    report_data.setdefault("confidence_level", "MEDIUM")

    # Override risk assessment with calculated value for consistency
    report_data["risk_assessment"] = overall_risk

    # Limit lists to reasonable sizes
    report_data["key_findings"] = report_data["key_findings"][:10]
    report_data["recommendations"] = report_data["recommendations"][:10]

    # Enhance executive summary if too short
    if len(report_data["executive_summary"]) < 100:
        report_data["executive_summary"] = (
            f"Se realizó un análisis exhaustivo de seguridad del código que identificó "
            f"{len(findings)} hallazgos técnicos y {len(events)} eventos forenses. "
            f"El nivel de riesgo global se evaluó como {overall_risk}. "
            f"{report_data['executive_summary']}"
        )

    # Enhance attack narrative if too short
    if len(report_data["attack_narrative"]) < 50:
        report_data["attack_narrative"] = (
            f"Análisis cronológico de {len(commits)} commits reveló patrones de actividad "
            f"{'sospechosa' if overall_risk in ['HIGH', 'CRITICAL'] else 'normal'}. "
            f"Se identificaron eventos en horarios inusuales, modificaciones a archivos críticos "
            f"y patrones que podrían indicar actividad maliciosa coordinada."
        )

    return report_data


def _generate_enhanced_fallback_report(
    findings: list[CodeSecurityFinding], events: list[CodeSecurityEvent], review_title: str, overall_risk: str
) -> dict[str, Any]:
    """Generate enhanced fallback report when LLM is unavailable."""

    # Count findings by severity
    critical_count = sum(1 for f in findings if f.severidad == "CRITICO")
    high_count = sum(1 for f in findings if f.severidad == "ALTO")
    medium_count = sum(1 for f in findings if f.severidad == "MEDIO")
    low_count = sum(1 for f in findings if f.severidad == "BAJO")

    # Count events by risk level
    critical_events = sum(1 for e in events if e.nivel_riesgo == "CRITICAL")
    high_events = sum(1 for e in events if e.nivel_riesgo == "HIGH")

    # Generate executive summary (2-3 paragraphs)
    executive_summary = (
        f"Se realizó un análisis forense exhaustivo del repositorio '{review_title}'. "
        f"El análisis identificó {len(findings)} hallazgos técnicos de seguridad y "
        f"{len(events)} eventos forenses en el historial de Git. "
        f"Entre los hallazgos, se encontraron {critical_count} críticos, {high_count} altos, "
        f"{medium_count} medios y {low_count} bajos. "
        f"En el timeline de commits, se detectaron {critical_events} eventos críticos y "
        f"{high_events} eventos de alto riesgo que requieren atención inmediata."
    )

    if critical_count > 0 or critical_events > 0:
        executive_summary += (
            " Los hallazgos críticos indican posible compromiso de seguridad que requiere "
            "investigación inmediata y acciones de contención."
        )
    elif high_count > 0 or high_events > 0:
        executive_summary += (
            " Los hallazgos de alto riesgo sugieren vulnerabilidades que podrían ser "
            "explotadas y deben ser abordadas en el corto plazo."
        )
    else:
        executive_summary += (
            " Aunque no se encontraron hallazgos críticos, se recomienda mantener "
            "las prácticas de seguridad y realizar monitoreo continuo."
        )

    # Generate attack narrative (timeline)
    attack_narrative = f"Timeline de análisis: Se examinaron {len(events)} eventos en el historial de Git. "

    if events:
        # Sort events by timestamp
        sorted_events = sorted(events, key=lambda e: e.event_ts)
        attack_narrative += (
            f"El activity más antiguo data del {sorted_events[0].event_ts.strftime('%Y-%m-%d %H:%M')} "
            f"y el más reciente del {sorted_events[-1].event_ts.strftime('%Y-%m-%d %H:%M')}. "
        )

        # Identify patterns
        off_hours_events = [e for e in events if 22 <= e.event_ts.hour or e.event_ts.hour <= 6]
        weekend_events = [e for e in events if e.event_ts.weekday() >= 5]

        if off_hours_events:
            attack_narrative += (
                f"Se detectaron {len(off_hours_events)} commits en horario fuera de laboral "
                f"(22:00-06:00), lo que podría indicar actividad encubierta. "
            )

        if weekend_events:
            attack_narrative += (
                f"Se encontraron {len(weekend_events)} commits realizados durante fines de semana, "
                f"lo que es inusual para actividad de desarrollo legítima. "
            )

        # File-based patterns
        critical_file_events = [
            e
            for e in events
            if any(crit in e.archivo.lower() for crit in ["auth", "crypto", "payment", "admin", "security"])
        ]
        if critical_file_events:
            attack_narrative += (
                f"Se modificaron {len(critical_file_events)} archivos en rutas críticas "
                f"(autenticación, criptografía, pagos), lo que aumenta el riesgo de compromiso. "
            )
    else:
        attack_narrative += "No se encontraron eventos en el historial de Git para análisis."

    # Generate key findings (top 5-10)
    key_findings = []

    # Add critical findings first
    critical_findings = [f for f in findings if f.severidad == "CRITICO"]
    for finding in critical_findings[:5]:
        key_findings.append(f"[CRÍTICO] {f.tipo_malicia} en {f.archivo}: {f.descripcion[:100]}...")

    # Add high findings
    high_findings = [f for f in findings if f.severidad == "ALTO"]
    for finding in high_findings[:3]:
        if len(key_findings) >= 10:
            break
        key_findings.append(f"[ALTO] {f.tipo_malicia} en {f.archivo}: {f.descripcion[:100]}...")

    # Add some medium findings if we need more
    if len(key_findings) < 5:
        medium_findings = [f for f in findings if f.severidad == "MEDIO"]
        for finding in medium_findings[:2]:
            if len(key_findings) >= 10:
                break
            key_findings.append(f"[MEDIO] {f.tipo_malicia} en {f.archivo}: {f.descripcion[:100]}...")

    # Ensure we have at least some findings
    if not key_findings and findings:
        key_findings = [f"{f.tipo_malicia} en {f.archivo}" for f in findings[:5]]
    elif not key_findings:
        key_findings = ["No se identificaron hallazgos técnicos significativos"]

    # Generate recommendations
    recommendations = []

    if critical_count > 0 or critical_events > 0:
        recommendations.extend(
            [
                "Realizar investigación forense inmediata de los commits sospechosos identificados",
                "Implementar controles de acceso adicionales en sistemas afectados",
                "Considerar la rotación de credenciales y claves de acceso potencialmente comprometidas",
                "Notificar al equipo de respuesta a incidentes según protocolo de seguridad",
                "Auditar todos los accesos privilegiados realizados durante el periodo de riesgo",
            ]
        )

    if high_count > 0 or high_events > 0:
        recommendations.extend(
            [
                "Priorizar la remediación de vulnerabilidades de alto riesgo identificadas",
                "Implementar monitoreo adicional en los archivos y sistemas afectados",
                "Revisar y actualizar los controles de seguridad en los componentes identificados",
            ]
        )

    # General recommendations
    recommendations.extend(
        [
            "Establecer revisión obligatoria de código para todos los commits a rutas críticas",
            "Implementar alertas automáticas para commits en horario fuera de laboral",
            "Realizar capacitación en seguridad consciente para el equipo de desarrollo",
            "Actualizar y hacer cumplir las políticas de gestión de cambios y acceso",
            "Considerar la implementación de firma de commits y verificación de autoría",
        ]
    )

    # Limit recommendations
    recommendations = recommendations[:8]

    # Calculate confidence based on data availability and consistency
    confidence_level = "MEDIUM"  # Default
    if len(findings) > 5 and len(events) > 3:
        confidence_level = "HIGH"
    elif len(findings) == 0 and len(events) == 0:
        confidence_level = "LOW"
    elif len(findings) < 2 and len(events) < 2:
        confidence_level = "LOW"

    return {
        "executive_summary": executive_summary,
        "risk_assessment": overall_risk,
        "attack_narrative": attack_narrative,
        "key_findings": key_findings,
        "recommendations": recommendations,
        "confidence_level": confidence_level,
    }
