"""Endpoints Code Security Reviews (SCR) — hallazgos de malicia, forense, reportes (fases 1–9)."""

from __future__ import annotations

import asyncio
import csv
import io
import json
import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse, Response, StreamingResponse
from sqlalchemy import asc, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.logging import logger
from app.core.permissions import P
from app.core.rate_limit import enforce_rate_limit
from app.core.response import success
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview
from app.models.code_security_scan_batch import CodeSecurityScanBatch
from app.models.scr_analysis_metric import ScrAnalysisMetric
from app.models.user import User
from app.schemas.code_security_finding import (
    CodeSecurityEventRead,
    CodeSecurityFindingRead,
    CodeSecurityFindingUpdate,
    CodeSecurityReportRead,
    ScrAnalysisMetricRead,
)
from app.schemas.code_security_review import (
    CodeSecurityAnalyzeResponse,
    CodeSecurityOrgBatchCreate,
    CodeSecurityOrgBatchResponse,
    CodeSecurityReviewCreate,
    CodeSecurityReviewRead,
    CodeSecurityReviewUpdate,
)
from app.services.code_security_finding_service import code_security_finding_svc
from app.services.code_security_review_service import code_security_review_svc
from app.services.scr_github_client import list_org_repos
from app.services.scr_github_context import scr_github_bearer_token
from app.services.scr_enqueue import enqueue_scr_analysis

router = APIRouter()


def _comparison_key(finding: CodeSecurityFinding) -> str:
    return "|".join(
        [
            finding.archivo or "",
            str(finding.linea_inicio or 0),
            str(finding.linea_fin or 0),
            finding.tipo_malicia or "",
            (finding.codigo_snippet or "")[:120],
        ]
    )


async def _finding_payloads(db: AsyncSession, findings: list[CodeSecurityFinding]) -> list[dict]:
    assignee_ids = {finding.asignado_a_id for finding in findings if finding.asignado_a_id}
    assignees: dict[uuid.UUID, User] = {}
    if assignee_ids:
        users = (await db.execute(select(User).where(User.id.in_(assignee_ids)))).scalars().all()
        assignees = {user.id: user for user in users}

    payloads = []
    for finding in findings:
        payload = CodeSecurityFindingRead.model_validate(finding).model_dump(mode="json")
        assignee = assignees.get(finding.asignado_a_id) if finding.asignado_a_id else None
        payload["assignee_email"] = assignee.email if assignee else None
        payload["assignee_name"] = assignee.full_name or assignee.username if assignee else None
        payloads.append(payload)
    return payloads


@router.get("")
@router.get("/")  # Compatibilidad con frontend que envía trailing slash
async def list_code_security_reviews(
    search: str | None = Query(None),
    estado: str | None = Query(None),
    repo: str | None = Query(None),
    provider: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Fase 3 — lista revisiones SCR del usuario actual."""
    logger.info(
        "scr.list_reviews.start",
        extra={
            "user_id": str(current_user.id),
            "search": search,
            "estado": estado,
            "repo_filter": repo is not None,
            "skip": skip,
            "limit": limit,
        },
    )

    stmt = select(CodeSecurityReview).where(
        CodeSecurityReview.user_id == current_user.id,
        CodeSecurityReview.deleted_at.is_(None),
    )
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                CodeSecurityReview.titulo.ilike(term),
                CodeSecurityReview.url_repositorio.ilike(term),
                CodeSecurityReview.github_org_slug.ilike(term),
            )
        )
    if estado:
        stmt = stmt.where(CodeSecurityReview.estado == estado)
    if repo:
        stmt = stmt.where(CodeSecurityReview.url_repositorio.ilike(f"%{repo.strip()}%"))
    if provider:
        stmt = stmt.where(CodeSecurityReview.scr_config["provider"].astext == provider)
    if date_from:
        stmt = stmt.where(CodeSecurityReview.created_at >= date_from)
    if date_to:
        stmt = stmt.where(CodeSecurityReview.created_at <= date_to)

    sort_columns = {
        "created_at": CodeSecurityReview.created_at,
        "updated_at": CodeSecurityReview.updated_at,
        "titulo": CodeSecurityReview.titulo,
        "estado": CodeSecurityReview.estado,
    }
    sort_col = sort_columns.get(sort_by, CodeSecurityReview.created_at)
    stmt = stmt.order_by(asc(sort_col) if sort_order.lower() == "asc" else desc(sort_col)).offset(skip).limit(limit)
    items = (await db.execute(stmt)).scalars().all()

    logger.info(
        "scr.list_reviews.success",
        extra={"user_id": str(current_user.id), "results_count": len(items)},
    )

    return success([CodeSecurityReviewRead.model_validate(x).model_dump(mode="json") for x in items])


@router.post("")
@router.post("/")  # Compatibilidad con frontend que envía trailing slash
async def create_code_security_review(
    entity_in: CodeSecurityReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    logger.info(
        "scr.create_review.start",
        extra={
            "user_id": str(current_user.id),
            "titulo": entity_in.titulo,
            "scan_type": entity_in.tipo_escaneo,
            "url_repositorio": entity_in.url_repositorio,
        },
    )

    # Rate limit: max 5 SCR creations per user per hour
    try:
        enforce_rate_limit(
            bucket="scr_create",
            key=str(current_user.id),
            limit=5,
            window_seconds=3600,
        )
    except Exception as e:
        logger.warning(
            "scr.create_review.rate_limit_exceeded",
            extra={"user_id": str(current_user.id), "error": str(e)},
        )
        raise

    entity = await code_security_review_svc.create(db, entity_in, extra={"user_id": current_user.id})

    logger.info(
        "scr.create_review.success",
        extra={
            "user_id": str(current_user.id),
            "review_id": str(entity.id),
            "estado": entity.estado,
        },
    )

    payload = success(CodeSecurityReviewRead.model_validate(entity).model_dump(mode="json"))
    return JSONResponse(status_code=201, content=payload)


@router.get("/compare/export")
async def export_review_comparison(
    base_review_id: uuid.UUID = Query(...),
    target_review_id: uuid.UUID = Query(...),
    format: str = Query("pdf", description="Format: pdf or json"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EXPORT)),
):
    """Exporta comparación real entre dos escaneos del usuario."""
    from app.core.exceptions import BadRequestException, NotFoundException

    reviews = (
        await db.execute(
            select(CodeSecurityReview).where(
                CodeSecurityReview.id.in_([base_review_id, target_review_id]),
                CodeSecurityReview.user_id == current_user.id,
                CodeSecurityReview.deleted_at.is_(None),
            )
        )
    ).scalars().all()
    by_id = {review.id: review for review in reviews}
    base_review = by_id.get(base_review_id)
    target_review = by_id.get(target_review_id)
    if not base_review or not target_review:
        raise NotFoundException("Uno de los escaneos no existe o no pertenece al usuario.")

    base_repo = (base_review.url_repositorio or "").rstrip("/").removesuffix(".git")
    target_repo = (target_review.url_repositorio or "").rstrip("/").removesuffix(".git")
    if base_repo and target_repo and base_repo != target_repo:
        raise BadRequestException("Solo se pueden comparar escaneos del mismo repositorio.")

    findings_rows = (
        await db.execute(
            select(CodeSecurityFinding).where(
                CodeSecurityFinding.review_id.in_([base_review.id, target_review.id]),
                CodeSecurityFinding.user_id == current_user.id,
                CodeSecurityFinding.deleted_at.is_(None),
            )
        )
    ).scalars().all()
    base_findings = [finding for finding in findings_rows if finding.review_id == base_review.id]
    target_findings = [finding for finding in findings_rows if finding.review_id == target_review.id]

    if format.lower() == "json":
        base_fingerprints = {_comparison_key(finding) for finding in base_findings}
        target_fingerprints = {_comparison_key(finding) for finding in target_findings}
        return success(
            {
                "base_review": CodeSecurityReviewRead.model_validate(base_review).model_dump(mode="json"),
                "target_review": CodeSecurityReviewRead.model_validate(target_review).model_dump(mode="json"),
                "resolved_count": len(base_fingerprints - target_fingerprints),
                "introduced_count": len(target_fingerprints - base_fingerprints),
                "persisted_count": len(base_fingerprints & target_fingerprints),
                "base_findings": await _finding_payloads(db, base_findings),
                "target_findings": await _finding_payloads(db, target_findings),
            }
        )
    if format.lower() != "pdf":
        raise BadRequestException("Formato no soportado. Usa 'pdf' o 'json'.")

    from app.services.pdf_export_service import generate_pdf_comparison

    pdf_bytes = await generate_pdf_comparison(base_review, target_review, base_findings, target_findings)
    timestamp = datetime.now().strftime("%Y%m%d")
    return Response(
        content=pdf_bytes,
        headers={"Content-Disposition": f'attachment; filename="scr-comparison-{timestamp}.pdf"'},
        media_type="application/pdf",
    )


@router.get("/findings/global")
async def list_global_findings(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    search: str | None = Query(None),
    severidad: str | None = Query(None),
    estado: str | None = Query(None),
    tipo_malicia: str | None = Query(None),
    repo: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    stmt = (
        select(CodeSecurityFinding, CodeSecurityReview)
        .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityFinding.review_id)
        .where(
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
        )
    )
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                CodeSecurityFinding.archivo.ilike(term),
                CodeSecurityFinding.tipo_malicia.ilike(term),
                CodeSecurityFinding.descripcion.ilike(term),
                CodeSecurityReview.titulo.ilike(term),
                CodeSecurityReview.url_repositorio.ilike(term),
            )
        )
    if severidad:
        stmt = stmt.where(CodeSecurityFinding.severidad == severidad)
    if estado:
        stmt = stmt.where(CodeSecurityFinding.estado == estado)
    if tipo_malicia:
        stmt = stmt.where(CodeSecurityFinding.tipo_malicia == tipo_malicia)
    if repo:
        stmt = stmt.where(CodeSecurityReview.url_repositorio.ilike(f"%{repo.strip()}%"))
    rows = (await db.execute(stmt.order_by(CodeSecurityFinding.created_at.desc()).offset(skip).limit(limit))).all()
    findings = [row[0] for row in rows]
    finding_payloads = await _finding_payloads(db, findings)
    payload = []
    for index, row in enumerate(rows):
        payload.append(
            {
                **finding_payloads[index],
                "review": CodeSecurityReviewRead.model_validate(row[1]).model_dump(mode="json"),
            }
        )
    return success(payload)


@router.get("/events/global")
async def list_global_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    query: str | None = Query(None),
    author: str | None = Query(None),
    repo: str | None = Query(None),
    severity: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    stmt = (
        select(CodeSecurityEvent, CodeSecurityReview)
        .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityEvent.review_id)
        .where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
        )
    )
    if query:
        term = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                CodeSecurityEvent.autor.ilike(term),
                CodeSecurityEvent.archivo.ilike(term),
                CodeSecurityEvent.mensaje_commit.ilike(term),
                CodeSecurityEvent.descripcion.ilike(term),
                CodeSecurityEvent.commit_hash.ilike(term),
                CodeSecurityReview.titulo.ilike(term),
                CodeSecurityReview.url_repositorio.ilike(term),
            )
        )
    if author:
        stmt = stmt.where(CodeSecurityEvent.autor.ilike(f"%{author.strip()}%"))
    if repo:
        stmt = stmt.where(CodeSecurityReview.url_repositorio.ilike(f"%{repo.strip()}%"))
    if severity:
        stmt = stmt.where(CodeSecurityEvent.nivel_riesgo == severity)
    if start_date:
        stmt = stmt.where(CodeSecurityEvent.event_ts >= start_date)
    if end_date:
        stmt = stmt.where(CodeSecurityEvent.event_ts <= end_date)
    rows = (await db.execute(stmt.order_by(CodeSecurityEvent.event_ts.desc()).offset(skip).limit(limit))).all()
    return success(
        [
            {
                **CodeSecurityEventRead.model_validate(row[0]).model_dump(mode="json"),
                "review": CodeSecurityReviewRead.model_validate(row[1]).model_dump(mode="json"),
            }
            for row in rows
        ]
    )


@router.get("/findings/export")
async def export_global_findings(
    format: str = Query("json"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EXPORT)),
):
    rows = (
        await db.execute(
            select(CodeSecurityFinding, CodeSecurityReview)
            .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityFinding.review_id)
            .where(
                CodeSecurityFinding.user_id == current_user.id,
                CodeSecurityFinding.deleted_at.is_(None),
                CodeSecurityReview.user_id == current_user.id,
                CodeSecurityReview.deleted_at.is_(None),
            )
            .order_by(CodeSecurityFinding.created_at.desc())
        )
    ).all()
    payload = [
        {
            "id": str(finding.id),
            "review_id": str(finding.review_id),
            "scan": review.titulo,
            "repository": review.url_repositorio,
            "file": finding.archivo,
            "lines": f"{finding.linea_inicio}-{finding.linea_fin}",
            "severity": finding.severidad,
            "type": finding.tipo_malicia,
            "status": finding.estado,
            "confidence": finding.confianza,
        }
        for finding, review in rows
    ]
    if format.lower() == "csv":
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=list(payload[0].keys()) if payload else ["id"])
        writer.writeheader()
        writer.writerows(payload)
        return Response(
            content=buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="scr-findings.csv"'},
        )
    return JSONResponse(
        content={"status": "success", "data": payload},
        headers={"Content-Disposition": 'attachment; filename="scr-findings.json"'},
        media_type="application/json",
    )


@router.get("/events/export")
async def export_global_events(
    format: str = Query("json"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EXPORT)),
):
    rows = (
        await db.execute(
            select(CodeSecurityEvent, CodeSecurityReview)
            .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityEvent.review_id)
            .where(CodeSecurityReview.user_id == current_user.id, CodeSecurityReview.deleted_at.is_(None))
            .order_by(CodeSecurityEvent.event_ts.desc())
        )
    ).all()
    payload = [
        {
            "id": str(event.id),
            "review_id": str(event.review_id),
            "scan": review.titulo,
            "repository": review.url_repositorio,
            "timestamp": event.event_ts.isoformat(),
            "commit_hash": event.commit_hash,
            "author": event.autor,
            "file": event.archivo,
            "risk": event.nivel_riesgo,
            "indicators": ",".join(event.indicadores or []),
        }
        for event, review in rows
    ]
    if format.lower() == "csv":
        buffer = io.StringIO()
        writer = csv.DictWriter(buffer, fieldnames=list(payload[0].keys()) if payload else ["id"])
        writer.writeheader()
        writer.writerows(payload)
        return Response(
            content=buffer.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="scr-forensic-events.csv"'},
        )
    return JSONResponse(
        content={"status": "success", "data": payload},
        headers={"Content-Disposition": 'attachment; filename="scr-forensic-events.json"'},
        media_type="application/json",
    )


@router.get("/{review_id}")
async def get_code_security_review(
    entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    return success(CodeSecurityReviewRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{review_id}")
async def update_code_security_review(
    entity_in: CodeSecurityReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
    entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    updated = await code_security_review_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(CodeSecurityReviewRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{review_id}")
async def delete_code_security_review(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.DELETE)),
    entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    await code_security_review_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success({"deleted": True}, meta={"message": "CodeSecurityReview deleted"})


@router.post("/{review_id}/analyze", status_code=202)
async def analyze_code_security_review(
    background_tasks: BackgroundTasks,
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Fases 4–6 — encola pipeline stub (Inspector/Detective/Fiscal)."""
    from app.core.exceptions import ConflictException

    if review_entity.estado != "PENDING":
        raise ConflictException(
            "Este escaneo ya fue ejecutado. Crea un nuevo escaneo o usa re-escaneo para conservar historial y métricas."
        )
    # Rate limit: max 3 analyses per user per hour
    enforce_rate_limit(
        bucket="scr_analyze",
        key=str(current_user.id),
        limit=3,
        window_seconds=3600,
    )
    enqueue_scr_analysis(review_entity.id, background_tasks)
    return success(
        CodeSecurityAnalyzeResponse(
            message="Análisis encolado (pipeline Inspector → Detective → Fiscal).",
            review_id=review_entity.id,
            status="ANALYZING",
        ).model_dump(mode="json")
    )


@router.get("/{review_id}/stream")
async def stream_review_progress(
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """SSE — progreso en tiempo real (misma fuente que polling sobre la revisión)."""

    rid = review_entity.id

    async def event_generator():
        from app.database import async_session

        last_progress = -1
        try:
            while True:
                async with async_session() as session:
                    result = await session.execute(select(CodeSecurityReview).where(CodeSecurityReview.id == rid))
                    review = result.scalar_one_or_none()
                if not review:
                    yield f"data: {json.dumps({'error': 'Review not found'})}\n\n"
                    return

                if review.progreso != last_progress:
                    payload = {
                        "progress": review.progreso,
                        "agent": review.agente_actual or "waiting",
                        "activity": review.actividad or "…",
                        "estado": review.estado,
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                    last_progress = review.progreso

                if review.estado in ("COMPLETED", "FAILED", "CANCELLED"):
                    break

                await asyncio.sleep(2)
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{review_id}/progress")
async def review_progress(
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    return success(
        {
            "progress": review_entity.progreso,
            "status": review_entity.estado,
            "agent": review_entity.agente_actual,
            "activity": review_entity.actividad,
            "current_phase": review_entity.agente_actual or ("pipeline" if review_entity.estado == "ANALYZING" else "idle_or_done"),
            "estimated_completion": None,
            "started_at": review_entity.started_at.isoformat() if review_entity.started_at else None,
            "completed_at": review_entity.completed_at.isoformat() if review_entity.completed_at else None,
            "duration_ms": review_entity.duration_ms,
            "total_tokens_used": review_entity.total_tokens_used,
            "estimated_cost_usd": review_entity.estimated_cost_usd,
        }
    )


@router.post("/{review_id}/cancel")
async def cancel_code_security_review(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    from app.core.exceptions import ConflictException

    if review_entity.estado not in {"PENDING", "ANALYZING"}:
        raise ConflictException("Solo se pueden cancelar escaneos pendientes o en ejecución.")
    review_entity.estado = "CANCELLED"
    review_entity.actividad = "Cancelado por el usuario"
    review_entity.completed_at = datetime.now(UTC)
    if review_entity.started_at:
        review_entity.duration_ms = max(0, int((review_entity.completed_at - review_entity.started_at).total_seconds() * 1000))
    await db.flush()
    return success(
        {
            "review_id": str(review_entity.id),
            "status": "CANCELLED",
            "cancelled_by": str(current_user.id),
            "cancelled_at": review_entity.completed_at.isoformat() if review_entity.completed_at else None,
        }
    )


@router.get("/{review_id}/metrics")
async def get_review_metrics(
    db: AsyncSession = Depends(get_db),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    stmt = (
        select(ScrAnalysisMetric)
        .where(ScrAnalysisMetric.review_id == review_entity.id)
        .order_by(ScrAnalysisMetric.started_at.asc())
    )
    rows = (await db.execute(stmt)).scalars().all()
    return success([ScrAnalysisMetricRead.model_validate(row).model_dump(mode="json") for row in rows])


@router.get("/{review_id}/findings")
async def list_review_findings(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    severidad: str | None = Query(None),
    estado: str | None = Query(None),
    tipo_malicia: str | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    stmt = select(CodeSecurityFinding).where(
        CodeSecurityFinding.user_id == current_user.id,
        CodeSecurityFinding.review_id == review_entity.id,
        CodeSecurityFinding.deleted_at.is_(None),
    )
    if severidad:
        stmt = stmt.where(CodeSecurityFinding.severidad == severidad)
    if estado:
        stmt = stmt.where(CodeSecurityFinding.estado == estado)
    if tipo_malicia:
        stmt = stmt.where(CodeSecurityFinding.tipo_malicia == tipo_malicia)
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            or_(
                CodeSecurityFinding.archivo.ilike(term),
                CodeSecurityFinding.tipo_malicia.ilike(term),
                CodeSecurityFinding.descripcion.ilike(term),
            )
        )
    sort_columns = {
        "created_at": CodeSecurityFinding.created_at,
        "updated_at": CodeSecurityFinding.updated_at,
        "severidad": CodeSecurityFinding.severidad,
        "confianza": CodeSecurityFinding.confianza,
        "estado": CodeSecurityFinding.estado,
        "tipo_malicia": CodeSecurityFinding.tipo_malicia,
    }
    sort_col = sort_columns.get(sort_by, CodeSecurityFinding.created_at)
    stmt = stmt.order_by(asc(sort_col) if sort_order.lower() == "asc" else desc(sort_col)).offset(skip).limit(limit)
    items = (await db.execute(stmt)).scalars().all()
    return success(await _finding_payloads(db, list(items)))


@router.patch("/{review_id}/findings/{finding_id}")
async def patch_finding(
    finding_id: uuid.UUID,
    body: CodeSecurityFindingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    from app.core.exceptions import NotFoundException

    existing = await code_security_finding_svc.get(db, finding_id, scope={"user_id": current_user.id})
    if existing is None or existing.review_id != review_entity.id:
        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")

    previous_status = existing.estado
    previous_assignee = existing.asignado_a_id
    updated = await code_security_finding_svc.update(db, finding_id, body, scope={"user_id": current_user.id})
    if updated is None:
        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")
    from app.models.code_security_finding_history import CodeSecurityFindingHistory

    history_details = []
    if body.estado is not None and body.estado != previous_status:
        history_details.append(f"estado: {previous_status} -> {body.estado}")
    if body.asignado_a_id != previous_assignee:
        history_details.append(f"asignado_a_id: {previous_assignee or 'sin_asignar'} -> {body.asignado_a_id or 'sin_asignar'}")
    if history_details:
        db.add(
            CodeSecurityFindingHistory(
                finding_id=updated.id,
                usuario_id=current_user.id,
                accion="finding.patch",
                detalle="; ".join(history_details),
            )
        )
        await db.flush()
    payloads = await _finding_payloads(db, [updated])
    return success(payloads[0])


@router.get("/{review_id}/findings/{finding_id}")
async def get_finding(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    from app.core.exceptions import NotFoundException

    finding = await code_security_finding_svc.get(db, finding_id, scope={"user_id": current_user.id})
    if finding is None or finding.review_id != review_entity.id:
        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")
    payloads = await _finding_payloads(db, [finding])
    return success(payloads[0])


@router.get("/{review_id}/findings/{finding_id}/comments")
async def list_finding_comments(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    from app.core.exceptions import NotFoundException
    from app.models.code_security_finding_history import CodeSecurityFindingHistory

    finding = await code_security_finding_svc.get(db, finding_id, scope={"user_id": current_user.id})
    if finding is None or finding.review_id != review_entity.id:
        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")
    rows = (
        await db.execute(
            select(CodeSecurityFindingHistory)
            .where(
                CodeSecurityFindingHistory.finding_id == finding_id,
                CodeSecurityFindingHistory.accion.in_(["comment", "finding.patch", "status.bulk_update", "assignment.bulk_update", "false_positive.bulk_mark"]),
            )
            .order_by(CodeSecurityFindingHistory.created_at.asc())
        )
    ).scalars().all()
    return success(
        [
            {
                "id": str(row.id),
                "finding_id": str(row.finding_id),
                "user_id": str(row.usuario_id) if row.usuario_id else None,
                "action": row.accion,
                "comment": row.detalle,
                "created_at": row.created_at.isoformat(),
            }
            for row in rows
        ]
    )


@router.post("/{review_id}/findings/{finding_id}/comments")
async def create_finding_comment(
    finding_id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    from app.core.exceptions import BadRequestException, NotFoundException
    from app.models.code_security_finding_history import CodeSecurityFindingHistory

    comment = str(body.get("comment") or body.get("text") or "").strip()
    if len(comment) < 3:
        raise BadRequestException("El comentario debe tener al menos 3 caracteres.")
    finding = await code_security_finding_svc.get(db, finding_id, scope={"user_id": current_user.id})
    if finding is None or finding.review_id != review_entity.id:
        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")
    row = CodeSecurityFindingHistory(
        finding_id=finding.id,
        usuario_id=current_user.id,
        accion="comment",
        detalle=comment,
    )
    db.add(row)
    await db.flush()
    return success(
        {
            "id": str(row.id),
            "finding_id": str(row.finding_id),
            "user_id": str(row.usuario_id) if row.usuario_id else None,
            "action": row.accion,
            "comment": row.detalle,
            "created_at": row.created_at.isoformat(),
        }
    )


@router.get("/{review_id}/events")
async def list_review_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    severity: str | None = Query(None),
    author: str | None = Query(None),
    file: str | None = Query(None),
    query: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    stmt = (
        select(CodeSecurityEvent)
        .where(CodeSecurityEvent.review_id == review_entity.id)
    )
    if severity:
        stmt = stmt.where(CodeSecurityEvent.nivel_riesgo == severity)
    if author:
        stmt = stmt.where(CodeSecurityEvent.autor.ilike(f"%{author.strip()}%"))
    if file:
        stmt = stmt.where(CodeSecurityEvent.archivo.ilike(f"%{file.strip()}%"))
    if query:
        term = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                CodeSecurityEvent.autor.ilike(term),
                CodeSecurityEvent.archivo.ilike(term),
                CodeSecurityEvent.mensaje_commit.ilike(term),
                CodeSecurityEvent.descripcion.ilike(term),
                CodeSecurityEvent.commit_hash.ilike(term),
            )
        )
    if start_date:
        stmt = stmt.where(CodeSecurityEvent.event_ts >= start_date)
    if end_date:
        stmt = stmt.where(CodeSecurityEvent.event_ts <= end_date)
    stmt = stmt.order_by(CodeSecurityEvent.event_ts.asc()).offset(skip).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return success([CodeSecurityEventRead.model_validate(x).model_dump(mode="json") for x in rows])


@router.get("/{review_id}/report")
async def get_review_report(
    db: AsyncSession = Depends(get_db),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    stmt = (
        select(CodeSecurityReport)
        .where(CodeSecurityReport.review_id == review_entity.id)
        .where(CodeSecurityReport.deleted_at.is_(None))
    )
    r = await db.execute(stmt)
    rep = r.scalar_one_or_none()
    if rep is None:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Reporte aún no generado.")
    return success(CodeSecurityReportRead.model_validate(rep).model_dump(mode="json"))


@router.get("/{review_id}/export")
async def export_review_bundle(
    format: str = Query("json", description="Format: json or pdf"),
    db: AsyncSession = Depends(get_db),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.EXPORT)),
):
    """Fase 8 — export JSON or PDF bundles."""
    from datetime import datetime

    if format.lower() == "pdf":
        from app.services.pdf_export_service import generate_pdf_report

        report_stmt = select(CodeSecurityReport).where(CodeSecurityReport.review_id == review_entity.id)
        report_result = await db.execute(report_stmt)
        report = report_result.scalar_one_or_none()

        if report is None:
            from app.core.exceptions import NotFoundException

            raise NotFoundException("Reporte aún no generado.")

        findings_stmt = select(CodeSecurityFinding).where(CodeSecurityFinding.review_id == review_entity.id)
        findings_result = await db.execute(findings_stmt)
        findings = findings_result.scalars().all()

        events_stmt = (
            select(CodeSecurityEvent)
            .where(CodeSecurityEvent.review_id == review_entity.id)
            .order_by(CodeSecurityEvent.event_ts.asc())
        )
        events_result = await db.execute(events_stmt)
        events = events_result.scalars().all()

        pdf_bytes = await generate_pdf_report(review_entity, report, list(findings), list(events))

        timestamp = datetime.now().strftime("%Y%m%d")
        return Response(
            content=pdf_bytes,
            headers={"Content-Disposition": f'attachment; filename="csr-{review_entity.id}-{timestamp}.pdf"'},
            media_type="application/pdf",
        )

    if format.lower() != "json":
        from app.core.exceptions import ConflictException

        raise ConflictException("Formato no soportado. Usa 'json' o 'pdf'.")

    findings_stmt = select(CodeSecurityFinding).where(CodeSecurityFinding.review_id == review_entity.id)
    findings_result = await db.execute(findings_stmt)
    findings = findings_result.scalars().all()

    events_stmt = (
        select(CodeSecurityEvent)
        .where(CodeSecurityEvent.review_id == review_entity.id)
        .order_by(CodeSecurityEvent.event_ts.asc())
    )
    events_result = await db.execute(events_stmt)
    events = events_result.scalars().all()

    report_stmt = (
        select(CodeSecurityReport)
        .where(CodeSecurityReport.review_id == review_entity.id)
        .where(CodeSecurityReport.deleted_at.is_(None))
    )
    report_result = await db.execute(report_stmt)
    report = report_result.scalar_one_or_none()

    payload = {
        "review": CodeSecurityReviewRead.model_validate(review_entity).model_dump(mode="json"),
        "findings": await _finding_payloads(db, list(findings)),
        "events": [CodeSecurityEventRead.model_validate(item).model_dump(mode="json") for item in events],
        "report": CodeSecurityReportRead.model_validate(report).model_dump(mode="json") if report else None,
        "exported_at": datetime.now().isoformat(),
    }
    return JSONResponse(
        content={"status": "success", "data": payload},
        headers={"Content-Disposition": f'attachment; filename="csr-{review_entity.id}.json"'},
        media_type="application/json",
    )


@router.post("/batch/org")
async def create_org_batch_placeholder(
    background_tasks: BackgroundTasks,
    body: CodeSecurityOrgBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Fase 3/4 — crea lote por organización y encola análisis para cada repo visible."""
    gh_plain = None
    if body.github_token_id:
        from app.models.scr_github_token import ScrGitHubToken

        token_res = await db.execute(
            select(ScrGitHubToken).where(
                ScrGitHubToken.id == body.github_token_id,
                ScrGitHubToken.deleted_at.is_(None),
            )
        )
        token_row = token_res.scalar_one_or_none()
        if token_row:
            gh_plain = token_row.token_secret

    with scr_github_bearer_token(gh_plain):
        repos = await list_org_repos(body.github_org_slug)
    if body.repo_urls:
        selected_urls = {url.strip() for url in body.repo_urls if url.strip()}
        repos = [repo for repo in repos if repo.get("html_url") in selected_urls]
    if not repos:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("No hay repositorios visibles para la organización indicada.")

    batch = CodeSecurityScanBatch(
        user_id=current_user.id,
        titulo=body.titulo,
        github_org_slug=body.github_org_slug,
        estado="ANALYZING",
    )
    db.add(batch)
    await db.flush()

    created = 0
    for repo in repos:
        review = await code_security_review_svc.create(
            db,
            CodeSecurityReviewCreate(
                titulo=f"{body.titulo} - {repo.get('name') or repo.get('full_name')}",
                estado="PENDING",
                descripcion=f"ORG_BATCH para {body.github_org_slug}",
                progreso=0,
                rama_analizar=repo.get("default_branch") or body.rama_analizar,
                url_repositorio=repo.get("html_url"),
                scan_mode="ORG_BATCH",
                repositorio_id=None,
                github_org_slug=body.github_org_slug,
                scan_batch_id=batch.id,
                scr_config={
                    **(body.scr_config or {}),
                    **({"github_token_id": str(body.github_token_id)} if body.github_token_id else {}),
                },
            ),
            extra={"user_id": current_user.id},
        )
        created += 1
        enqueue_scr_analysis(review.id, background_tasks)

    return success(
        CodeSecurityOrgBatchResponse(
            batch_id=batch.id,
            github_org_slug=body.github_org_slug,
            reviews_created=created,
            status="ANALYZING",
        ).model_dump(mode="json")
    )


@router.post("/{review_id}/findings/{finding_id}/false-positive")
async def mark_finding_as_false_positive(
    finding_id: uuid.UUID,
    body: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    """Mark a finding as false positive for ML learning."""
    from app.models.code_security_false_positive import CodeSecurityFalsePositive
    from pydantic import BaseModel

    class FalsePositiveCreate(BaseModel):
        reason: str | None = None
        pattern_type: str | None = None

    validated_body = FalsePositiveCreate(**body)

    existing_fp = await db.execute(
        select(CodeSecurityFalsePositive).where(
            CodeSecurityFalsePositive.finding_id == finding_id,
            CodeSecurityFalsePositive.user_id == current_user.id,
            CodeSecurityFalsePositive.review_id == review_entity.id,
        )
    )
    if existing_fp.scalar_one_or_none():
        from app.core.exceptions import ConflictException

        raise ConflictException("Este hallazgo ya está marcado como falso positivo.")

    fp = CodeSecurityFalsePositive(
        review_id=review_entity.id,
        finding_id=finding_id,
        user_id=current_user.id,
        reason=validated_body.reason,
        pattern_type=validated_body.pattern_type,
    )
    db.add(fp)

    finding_stmt = select(CodeSecurityFinding).where(
        CodeSecurityFinding.id == finding_id,
        CodeSecurityFinding.review_id == review_entity.id,
        CodeSecurityFinding.user_id == current_user.id,
        CodeSecurityFinding.deleted_at.is_(None),
    )
    finding_result = await db.execute(finding_stmt)
    finding = finding_result.scalar_one_or_none()
    if finding is None:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")

    previous_status = finding.estado
    finding.estado = "FALSE_POSITIVE"
    from app.models.code_security_finding_history import CodeSecurityFindingHistory

    db.add(
        CodeSecurityFindingHistory(
            finding_id=finding.id,
            usuario_id=current_user.id,
            accion="false_positive.mark",
            detalle=f"{previous_status} -> FALSE_POSITIVE. Motivo: {validated_body.reason or 'sin motivo'}",
        )
    )
    await db.flush()

    return success(
        {"marked": True, "finding_id": str(finding_id)}, meta={"message": "Hallazgo marcado como falso positivo"}
    )


@router.delete("/{review_id}/findings/{finding_id}/false-positive")
async def unmark_finding_as_false_positive(
    finding_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    """Remove false positive marking from a finding."""
    from app.models.code_security_false_positive import CodeSecurityFalsePositive

    fp_stmt = select(CodeSecurityFalsePositive).where(
        CodeSecurityFalsePositive.finding_id == finding_id,
        CodeSecurityFalsePositive.user_id == current_user.id,
        CodeSecurityFalsePositive.review_id == review_entity.id,
    )
    fp_result = await db.execute(fp_stmt)
    fp = fp_result.scalar_one_or_none()

    if not fp:
        from app.core.exceptions import NotFoundException

        raise NotFoundException("Este hallazgo no está marcado como falso positivo.")

    await db.delete(fp)
    await db.flush()

    finding_stmt = select(CodeSecurityFinding).where(
        CodeSecurityFinding.id == finding_id,
        CodeSecurityFinding.review_id == review_entity.id,
        CodeSecurityFinding.user_id == current_user.id,
        CodeSecurityFinding.deleted_at.is_(None),
    )
    finding_result = await db.execute(finding_stmt)
    finding = finding_result.scalar_one_or_none()

    if finding:
        previous_status = finding.estado
        finding.estado = "DETECTED"
        from app.models.code_security_finding_history import CodeSecurityFindingHistory

        db.add(
            CodeSecurityFindingHistory(
                finding_id=finding.id,
                usuario_id=current_user.id,
                accion="false_positive.unmark",
                detalle=f"{previous_status} -> DETECTED",
            )
        )
        await db.flush()

    return success(
        {"unmarked": True, "finding_id": str(finding_id)}, meta={"message": "Marcado de falso positivo eliminado"}
    )


@router.get("/{review_id}/false-positives")
async def list_false_positives(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    """List all false positive markings for a review."""
    from app.models.code_security_false_positive import CodeSecurityFalsePositive
    from app.schemas.code_security_finding import CodeSecurityFalsePositiveRead

    stmt = select(CodeSecurityFalsePositive).where(CodeSecurityFalsePositive.review_id == review_entity.id)
    result = await db.execute(stmt)
    fps = result.scalars().all()

    return success([CodeSecurityFalsePositiveRead.model_validate(fp).model_dump(mode="json") for fp in fps])


@router.get("/providers/health")
async def check_providers_health(
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Check health status of all LLM providers.

    Returns which providers are configured and available for use.
    This is called before analysis to ensure provider is available.
    """
    from app.services.ia_provider import AIProviderType, get_ai_provider

    providers_status = {}

    for provider_type in AIProviderType:
        try:
            provider_obj = get_ai_provider(provider_type)
            is_healthy = await provider_obj.health_check()
            providers_status[provider_type.value] = {
                "available": is_healthy,
                "status": "healthy" if is_healthy else "unavailable",
            }
        except Exception as e:
            providers_status[provider_type.value] = {
                "available": False,
                "status": "error",
                "error": str(e)[:100],
            }

    return success({"providers": providers_status})


@router.get("/github/repos")
async def list_github_repositories(
    username: str = Query(..., description="GitHub username or org slug"),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """List repositories for a GitHub user or organization.

    Frontend calls this when creating a new scan to browse repositories.
    """
    from app.services.scr_github_client import list_github_user_repos

    try:
        repos = await list_github_user_repos(username)
        return success(repos)
    except Exception as e:
        from app.core.exceptions import BadRequestException

        raise BadRequestException(f"Failed to fetch repositories: {str(e)[:200]}")


@router.get("/github/branches")
async def list_repository_branches(
    repo_url: str = Query(..., description="GitHub repository URL"),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """List branches for a repository.

    Frontend calls this when selecting a branch for analysis.
    """
    from app.services.scr_github_client import list_repository_branches as gh_list_branches

    try:
        branches = await gh_list_branches(repo_url)
        return success(branches)
    except Exception as e:
        from app.core.exceptions import BadRequestException

        raise BadRequestException(f"Failed to fetch branches: {str(e)[:200]}")
