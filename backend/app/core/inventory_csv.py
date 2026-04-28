"""Helpers for inventario (repositorios / activo web) CSV template + import filas."""

from __future__ import annotations

import csv
from io import StringIO
from uuid import UUID

from pydantic import ValidationError

from app.schemas.activo_web import ActivoWebCreate
from app.schemas.repositorio import RepositorioCreate

REPO_HEADER = (
    "nombre,url,plataforma,rama_default,activo,organizacion_id,celula_id,subdireccion_responsable_id,"
    "responsable_nombre,responsable_contacto"
)
WEB_HEADER = "nombre,url,ambiente,tipo,celula_id"


def repositorio_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(REPO_HEADER.split(","))
    w.writerow(
        [
            "mi-servicio",
            "https://github.com/org/repo",
            "github",
            "main",
            "true",
            "00000000-0000-0000-0000-000000000000",
            "00000000-0000-0000-0000-000000000000",
            "00000000-0000-0000-0000-000000000000",
            "Responsable Demo",
            "responsable@empresa.com",
        ]
    )
    return buf.getvalue()


def activo_web_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(WEB_HEADER.split(","))
    w.writerow(
        [
            "portal",
            "https://app.example.com/",
            "Produccion",
            "aplicacion",
            "00000000-0000-0000-0000-000000000000",
        ]
    )
    return buf.getvalue()


def _parse_bool(s: str) -> bool:
    t = s.strip().lower()
    if t in ("1", "true", "yes", "sí", "si", "y"):
        return True
    if t in ("0", "false", "no", ""):
        return False
    raise ValueError("activo debe ser true o false")


def repositorio_row_to_create(d: dict[str, str], *, row: int) -> tuple[RepositorioCreate | None, str | None]:
    """Return (create, error_message). error_message set on validation failure."""
    try:
        org = d.get("organizacion_id", "").strip()
        oid = UUID(org) if org else None
        cell = d.get("celula_id", "").strip()
        cid = UUID(cell) if cell else None
        sub = d.get("subdireccion_responsable_id", "").strip()
        sid = UUID(sub) if sub else None
        u = d.get("url", "").strip()
        if not u:
            return None, f"fila {row}: url obligatoria"
        return (
            RepositorioCreate(
                nombre=d.get("nombre", "").strip(),
                url=u,
                plataforma=d.get("plataforma", "").strip(),
                rama_default=d.get("rama_default", "").strip(),
                activo=_parse_bool(d.get("activo", "true")),
                organizacion_id=oid,
                celula_id=cid,
                subdireccion_responsable_id=sid,
                responsable_nombre=d.get("responsable_nombre", "").strip() or None,
                responsable_contacto=d.get("responsable_contacto", "").strip() or None,
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


def activo_web_row_to_create(d: dict[str, str], *, row: int) -> tuple[ActivoWebCreate | None, str | None]:
    try:
        cell = d.get("celula_id", "").strip()
        cid = UUID(cell) if cell else None
        if cid is None:
            return None, f"fila {row}: celula_id obligatorio (UUID)"
        u = d.get("url", "").strip()
        if not u:
            return None, f"fila {row}: url obligatoria"
        return (
            ActivoWebCreate(
                nombre=d.get("nombre", "").strip(),
                url=u,
                ambiente=d.get("ambiente", "").strip(),
                tipo=d.get("tipo", "").strip(),
                celula_id=cid,
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


def read_csv_dict_rows(text: str) -> list[dict[str, str]]:
    """UTF-8 CSV; primera fila = cabeceras. Omite filas completamente vacías."""
    s = StringIO(text.strip() or "")
    r = csv.DictReader(s)
    if not r.fieldnames:
        return []
    out: list[dict[str, str]] = []
    for row in r:
        d = {k: (v or "").strip() for k, v in row.items() if k}
        if not any(d.values()):
            continue
        out.append(d)
    return out
