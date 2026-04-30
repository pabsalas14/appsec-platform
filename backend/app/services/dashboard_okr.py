import math
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_subcompromiso import OkrSubcompromiso

async def build_okr_dashboard(
    db: AsyncSession,
    *,
    year: int | None = None,
    quarter: int | None = None,
    direccion_id: UUID | None = None,
    subdireccion_id: UUID | None = None,
) -> dict:
    """
    Construye el payload real para el Dashboard de OKRs (Simulador de Cascada).
    Extrae el score global, compromisos en riesgo y el heatmap de células.
    """
    
    current_year = year or datetime.now(UTC).year
    
    # 1. Total Score Global de Jefatura (Promedio de avances de compromisos)
    stmt_promedio = select(func.avg(OkrCompromiso.avance_actual)).where(
        OkrCompromiso.deleted_at.is_(None)
    )
    # Filtros simples (se pueden expandir)
    result_promedio = await db.execute(stmt_promedio)
    score_global_raw = result_promedio.scalar() or 0.0
    score_global = round(score_global_raw, 1)

    # 2. Compromisos en Riesgo (Avance < 50%)
    stmt_riesgo = select(func.count(OkrCompromiso.id)).where(
        OkrCompromiso.avance_actual < 50.0,
        OkrCompromiso.deleted_at.is_(None)
    )
    result_riesgo = await db.execute(stmt_riesgo)
    riesgo_count = result_riesgo.scalar() or 0

    # 3. Heatmap Organizacional (Subdirecciones y su avance promedio)
    # Requerimos cruzar OkrCompromiso con la estructura jerárquica
    # Para simplicidad en este paso, agruparemos por responsable
    stmt_heatmap = select(
        OkrCompromiso.responsable, 
        func.avg(OkrCompromiso.avance_actual).label('promedio'),
        func.count(OkrCompromiso.id).label('total')
    ).where(
        OkrCompromiso.deleted_at.is_(None)
    ).group_by(OkrCompromiso.responsable)
    
    heatmap_res = await db.execute(stmt_heatmap)
    heatmap_data = []
    rezago_count = 0
    for row in heatmap_res:
        resp = row.responsable or "Sin Asignar"
        prom = round(row.promedio or 0.0, 1)
        heatmap_data.append({
            "name": resp,
            "score": prom,
            "commitments": row.total
        })
        if prom < 60.0:
            rezago_count += 1

    return {
        "kpis": {
            "score_global": score_global,
            "en_riesgo": riesgo_count,
            "celulas_rezago": rezago_count
        },
        "heatmap": heatmap_data,
        "simulator": {
            "base_score": score_global,
            "nodes": heatmap_data
        }
    }
