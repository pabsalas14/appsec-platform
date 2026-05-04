"""Configuración de presentación del dashboard de programas anuales (system_settings)."""

from __future__ import annotations

from copy import deepcopy
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_setting import SystemSetting

DEFAULT_ANNUAL_PROGRAM_DISPLAY: dict[str, Any] = {
    "order": ["SAST", "DAST", "SCA", "CDS", "MDA"],
    "labels": {
        "SAST": "Seguridad en Aplicaciones (SAST)",
        "DAST": "Pruebas Dinámicas (DAST)",
        "SCA": "Análisis de Composición (SCA)",
        "CDS": "Defensa de Código (CDS)",
        "MDA": "Análisis Móvil (MDA)",
    },
    "colors": {
        "SAST": "#3b82f6",
        "DAST": "#ef4444",
        "SCA": "#a855f7",
        "CDS": "#10b981",
        "MDA": "#f59e0b",
    },
}


def merge_annual_program_display(stored: object | None) -> dict[str, Any]:
    """Fusiona valor en BD con defaults; ignora claves desconocidas mal formadas."""
    base = deepcopy(DEFAULT_ANNUAL_PROGRAM_DISPLAY)
    if not isinstance(stored, dict):
        return base

    raw_order = stored.get("order")
    if isinstance(raw_order, list) and raw_order:
        base["order"] = [str(x).strip().upper() for x in raw_order if str(x).strip()]

    raw_labels = stored.get("labels")
    if isinstance(raw_labels, dict):
        for k, v in raw_labels.items():
            ks = str(k).strip().upper()
            if ks and isinstance(v, str) and v.strip():
                base["labels"][ks] = v.strip()

    raw_colors = stored.get("colors")
    if isinstance(raw_colors, dict):
        for k, v in raw_colors.items():
            ks = str(k).strip().upper()
            if ks and isinstance(v, str) and v.strip().startswith("#"):
                base["colors"][ks] = v.strip()

    return base


async def get_annual_program_display(db: AsyncSession) -> dict[str, Any]:
    r = await db.execute(select(SystemSetting.value).where(SystemSetting.key == "programas.anuales.display"))
    val = r.scalar_one_or_none()
    return merge_annual_program_display(val)
