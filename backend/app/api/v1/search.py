"""Omnisearch endpoint — global search across all indexed entities.

Implements full-text search in PostgreSQL using GIN indexes on searchable text fields.
Groups results by type for intuitive navigation.

Supports:
- Vulnerabilidades (titulo, descripcion)
- Planes de Remediación (descripcion, acciones_recomendadas)
- Temas Emergentes (titulo, descripcion)
- Iniciativas (titulo, descripcion)
- Hallazgos SAST/DAST/MAST (titulo, descripcion)
- Control Seguridad (nombre)
- Auditoria (titulo)
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.response import success
from app.core.search import sanitize_search_term
from app.models.auditoria import Auditoria
from app.models.control_seguridad import ControlSeguridad
from app.models.hallazgo_dast import HallazgoDast
from app.models.hallazgo_mast import HallazgoMast
from app.models.hallazgo_sast import HallazgoSast
from app.models.iniciativa import Iniciativa
from app.models.plan_remediacion import PlanRemediacion
from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad

router = APIRouter()


class SearchResult:
    """Normalized search result structure."""

    def __init__(
        self,
        tipo: str,
        id: UUID,
        nombre: str,
        descripcion: str | None,
        url: str,
    ):
        self.tipo = tipo
        self.id = str(id)
        self.nombre = nombre
        self.descripcion = descripcion or ""
        self.url = url

    def to_dict(self) -> dict:
        return {
            "tipo": self.tipo,
            "id": self.id,
            "nombre": self.nombre,
            "descripcion": self.descripcion,
            "url": self.url,
        }


@router.get("")
async def global_search(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
):
    """
    Global omnisearch across all indexed entities.

    Groups results by type for intuitive navigation.
    Supports basic text matching on indexed fields.

    Returns: {tipo: "Vulnerabilidades" | "Planes" | ..., results: [{id, nombre, descripcion, url}, ...]}
    """
    # Sanitize query for LIKE operations
    safe_query = sanitize_search_term(q.strip())
    pattern = f"%{safe_query}%"

    results: dict[str, list[SearchResult]] = {
        "Vulnerabilidades": [],
        "Planes de Remediación": [],
        "Temas Emergentes": [],
        "Iniciativas": [],
        "Hallazgos SAST": [],
        "Hallazgos DAST": [],
        "Hallazgos MAST": [],
        "Controles de Seguridad": [],
        "Auditorías": [],
    }

    # ── Vulnerabilidades ──────────────────────────────────────────────────────
    stmt = select(Vulnerabilidad).where(
        Vulnerabilidad.deleted_at.is_(None),
        or_(
            Vulnerabilidad.titulo.ilike(pattern),
            Vulnerabilidad.descripcion.ilike(pattern),
        ),
    ).limit(10)
    vulns = await db.scalars(stmt)
    for vuln in vulns:
        results["Vulnerabilidades"].append(
            SearchResult(
                tipo="Vulnerabilidad",
                id=vuln.id,
                nombre=vuln.titulo,
                descripcion=vuln.descripcion,
                url=f"/vulnerabilidads/{vuln.id}",
            )
        )

    # ── Planes de Remediación ─────────────────────────────────────────────────
    stmt = select(PlanRemediacion).where(
        PlanRemediacion.deleted_at.is_(None),
        or_(
            PlanRemediacion.descripcion.ilike(pattern),
            PlanRemediacion.acciones_recomendadas.ilike(pattern),
        ),
    ).limit(10)
    plans = await db.scalars(stmt)
    for plan in plans:
        results["Planes de Remediación"].append(
            SearchResult(
                tipo="Plan",
                id=plan.id,
                nombre=f"Plan #{plan.id.hex[:8]}",
                descripcion=plan.descripcion,
                url=f"/plan_remediacions/{plan.id}",
            )
        )

    # ── Temas Emergentes ──────────────────────────────────────────────────────
    stmt = select(TemaEmergente).where(
        TemaEmergente.deleted_at.is_(None),
        or_(
            TemaEmergente.titulo.ilike(pattern),
            TemaEmergente.descripcion.ilike(pattern),
        ),
    ).limit(10)
    temas = await db.scalars(stmt)
    for tema in temas:
        results["Temas Emergentes"].append(
            SearchResult(
                tipo="Tema",
                id=tema.id,
                nombre=tema.titulo,
                descripcion=tema.descripcion,
                url=f"/temas_emergentes/{tema.id}",
            )
        )

    # ── Iniciativas ───────────────────────────────────────────────────────────
    stmt = select(Iniciativa).where(
        Iniciativa.deleted_at.is_(None),
        or_(
            Iniciativa.titulo.ilike(pattern),
            Iniciativa.descripcion.ilike(pattern),
        ),
    ).limit(10)
    inits = await db.scalars(stmt)
    for init in inits:
        results["Iniciativas"].append(
            SearchResult(
                tipo="Iniciativa",
                id=init.id,
                nombre=init.titulo,
                descripcion=init.descripcion,
                url=f"/iniciativas/{init.id}",
            )
        )

    # ── Hallazgos SAST ────────────────────────────────────────────────────────
    stmt = select(HallazgoSast).where(
        HallazgoSast.deleted_at.is_(None),
        or_(
            HallazgoSast.titulo.ilike(pattern),
            HallazgoSast.descripcion.ilike(pattern),
        ),
    ).limit(10)
    sasts = await db.scalars(stmt)
    for sast in sasts:
        results["Hallazgos SAST"].append(
            SearchResult(
                tipo="Hallazgo SAST",
                id=sast.id,
                nombre=sast.titulo,
                descripcion=sast.descripcion,
                url=f"/hallazgo_sasts/{sast.id}",
            )
        )

    # ── Hallazgos DAST ────────────────────────────────────────────────────────
    stmt = select(HallazgoDast).where(
        HallazgoDast.deleted_at.is_(None),
        or_(
            HallazgoDast.titulo.ilike(pattern),
            HallazgoDast.descripcion.ilike(pattern),
        ),
    ).limit(10)
    dasts = await db.scalars(stmt)
    for dast in dasts:
        results["Hallazgos DAST"].append(
            SearchResult(
                tipo="Hallazgo DAST",
                id=dast.id,
                nombre=dast.titulo,
                descripcion=dast.descripcion,
                url=f"/hallazgo_dasts/{dast.id}",
            )
        )

    # ── Hallazgos MAST ────────────────────────────────────────────────────────
    stmt = select(HallazgoMast).where(
        HallazgoMast.deleted_at.is_(None),
        or_(
            HallazgoMast.nombre.ilike(pattern),
            HallazgoMast.descripcion.ilike(pattern),
        ),
    ).limit(10)
    masts = await db.scalars(stmt)
    for mast in masts:
        results["Hallazgos MAST"].append(
            SearchResult(
                tipo="Hallazgo MAST",
                id=mast.id,
                nombre=mast.nombre,
                descripcion=mast.descripcion,
                url=f"/hallazgo_masts/{mast.id}",
            )
        )

    # ── Controles de Seguridad ────────────────────────────────────────────────
    stmt = select(ControlSeguridad).where(
        ControlSeguridad.deleted_at.is_(None),
        ControlSeguridad.nombre.ilike(pattern),
    ).limit(10)
    controls = await db.scalars(stmt)
    for ctrl in controls:
        results["Controles de Seguridad"].append(
            SearchResult(
                tipo="Control",
                id=ctrl.id,
                nombre=ctrl.nombre,
                descripcion=None,
                url=f"/control_seguridads/{ctrl.id}",
            )
        )

    # ── Auditorías ────────────────────────────────────────────────────────────
    stmt = select(Auditoria).where(
        Auditoria.deleted_at.is_(None),
        Auditoria.titulo.ilike(pattern),
    ).limit(10)
    audits = await db.scalars(stmt)
    for audit in audits:
        results["Auditorías"].append(
            SearchResult(
                tipo="Auditoría",
                id=audit.id,
                nombre=audit.titulo,
                descripcion=None,
                url=f"/auditorias/{audit.id}",
            )
        )

    # ── Filter out empty categories and normalize response ────────────────────
    grouped_results = {
        category: [r.to_dict() for r in items]
        for category, items in results.items()
        if items
    }

    return success({"results": grouped_results, "query": q})
