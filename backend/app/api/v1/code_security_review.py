"""Endpoints Code Security Reviews (SCR) — hallazgos de malicia, forense, reportes (fases 1–9)."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.permissions import P
from app.core.response import success
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview
from app.models.code_security_scan_batch import CodeSecurityScanBatch
from app.models.user import User
from app.schemas.code_security_finding import (
    CodeSecurityEventRead,
    CodeSecurityFindingRead,
    CodeSecurityFindingUpdate,
    CodeSecurityReportRead,
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
from app.services.scr_pipeline import run_scr_analysis_background

router = APIRouter()


@router.get("")
async def list_code_security_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Fase 3 — lista revisiones SCR del usuario actual."""
    items = await code_security_review_svc.list(db, filters={"user_id": current_user.id})
    return success([CodeSecurityReviewRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{review_id}")
async def get_code_security_review(
    entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    return success(CodeSecurityReviewRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_code_security_review(
    entity_in: CodeSecurityReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    entity = await code_security_review_svc.create(db, entity_in, extra={"user_id": current_user.id})
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
    _: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Fases 4–6 — encola pipeline stub (Inspector/Detective/Fiscal)."""
    background_tasks.add_task(run_scr_analysis_background, review_entity.id)
    return success(
        CodeSecurityAnalyzeResponse(
            message="Análisis encolado (stub asíncrono).",
            review_id=review_entity.id,
            status="ANALYZING",
        ).model_dump(mode="json")
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
            "current_phase": "stub_pipeline" if review_entity.estado == "ANALYZING" else "idle_or_done",
            "estimated_completion": None,
        }
    )


@router.get("/{review_id}/findings")
async def list_review_findings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
):
    items = await code_security_finding_svc.list(
        db,
        filters={"user_id": current_user.id, "review_id": review_entity.id},
    )
    return success([CodeSecurityFindingRead.model_validate(x).model_dump(mode="json") for x in items])


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

    updated = await code_security_finding_svc.update(db, finding_id, body, scope={"user_id": current_user.id})
    if updated is None:
        raise NotFoundException("Hallazgo no encontrado o distinto revisión/usuario.")
    return success(CodeSecurityFindingRead.model_validate(updated).model_dump(mode="json"))


@router.get("/{review_id}/events")
async def list_review_events(
    db: AsyncSession = Depends(get_db),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    stmt = (
        select(CodeSecurityEvent)
        .where(CodeSecurityEvent.review_id == review_entity.id)
        .order_by(CodeSecurityEvent.event_ts.asc())
    )
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
    format: str = Query("json", description="Por ahora solo json (PDF fase 8)."),
    review_entity: CodeSecurityReview = Depends(require_ownership(code_security_review_svc, id_param="review_id")),
    _: User = Depends(require_permission(P.CODE_SECURITY.EXPORT)),
):
    """Fase 8 — export JSON bundles; PDF pendiente librería dedicada."""
    if format.lower() != "json":
        from app.core.exceptions import ConflictException

        raise ConflictException("Por ahora solo está disponible export en JSON.")
    payload = CodeSecurityReviewRead.model_validate(review_entity).model_dump(mode="json")
    return JSONResponse(
        content={"status": "success", "data": {"review": payload}},
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
    repos = await list_org_repos(body.github_org_slug)
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
            ),
            extra={"user_id": current_user.id},
        )
        created += 1
        background_tasks.add_task(run_scr_analysis_background, review.id)

    return success(
        CodeSecurityOrgBatchResponse(
            batch_id=batch.id,
            github_org_slug=body.github_org_slug,
            reviews_created=created,
            status="ANALYZING",
        ).model_dump(mode="json")
    )
