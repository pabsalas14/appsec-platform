"""Importación masiva de hallazgos (CSV) por motor — BRD Módulo 9."""

from __future__ import annotations

import csv
from io import StringIO
from uuid import UUID

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ValidationException
from app.schemas.vulnerabilidad import VulnerabilidadCreate
from app.services.vulnerabilidad_service import vulnerabilidad_svc

_MOTOR_TO_FUENTE: dict[str, str] = {
    "sast": "SAST",
    "dast": "DAST",
    "sca": "SCA",
    "cds": "CDS",
    "mda": "MDA",
    "mast": "MAST",
    "tm": "TM",
}


def resolve_fuente(motor: str) -> str:
    key = motor.strip().lower()
    if key not in _MOTOR_TO_FUENTE:
        allowed = ", ".join(sorted(_MOTOR_TO_FUENTE))
        raise ValidationException(f"motor debe ser uno de: {allowed}")
    return _MOTOR_TO_FUENTE[key]


def _count_assets(row: dict[str, str]) -> int:
    keys = ("repositorio_id", "activo_web_id", "servicio_id", "aplicacion_movil_id")
    n = 0
    for k in keys:
        v = (row.get(k) or "").strip()
        if v:
            n += 1
    return n


def _parse_uuid_cell(val: str | None) -> UUID | None:
    if not val or not str(val).strip():
        return None
    try:
        return UUID(str(val).strip())
    except ValueError:
        raise ValidationException(f"UUID inválido: {val!r}") from None


async def import_vulnerabilidades_from_csv(
    db: AsyncSession,
    *,
    user_id: UUID,
    motor_key: str,
    csv_text: str,
    default_repositorio_id: UUID | None = None,
    default_activo_web_id: UUID | None = None,
    default_servicio_id: UUID | None = None,
    default_aplicacion_movil_id: UUID | None = None,
) -> dict[str, int | list[str]]:
    fuente = resolve_fuente(motor_key)
    defaults_n = sum(
        1
        for x in (
            default_repositorio_id,
            default_activo_web_id,
            default_servicio_id,
            default_aplicacion_movil_id,
        )
        if x is not None
    )
    if defaults_n > 1:
        raise ValidationException("Debe indicarse como máximo un activo por defecto (query params)")

    reader = csv.DictReader(StringIO(csv_text))
    if not reader.fieldnames:
        raise ValidationException("CSV vacío o sin cabecera")

    created = 0
    errors: list[str] = []
    for i, row in enumerate(reader, start=2):
        line_label = f"fila {i}"
        try:
            titulo = (row.get("titulo") or "").strip()
            if not titulo:
                errors.append(f"{line_label}: titulo obligatorio")
                continue
            severidad = (row.get("severidad") or "").strip()
            estado = (row.get("estado") or "").strip()
            if not severidad or not estado:
                errors.append(f"{line_label}: severidad y estado obligatorios")
                continue

            rid = _parse_uuid_cell(row.get("repositorio_id"))
            wid = _parse_uuid_cell(row.get("activo_web_id"))
            sid = _parse_uuid_cell(row.get("servicio_id"))
            aid = _parse_uuid_cell(row.get("aplicacion_movil_id"))
            per_row = sum(1 for x in (rid, wid, sid, aid) if x is not None)
            if per_row > 1:
                errors.append(f"{line_label}: solo un activo por fila")
                continue
            if per_row == 0:
                if defaults_n == 0:
                    errors.append(f"{line_label}: sin activo; use columnas o query default_*")
                    continue
                rid, wid, sid, aid = (
                    default_repositorio_id,
                    default_activo_web_id,
                    default_servicio_id,
                    default_aplicacion_movil_id,
                )

            desc = (row.get("descripcion") or "").strip() or None
            cwe = (row.get("cwe_id") or "").strip() or None
            owasp = (row.get("owasp_categoria") or "").strip() or None
            cvss_raw = (row.get("cvss_score") or "").strip()
            cvss: float | None = None
            if cvss_raw:
                try:
                    cvss = float(cvss_raw)
                except ValueError:
                    errors.append(f"{line_label}: cvss_score inválido")
                    continue

            resp = _parse_uuid_cell(row.get("responsable_id"))

            payload = VulnerabilidadCreate(
                titulo=titulo,
                descripcion=desc,
                fuente=fuente,
                severidad=severidad,
                estado=estado,
                cvss_score=cvss,
                cwe_id=cwe,
                owasp_categoria=owasp,
                responsable_id=resp,
                repositorio_id=rid,
                activo_web_id=wid,
                servicio_id=sid,
                aplicacion_movil_id=aid,
            )
            await vulnerabilidad_svc.create(db, payload, extra={"user_id": user_id})
            created += 1
        except (ValidationError, ValidationException) as e:
            errors.append(f"{line_label}: {e}")

    return {"created": created, "errors": errors}
