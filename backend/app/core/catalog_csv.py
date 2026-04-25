"""Import/export CSV de catálogos §3.1 (BRD A2/A3) — subdirección…control."""

from __future__ import annotations

import csv
from io import StringIO
from uuid import UUID

from pydantic import ValidationError

from app.core.inventory_csv import read_csv_dict_rows
from app.models.tipo_prueba import CATEGORIAS_VALIDAS
from app.schemas.celula import CelulaCreate
from app.schemas.control_seguridad import ControlSeguridadCreate
from app.schemas.gerencia import GerenciaCreate
from app.schemas.organizacion import OrganizacionCreate
from app.schemas.servicio import ServicioCreate
from app.schemas.subdireccion import SubdireccionCreate
from app.schemas.tipo_prueba import TipoPruebaCreate


def _bool_cell(s: str) -> bool:
    t = s.strip().lower()
    if t in ("1", "true", "yes", "sí", "si", "y"):
        return True
    if t in ("0", "false", "no", ""):
        return False
    raise ValueError("obligatorio debe ser true o false")


def subdireccion_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "codigo", "descripcion", "director_nombre", "director_contacto"])
    w.writerow(["Plataformas", "PLAT-01", "Subdirección de plataformas", "Ana Pérez", "ana@org.local"])
    return buf.getvalue()


def subdireccion_row(d: dict[str, str], *, row: int) -> tuple[SubdireccionCreate | None, str | None]:
    try:
        return (
            SubdireccionCreate(
                nombre=(d.get("nombre") or "").strip(),
                codigo=(d.get("codigo") or "").strip(),
                descripcion=(d.get("descripcion") or "").strip() or None,
                director_nombre=(d.get("director_nombre") or "").strip() or None,
                director_contacto=(d.get("director_contacto") or "").strip() or None,
            ),
            None,
        )
    except ValidationError as e:
        return None, f"fila {row}: {e!s}"


def gerencia_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "descripcion", "subdireccion_id"])
    w.writerow(["Gerencia Core", "Core apps", "00000000-0000-0000-0000-000000000000"])
    return buf.getvalue()


def gerencia_row(d: dict[str, str], *, row: int) -> tuple[GerenciaCreate | None, str | None]:
    try:
        sid = (d.get("subdireccion_id") or "").strip()
        if not sid:
            return None, f"fila {row}: subdireccion_id obligatorio"
        return (
            GerenciaCreate(
                nombre=(d.get("nombre") or "").strip(),
                descripcion=(d.get("descripcion") or "").strip() or None,
                subdireccion_id=UUID(sid),
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


def organizacion_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "codigo", "descripcion", "gerencia_id", "plataforma", "url_base", "responsable"])
    w.writerow(
        [
            "Org Git",
            "ORG-GH-1",
            "Organización GitHub",
            "00000000-0000-0000-0000-000000000000",
            "GitHub",
            "https://github.com/myorg",
            "Bob",
        ]
    )
    return buf.getvalue()


def organizacion_row(d: dict[str, str], *, row: int) -> tuple[OrganizacionCreate | None, str | None]:
    try:
        gid = (d.get("gerencia_id") or "").strip()
        if not gid:
            return None, f"fila {row}: gerencia_id obligatorio"
        return (
            OrganizacionCreate(
                nombre=(d.get("nombre") or "").strip(),
                codigo=(d.get("codigo") or "").strip(),
                descripcion=(d.get("descripcion") or "").strip() or None,
                gerencia_id=UUID(gid),
                plataforma=(d.get("plataforma") or "GitHub").strip() or "GitHub",
                url_base=(d.get("url_base") or "").strip() or None,
                responsable=(d.get("responsable") or "").strip() or None,
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


def celula_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "tipo", "descripcion", "organizacion_id"])
    w.writerow(
        [
            "Célula API",
            "Squad",
            "Servicios internos",
            "00000000-0000-0000-0000-000000000000",
        ]
    )
    return buf.getvalue()


def celula_row(d: dict[str, str], *, row: int) -> tuple[CelulaCreate | None, str | None]:
    try:
        oid = (d.get("organizacion_id") or "").strip()
        if not oid:
            return None, f"fila {row}: organizacion_id obligatorio"
        return (
            CelulaCreate(
                nombre=(d.get("nombre") or "").strip(),
                tipo=(d.get("tipo") or "").strip(),
                descripcion=(d.get("descripcion") or "").strip() or None,
                organizacion_id=UUID(oid),
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


def servicio_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "descripcion", "criticidad", "tecnologia_stack", "celula_id"])
    w.writerow(
        [
            "API Pagos",
            "Gateway",
            "Alta",
            "Python, FastAPI",
            "00000000-0000-0000-0000-000000000000",
        ]
    )
    return buf.getvalue()


def servicio_row(d: dict[str, str], *, row: int) -> tuple[ServicioCreate | None, str | None]:
    try:
        cid = (d.get("celula_id") or "").strip()
        if not cid:
            return None, f"fila {row}: celula_id obligatorio"
        n = (d.get("nombre") or "").strip()
        if not n:
            return None, f"fila {row}: nombre obligatorio"
        c = (d.get("criticidad") or "").strip()
        if not c:
            return None, f"fila {row}: criticidad obligatoria"
        return (
            ServicioCreate(
                nombre=n,
                descripcion=(d.get("descripcion") or "").strip() or None,
                criticidad=c,
                tecnologia_stack=(d.get("tecnologia_stack") or "").strip() or None,
                celula_id=UUID(cid),
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


def tipo_prueba_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "categoria", "descripcion"])
    w.writerow(["SAST reglas custom", "SAST", "Reglas de negocio"])
    return buf.getvalue()


def tipo_prueba_row(d: dict[str, str], *, row: int) -> tuple[TipoPruebaCreate | None, str | None]:
    try:
        cat = (d.get("categoria") or "").strip()
        if cat not in CATEGORIAS_VALIDAS:
            return None, f"fila {row}: categoria debe ser una de {sorted(CATEGORIAS_VALIDAS)}"
        return (
            TipoPruebaCreate(
                nombre=(d.get("nombre") or "").strip(),
                categoria=cat,
                descripcion=(d.get("descripcion") or "").strip() or None,
            ),
            None,
        )
    except ValidationError as e:
        return None, f"fila {row}: {e!s}"


def control_seguridad_template_body() -> str:
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["nombre", "tipo", "descripcion", "obligatorio"])
    w.writerow(["Cifrado en tránsito", "Técnico", "TLS 1.2+", "true"])
    return buf.getvalue()


def control_seguridad_row(d: dict[str, str], *, row: int) -> tuple[ControlSeguridadCreate | None, str | None]:
    try:
        return (
            ControlSeguridadCreate(
                nombre=(d.get("nombre") or "").strip(),
                tipo=(d.get("tipo") or "").strip(),
                descripcion=(d.get("descripcion") or "").strip() or None,
                obligatorio=_bool_cell(d.get("obligatorio", "false")),
            ),
            None,
        )
    except (ValueError, ValidationError) as e:
        return None, f"fila {row}: {e!s}"


__all__ = [
    "celula_row",
    "celula_template_body",
    "control_seguridad_row",
    "control_seguridad_template_body",
    "gerencia_row",
    "gerencia_template_body",
    "organizacion_row",
    "organizacion_template_body",
    "read_csv_dict_rows",
    "servicio_row",
    "servicio_template_body",
    "subdireccion_row",
    "subdireccion_template_body",
    "tipo_prueba_row",
    "tipo_prueba_template_body",
]
