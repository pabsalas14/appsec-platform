"""Endpoints forenses SCR basados en eventos reales de BD."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_review import CodeSecurityReview
from app.models.user import User
from app.schemas.code_security_finding import CodeSecurityEventRead

router = APIRouter(prefix="/code_security_reviews", tags=["SCR Forensic"])


async def _require_review(db: AsyncSession, review_id: UUID, user_id: UUID) -> CodeSecurityReview:
    review = await db.scalar(
        select(CodeSecurityReview).where(
            CodeSecurityReview.id == review_id,
            CodeSecurityReview.user_id == user_id,
            CodeSecurityReview.deleted_at.is_(None),
        )
    )
    if review is None:
        raise NotFoundException("Revisión SCR no encontrada")
    return review


@router.get("/{review_id}/events/search")
async def search_forensic_events(
    review_id: UUID,
    query: str = Query(..., min_length=1),
    author: str | None = Query(None),
    file_pattern: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Busca eventos forenses reales por texto, autor, archivo y rango."""
    await _require_review(db, review_id, current_user.id)
    term = f"%{query.strip()}%"
    stmt = select(CodeSecurityEvent).where(
        CodeSecurityEvent.review_id == review_id,
        or_(
            CodeSecurityEvent.autor.ilike(term),
            CodeSecurityEvent.archivo.ilike(term),
            CodeSecurityEvent.mensaje_commit.ilike(term),
            CodeSecurityEvent.descripcion.ilike(term),
            CodeSecurityEvent.commit_hash.ilike(term),
        ),
    )
    if author:
        stmt = stmt.where(CodeSecurityEvent.autor.ilike(f"%{author.strip()}%"))
    if file_pattern:
        stmt = stmt.where(CodeSecurityEvent.archivo.ilike(f"%{file_pattern.strip()}%"))
    if start_date:
        stmt = stmt.where(CodeSecurityEvent.event_ts >= start_date)
    if end_date:
        stmt = stmt.where(CodeSecurityEvent.event_ts <= end_date)
    stmt = stmt.order_by(CodeSecurityEvent.event_ts.desc()).limit(500)
    rows = (await db.execute(stmt)).scalars().all()
    return success(
        {
            "query": query,
            "results": [CodeSecurityEventRead.model_validate(row).model_dump(mode="json") for row in rows],
            "total": len(rows),
            "filters": {
                "author": author,
                "file_pattern": file_pattern,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
            },
        }
    )


@router.get("/{review_id}/timeline")
async def get_forensic_timeline(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
    granularity: str = Query("daily"),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Agrupa eventos forenses reales por hora/día/semana."""
    await _require_review(db, review_id, current_user.id)
    trunc = {"hourly": "hour", "daily": "day", "weekly": "week"}.get(granularity, "day")
    result = await db.execute(
        select(
            func.date_trunc(trunc, CodeSecurityEvent.event_ts).label("period"),
            func.count(CodeSecurityEvent.id).label("events_count"),
            func.count(func.distinct(CodeSecurityEvent.autor)).label("authors_involved"),
            func.count(func.distinct(CodeSecurityEvent.archivo)).label("files_modified"),
        )
        .where(CodeSecurityEvent.review_id == review_id)
        .group_by("period")
        .order_by("period")
    )
    timeline = [
        {
            "period": row.period.isoformat() if row.period else None,
            "events_count": int(row.events_count or 0),
            "authors_involved": int(row.authors_involved or 0),
            "files_modified": int(row.files_modified or 0),
        }
        for row in result
    ]
    return success(
        {
            "review_id": str(review_id),
            "granularity": granularity,
            "timeline": timeline,
            "summary": {
                "total_events": sum(row["events_count"] for row in timeline),
                "affected_authors": sum(row["authors_involved"] for row in timeline),
            },
        }
    )


@router.get("/{review_id}/forensic/summary")
async def get_forensic_summary(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Resumen forense real basado en eventos y hallazgos."""
    await _require_review(db, review_id, current_user.id)
    total_events = await db.scalar(select(func.count(CodeSecurityEvent.id)).where(CodeSecurityEvent.review_id == review_id)) or 0
    affected_authors = await db.scalar(
        select(func.count(func.distinct(CodeSecurityEvent.autor))).where(CodeSecurityEvent.review_id == review_id)
    ) or 0
    high_risk_files = await db.scalar(
        select(func.count(func.distinct(CodeSecurityEvent.archivo))).where(
            CodeSecurityEvent.review_id == review_id,
            CodeSecurityEvent.nivel_riesgo.in_(["CRITICO", "ALTO"]),
        )
    ) or 0
    critical_findings = await db.scalar(
        select(func.count(CodeSecurityFinding.id)).where(
            CodeSecurityFinding.review_id == review_id,
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.severidad == "CRITICO",
        )
    ) or 0
    return success(
        {
            "review_id": str(review_id),
            "summary": {
                "total_events": int(total_events),
                "affected_authors": int(affected_authors),
                "high_risk_files": int(high_risk_files),
                "critical_findings": int(critical_findings),
            },
        }
    )


@router.get("/{review_id}/author-analysis/{author}")
async def analyze_author_activity(
    review_id: UUID,
    author: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Analiza actividad real de un autor en una revisión."""
    await _require_review(db, review_id, current_user.id)
    rows = (
        await db.execute(
            select(CodeSecurityEvent).where(
                CodeSecurityEvent.review_id == review_id,
                CodeSecurityEvent.autor == author,
            )
        )
    ).scalars().all()
    high_risk = [row for row in rows if row.nivel_riesgo in {"CRITICO", "ALTO"}]
    return success(
        {
            "review_id": str(review_id),
            "author": author,
            "analysis": {
                "total_events": len(rows),
                "high_risk_events": len(high_risk),
                "files_modified": len({row.archivo for row in rows}),
                "risk_level": "ALTO" if high_risk else "BAJO",
            },
        }
    )


@router.get("/{review_id}/anomalies")
async def detect_anomalies(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
    anomaly_type: str | None = Query(None),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista indicadores forenses reales derivados del campo indicadores."""
    await _require_review(db, review_id, current_user.id)
    rows = (await db.execute(select(CodeSecurityEvent).where(CodeSecurityEvent.review_id == review_id))).scalars().all()
    anomalies = []
    for row in rows:
        for indicator in row.indicadores or []:
            if anomaly_type and indicator.lower() != anomaly_type.lower():
                continue
            anomalies.append(
                {
                    "id": f"{row.id}:{indicator}",
                    "type": indicator,
                    "severity": row.nivel_riesgo,
                    "timestamp": row.event_ts.isoformat(),
                    "description": row.descripcion or row.mensaje_commit,
                    "commit_hash": row.commit_hash,
                    "archivo": row.archivo,
                }
            )
    return success({"review_id": str(review_id), "anomalies": anomalies, "total": len(anomalies)})


@router.get("/{review_id}/commit/{commit_hash}/details")
async def get_commit_details(
    review_id: UUID,
    commit_hash: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna eventos reales asociados a un commit."""
    await _require_review(db, review_id, current_user.id)
    rows = (
        await db.execute(
            select(CodeSecurityEvent).where(
                CodeSecurityEvent.review_id == review_id,
                CodeSecurityEvent.commit_hash == commit_hash,
            )
        )
    ).scalars().all()
    if not rows:
        raise NotFoundException("Commit no encontrado en eventos forenses")
    return success(
        {
            "review_id": str(review_id),
            "commit_hash": commit_hash,
            "events": [CodeSecurityEventRead.model_validate(row).model_dump(mode="json") for row in rows],
        }
    )
