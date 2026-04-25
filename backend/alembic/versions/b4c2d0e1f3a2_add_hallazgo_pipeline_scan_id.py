"""add scan_id to hallazgo_pipelines (BRD C2 — correlación con herramienta)

Revision ID: b4c2d0e1f3a2
Revises: (head chain — set below)
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "b4c2d0e1f3a2"
down_revision = "e8f0a1b2c3d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "hallazgo_pipelines",
        sa.Column("scan_id", sa.String(length=255), nullable=True),
    )
    op.create_index(
        op.f("ix_hallazgo_pipelines_scan_id"),
        "hallazgo_pipelines",
        ["scan_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_hallazgo_pipelines_scan_id"), table_name="hallazgo_pipelines")
    op.drop_column("hallazgo_pipelines", "scan_id")
