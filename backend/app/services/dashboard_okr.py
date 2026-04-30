import math
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.okr_revision_q import OkrRevisionQ

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
    
    # 1. Total Score Global de Jefatura (Promedio de avances reportados)
    stmt_promedio = select(func.avg(OkrRevisionQ.avance_reportado)).where(
        OkrRevisionQ.deleted_at.is_(None)
    )
    result_promedio = await db.execute(stmt_promedio)
    score_global_raw = result_promedio.scalar() or 0.0
    score_global = round(score_global_raw, 1)

    # 2. Compromisos en Riesgo (Avance < 50%)
    stmt_riesgo = select(func.count(OkrRevisionQ.id)).where(
        OkrRevisionQ.avance_reportado < 50.0,
        OkrRevisionQ.deleted_at.is_(None)
    )
    result_riesgo = await db.execute(stmt_riesgo)
    riesgo_count = result_riesgo.scalar() or 0

    # 3. Heatmap Organizacional
    # Agruparemos por nombre_objetivo del compromiso
    stmt_heatmap = select(
        OkrCompromiso.nombre_objetivo,
        func.avg(OkrRevisionQ.avance_reportado).label('promedio'),
        func.count(OkrRevisionQ.id).label('total')
    ).select_from(
        OkrCompromiso
    ).join(
        OkrSubcompromiso, OkrSubcompromiso.compromiso_id == OkrCompromiso.id
    ).join(
        OkrRevisionQ, OkrRevisionQ.subcompromiso_id == OkrSubcompromiso.id
    ).where(
        OkrCompromiso.deleted_at.is_(None),
        OkrRevisionQ.deleted_at.is_(None)
    ).group_by(OkrCompromiso.nombre_objetivo)
    
    heatmap_res = await db.execute(stmt_heatmap)
    heatmap_data = []
    rezago_count = 0
    for row in heatmap_res:
        resp = row.nombre_objetivo or "Sin Asignar"
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
