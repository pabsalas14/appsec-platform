"""OKR Calificación Service."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.okr_revision_q import OkrRevisionQ
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.okr_compromiso import OkrCompromiso
from app.models.user import User
from app.schemas.okr_calificacion import OkrCalificacionCreate, OkrCalificacionUpdate


class OkrCalificacionService:
    """Service for OKR calificaciones."""

    async def create_or_update_calificacion(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        data: OkrCalificacionCreate,
    ) -> OkrRevisionQ:
        """
        Create or update a calificación for a subcompromiso in a quarter.
        If exists, update; otherwise create new.
        """
        # Check if exists
        stmt = select(OkrRevisionQ).where(
            OkrRevisionQ.subcompromiso_id == data.subcompromiso_id,
            OkrRevisionQ.quarter == data.quarter,
            OkrRevisionQ.deleted_at.is_(None),
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing
            existing.avance_reportado = data.avance
            existing.comentario_colaborador = data.comentario
            existing.feedback_evaluador = data.evidencia
            existing.estado = "submitted"
            existing.updated_at = datetime.now(UTC)
            return existing
        else:
            # Create new
            new_calificacion = OkrRevisionQ(
                user_id=user_id,
                subcompromiso_id=data.subcompromiso_id,
                quarter=data.quarter,
                avance_reportado=data.avance,
                comentario_colaborador=data.comentario,
                feedback_evaluador=data.evidencia,
                estado="submitted",
            )
            db.add(new_calificacion)
            await db.flush()
            return new_calificacion

    async def get_calificacion_by_subcompromiso(
        self,
        db: AsyncSession,
        *,
        subcompromiso_id: UUID,
        quarter: str,
    ) -> OkrRevisionQ | None:
        """Get calificación by subcompromiso and quarter."""
        stmt = select(OkrRevisionQ).where(
            OkrRevisionQ.subcompromiso_id == subcompromiso_id,
            OkrRevisionQ.quarter == quarter,
            OkrRevisionQ.deleted_at.is_(None),
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_calificaciones_by_user(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        quarter: str | None = None,
    ) -> list[OkrRevisionQ]:
        """List all calificaciones for a user."""
        stmt = select(OkrRevisionQ).where(
            OkrRevisionQ.user_id == user_id,
            OkrRevisionQ.deleted_at.is_(None),
        )
        if quarter:
            stmt = stmt.where(OkrRevisionQ.quarter == quarter)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_drilldown_by_riesgo(
        self,
        db: AsyncSession,
        *,
        user_id: UUID,
        min_avance: float = 0,
        max_avance: float = 100,
    ) -> list[dict]:
        """Get drill-down data for compromisos in risk range."""
        stmt = (
            select(
                OkrRevisionQ,
                OkrSubcompromiso,
                OkrCompromiso,
            )
            .join(OkrSubcompromiso, OkrSubcompromiso.id == OkrRevisionQ.subcompromiso_id)
            .join(OkrCompromiso, OkrCompromiso.id == OkrSubcompromiso.compromiso_id)
            .where(
                OkrRevisionQ.user_id == user_id,
                OkrRevisionQ.deleted_at.is_(None),
                OkrRevisionQ.avance_reportado >= min_avance,
                OkrRevisionQ.avance_reportado <= max_avance,
            )
        )
        result = await db.execute(stmt)
        rows = result.all()

        drilldown = []
        for rev, sub, comp in rows:
            drilldown.append(
                {
                    "compromiso_id": comp.id,
                    "compromiso_nombre": comp.nombre_objetivo,
                    "subcompromiso_id": sub.id,
                    "subcompromiso_nombre": sub.nombre,
                    "avance": rev.avance_reportado,
                    "quarter": rev.quarter,
                    "estado": rev.estado,
                }
            )
        return drilldown


okr_calificacion_svc = OkrCalificacionService()
