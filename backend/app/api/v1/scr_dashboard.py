"""Endpoints Dashboard SCR — KPIs, costos, tendencias."""

from datetime import UTC, datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.permissions import P
from app.core.response import success
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview
from app.models.scr_analysis_metric import ScrAnalysisMetric
from app.models.user import User

router = APIRouter(prefix="/scr/dashboard", tags=["SCR Dashboard"])


@router.get("/kpis")
async def get_scr_kpis(
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna KPIs de SCR: escaneos, hallazgos, repositorios."""
    start_date = datetime.now(UTC) - timedelta(days=days)

    # Total escaneos
    total_scans = await db.scalar(
        select(func.count(CodeSecurityReview.id)).where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityReview.created_at >= start_date
        )
    )

    # Hallazgos críticos y altos
    critical = await db.scalar(
        select(func.count(CodeSecurityFinding.id)).where(
            CodeSecurityFinding.severidad == "CRITICO",
            CodeSecurityFinding.estado != "FALSE_POSITIVE",
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.created_at >= start_date,
        )
    )
    high = await db.scalar(
        select(func.count(CodeSecurityFinding.id)).where(
            CodeSecurityFinding.severidad == "ALTO",
            CodeSecurityFinding.estado != "FALSE_POSITIVE",
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.created_at >= start_date,
        )
    )

    # Repositorios únicos escaneados
    scanned_repos = await db.scalar(
        select(func.count(func.distinct(CodeSecurityReview.url_repositorio))).where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityReview.created_at >= start_date
        )
    )

    avg_risk = await db.scalar(
        select(func.avg(CodeSecurityReport.puntuacion_riesgo_global))
        .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityReport.review_id)
        .where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityReport.deleted_at.is_(None),
            CodeSecurityReport.created_at >= start_date,
        )
    )

    return success({
        "total_scans": total_scans or 0,
        "critical_findings": critical or 0,
        "high_findings": high or 0,
        "scanned_repos": scanned_repos or 0,
        "avg_risk_score": round(float(avg_risk or 0), 2),
        "avg_remediation_days": 0,
    })


@router.get("/costs")
async def get_scr_costs(
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna análisis de costos de SCR."""
    start_date = datetime.now(UTC) - timedelta(days=days)
    scans_count = await db.scalar(
        select(func.count(CodeSecurityReview.id)).where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityReview.created_at >= start_date,
        )
    ) or 0
    total_cost = 0.0
    tokens_consumed = 0
    cost_by_agent = []
    recent_scans = []
    try:
        total_cost = await db.scalar(
            select(func.coalesce(func.sum(ScrAnalysisMetric.estimated_cost_usd), 0)).where(
                ScrAnalysisMetric.user_id == current_user.id,
                ScrAnalysisMetric.created_at >= start_date,
            )
        ) or 0.0
        tokens_consumed = await db.scalar(
            select(func.coalesce(func.sum(ScrAnalysisMetric.tokens_used), 0)).where(
                ScrAnalysisMetric.user_id == current_user.id,
                ScrAnalysisMetric.created_at >= start_date,
            )
        ) or 0
        agent_rows = await db.execute(
            select(
                ScrAnalysisMetric.agent,
                func.count(ScrAnalysisMetric.id).label("calls"),
                func.coalesce(func.sum(ScrAnalysisMetric.tokens_used), 0).label("tokens"),
                func.coalesce(func.sum(ScrAnalysisMetric.estimated_cost_usd), 0).label("cost"),
                func.coalesce(func.avg(ScrAnalysisMetric.duration_ms), 0).label("avg_duration_ms"),
            )
            .where(
                ScrAnalysisMetric.user_id == current_user.id,
                ScrAnalysisMetric.created_at >= start_date,
            )
            .group_by(ScrAnalysisMetric.agent)
            .order_by(func.coalesce(func.sum(ScrAnalysisMetric.estimated_cost_usd), 0).desc())
        )
        cost_by_agent = [
            {
                "agent": row.agent,
                "calls": int(row.calls or 0),
                "tokens": int(row.tokens or 0),
                "cost": round(float(row.cost or 0), 6),
                "avg_duration_ms": int(row.avg_duration_ms or 0),
            }
            for row in agent_rows
        ]
    except SQLAlchemyError:
        # Permite que el dashboard cargue aun si la migración de telemetría no ha corrido en un ambiente.
        await db.rollback()
        cost_by_agent = []
    avg_cost_per_scan = 0.0 if scans_count == 0 else float(total_cost) / scans_count
    incremental_runs = await db.scalar(
        select(func.count(CodeSecurityReview.id)).where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityReview.created_at >= start_date,
            CodeSecurityReview.analysis_version > 1,
        )
    ) or 0
    incremental_savings = round(float(incremental_runs) * float(avg_cost_per_scan), 4)

    try:
        scan_rows = await db.execute(
            select(
                CodeSecurityReview.id,
                CodeSecurityReview.titulo,
                CodeSecurityReview.url_repositorio,
                CodeSecurityReview.total_tokens_used,
                CodeSecurityReview.estimated_cost_usd,
                CodeSecurityReview.duration_ms,
                CodeSecurityReview.completed_at,
            )
            .where(
                CodeSecurityReview.user_id == current_user.id,
                CodeSecurityReview.deleted_at.is_(None),
                CodeSecurityReview.created_at >= start_date,
            )
            .order_by(CodeSecurityReview.created_at.desc())
            .limit(10)
        )
        recent_scans = [
            {
                "review_id": str(row.id),
                "title": row.titulo,
                "repository": row.url_repositorio,
                "tokens": int(row.total_tokens_used or 0),
                "cost": round(float(row.estimated_cost_usd or 0), 6),
                "duration_ms": int(row.duration_ms or 0),
                "completed_at": row.completed_at.isoformat() if row.completed_at else None,
            }
            for row in scan_rows
        ]
    except SQLAlchemyError:
        await db.rollback()
        recent_scans = []

    return success({
        "total_cost": round(float(total_cost), 6),
        "tokens_consumed": int(tokens_consumed),
        "avg_cost_per_scan": round(float(avg_cost_per_scan), 6),
        "incremental_savings": incremental_savings,
        "scans_count": scans_count,
        "cost_by_agent": cost_by_agent,
        "recent_scans": recent_scans,
    })


@router.get("/trends")
async def get_scr_trends(
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=7, le=90),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna tendencias de detección vs resolución por semana."""
    start_date = datetime.now(UTC) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date_trunc("week", CodeSecurityFinding.created_at).label("week"),
            func.count(CodeSecurityFinding.id).label("detected"),
            func.sum(
                case((CodeSecurityFinding.estado.in_(["CORRECTED", "VERIFIED", "CLOSED", "FALSE_POSITIVE"]), 1), else_=0)
            ).label("resolved"),
        )
        .where(
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.created_at >= start_date,
        )
        .group_by("week")
        .order_by("week")
    )
    trends = [
        {
            "week": row.week.strftime("%Y-W%V") if row.week else "",
            "detected": int(row.detected or 0),
            "resolved": int(row.resolved or 0),
        }
        for row in result
    ]

    return success(trends)


@router.get("/top-repos")
async def get_scr_top_repos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna top 5 repositorios con más hallazgos activos."""
    rows = await db.execute(
        select(
            CodeSecurityReview.url_repositorio.label("repo_url"),
            CodeSecurityReview.github_org_slug.label("organization"),
            func.max(CodeSecurityReview.created_at).label("last_scan"),
            func.sum(case((CodeSecurityFinding.severidad == "CRITICO", 1), else_=0)).label("critical"),
            func.sum(case((CodeSecurityFinding.severidad == "ALTO", 1), else_=0)).label("high"),
            func.sum(case((CodeSecurityFinding.severidad == "MEDIO", 1), else_=0)).label("medium"),
            func.sum(case((CodeSecurityFinding.severidad == "BAJO", 1), else_=0)).label("low"),
            func.count(CodeSecurityFinding.id).label("total"),
        )
        .join(CodeSecurityFinding, CodeSecurityFinding.review_id == CodeSecurityReview.id)
        .where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.estado != "FALSE_POSITIVE",
        )
        .group_by(CodeSecurityReview.url_repositorio, CodeSecurityReview.github_org_slug)
        .order_by(func.count(CodeSecurityFinding.id).desc())
        .limit(5)
    )
    repos = []
    for row in rows:
        repo_url = row.repo_url or "sin-repositorio"
        repos.append(
            {
                "name": repo_url.rstrip("/").split("/")[-1].replace(".git", ""),
                "url": repo_url,
                "organization": row.organization,
                "critical": int(row.critical or 0),
                "high": int(row.high or 0),
                "medium": int(row.medium or 0),
                "low": int(row.low or 0),
                "total": int(row.total or 0),
                "last_scan": row.last_scan.isoformat() if row.last_scan else None,
            }
        )

    return success(repos)
