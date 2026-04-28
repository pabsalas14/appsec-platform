from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_revision_q import OkrRevisionQ
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.user import User
from app.services.okr_engine import compute_leader_cascade_score, compute_plan_score


async def _make_user(db: AsyncSession, *, role: str = "user") -> User:
    user = User(
        username=f"u_{uuid4().hex[:8]}",
        email=f"u_{uuid4().hex[:8]}@test.local",
        hashed_password=hash_password("TestPassword123!"),
        role=role,
        is_active=True,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def _add_revision(
    db: AsyncSession,
    *,
    user_id,
    subcompromiso_id,
    quarter: str,
    avance_reportado: float,
    avance_validado: float | None = None,
) -> OkrRevisionQ:
    rev = OkrRevisionQ(
        user_id=user_id,
        subcompromiso_id=subcompromiso_id,
        quarter=quarter,
        avance_reportado=avance_reportado,
        avance_validado=avance_validado,
        estado="aprobado",
    )
    db.add(rev)
    await db.flush()
    return rev


@pytest.mark.asyncio
async def test_compute_plan_score_weighted_subitems_and_commitments(session_factory):
    async with session_factory() as db:
        owner = await _make_user(db)
        evaluator = await _make_user(db, role="lider_programa")
        plan = OkrPlanAnual(
            user_id=owner.id,
            colaborador_id=owner.id,
            evaluador_id=evaluator.id,
            ano=2026,
            estado="activo",
        )
        db.add(plan)
        await db.flush()

        c1 = OkrCompromiso(
            user_id=owner.id,
            plan_id=plan.id,
            categoria_id=None,
            nombre_objetivo="Compromiso 1",
            descripcion=None,
            peso_global=50.0,
            fecha_inicio=datetime(2026, 1, 1, tzinfo=UTC),
            fecha_fin=datetime(2026, 12, 31, tzinfo=UTC),
            tipo_medicion="subitems",
        )
        c2 = OkrCompromiso(
            user_id=owner.id,
            plan_id=plan.id,
            categoria_id=None,
            nombre_objetivo="Compromiso 2",
            descripcion=None,
            peso_global=50.0,
            fecha_inicio=datetime(2026, 1, 1, tzinfo=UTC),
            fecha_fin=datetime(2026, 12, 31, tzinfo=UTC),
            tipo_medicion="subitems",
        )
        db.add_all([c1, c2])
        await db.flush()

        s11 = OkrSubcompromiso(
            user_id=owner.id,
            compromiso_id=c1.id,
            nombre_sub_item="S11",
            resultado_esperado=None,
            peso_interno=60.0,
            evidencia_requerida=True,
        )
        s12 = OkrSubcompromiso(
            user_id=owner.id,
            compromiso_id=c1.id,
            nombre_sub_item="S12",
            resultado_esperado=None,
            peso_interno=40.0,
            evidencia_requerida=False,
        )
        s21 = OkrSubcompromiso(
            user_id=owner.id,
            compromiso_id=c2.id,
            nombre_sub_item="S21",
            resultado_esperado=None,
            peso_interno=100.0,
            evidencia_requerida=False,
        )
        db.add_all([s11, s12, s21])
        await db.flush()

        await _add_revision(
            db, user_id=owner.id, subcompromiso_id=s11.id, quarter="Q1", avance_reportado=50, avance_validado=50
        )
        await _add_revision(
            db, user_id=owner.id, subcompromiso_id=s12.id, quarter="Q1", avance_reportado=80, avance_validado=None
        )
        await _add_revision(
            db, user_id=owner.id, subcompromiso_id=s21.id, quarter="Q1", avance_reportado=90, avance_validado=90
        )

        score = await compute_plan_score(db, plan.id, quarter="Q1")
        assert score["score_global"] == 76.0
        assert len(score["compromisos"]) == 2


@pytest.mark.asyncio
async def test_compute_plan_score_filters_by_quarter(session_factory):
    async with session_factory() as db:
        owner = await _make_user(db)
        evaluator = await _make_user(db, role="lider_programa")
        plan = OkrPlanAnual(
            user_id=owner.id,
            colaborador_id=owner.id,
            evaluador_id=evaluator.id,
            ano=2026,
            estado="activo",
        )
        db.add(plan)
        await db.flush()

        c = OkrCompromiso(
            user_id=owner.id,
            plan_id=plan.id,
            categoria_id=None,
            nombre_objetivo="Compromiso",
            descripcion=None,
            peso_global=100.0,
            fecha_inicio=datetime(2026, 1, 1, tzinfo=UTC),
            fecha_fin=datetime(2026, 12, 31, tzinfo=UTC),
            tipo_medicion="subitems",
        )
        db.add(c)
        await db.flush()

        s = OkrSubcompromiso(
            user_id=owner.id,
            compromiso_id=c.id,
            nombre_sub_item="Sub",
            resultado_esperado=None,
            peso_interno=100.0,
            evidencia_requerida=False,
        )
        db.add(s)
        await db.flush()

        await _add_revision(
            db, user_id=owner.id, subcompromiso_id=s.id, quarter="Q1", avance_reportado=40, avance_validado=40
        )
        await _add_revision(
            db, user_id=owner.id, subcompromiso_id=s.id, quarter="Q2", avance_reportado=90, avance_validado=90
        )

        q1 = await compute_plan_score(db, plan.id, quarter="Q1")
        q2 = await compute_plan_score(db, plan.id, quarter="Q2")
        assert q1["score_global"] == 40.0
        assert q2["score_global"] == 90.0


@pytest.mark.asyncio
async def test_compute_leader_cascade_score_averages_direct_reports(session_factory):
    async with session_factory() as db:
        leader = await _make_user(db, role="chief_appsec")
        u1 = await _make_user(db)
        u2 = await _make_user(db)

        p1 = OkrPlanAnual(user_id=u1.id, colaborador_id=u1.id, evaluador_id=leader.id, ano=2026, estado="activo")
        p2 = OkrPlanAnual(user_id=u2.id, colaborador_id=u2.id, evaluador_id=leader.id, ano=2026, estado="activo")
        db.add_all([p1, p2])
        await db.flush()

        for plan, owner, score in [(p1, u1, 80.0), (p2, u2, 60.0)]:
            comp = OkrCompromiso(
                user_id=owner.id,
                plan_id=plan.id,
                categoria_id=None,
                nombre_objetivo="C",
                descripcion=None,
                peso_global=100.0,
                fecha_inicio=datetime(2026, 1, 1, tzinfo=UTC),
                fecha_fin=datetime(2026, 12, 31, tzinfo=UTC),
                tipo_medicion="subitems",
            )
            db.add(comp)
            await db.flush()
            sub = OkrSubcompromiso(
                user_id=owner.id,
                compromiso_id=comp.id,
                nombre_sub_item="S",
                resultado_esperado=None,
                peso_interno=100.0,
                evidencia_requerida=False,
            )
            db.add(sub)
            await db.flush()
            await _add_revision(
                db,
                user_id=owner.id,
                subcompromiso_id=sub.id,
                quarter="Q1",
                avance_reportado=score,
                avance_validado=score,
            )

        cascade = await compute_leader_cascade_score(db, leader.id, quarter="Q1")
        assert cascade == 70.0
