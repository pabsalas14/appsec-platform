"""PDF Export Service — Genera reportes ejecutivos en formato PDF."""

from __future__ import annotations

import html
from datetime import datetime
from typing import Any

from weasyprint import HTML

from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview


def _escape_html(text: str | None) -> str:
    """Escape HTML special characters."""
    if text is None:
        return ""
    return html.escape(str(text))


def _build_html_report(
    review: CodeSecurityReview,
    report: CodeSecurityReport,
    findings: list[CodeSecurityFinding],
    events: list[CodeSecurityEvent],
) -> str:
    """Build HTML content for the PDF report."""

    severity_counts = report.desglose_severidad or {}
    critico = severity_counts.get("critico", severity_counts.get("CRITICO", 0))
    alto = severity_counts.get("alto", severity_counts.get("ALTO", 0))
    medio = severity_counts.get("medio", severity_counts.get("MEDIO", 0))
    bajo = severity_counts.get("bajo", severity_counts.get("BAJO", 0))

    risk_label = "LOW"
    if report.puntuacion_riesgo_global >= 90:
        risk_label = "CRITICAL"
    elif report.puntuacion_riesgo_global >= 75:
        risk_label = "HIGH"
    elif report.puntuacion_riesgo_global >= 50:
        risk_label = "MEDIUM"

    findings_html = ""
    for f in findings[:20]:
        severity_class = f.severidad.lower() if f.severidad else "medio"
        findings_html += f"""
        <div class="finding">
            <div class="finding-header">
                <span class="severity severity-{severity_class}">{_escape_html(f.severidad or "MEDIO")}</span>
                <span class="file">{_escape_html(f.archivo)}</span>
                <span class="confidence">{int(f.confianza * 100)}% confianza</span>
            </div>
            <div class="finding-type">{_escape_html(f.tipo_malicia or "Unknown")}</div>
            <div class="finding-desc">{_escape_html(f.descripcion[:200])}</div>
            {f'<div class="finding-code"><pre>{_escape_html(f.codigo_snippet or "")}</pre></div>' if f.codigo_snippet else ""}
        </div>
        """

    events_html = ""
    for e in events[:15]:
        risk_class = e.nivel_riesgo.lower() if e.nivel_riesgo else "medio"
        events_html += f"""
        <div class="event">
            <div class="event-header">
                <span class="event-time">{e.event_ts.strftime("%Y-%m-%d %H:%M")}</span>
                <span class="risk-level risk-{risk_class}">{_escape_html(e.nivel_riesgo or "MEDIUM")}</span>
            </div>
            <div class="event-author">{_escape_html(e.autor)}</div>
            <div class="event-file">{_escape_html(e.archivo)}</div>
            <div class="event-desc">{_escape_html(e.descripcion or "")}</div>
            <div class="indicators">
                {"".join(f'<span class="indicator">{_escape_html(ind)}</span>' for ind in (e.indicadores or [])[:5])}
            </div>
        </div>
        """

    pasos_html = ""
    for i, paso in enumerate((report.pasos_remediacion or [])[:8], 1):
        pasos_html += f"""
        <div class="step">
            <span class="step-num">{i}</span>
            <span class="step-text">{_escape_html(str(paso))}</span>
        </div>
        """

    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Code Security Report - {_escape_html(review.titulo)}</title>
    <style>
        @page {{ size: A4; margin: 2cm; }}
        body {{ font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.4; color: #333; }}
        .header {{ border-bottom: 3px solid #1a56db; padding-bottom: 10px; margin-bottom: 20px; }}
        .header h1 {{ color: #1a56db; margin: 0; font-size: 24pt; }}
        .header .subtitle {{ color: #666; font-size: 12pt; }}
        .header .meta {{ color: #999; font-size: 10pt; margin-top: 5px; }}
        
        .summary-box {{ background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }}
        .summary-box .score {{ font-size: 36pt; font-weight: bold; color: #1a56db; }}
        .summary-box .risk {{ font-size: 14pt; padding: 4px 12px; border-radius: 4px; }}
        .risk-critical {{ background: #dc2626; color: white; }}
        .risk-high {{ background: #ea580c; color: white; }}
        .risk-medium {{ background: #ca8a04; color: white; }}
        .risk-low {{ background: #16a34a; color: white; }}
        
        .section {{ margin: 20px 0; }}
        .section h2 {{ color: #1a56db; border-bottom: 1px solid #ddd; padding-bottom: 5px; font-size: 16pt; }}
        
        .severity-grid {{ display: flex; gap: 15px; margin: 10px 0; }}
        .severity-box {{ flex: 1; text-align: center; padding: 15px; border-radius: 8px; }}
        .severity-critico {{ background: #fef2f2; border: 2px solid #dc2626; }}
        .severity-alto {{ background: #fff7ed; border: 2px solid #ea580c; }}
        .severity-medio {{ background: #fefce8; border: 2px solid #ca8a04; }}
        .severity-bajo {{ background: #f0fdf4; border: 2px solid #16a34a; }}
        .severity-box .count {{ font-size: 24pt; font-weight: bold; }}
        .severity-box .label {{ font-size: 10pt; color: #666; }}
        
        .executive-summary {{ background: white; padding: 15px; border-left: 4px solid #1a56db; }}
        
        .finding {{ background: #fafafa; border: 1px solid #e5e7eb; padding: 10px; margin: 10px 0; border-radius: 6px; }}
        .finding-header {{ display: flex; gap: 10px; align-items: center; margin-bottom: 5px; }}
        .severity {{ padding: 2px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; }}
        .severity-critico {{ background: #dc2626; color: white; }}
        .severity-alto {{ background: #ea580c; color: white; }}
        .severity-medio {{ background: #ca8a04; color: white; }}
        .severity-bajo {{ background: #16a34a; color: white; }}
        .file {{ font-family: monospace; font-size: 10pt; color: #666; }}
        .confidence {{ font-size: 9pt; color: #999; }}
        .finding-type {{ font-weight: bold; color: #1a56db; }}
        .finding-desc {{ font-size: 10pt; color: #444; margin: 5px 0; }}
        .finding-code {{ background: #1f2937; color: #e5e7eb; padding: 8px; border-radius: 4px; font-size: 9pt; overflow: x-hidden; }}
        .finding-code pre {{ margin: 0; white-space: pre-wrap; word-wrap: break-word; }}
        
        .event {{ background: #fafafa; border: 1px solid #e5e7eb; padding: 10px; margin: 10px 0; border-radius: 6px; }}
        .event-header {{ display: flex; justify-content: space-between; margin-bottom: 5px; }}
        .event-time {{ font-size: 10pt; color: #666; }}
        .risk-level {{ padding: 2px 8px; border-radius: 3px; font-size: 9pt; font-weight: bold; }}
        .risk-critical {{ background: #dc2626; color: white; }}
        .risk-high {{ background: #ea580c; color: white; }}
        .risk-medium {{ background: #ca8a04; color: white; }}
        .risk-low {{ background: #16a34a; color: white; }}
        .event-author {{ font-weight: bold; color: #1a56db; font-size: 10pt; }}
        .event-file {{ font-family: monospace; font-size: 10pt; color: #666; }}
        .event-desc {{ font-size: 10pt; color: #444; margin: 5px 0; }}
        .indicators {{ display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }}
        .indicator {{ background: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-size: 8pt; color: #666; }}
        
        .steps {{ counter-reset: step; }}
        .step {{ display: flex; align-items: flex-start; margin: 10px 0; }}
        .step-num {{ 
            counter-increment: step; 
            min-width: 24px; height: 24px; 
            background: #1a56db; color: white; 
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            font-size: 10pt; font-weight: bold;
            margin-right: 10px;
        }}
        .step-text {{ flex: 1; font-size: 11pt; }}
        
        .footer {{ margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9pt; color: #999; text-align: center; }}
        .narrative {{ background: #f9fafb; padding: 15px; border-radius: 6px; font-size: 10pt; line-height: 1.6; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Code Security Report</h1>
        <div class="subtitle">{_escape_html(review.titulo)}</div>
        <div class="meta">
            Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")} | 
            Repository: {_escape_html(review.url_repositorio or "N/A")} | 
            Branch: {_escape_html(review.rama_analizar or "main")}
        </div>
    </div>

    <div class="summary-box">
        <table style="width: 100%;">
            <tr>
                <td style="width: 80px;">
                    <div class="score">{report.puntuacion_riesgo_global}</div>
                </td>
                <td>
                    <div style="font-size: 14pt; margin-bottom: 5px;">Risk Score (0-100)</div>
                    <span class="risk risk-{risk_label.lower()}">{risk_label}</span>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="executive-summary">
            {report.resumen_ejecutivo.replace(chr(10), "<br>") if report.resumen_ejecutivo else "No executive summary available."}
        </div>
    </div>

    <div class="section">
        <h2>Risk Breakdown</h2>
        <div class="severity-grid">
            <div class="severity-box severity-critico">
                <div class="count">{critico}</div>
                <div class="label">Critical</div>
            </div>
            <div class="severity-box severity-alto">
                <div class="count">{alto}</div>
                <div class="label">High</div>
            </div>
            <div class="severity-box severity-medio">
                <div class="count">{medio}</div>
                <div class="label">Medium</div>
            </div>
            <div class="severity-box severity-bajo">
                <div class="count">{bajo}</div>
                <div class="label">Low</div>
            </div>
        </div>
    </div>

    {'<div class="section"><h2>Attack Evolution Narrative</h2><div class="narrative">' + (report.narrativa_evolucion.replace(chr(10), "<br>") if report.narrativa_evolucion else "No narrative available.") + "</div></div>" if report.narrativa_evolucion else ""}

    {'<div class="section"><h2>Key Findings</h2>' + findings_html + "</div>" if findings_html else ""}

    {'<div class="section"><h2>Forensic Timeline</h2>' + events_html + "</div>" if events_html else ""}

    {'<div class="section"><h2>Remediation Steps</h2><div class="steps">' + pasos_html + "</div></div>" if pasos_html else ""}

    <div class="footer">
        <p>AppSec Platform - Code Security Review | {datetime.now().strftime("%Y-%m-%d")}</p>
    </div>
</body>
</html>"""


async def generate_pdf_report(
    review: CodeSecurityReview,
    report: CodeSecurityReport,
    findings: list[CodeSecurityFinding],
    events: list[CodeSecurityEvent],
) -> bytes:
    """Generate PDF report as bytes.

    Args:
        review: The code security review
        report: The generated report
        findings: List of findings
        events: List of forensic events

    Returns:
        PDF content as bytes
    """
    import asyncio
    from concurrent.futures import ThreadPoolExecutor

    def _generate_pdf_sync() -> bytes:
        """Synchronous PDF generation (WeasyPrint is blocking)."""
        html_content = _build_html_report(review, report, findings, events)
        pdf_bytes = HTML(string=html_content).write(
            presentational_hints=True,
            optimize_size=("fonts", "images"),
        )
        return pdf_bytes

    # Run blocking I/O in thread pool to not block event loop
    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(ThreadPoolExecutor(), _generate_pdf_sync)

    return pdf_bytes
