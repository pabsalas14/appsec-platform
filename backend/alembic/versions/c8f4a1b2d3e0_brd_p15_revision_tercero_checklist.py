"""BRD §10.3: checklist, evidencias y metadatos de revisión por terceros.

Revision: c8f4a1b2d3e0
Revises: a1b2c3d4e5f6
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c8f4a1b2d3e0"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "revision_terceros",
        sa.Column("checklist_resultados", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "revision_terceros",
        sa.Column("evidencias", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "revision_terceros",
        sa.Column("responsable_revision", sa.String(255), nullable=True),
    )
    op.add_column(
        "revision_terceros",
        sa.Column("observaciones", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("revision_terceros", "observaciones")
    op.drop_column("revision_terceros", "responsable_revision")
    op.drop_column("revision_terceros", "evidencias")
    op.drop_column("revision_terceros", "checklist_resultados")
