"""Tema Emergente Bitácora Service."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tema_emergente_bitacora import TemaEmergenteBitacora


class TemaEmergenteBitacoraService:
    """Service for tema emergente bitácora."""

    async def create_bitacora_entry(
        self,
        db: AsyncSession,
        *,
        tema_emergente_id: UUID,
        user_id: UUID,
        accion: str,
        campo: str | None = None,
        valor_anterior: str | None = None,
        valor_nuevo: str | None = None,
        comentario: str | None = None,
    ) -> TemaEmergenteBitacora:
        """Create a bitácora entry for a tema emergente change."""
        entry = TemaEmergenteBitacora(
            tema_emergente_id=tema_emergente_id,
            user_id=user_id,
            accion=accion,
            campo=campo,
            valor_anterior=valor_anterior,
            valor_nuevo=valor_nuevo,
            comentario=comentario,
        )
        db.add(entry)
        await db.flush()
        return entry

    async def get_bitacora_by_tema(
        self,
        db: AsyncSession,
        *,
        tema_emergente_id: UUID,
    ) -> list[TemaEmergenteBitacora]:
        """Get all bitácora entries for a tema emergente."""
        stmt = (
            select(TemaEmergenteBitacora)
            .where(
                TemaEmergenteBitacora.tema_emergente_id == tema_emergente_id,
            )
            .order_by(TemaEmergenteBitacora.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


tema_emergente_bitacora_svc = TemaEmergenteBitacoraService()
