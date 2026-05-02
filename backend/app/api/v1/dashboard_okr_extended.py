"""Dashboard OKR Extended API - Team, Global, Calificar."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.permissions import P
from app.core.response import success
from app.models.user import User
from app.schemas.okr_calificacion import OkrCalificacionCreate, OkrCalificacionRead
from app.services.okr_calificacion_service import okr_calificacion_svc
from app.services.dashboard_okr_team import build_okr_team_dashboard
from app.services.dashboard_okr_global import build_okr_global_dashboard
from app.services.dashboard_okr import build_okr_dashboard


router = APIRouter()


@router.get("/okr/team")
async def get_dashboard_okr_team(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    year: int | None = Query(None, description="Año del OKR"),
):
    """
    Dashboard OKR - Vista "Mi Equipo".
    Muestra los compromisos de los reportes directos del usuario.
    """
    payload = await build_okr_team_dashboard(db, user_id=user.id, year=year)
    return success(payload)


@router.get("/okr/global")
async def get_dashboard_okr_global(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    year: int | None = Query(None, description="Año del OKR"),
    direccion_id: UUID | None = Query(None, description="Filtrar por dirección"),
):
    """
    Dashboard OKR - Vista Global.
    Muestra el consolidado organizacional de OKRs.
    """
    payload = await build_okr_global_dashboard(
        db,
        year=year,
        direccion_id=direccion_id,
    )
    return success(payload)


@router.post("/okr/calificar")
async def calificar_okr(
    *,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.EDIT)),
    data: OkrCalificacionCreate,
):
    """
    Calificar el avance de un subcompromiso OKR.
    Crea o actualiza la calificación.
    """
    calificacion = await okr_calificacion_svc.create_or_update_calificacion(
        db,
        user_id=user.id,
        data=data,
    )
    return success({"calificacion": OkrCalificacionRead.model_validate(calificacion)})


@router.get("/okr/evolution")
async def get_okr_evolution(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    quarter: str | None = Query(None, description="Quarter (Q1, Q2, Q3, Q4)"),
):
    """
    Obtener la evolución de avance por semana.
    """
    from datetime import UTC, datetime, timedelta

    # Get all revisions for user
    calificaciones = await okr_calificacion_svc.list_calificaciones_by_user(
        db,
        user_id=user.id,
        quarter=quarter,
    )

    # Group by week
    evolution = []
    for cal in calificaciones:
        evolution.append(
            {
                "quarter": cal.quarter,
                "avance": cal.avance_reportado,
                "estado": cal.estado,
                "comentario": cal.comentario_colaborador,
            }
        )

    return success({"evolution": evolution})


@router.get("/okr/drilldown")
async def okr_drilldown(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    min_avance: float = Query(0, description="Avance mínimo"),
    max_avance: float = Query(100, description="Avance máximo"),
):
    """
    Drill-down from OKR dashboard - show compromisos en rango de avance.
    """
    drilldown = await okr_calificacion_svc.get_drilldown_by_riesgo(
        db,
        user_id=user.id,
        min_avance=min_avance,
        max_avance=max_avance,
    )
    return success({"drilldown": drilldown})


@router.get("/okr")
async def get_dashboard_okr_base(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    year: int | None = Query(None, description="Año del OKR"),
    quarter: int | None = Query(None, description="Quarter"),
    direccion_id: UUID | None = Query(None),
    subdireccion_id: UUID | None = Query(None),
):
    """
    Dashboard OKR base - Vista Mis OKRs.
    """
    payload = await build_okr_dashboard(
        db,
        year=year,
        quarter=quarter,
        direccion_id=direccion_id,
        subdireccion_id=subdireccion_id,
    )
    return success(payload)
