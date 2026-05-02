"""Dashboard Export Genérico API."""

import csv
import json
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.permissions import P
from app.core.response import success
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.models.auditoria import Auditoria
from app.models.tema_emergente import TemaEmergente
from app.models.programa_sast import ProgramaSast
from app.models.okr_compromiso import OkrCompromiso


router = APIRouter()


@router.get("/export")
async def dashboard_export(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    type: str = Query(..., description="Tipo: okr, vulnerabilidades, auditorias, temas, programas"),
    format: str = Query("json", description="Formato: json, csv"),
    year: int | None = Query(None, description="Año para filtrar"),
    quarter: str | None = Query(None, description="Quarter (Q1, Q2, Q3, Q4)"),
):
    """
    Export genérico para cualquier dashboard.
    Permite exportar en diferentes formatos (json, csv).
    """
    data = await _get_data_for_type(db, user.id, type, year, quarter)

    if format == "csv":
        csv_data = _convert_to_csv(data, type)
        return success(
            {
                "export_data": csv_data,
                "format": "csv",
                "type": type,
            }
        )

    return success(
        {
            "data": data,
            "format": "json",
            "type": type,
        }
    )


async def _get_data_for_type(
    db: AsyncSession,
    user_id: UUID,
    type: str,
    year: int | None,
    quarter: str | None,
) -> list[dict]:
    """Get data based on type."""
    if type == "okr":
        stmt = select(OkrCompromiso).where(
            OkrCompromiso.user_id == user_id,
            OkrCompromiso.deleted_at.is_(None),
        )
        result = await db.execute(stmt)
        return [
            {
                "id": str(c.id),
                "nombre_objetivo": c.nombre_objetivo,
                "descripcion": c.descripcion,
                "peso_global": c.peso_global,
                "fecha_inicio": c.fecha_inicio.isoformat() if c.fecha_inicio else None,
                "fecha_fin": c.fecha_fin.isoformat() if c.fecha_fin else None,
            }
            for c in result.scalars().all()
        ]

    elif type == "vulnerabilidades":
        stmt = select(Vulnerabilidad).where(Vulnerabilidad.deleted_at.is_(None))
        result = await db.execute(stmt)
        return [
            {
                "id": str(v.id),
                "titulo": v.titulo,
                "severidad": v.severidad,
                "estado": v.estado,
                "fuente": v.fuente,
            }
            for v in result.scalars().all()[:1000]  # Limit
        ]

    elif type == "auditorias":
        stmt = select(Auditoria).where(Auditoria.deleted_at.is_(None))
        result = await db.execute(stmt)
        return [
            {
                "id": str(a.id),
                "nombre": a.nombre,
                "auditor": a.auditor,
                "tipo": a.tipo,
                "estado": a.estado,
            }
            for a in result.scalars().all()
        ]

    elif type == "temas":
        stmt = select(TemaEmergente).where(TemaEmergente.deleted_at.is_(None))
        result = await db.execute(stmt)
        return [
            {
                "id": str(t.id),
                "titulo": t.titulo,
                "tipo": t.tipo,
                "impacto": t.impacto,
                "estado": t.estado,
            }
            for t in result.scalars().all()
        ]

    elif type == "programas":
        stmt = select(ProgramaSast).where(ProgramaSast.deleted_at.is_(None))
        result = await db.execute(stmt)
        return [
            {
                "id": str(p.id),
                "nombre": p.nombre,
                "estado": p.estado,
            }
            for p in result.scalars().all()
        ]

    return []


def _convert_to_csv(data: list[dict], type: str) -> str:
    """Convert data to CSV format."""
    if not data:
        return ""

    buf = StringIO()
    writer = csv.DictWriter(buf, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return buf.getvalue()
