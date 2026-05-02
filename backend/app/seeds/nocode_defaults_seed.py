"""Defaults no-code: module views, campos, reglas, fórmula y AI demo tras ``make seed``.

Los IDs son deterministas (uuid5) para inserts idempotentes.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.ai_rule import AIRule
from app.models.custom_field import CustomField
from app.models.formula import Formula
from app.models.module_view import ModuleView
from app.models.validation_rule import ValidationRule

_NS = uuid.UUID("6ba7b811-9dad-11d1-80b4-00c04fd430c8")


def _nid(name: str) -> uuid.UUID:
    return uuid.uuid5(_NS, f"nocode:{name}")


async def seed_nocode_defaults(db: AsyncSession, admin_id: uuid.UUID) -> None:
    """Inserta una fila de ejemplo por categoría si aún no existe configuración seed."""
    marker = await db.scalar(select(func.count()).select_from(ModuleView).where(ModuleView.id == _nid("mv_vuln_table")))
    if marker:
        logger.info(
            "seed.nocode_defaults.skip",
            extra={"event": "seed.nocode_defaults.skip", "reason": "already_present"},
        )
        return

    mv_rows: list[dict[str, Any]] = [
        {
            "id": _nid("mv_vuln_table"),
            "module_name": "vulnerabilidades",
            "nombre": "Vista demo — Tabla críticas",
            "tipo": "table",
            "columns_config": {
                "columns": [
                    {"field": "titulo", "width": 280, "order": 0},
                    {"field": "severidad", "width": 120, "order": 1},
                    {"field": "estado", "width": 140, "order": 2},
                ]
            },
            "filters": {"severidad": ["CRITICA", "ALTA"]},
            "sort_by": {"field": "updated_at", "direction": "DESC"},
            "group_by": None,
            "page_size": 25,
            "user_id": admin_id,
        },
        {
            "id": _nid("mv_release_kanban"),
            "module_name": "service_releases",
            "nombre": "Vista demo — Kanban liberaciones",
            "tipo": "kanban",
            "columns_config": {"group_field": "estado_pipeline"},
            "filters": {},
            "sort_by": {"field": "fecha_objetivo", "direction": "ASC"},
            "group_by": "estado_pipeline",
            "page_size": 50,
            "user_id": admin_id,
        },
    ]
    await db.execute(insert(ModuleView).values(mv_rows))
    await db.execute(
        insert(CustomField).values(
            id=_nid("cf_vuln_owner"),
            name="business_owner_ref",
            field_type="text",
            entity_type="vulnerabilidad",
            label="Business owner (referencia)",
            description="Campo demo para extender vulnerabilidades sin migración",
            is_required=False,
            is_searchable=True,
            order=10,
            config='{"placeholder":"owner@empresa.com"}',
        )
    )
    await db.execute(
        insert(ValidationRule).values(
            id=_nid("vr_vuln_title"),
            entity_type="vulnerabilidad",
            nombre="Título no vacío",
            rule_type="required",
            condition={"field": "titulo", "op": "non_empty"},
            error_message="El título es obligatorio",
            enabled=True,
            created_by=admin_id,
        )
    )
    await db.execute(
        insert(Formula).values(
            id=_nid("formula_demo_sla"),
            nombre="Días hasta vencimiento SLA (demo)",
            description="Referencia para motor de fórmulas en administración",
            formula_text="max(0, days_until(due_date))",
            motor="formula_engine",
            enabled=False,
        )
    )
    await db.execute(
        insert(AIRule).values(
            id=_nid("ai_demo_notify"),
            name="Demo: recordatorio SLA (desactivada)",
            description="Plantilla — activar en AI Builder para automatizar avisos",
            trigger_type="on_sla_at_risk",
            trigger_config={"severidad": ["CRITICA", "ALTA"]},
            action_type="send_notification",
            action_config={"template": "sla_at_risk", "channels": ["in_app"]},
            enabled=False,
            max_retries=2,
            timeout_seconds=30,
            created_by=admin_id,
        )
    )
    await db.flush()
    logger.info("seed.nocode_defaults.done", extra={"event": "seed.nocode_defaults.done"})
