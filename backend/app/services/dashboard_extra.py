"""Servicios adicionales para dashboards 6-10 (Kanban, Temas, Plataforma)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auditoria import Auditoria
from app.models.changelog_entrada import ChangelogEntrada
from app.models.service_release import ServiceRelease
from app.models.tema_emergente import TemaEmergente


async def build_releases_kanban(db: AsyncSession) -> dict:
    """Dashboard 7: Kanban de liberaciones."""
    q = await db.execute(
        select(ServiceRelease)
        .where(ServiceRelease.deleted_at.is_(None))
        .order_by(ServiceRelease.updated_at.desc())
    )
    rows = q.scalars().all()
    
    columns: dict[str, list[dict]] = {
        "Design Review": [],
        "Security Validation": [],
        "Pendiente de Aprobacion": [],
        "Completada": [],
    }
    
    for r in rows:
        st = r.estado_actual or "Design Review"
        if st not in columns:
            columns[st] = []
        columns[st].append({
            "id": str(r.id),
            "nombre": r.nombre,
            "version": r.version or "1.0.0",
        })
        
    return {
        "columns": columns,
        "total_cards": len(rows)
    }


async def build_temas_auditorias(db: AsyncSession) -> dict:
    """Dashboard 8: Temas Emergentes y Auditorías."""
    now = datetime.now(UTC)
    old_7d = now - timedelta(days=7)
    
    # Temas KPIs
    total_abiertos = int((await db.execute(
        select(func.count()).select_from(TemaEmergente).where(
            TemaEmergente.deleted_at.is_(None),
            TemaEmergente.estado != "Cerrado"
        )
    )).scalar_one() or 0)
    
    sin_mov = int((await db.execute(
        select(func.count()).select_from(TemaEmergente).where(
            TemaEmergente.deleted_at.is_(None),
            TemaEmergente.estado != "Cerrado",
            TemaEmergente.updated_at < old_7d
        )
    )).scalar_one() or 0)
    
    # Tabla Temas
    t_q = await db.execute(
        select(TemaEmergente)
        .where(TemaEmergente.deleted_at.is_(None))
        .order_by(TemaEmergente.created_at.desc())
        .limit(10)
    )
    t_rows = []
    for t in t_q.scalars().all():
        t_rows.append({
            "id": str(t.id),
            "titulo": t.titulo,
            "estado": t.estado,
            "impacto": t.impacto,
            "dias_abierto": (now - t.created_at).days if t.created_at else 0
        })
        
    # Auditorías KPIs
    aud_activas = int((await db.execute(
        select(func.count()).select_from(Auditoria).where(
            Auditoria.deleted_at.is_(None),
            Auditoria.estado == "Activa"
        )
    )).scalar_one() or 0)
    
    # Tabla Auditorías
    a_q = await db.execute(
        select(Auditoria)
        .where(Auditoria.deleted_at.is_(None))
        .order_by(Auditoria.created_at.desc())
        .limit(10)
    )
    a_rows = []
    for a in a_q.scalars().all():
        a_rows.append({
            "id": str(a.id),
            "nombre": a.nombre,
            "tipo": a.tipo,
            "estado": a.estado
        })

    return {
        "temas": {
            "kpis": {
                "total_abiertos": total_abiertos,
                "sin_movimiento_7d": sin_mov,
                "proximos_vencer": 0
            },
            "tabla": t_rows
        },
        "auditorias": {
            "kpis": {
                "activas": aud_activas,
                "cerradas_ano": 0,
                "hallazgos_pendientes": 0
            },
            "tabla": a_rows
        }
    }


async def build_platform_release(db: AsyncSession) -> dict:
    """Dashboard 10: Release Plataforma."""
    # Changelog real
    q = await db.execute(
        select(ChangelogEntrada)
        .where(ChangelogEntrada.deleted_at.is_(None))
        .order_by(ChangelogEntrada.created_at.desc())
    )
    rows = q.scalars().all()
    
    serialized = []
    for r in rows:
        serialized.append({
            "version": r.version,
            "fecha": r.created_at.isoformat() if r.created_at else "—",
            "tipo": r.tipo or "feature",
            "descripcion": r.descripcion,
            "estatus": r.estado or "desplegado"
        })
        
    # Timeline (agrupado por versión)
    timeline = []
    seen_v = set()
    for r in rows:
        if r.version not in seen_v:
            timeline.append({
                "version": r.version,
                "fecha": r.created_at.strftime("%Y-%m-%d") if r.created_at else "—",
                "titulo": r.titulo or f"Release {r.version}"
            })
            seen_v.add(r.version)
            
    return {
        "kpis": {
            "version_actual": timeline[0]["version"] if timeline else "v1.0.0",
            "ultima_actualizacion": timeline[0]["fecha"] if timeline else "—",
            "releases_en_desarrollo": 2,
            "bugs_reportados": 0
        },
        "timeline": timeline[:5],
        "changelog": serialized[:20]
    }
