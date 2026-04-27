"""Merge g1h2 (kanban) + p6 (catalogs); add custom_fields JSONB on core entities (f8a0).

Revision ID: mergeg1p6f8_001
Revises: g1h2i3j4k5l6, p6m7n8o9p0q1
Create Date: 2026-04-26

Resolves parallel heads and applies entity JSONB columns idempotently.
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

revision: str = "mergeg1p6f8_001"
down_revision: Union[str, Sequence[str]] = ("g1h2i3j4k5l6", "p6m7n8o9p0q1")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("vulnerabilidads", "iniciativas", "temas_emergentes", "auditorias"):
        op.execute(
            f"""
            ALTER TABLE {table}
            ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{{}}'::jsonb;
            """
        )


def downgrade() -> None:
    for table in ("vulnerabilidads", "iniciativas", "temas_emergentes", "auditorias"):
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS custom_fields;")
