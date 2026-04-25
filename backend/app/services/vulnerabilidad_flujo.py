"""BRD §11 (D1): catálogo de estatus, equivalencias y transiciones configurables."""

from __future__ import annotations

from typing import Any

# Texto heredado en pruebas / UI — mapeo a id canónico del catálogo admin
_ESTADO_ALIASES: dict[str, str] = {
    "abierta": "abierta",
    "abierto": "abierta",
    "cerrada": "cerrada",
    "cerrado": "cerrada",
    "en_remediacion": "en_remediacion",
    "en remediacion": "en_remediacion",
    "en remediación": "en_remediacion",
    "en_revision": "en_revision",
    "en revisión": "en_revision",
    "en verificacion": "verificacion",
    "en verificación": "verificacion",
}


def _norm_key(s: str) -> str:
    return " ".join(s.strip().lower().split())


def parse_estatus_catalog(raw: Any) -> list[dict[str, Any]]:
    """Normaliza `catalogo.estatus_vulnerabilidad` (lista o envuelto en dict)."""
    if raw is None:
        return []
    if isinstance(raw, dict) and "estatus" in raw:
        raw = raw["estatus"]
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if isinstance(item, dict) and item.get("id"):
            out.append(item)
    return out


def normalize_estado_a_id(val: str | None, catalog: list[dict[str, Any]]) -> str | None:
    """Resuelve etiqueta, id o alias a `id` del catálogo."""
    if val is None or not str(val).strip():
        return None
    s = str(val).strip()
    for row in catalog:
        eid = str(row.get("id", "")).strip()
        if eid and s == eid:
            return eid
        label = str(row.get("label", "")).strip()
        if label and _norm_key(s) == _norm_key(label):
            return eid
    alias = _ESTADO_ALIASES.get(_norm_key(s))
    if alias:
        for row in catalog:
            if str(row.get("id", "")).strip() == alias:
                return alias
    return None


def assert_transicion_permitida(
    catalog: list[dict[str, Any]],
    desde_id: str,
    hacia_id: str,
) -> None:
    """Levanta ValueError si la transición no está permitida (D1)."""
    if desde_id == hacia_id:
        return
    row = next((r for r in catalog if str(r.get("id")) == desde_id), None)
    if row is None:
        return
    permitidas = row.get("transiciones_permitidas")
    if permitidas is None and "transiciones_permitidas" not in row:
        # Catálogos viejos sin clave: no bloquear
        return
    if not isinstance(permitidas, list):
        return
    if len(permitidas) == 0:
        raise ValueError(f"El estatus '{desde_id}' no admite transiciones de salida (terminal).")
    allow = {str(x).strip() for x in permitidas if str(x).strip()}
    if hacia_id not in allow:
        raise ValueError(
            f"Transición de estatus no permitida: '{desde_id}' → '{hacia_id}'. "
            f"Destinos permitidos: {sorted(allow)}"
        )


def estados_activa_clasificacion(catalog: list[dict[str, Any]]) -> set[str]:
    """Ids de estatus que cuentan como 'activas' para métricas de SLA (BRD)."""
    out: set[str] = set()
    for row in catalog:
        eid = str(row.get("id", "")).strip()
        if not eid:
            continue
        raw = row.get("clasificacion_ciclo")
        if raw is None or (isinstance(raw, str) and not raw.strip()):
            if not row.get("es_terminal"):
                out.add(eid)
            continue
        c = str(raw).strip().lower()
        if c == "activa":
            out.add(eid)
    if not out and catalog:
        # Catálogo sin campo nuevo: asumir no terminales como activa
        for row in catalog:
            eid = str(row.get("id", "")).strip()
            if eid and not row.get("es_terminal"):
                out.add(eid)
    return out


def estados_cerrada_clasificacion(catalog: list[dict[str, Any]]) -> set[str]:
    """Ids de estatus que cuentan como 'cerrados/remediados' para madurez (E2)."""
    out: set[str] = set()
    for row in catalog:
        eid = str(row.get("id", "")).strip()
        if not eid:
            continue
        if row.get("es_terminal"):
            out.add(eid)
            continue
        raw = row.get("clasificacion_ciclo")
        if isinstance(raw, str) and raw.strip():
            c = raw.strip().lower()
            if c in ("remediada", "cerrada", "falso_positivo", "aceptada"):
                out.add(eid)
    return out
