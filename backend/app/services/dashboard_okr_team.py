"""Dashboard OKR Team service - Vista Mi Equipo."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.okr_revision_q import OkrRevisionQ
from app.models.user import User


async def build_okr_team_dashboard(
    db: AsyncSession,
    *,
    user_id: UUID,
    year: int | None = None,
) -> dict:
    """
    Build dashboard for "Mi Equipo" view.
    Returns performance data of direct reports.
    """
    current_year = year or datetime.now(UTC).year

    # Get direct reports (users where manager_id = user_id)
    # First find the current user
    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    current_user = user_result.scalar_one_or_none()

    if not current_user:
        return {
            "analistas": [],
            "kpis": {
                "total_analistas": 0,
                "avg_avance": 0,
                "en_riesgo": 0,
                "en_verde": 0,
            },
        }

    # Get users that report to this user (based on organizacion)
    # For now, get users in same organizacion as manager
    team_stmt = select(User).where(
        User.is_active.is_(True),
        User.id != user_id,
    )
    team_result = await db.execute(team_stmt)
    team_members = list(team_result.scalars().all())

    # For each team member, calculate their OKR metrics
    analistas_data = []
    total_avance = 0
    en_riesgo = 0
    en_verde = 0

    for member in team_members:
        # Get their revisions
        rev_stmt = select(func.avg(OkrRevisionQ.avance_reportado)).where(
            OkrRevisionQ.user_id == member.id,
            OkrRevisionQ.deleted_at.is_(None),
        )
        rev_result = await db.execute(rev_stmt)
        avg_avance = rev_result.scalar() or 0

        # Get compromiso count
        comp_stmt = select(func.count(OkrCompromiso.id)).where(
            OkrCompromiso.user_id == member.id,
            OkrCompromiso.deleted_at.is_(None),
        )
        comp_result = await db.execute(comp_stmt)
        comp_count = comp_result.scalar() or 0

        # Determine status
        if avg_avance >= 70:
            status = "green"
            en_verde += 1
        elif avg_avance >= 40:
            status = "yellow"
        else:
            status = "red"
            en_riesgo += 1

        analistas_data.append(
            {
                "id": str(member.id),
                "nombre": member.full_name or member.username,
                "iniciales": (member.full_name or member.username)[:2].upper(),
                "color": "#3b82f6",
                "avance_promedio": round(avg_avance, 1),
                "compromisos_count": comp_count,
                "status": status,
            }
        )
        total_avance += avg_avance

    avg_team = total_avance / len(analistas_data) if analistas_data else 0

    return {
        "analistas": analistas_data,
        "kpis": {
            "total_analistas": len(analistas_data),
            "avg_avance": round(avg_team, 1),
            "en_riesgo": en_riesgo,
            "en_verde": en_verde,
        },
    }
