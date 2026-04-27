from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_revision_q import OkrRevisionQ
from app.models.okr_subcompromiso import OkrSubcompromiso


@dataclass
class OkrCommitmentScore:
    compromiso_id: UUID
    porcentaje: float
    peso_global: float


async def compute_plan_score(db: AsyncSession, plan_id: UUID, *, quarter: str | None = None) -> dict:
    compromisos = (
        (
            await db.execute(
                select(OkrCompromiso).where(
                    OkrCompromiso.plan_id == plan_id,
                    OkrCompromiso.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    by_commitment: list[OkrCommitmentScore] = []

    for compromiso in compromisos:
        subs = (
            (
                await db.execute(
                    select(OkrSubcompromiso).where(
                        OkrSubcompromiso.compromiso_id == compromiso.id,
                        OkrSubcompromiso.deleted_at.is_(None),
                    )
                )
            )
            .scalars()
            .all()
        )
        if not subs:
            continue

        total = 0.0
        for sub in subs:
            stmt = select(OkrRevisionQ).where(
                OkrRevisionQ.subcompromiso_id == sub.id,
                OkrRevisionQ.deleted_at.is_(None),
            )
            if quarter:
                stmt = stmt.where(OkrRevisionQ.quarter == quarter)
            stmt = stmt.order_by(OkrRevisionQ.updated_at.desc(), OkrRevisionQ.created_at.desc())
            revisions = (await db.execute(stmt)).scalars().all()
            if not revisions:
                continue
            latest = revisions[0]
            if latest.estado not in {"aprobado", "editado", "cerrado"}:
                continue
            approved = latest.avance_validado if latest.avance_validado is not None else latest.avance_reportado
            total += approved * (sub.peso_interno / 100.0)

        by_commitment.append(
            OkrCommitmentScore(
                compromiso_id=compromiso.id,
                porcentaje=round(total, 2),
                peso_global=compromiso.peso_global,
            )
        )

    global_score = round(sum(c.porcentaje * (c.peso_global / 100.0) for c in by_commitment), 2)
    return {
        "plan_id": str(plan_id),
        "quarter": quarter,
        "score_global": global_score,
        "compromisos": [
            {
                "compromiso_id": str(x.compromiso_id),
                "porcentaje": x.porcentaje,
                "peso_global": x.peso_global,
            }
            for x in by_commitment
        ],
    }


async def compute_leader_cascade_score(db: AsyncSession, leader_user_id: UUID, *, quarter: str | None = None) -> float:
    plans = (
        (
            await db.execute(
                select(OkrPlanAnual).where(
                    OkrPlanAnual.evaluador_id == leader_user_id,
                    OkrPlanAnual.estado.in_(["activo", "en_revision"]),
                    OkrPlanAnual.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    if not plans:
        return 0.0
    vals: list[float] = []
    for plan in plans:
        s = await compute_plan_score(db, plan.id, quarter=quarter)
        vals.append(float(s["score_global"]))
    return round(sum(vals) / len(vals), 2)
