"""Bulk actions reales para hallazgos SCR."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Body, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.code_security_false_positive import CodeSecurityFalsePositive
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_finding_history import CodeSecurityFindingHistory
from app.models.code_security_review import CodeSecurityReview
from app.models.user import User
from app.schemas.code_security_finding import CodeSecurityFindingRead

router = APIRouter(prefix="/code_security_reviews", tags=["SCR Bulk Actions"])

VALID_FINDING_STATUSES = {
    "DETECTED",
    "IN_REVIEW",
    "IN_CORRECTION",
    "CORRECTED",
    "VERIFIED",
    "FALSE_POSITIVE",
    "CLOSED",
}

RESOLVED_STATUSES = {"CORRECTED", "VERIFIED", "FALSE_POSITIVE", "CLOSED"}


def _validate_transition(current_status: str, next_status: str) -> None:
    if current_status == "VERIFIED" and next_status != "CLOSED":
        raise BadRequestException("Un hallazgo certificado solo puede cerrarse.")
    if current_status == "CLOSED" and next_status != "CLOSED":
        raise BadRequestException("Un hallazgo cerrado no puede reabrirse desde acciones masivas.")
    if current_status in RESOLVED_STATUSES and next_status == "DETECTED":
        raise BadRequestException("No se permite regresar un hallazgo resuelto a DETECTED sin flujo dedicado.")


def _history(finding: CodeSecurityFinding, user_id: UUID, action: str, detail: str | None) -> CodeSecurityFindingHistory:
    return CodeSecurityFindingHistory(
        finding_id=finding.id,
        usuario_id=user_id,
        accion=action,
        detalle=detail,
    )


class BulkStatusUpdateSchema(BaseModel):
    finding_ids: list[UUID]
    new_status: str
    comment: str | None = None


class BulkAssignmentSchema(BaseModel):
    finding_ids: list[UUID]
    assignee_email: str
    priority: str | None = None


class BulkFalsePositiveSchema(BaseModel):
    finding_ids: list[UUID]
    reason: str
    feedback: str | None = None


async def _require_review(db: AsyncSession, review_id: UUID, user_id: UUID) -> CodeSecurityReview:
    row = await db.scalar(
        select(CodeSecurityReview).where(
            CodeSecurityReview.id == review_id,
            CodeSecurityReview.user_id == user_id,
            CodeSecurityReview.deleted_at.is_(None),
        )
    )
    if row is None:
        raise NotFoundException("Revisión SCR no encontrada")
    return row


async def _scoped_findings(db: AsyncSession, review_id: UUID, user_id: UUID, finding_ids: list[UUID]) -> list[CodeSecurityFinding]:
    if not finding_ids:
        raise BadRequestException("No se especificaron hallazgos")
    rows = (
        await db.execute(
            select(CodeSecurityFinding).where(
                CodeSecurityFinding.id.in_(finding_ids),
                CodeSecurityFinding.review_id == review_id,
                CodeSecurityFinding.user_id == user_id,
                CodeSecurityFinding.deleted_at.is_(None),
            )
        )
    ).scalars().all()
    if len(rows) != len(set(finding_ids)):
        raise NotFoundException("Uno o más hallazgos no existen o no pertenecen a la revisión")
    return list(rows)


@router.patch("/{review_id}/findings/bulk/status")
async def bulk_update_finding_status(
    review_id: UUID,
    schema: BulkStatusUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Actualiza estado de múltiples hallazgos en lote."""
    if schema.new_status not in VALID_FINDING_STATUSES:
        raise BadRequestException(f"Estatus inválido. Usa uno de: {', '.join(sorted(VALID_FINDING_STATUSES))}")
    await _require_review(db, review_id, current_user.id)
    findings = await _scoped_findings(db, review_id, current_user.id, schema.finding_ids)
    for finding in findings:
        _validate_transition(finding.estado, schema.new_status)
        previous = finding.estado
        finding.estado = schema.new_status
        finding.updated_at = datetime.now(UTC)
        db.add(_history(finding, current_user.id, "status.bulk_update", f"{previous} -> {schema.new_status}. {schema.comment or ''}".strip()))
    await db.flush()
    return success(
        {
            "action": "bulk_status_update",
            "review_id": str(review_id),
            "total_processed": len(findings),
            "successful": len(findings),
            "failed": 0,
            "new_status": schema.new_status,
            "comment": schema.comment,
            "timestamp": datetime.now(UTC).isoformat(),
        }
    )


@router.patch("/{review_id}/findings/bulk/assign")
async def bulk_assign_findings(
    review_id: UUID,
    schema: BulkAssignmentSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Asigna múltiples hallazgos a un usuario existente por email."""
    if "@" not in schema.assignee_email:
        raise BadRequestException("Email inválido")
    await _require_review(db, review_id, current_user.id)
    assignee = await db.scalar(select(User).where(User.email == schema.assignee_email))
    if assignee is None:
        raise NotFoundException("Usuario asignado no encontrado")
    findings = await _scoped_findings(db, review_id, current_user.id, schema.finding_ids)
    for finding in findings:
        previous = str(finding.asignado_a_id) if finding.asignado_a_id else "sin_asignar"
        finding.asignado_a_id = assignee.id
        finding.updated_at = datetime.now(UTC)
        db.add(_history(finding, current_user.id, "assignment.bulk_update", f"{previous} -> {assignee.email}"))
    await db.flush()
    return success(
        {
            "action": "bulk_assign",
            "review_id": str(review_id),
            "total_processed": len(findings),
            "successful": len(findings),
            "failed": 0,
            "assignee_email": schema.assignee_email,
            "priority": schema.priority,
            "timestamp": datetime.now(UTC).isoformat(),
        }
    )


@router.post("/{review_id}/findings/bulk/false-positive")
async def bulk_mark_false_positives(
    review_id: UUID,
    schema: BulkFalsePositiveSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Marca múltiples hallazgos como falsos positivos y registra feedback."""
    if len(schema.reason.strip()) < 8:
        raise BadRequestException("El motivo del falso positivo debe tener al menos 8 caracteres.")
    await _require_review(db, review_id, current_user.id)
    findings = await _scoped_findings(db, review_id, current_user.id, schema.finding_ids)
    existing = (
        await db.execute(
            select(CodeSecurityFalsePositive.finding_id).where(
                CodeSecurityFalsePositive.review_id == review_id,
                CodeSecurityFalsePositive.finding_id.in_([finding.id for finding in findings]),
                CodeSecurityFalsePositive.user_id == current_user.id,
            )
        )
    ).scalars().all()
    existing_ids = set(existing)
    for finding in findings:
        _validate_transition(finding.estado, "FALSE_POSITIVE")
        previous = finding.estado
        finding.estado = "FALSE_POSITIVE"
        finding.updated_at = datetime.now(UTC)
        db.add(_history(finding, current_user.id, "false_positive.bulk_mark", f"{previous} -> FALSE_POSITIVE. Motivo: {schema.reason}"))
        if finding.id in existing_ids:
            continue
        db.add(
            CodeSecurityFalsePositive(
                review_id=review_id,
                finding_id=finding.id,
                user_id=current_user.id,
                reason=schema.reason,
                pattern_type=finding.tipo_malicia,
            )
        )
    await db.flush()
    return success(
        {
            "action": "bulk_false_positive",
            "review_id": str(review_id),
            "total_processed": len(findings),
            "successful": len(findings),
            "failed": 0,
            "reason": schema.reason,
            "feedback": schema.feedback,
            "timestamp": datetime.now(UTC).isoformat(),
        }
    )


@router.post("/{review_id}/findings/bulk/remediation-plan")
async def create_bulk_remediation_plan(
    review_id: UUID,
    finding_ids: list[UUID] = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Crea un plan calculado desde los hallazgos seleccionados."""
    await _require_review(db, review_id, current_user.id)
    findings = await _scoped_findings(db, review_id, current_user.id, finding_ids)
    severities = ["CRITICO", "ALTO", "MEDIO", "BAJO"]
    estimated_days = {"CRITICO": 3, "ALTO": 7, "MEDIO": 14, "BAJO": 21}
    phases = []
    total_days = 0
    for index, severity in enumerate(severities, start=1):
        count = sum(1 for finding in findings if finding.severidad == severity)
        if count == 0:
            continue
        days = estimated_days[severity]
        total_days += days
        phases.append(
            {
                "phase": index,
                "severity": severity,
                "findings_count": count,
                "estimated_days": days,
                "priority": index,
            }
        )
    return success(
        {
            "review_id": str(review_id),
            "total_findings": len(findings),
            "plan_created_at": datetime.now(UTC).isoformat(),
            "phases": phases,
            "total_estimated_days": total_days,
            "recommended_order": "Por severidad: CRITICO -> ALTO -> MEDIO -> BAJO",
        }
    )


@router.post("/{review_id}/findings/bulk/export")
async def bulk_export_findings(
    review_id: UUID,
    finding_ids: list[UUID] = Body(...),
    format: str = Body("json"),
    include_code_snippets: bool = Body(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EXPORT)),
):
    """Devuelve los hallazgos seleccionados listos para exportación."""
    if format not in {"json", "csv", "pdf"}:
        raise BadRequestException("Formato inválido. Usa json, csv o pdf")
    await _require_review(db, review_id, current_user.id)
    findings = await _scoped_findings(db, review_id, current_user.id, finding_ids)
    payload = [CodeSecurityFindingRead.model_validate(finding).model_dump(mode="json") for finding in findings]
    if not include_code_snippets:
        for row in payload:
            row["codigo_snippet"] = None
    return success(
        {
            "action": "bulk_export",
            "review_id": str(review_id),
            "total_findings": len(payload),
            "format": format,
            "include_code_snippets": include_code_snippets,
            "findings": payload,
            "generated_at": datetime.now(UTC).isoformat(),
        }
    )


@router.get("/{review_id}/findings/bulk/status-report")
async def get_bulk_status_report(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna reporte consolidado del estado de todos los hallazgos."""
    await _require_review(db, review_id, current_user.id)
    rows = await db.execute(
        select(CodeSecurityFinding.estado, CodeSecurityFinding.severidad, func.count(CodeSecurityFinding.id))
        .where(
            CodeSecurityFinding.review_id == review_id,
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
        )
        .group_by(CodeSecurityFinding.estado, CodeSecurityFinding.severidad)
    )
    status_summary: dict[str, int] = {}
    severity_distribution: dict[str, dict[str, int]] = {}
    for estado, severidad, count in rows:
        count_int = int(count or 0)
        status_summary[estado] = status_summary.get(estado, 0) + count_int
        bucket = severity_distribution.setdefault(severidad, {"total": 0, "resolved": 0})
        bucket["total"] += count_int
        if estado in {"CORRECTED", "VERIFIED", "CLOSED", "FALSE_POSITIVE"}:
            bucket["resolved"] += count_int
    return success(
        {
            "review_id": str(review_id),
            "report_generated_at": datetime.now(UTC).isoformat(),
            "status_summary": status_summary,
            "severity_distribution": severity_distribution,
        }
    )
