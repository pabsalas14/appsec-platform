"""HallazgoPipeline CRUD endpoints (Módulo 8 — Operación)."""

import csv
from io import StringIO
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import Response
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.exceptions import ValidationException
from app.core.response import success
from app.models.hallazgo_pipeline import HallazgoPipeline
from app.models.user import User
from app.schemas.hallazgo_pipeline import (
    HallazgoPipelineCreate,
    HallazgoPipelineRead,
    HallazgoPipelineUpdate,
)
from app.services.hallazgo_pipeline_service import hallazgo_pipeline_svc, resolve_pipeline_por_match

router = APIRouter()

PLANTILLA_CSV = (
    "scan_id,branch,titulo,severidad,archivo,linea,regla,estado\n"
    "SCAN-1,main,Ejemplo SQLi,Alta,src/x.py,10,rule-1,Abierto\n"
)


@router.get("/plantilla.csv")
async def descargar_plantilla_hallazgos_pipeline(
    _current_user: User = Depends(get_current_user),
):
    """BRD C2: plantilla obligatoria para import masivo (Regla global §2.7)."""
    return Response(
        content=PLANTILLA_CSV,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="hallazgos_pipeline_plantilla.csv"'},
    )


@router.get("/import-template.csv")
async def descargar_template_hallazgos_pipeline(
    _current_user: User = Depends(get_current_user),
):
    """P13: mismo CSV que `plantilla.csv` (nombre homogéneo «Descargar template»)."""
    return Response(
        content=PLANTILLA_CSV,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="hallazgos_pipeline_import_template.csv"'},
    )


@router.post("/import-csv", status_code=201)
async def import_hallazgos_pipeline_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """C2 / P14: match estricto ``scan_id`` + ``branch`` con Nivel 1; filas inválidas se rechazan con log."""
    raw = (await file.read()).decode("utf-8", errors="replace")
    buf = StringIO(raw)
    reader = csv.DictReader(buf)
    if not reader.fieldnames:
        raise ValidationException("CSV vacío o sin encabezados")
    creados = 0
    errores: list[dict[str, int | str]] = []

    def _row_has_content(r: dict[str, str | None]) -> bool:
        return any((str(v).strip() if v is not None else "") for v in r.values())

    for row_num, row in enumerate(reader, start=2):
        if not _row_has_content(row):
            continue
        sid = (row.get("scan_id") or "").strip()
        br = (row.get("branch") or "").strip()
        if not sid or not br:
            errores.append(
                {"fila": row_num, "motivo": "P14: scan_id y branch son obligatorios para cada fila con datos."}
            )
            continue
        titulo = (row.get("titulo") or "").strip()
        if not titulo:
            errores.append({"fila": row_num, "motivo": "P14: titulo es obligatorio."})
            continue

        pr = await resolve_pipeline_por_match(
            db,
            user_id=current_user.id,
            scan_id=sid,
            rama=br,
        )
        if pr is None:
            errores.append(
                {
                    "fila": row_num,
                    "motivo": f"No hay pipeline (Scan ID + Branch) en inventario para scan_id={sid!r}, branch={br!r}.",
                }
            )
            continue

        linea: int | None = None
        if (row.get("linea") or "").strip().isdigit():
            linea = int((row.get("linea") or "0").strip())

        try:
            h_in = HallazgoPipelineCreate(
                pipeline_release_id=pr.id,
                titulo=titulo,
                descripcion=None,
                severidad=(row.get("severidad") or "Media").strip() or "Media",
                archivo=(row.get("archivo") or "").strip() or None,
                linea=linea,
                regla=(row.get("regla") or "").strip() or None,
                scan_id=sid or None,
                estado=(row.get("estado") or "Abierto").strip() or "Abierto",
            )
        except ValidationError as ve:
            err_list = ve.errors()
            det = err_list[0].get("msg", str(ve)) if err_list else str(ve)
            errores.append({"fila": row_num, "motivo": f"P14: {det}"})
            continue
        raw_in = h_in.model_dump()
        if await hallazgo_pipeline_svc._es_duplicado_c2(
            db,
            user_id=current_user.id,
            pipeline_release_id=pr.id,
            titulo=raw_in["titulo"],
            archivo=raw_in.get("archivo"),
            linea=raw_in.get("linea"),
            scan_id=raw_in.get("scan_id"),
        ):
            errores.append(
                {
                    "fila": row_num,
                    "motivo": "P14: registro duplicado (mismo título, scan, archivo y línea bajo el pipeline L1).",
                }
            )
            continue
        try:
            await hallazgo_pipeline_svc.create(db, h_in, extra={"user_id": current_user.id})
        except ValidationException as ex:
            errores.append({"fila": row_num, "motivo": str(ex.detail)})
            continue
        creados += 1

    rechazados = len(errores)
    return success(
        {
            "importados": creados,
            "rechazados": rechazados,
            "errores": errores,
        }
    )


@router.get("")
async def list_hallazgo_pipelines(
    pipeline_release_id: UUID | None = Query(default=None),
    scan_id: str | None = Query(
        default=None,
        max_length=255,
        description="Correlación con ID de scan en la herramienta (BRD C2, junto a rama en pipeline_release).",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista hallazgos de pipeline. Filtrar por ``pipeline_release_id`` y/u optional ``scan_id``."""
    filters: dict = {"user_id": current_user.id}
    if pipeline_release_id:
        filters["pipeline_release_id"] = pipeline_release_id
    if scan_id:
        filters["scan_id"] = scan_id
    items = await hallazgo_pipeline_svc.list(db, filters=filters)
    return success([HallazgoPipelineRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_hallazgo_pipeline(
    entity: HallazgoPipeline = Depends(require_ownership(hallazgo_pipeline_svc)),
):
    return success(HallazgoPipelineRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_hallazgo_pipeline(
    entity_in: HallazgoPipelineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entity = await hallazgo_pipeline_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(HallazgoPipelineRead.model_validate(entity).model_dump(mode="json"))


@router.patch("/{id}")
async def update_hallazgo_pipeline(
    entity_in: HallazgoPipelineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoPipeline = Depends(require_ownership(hallazgo_pipeline_svc)),
):
    updated = await hallazgo_pipeline_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
    return success(HallazgoPipelineRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_hallazgo_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: HallazgoPipeline = Depends(require_ownership(hallazgo_pipeline_svc)),
):
    await hallazgo_pipeline_svc.delete(db, entity.id, scope={"user_id": current_user.id}, actor_id=current_user.id)
    return success(None, meta={"message": "HallazgoPipeline eliminado"})
