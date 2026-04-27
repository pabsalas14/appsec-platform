from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.okr_cierre_q import OkrCierreQ
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_evidencia import OkrEvidencia
from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_revision_q import OkrRevisionQ
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.user import User
from app.schemas.okr_revision_q import VALID_Q_STATES
from app.services.okr_engine import compute_plan_score


def _assert_q_state(value: str) -> None:
    if value not in VALID_Q_STATES:
        raise BadRequestException("Estado de revisión inválido")


async def _resolve_revision_graph(
    db: AsyncSession,
    revision_id: UUID,
) -> tuple[OkrRevisionQ, OkrSubcompromiso, OkrCompromiso, OkrPlanAnual]:
    revision = (
        await db.execute(select(OkrRevisionQ).where(OkrRevisionQ.id == revision_id, OkrRevisionQ.deleted_at.is_(None)))
    ).scalar_one_or_none()
    if revision is None:
        raise NotFoundException("Revisión no encontrada")
    _assert_q_state(revision.estado)

    sub = (
        await db.execute(
            select(OkrSubcompromiso).where(
                OkrSubcompromiso.id == revision.subcompromiso_id,
                OkrSubcompromiso.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if sub is None:
        raise NotFoundException("Subcompromiso no encontrado")

    compromiso = (
        await db.execute(
            select(OkrCompromiso).where(
                OkrCompromiso.id == sub.compromiso_id,
                OkrCompromiso.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if compromiso is None:
        raise NotFoundException("Compromiso no encontrado")

    plan = (
        await db.execute(
            select(OkrPlanAnual).where(
                OkrPlanAnual.id == compromiso.plan_id,
                OkrPlanAnual.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if plan is None:
        raise NotFoundException("Plan anual no encontrado")

    return revision, sub, compromiso, plan


def _can_submit(user: User, plan: OkrPlanAnual) -> bool:
    return user.id == plan.user_id or user.id == plan.colaborador_id


def _can_review(user: User, plan: OkrPlanAnual) -> bool:
    return user.id == plan.evaluador_id


async def _assert_not_closed(db: AsyncSession, plan_id: UUID, quarter: str) -> None:
    cierre = (
        await db.execute(
            select(OkrCierreQ.id).where(
                OkrCierreQ.plan_id == plan_id,
                OkrCierreQ.quarter == quarter,
                OkrCierreQ.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if cierre is not None:
        raise BadRequestException("El trimestre ya está cerrado y es inmutable")


async def _assert_compromisos_sum_100(db: AsyncSession, plan_id: UUID) -> None:
    total = (
        await db.execute(
            select(func.coalesce(func.sum(OkrCompromiso.peso_global), 0.0)).where(
                OkrCompromiso.plan_id == plan_id,
                OkrCompromiso.deleted_at.is_(None),
            )
        )
    ).scalar_one()
    if round(float(total), 2) != 100.0:
        raise BadRequestException("La suma de peso_global de compromisos por plan debe ser 100")


async def _assert_subitems_sum_100_if_needed(db: AsyncSession, compromiso: OkrCompromiso) -> None:
    if compromiso.tipo_medicion.strip().lower() != "subitems":
        return
    total = (
        await db.execute(
            select(func.coalesce(func.sum(OkrSubcompromiso.peso_interno), 0.0)).where(
                OkrSubcompromiso.compromiso_id == compromiso.id,
                OkrSubcompromiso.deleted_at.is_(None),
            )
        )
    ).scalar_one()
    if round(float(total), 2) != 100.0:
        raise BadRequestException("La suma de peso_interno por compromiso tipo subitems debe ser 100")


async def _assert_required_evidence(db: AsyncSession, revision: OkrRevisionQ, sub: OkrSubcompromiso) -> None:
    if not sub.evidencia_requerida:
        return
    evidence_count = (
        await db.execute(
            select(func.count(OkrEvidencia.id)).where(
                OkrEvidencia.revision_q_id == revision.id,
                OkrEvidencia.deleted_at.is_(None),
            )
        )
    ).scalar_one()
    if int(evidence_count) < 1:
        raise BadRequestException("La revisión requiere al menos una evidencia para enviar a revisión")


async def submit_revision(
    db: AsyncSession,
    *,
    revision_id: UUID,
    actor: User,
    comentario_colaborador: str | None = None,
) -> OkrRevisionQ:
    revision, sub, compromiso, plan = await _resolve_revision_graph(db, revision_id)
    if not _can_submit(actor, plan):
        raise ForbiddenException("Solo el colaborador dueño del plan puede enviar revisión")
    if revision.estado in {"aprobado", "editado", "cerrado"}:
        raise BadRequestException("La revisión ya fue validada o cerrada")

    await _assert_not_closed(db, plan.id, revision.quarter)
    await _assert_compromisos_sum_100(db, plan.id)
    await _assert_subitems_sum_100_if_needed(db, compromiso)
    await _assert_required_evidence(db, revision, sub)

    revision.estado = "en_revision"
    if comentario_colaborador is not None:
        revision.comentario_colaborador = comentario_colaborador
    await db.flush()
    return revision


async def approve_revision(
    db: AsyncSession,
    *,
    revision_id: UUID,
    actor: User,
    avance_validado: float,
    feedback_evaluador: str | None = None,
    mark_as_editado: bool = False,
) -> tuple[OkrRevisionQ, dict]:
    revision, _sub, _compromiso, plan = await _resolve_revision_graph(db, revision_id)
    if not _can_review(actor, plan):
        raise ForbiddenException("Solo el evaluador del plan puede validar revisiones")
    if revision.estado == "cerrado":
        raise BadRequestException("No se puede validar una revisión cerrada")
    if revision.estado == "draft":
        raise BadRequestException("Primero debes enviar la revisión")

    await _assert_not_closed(db, plan.id, revision.quarter)

    revision.avance_validado = avance_validado
    if feedback_evaluador is not None:
        revision.feedback_evaluador = feedback_evaluador
    revision.estado = "editado" if mark_as_editado else "aprobado"
    await db.flush()

    score = await compute_plan_score(db, plan.id, quarter=revision.quarter)
    return revision, score


async def reject_revision(
    db: AsyncSession,
    *,
    revision_id: UUID,
    actor: User,
    feedback_evaluador: str,
) -> OkrRevisionQ:
    revision, _sub, _compromiso, plan = await _resolve_revision_graph(db, revision_id)
    if not _can_review(actor, plan):
        raise ForbiddenException("Solo el evaluador del plan puede rechazar revisiones")
    if revision.estado == "cerrado":
        raise BadRequestException("No se puede rechazar una revisión cerrada")
    if revision.estado == "draft":
        raise BadRequestException("Primero debes enviar la revisión")

    await _assert_not_closed(db, plan.id, revision.quarter)

    revision.estado = "rechazado"
    revision.feedback_evaluador = feedback_evaluador.strip()
    await db.flush()
    return revision


async def close_quarter(
    db: AsyncSession,
    *,
    plan_id: UUID,
    quarter: str,
    retroalimentacion_general: str,
    actor: User,
) -> tuple[OkrCierreQ, dict]:
    plan = (
        await db.execute(
            select(OkrPlanAnual).where(
                OkrPlanAnual.id == plan_id,
                OkrPlanAnual.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if plan is None:
        raise NotFoundException("Plan anual no encontrado")
    if not _can_review(actor, plan):
        raise ForbiddenException("Solo el evaluador del plan puede cerrar trimestre")
    await _assert_not_closed(db, plan.id, quarter)
    await _assert_compromisos_sum_100(db, plan.id)

    compromisos = (
        (
            await db.execute(
                select(OkrCompromiso).where(
                    OkrCompromiso.plan_id == plan.id,
                    OkrCompromiso.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    for compromiso in compromisos:
        await _assert_subitems_sum_100_if_needed(db, compromiso)

    sub_ids = (
        (
            await db.execute(
                select(OkrSubcompromiso.id)
                .join(OkrCompromiso, OkrCompromiso.id == OkrSubcompromiso.compromiso_id)
                .where(
                    OkrCompromiso.plan_id == plan.id,
                    OkrCompromiso.deleted_at.is_(None),
                    OkrSubcompromiso.deleted_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    if not sub_ids:
        raise BadRequestException("El plan no tiene subcompromisos para cerrar trimestre")

    latest_revisions: list[OkrRevisionQ] = []
    for sub_id in sub_ids:
        latest = (
            await db.execute(
                select(OkrRevisionQ)
                .where(
                    OkrRevisionQ.subcompromiso_id == sub_id,
                    OkrRevisionQ.quarter == quarter,
                    OkrRevisionQ.deleted_at.is_(None),
                )
                .order_by(OkrRevisionQ.updated_at.desc(), OkrRevisionQ.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()
        if latest is None:
            raise BadRequestException("Todos los subcompromisos deben tener revisión del trimestre")
        if latest.estado not in {"aprobado", "editado"}:
            raise BadRequestException("Solo se puede cerrar con revisiones aprobadas o editadas")
        latest_revisions.append(latest)

    for rev in latest_revisions:
        rev.estado = "cerrado"

    cierre = OkrCierreQ(
        user_id=plan.user_id,
        plan_id=plan.id,
        quarter=quarter,
        retroalimentacion_general=retroalimentacion_general.strip(),
        cerrado_at=datetime.now(UTC),
    )
    db.add(cierre)
    await db.flush()

    score = await compute_plan_score(db, plan.id, quarter=quarter)
    return cierre, score
