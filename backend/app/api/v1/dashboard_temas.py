"""Dashboard Temas/Auditorías Extended API."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_permission
from app.core.permissions import P
from app.core.response import success
from app.models.auditoria import Auditoria
from app.models.tema_emergente import TemaEmergente
from app.models.hallazgo_auditoria import HallazgoAuditoria
from app.models.user import User


router = APIRouter()


@router.get("/temas-auditorias/drilldown")
async def temas_auditorias_drilldown(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    tipo: str = Query(..., description="Tipo: 'tema' o 'auditoria'"),
    filtro: str = Query(..., description="Filtro: 'estado', 'tipo', 'severidad', 'auditor'"),
    valor: str = Query(..., description="Valor del filtro"),
):
    """
    Drill-down desde KPIs de Temas/Auditorías.
    Retorna los registros que компонент el número del KPI.
    """
    if tipo == "tema":
        return await _drilldown_temas(db, filtro, valor)
    elif tipo == "auditoria":
        return await _drilldown_auditorias(db, filtro, valor)
    else:
        return success({"error": "Tipo inválido"})


async def _drilldown_temas(db: AsyncSession, filtro: str, valor: str) -> dict:
    """Get drill-down data for temas."""
    query = select(TemaEmergente).where(TemaEmergente.deleted_at.is_(None))

    if filtro == "estado":
        query = query.where(TemaEmergente.estado == valor)
    elif filtro == "tipo":
        query = query.where(TemaEmergente.tipo == valor)
    elif filtro == "severidad":
        query = query.where(TemaEmergente.impacto == valor)

    result = await db.execute(query)
    temas = result.scalars().all()

    data = [
        {
            "id": str(t.id),
            "titulo": t.titulo,
            "estado": t.estado,
            "tipo": t.tipo,
            "impacto": t.impacto,
            "fuente": t.fuente,
            "dias_abierto": t.dias_abierto,
        }
        for t in temas
    ]
    return success({"temas": data, "total": len(data)})


async def _drilldown_auditorias(db: AsyncSession, filtro: str, valor: str) -> dict:
    """Get drill-down data for auditorías."""
    query = select(Auditoria).where(Auditoria.deleted_at.is_(None))

    if filtro == "estado":
        query = query.where(Auditoria.estado == valor)
    elif filtro == "tipo":
        query = query.where(Auditoria.tipo == valor)
    elif filtro == "auditor":
        query = query.where(Auditoria.auditor == valor)

    result = await db.execute(query)
    auditorias = result.scalars().all()

    # Get findings count for each
    data = []
    for audit in auditorias:
        hallazgos_stmt = select(func.count(HallazgoAuditoria.id)).where(
            HallazgoAuditoria.auditoria_id == audit.id,
            HallazgoAuditoria.deleted_at.is_(None),
        )
        hallazgos_result = await db.execute(hallazgos_stmt)
        hallazgos_count = hallazgos_result.scalar() or 0

        data.append(
            {
                "id": str(audit.id),
                "nombre": audit.nombre,
                "auditor": audit.auditor,
                "tipo": audit.tipo,
                "estado": audit.estado,
                "hallazgos_count": hallazgos_count,
            }
        )

    return success({"auditorias": data, "total": len(data)})


@router.get("/temas/detalle/{tema_id}")
async def tema_detalle(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    tema_id: UUID = ...,
):
    """Get detailed information for a tema emergente."""
    from app.services.tema_emergente_bitacora_service import tema_emergente_bitacora_svc
    from app.models.tema_emergente_evidencia import TemaEmergenteEvidencia

    # Get tema
    tema_stmt = select(TemaEmergente).where(
        TemaEmergente.id == tema_id,
        TemaEmergente.deleted_at.is_(None),
    )
    tema_result = await db.execute(tema_stmt)
    tema = tema_result.scalar_one_or_none()

    if not tema:
        return success({"error": "Tema no encontrado"})

    # Get bitácora
    bitacora = await tema_emergente_bitacora_svc.get_bitacora_by_tema(db, tema_emergente_id=tema_id)

    # Get evidencias
    evid_stmt = select(TemaEmergenteEvidencia).where(
        TemaEmergenteEvidencia.tema_emergente_id == tema_id,
    )
    evid_result = await db.execute(evid_stmt)
    evidencias = list(evid_result.scalars().all())

    return success(
        {
            "tema": {
                "id": str(tema.id),
                "titulo": tema.titulo,
                "descripcion": tema.descripcion,
                "estado": tema.estado,
                "tipo": tema.tipo,
                "impacto": tema.impacto,
                "fuente": tema.fuente,
                "dias_abierto": tema.dias_abierto,
                "created_at": tema.created_at.isoformat() if tema.created_at else None,
            },
            "bitacora": [
                {
                    "id": str(b.id),
                    "accion": b.accion,
                    "campo": b.campo,
                    "valor_anterior": b.valor_anterior,
                    "valor_nuevo": b.valor_nuevo,
                    "comentario": b.comentario,
                    "created_at": b.created_at.isoformat() if b.created_at else None,
                }
                for b in bitacora
            ],
            "evidencias": [
                {
                    "id": str(e.id),
                    "tipo": e.tipo,
                    "nombre": e.nombre,
                    "url": e.url,
                    "descripcion": e.descripcion,
                }
                for e in evidencias
            ],
        }
    )


@router.get("/auditorias/detalle/{auditoria_id}")
async def auditoria_detalle(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_permission(P.DASHBOARDS.VIEW)),
    auditoria_id: UUID = ...,
):
    """Get detailed information for an auditoría."""
    # Get auditoría
    audit_stmt = select(Auditoria).where(
        Auditoria.id == auditoria_id,
        Auditoria.deleted_at.is_(None),
    )
    audit_result = await db.execute(audit_stmt)
    auditoria = audit_result.scalar_one_or_none()

    if not auditoria:
        return success({"error": "Auditoría no encontrada"})

    # Get hallazgos
    hall_stmt = select(HallazgoAuditoria).where(
        HallazgoAuditoria.auditoria_id == auditoria_id,
        HallazgoAuditoria.deleted_at.is_(None),
    )
    hall_result = await db.execute(hall_stmt)
    hallazgos = list(hall_result.scalars().all())

    # Get counts by estado
    abierta_stmt = select(func.count(HallazgoAuditoria.id)).where(
        HallazgoAuditoria.auditoria_id == auditoria_id,
        HallazgoAuditoria.deleted_at.is_(None),
        HallazgoAuditoria.estado.in_(["abierto", "en_proceso"]),
    )
    abierta_result = await db.execute(abierta_stmt)
    abierta_count = abierta_result.scalar() or 0

    cerrada_stmt = select(func.count(HallazgoAuditoria.id)).where(
        HallazgoAuditoria.auditoria_id == auditoria_id,
        HallazgoAuditoria.deleted_at.is_(None),
        HallazgoAuditoria.estado == "cerrado",
    )
    cerrada_result = await db.execute(cerrada_stmt)
    cerrada_count = cerrada_result.scalar() or 0

    return success(
        {
            "auditoria": {
                "id": str(auditoria.id),
                "nombre": auditoria.nombre,
                "auditor": auditoria.auditor,
                "tipo": auditoria.tipo,
                "estado": auditoria.estado,
                "fecha_inicio": auditoria.fecha_inicio.isoformat() if auditoria.fecha_inicio else None,
                "fecha_fin": auditoria.fecha_fin.isoformat() if auditoria.fecha_fin else None,
            },
            "hallazgos": [
                {
                    "id": str(h.id),
                    "descripcion": h.descripcion,
                    "severidad": h.severidad,
                    "estado": h.estado,
                    "responsable": h.responsable,
                }
                for h in hallazgos
            ],
            "resumen": {
                "total": len(hallazgos),
                "abiertos": abierta_count,
                "cerrados": cerrada_count,
            },
        }
    )
