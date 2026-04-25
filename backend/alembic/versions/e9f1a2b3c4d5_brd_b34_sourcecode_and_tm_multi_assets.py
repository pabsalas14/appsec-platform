"""BRD fase B: metadatos motor en source code + activos/adjuntos en sesion TM.

Revision ID: e9f1a2b3c4d5
Revises: d7e9a1b2c3f4
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "e9f1a2b3c4d5"
down_revision = "d7e9a1b2c3f4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "programa_source_codes",
        sa.Column("metadatos_motor", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "sesion_threat_modelings",
        sa.Column("activos_web_relacionados_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "sesion_threat_modelings",
        sa.Column("adjuntos_referencias", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("sesion_threat_modelings", "adjuntos_referencias")
    op.drop_column("sesion_threat_modelings", "activos_web_relacionados_ids")
    op.drop_column("programa_source_codes", "metadatos_motor")
