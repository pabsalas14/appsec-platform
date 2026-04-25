"""HallazgoPipeline service — async CRUD; C2: hereda `scan_id` del pipeline L1 si falta."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.models.hallazgo_pipeline import HallazgoPipeline
from app.models.pipeline_release import PipelineRelease
from app.schemas.hallazgo_pipeline import HallazgoPipelineCreate, HallazgoPipelineUpdate
from app.services.base import BaseService


class HallazgoPipelineService(
    BaseService[HallazgoPipeline, HallazgoPipelineCreate, HallazgoPipelineUpdate],
):
    async def _es_duplicado_c2(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        pipeline_release_id: uuid.UUID,
        titulo: str,
        archivo: str | None,
        linea: int | None,
        scan_id: str | None,
    ) -> bool:
        """P14: evita duplicados en import (mismo título+archivo+línea+scan bajo el mismo L1)."""
        ln = linea if linea is not None else -1_000_000
        f_scan = (scan_id or "").strip()
        f_arch = (archivo or "").strip()
        q = select(HallazgoPipeline.id).where(
            HallazgoPipeline.user_id == user_id,
            HallazgoPipeline.pipeline_release_id == pipeline_release_id,
            HallazgoPipeline.titulo == titulo,
            HallazgoPipeline.deleted_at.is_(None),
            func.coalesce(HallazgoPipeline.scan_id, "") == f_scan,
            func.coalesce(HallazgoPipeline.archivo, "") == f_arch,
            func.coalesce(HallazgoPipeline.linea, -1_000_000) == ln,
        )
        return (await db.execute(q)).scalar_one_or_none() is not None

    async def create(
        self,
        db: AsyncSession,
        schema: HallazgoPipelineCreate,
        *,
        extra: dict[str, Any] | None = None,
    ) -> HallazgoPipeline:
        data = schema.model_dump()
        if extra:
            data.update(extra)
        if not data.get("scan_id") and data.get("pipeline_release_id"):
            pr = await db.get(PipelineRelease, data["pipeline_release_id"])
            if pr is not None and pr.scan_id:
                data["scan_id"] = pr.scan_id
        uid = data["user_id"]
        if await self._es_duplicado_c2(
            db,
            user_id=uid,
            pipeline_release_id=data["pipeline_release_id"],
            titulo=data["titulo"],
            archivo=data.get("archivo"),
            linea=data.get("linea"),
            scan_id=data.get("scan_id"),
        ):
            raise ValidationException(
                "Ya existe un hallazgo de pipeline con el mismo título, scan, archivo y línea (P14 / data quality)."
            )
        record = self.model(**data)
        db.add(record)
        await db.flush()
        await db.refresh(record)
        await self._audit(db, "create", record, metadata={"created": _safe(data)})
        return record


def _safe(data: dict[str, Any]) -> dict[str, Any]:
    import datetime as _dt
    import uuid as _uuid

    out: dict[str, Any] = {}
    for k, v in data.items():
        if isinstance(v, (_uuid.UUID, _dt.datetime, _dt.date)):
            out[k] = str(v)
        elif isinstance(v, (dict, list, tuple, int, float, str, bool)) or v is None:
            out[k] = v
        else:
            out[k] = str(v)
    return out


async def resolve_pipeline_por_match(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    scan_id: str,
    rama: str,
) -> PipelineRelease | None:
    """BRD C2: localiza un pipeline por ``scan_id`` + ``rama`` (Nivel 1) para carga de detalle."""
    sid = (scan_id or "").strip()
    br = (rama or "").strip()
    if not sid or not br:
        return None
    result = await db.execute(
        select(PipelineRelease)
        .where(
            PipelineRelease.user_id == user_id,
            PipelineRelease.scan_id == sid,
            PipelineRelease.rama == br,
            PipelineRelease.deleted_at.is_(None),
        )
        .order_by(PipelineRelease.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


hallazgo_pipeline_svc = HallazgoPipelineService(
    HallazgoPipeline,
    owner_field="user_id",
    audit_action_prefix="hallazgo_pipeline",
)
