"""Dashboard OKR Global service - Vista Organizacional."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.okr_revision_q import OkrRevisionQ
from app.models.user import User


async def build_okr_global_dashboard(
    db: AsyncSession,
    *,
    year: int | None = None,
    direccion_id: UUID | None = None,
) -> dict:
    """
    Build dashboard for "Vista Global" - consolidated organization view.
    Returns aggregated metrics by cell/team.
    """
    current_year = year or datetime.now(UTC).year

    # Get all active users with their organizacion info
    users_stmt = select(User).where(User.is_active.is_(True))
    users_result = await db.execute(users_stmt)
    all_users = list(users_result.scalars().all())

    # For each user, calculate their OKR metrics
    celulas_data = []
    total_avance = 0
    total_en_riesgo = 0
    total_en_verde = 0

    for user in all_users:
        user_id_val = user.id

        # Get their average advance
        rev_stmt = select(func.avg(OkrRevisionQ.avance_reportado)).where(
            OkrRevisionQ.user_id == user_id_val,
            OkrRevisionQ.deleted_at.is_(None),
        )
        rev_result = await db.execute(rev_stmt)
        avg_avance = rev_result.scalar() or 0

        # Get compromiso count
        comp_stmt = select(func.count(OkrCompromiso.id)).where(
            OkrCompromiso.user_id == user_id_val,
            OkrCompromiso.deleted_at.is_(None),
        )
        comp_result = await db.execute(comp_stmt)
        comp_count = comp_result.scalar() or 0

        # Group by user as a cell representation
        if avg_avance >= 70:
            status = "green"
            total_en_verde += 1
        elif avg_avance >= 40:
            status = "yellow"
        else:
            status = "red"
            total_en_riesgo += 1

        celulas_data.append(
            {
                "id": str(user.id),
                "nombre": user.full_name or user.username,
                "responsable": user.full_name or user.username,
                "compromisos_count": comp_count,
                "avance_promedio": round(avg_avance, 1),
                "status": status,
                "tendencia": "stable",  # Placeholder for trend
            }
        )
        total_avance += avg_avance

    avg_global = total_avance / len(celulas_data) if celulas_data else 0

    # Get top and bottom 5
    sorted_by_avance = sorted(celulas_data, key=lambda x: x["avance_promedio"], reverse=True)
    top_5 = sorted_by_avance[:5]
    bottom_5 = sorted_by_avance[-5:]

    return {
        "celulas": celulas_data,
        "kpis": {
            "total_celulas": len(celulas_data),
            "avg_global": round(avg_global, 1),
            "en_riesgo": total_en_riesgo,
            "en_verde": total_en_verde,
        },
        "top_5": top_5,
        "bottom_5": bottom_5,
        "distribution": {
            "verde": total_en_verde,
            "amarillo": len(celulas_data) - total_en_verde - total_en_riesgo,
            "rojo": total_en_riesgo,
        },
    }
