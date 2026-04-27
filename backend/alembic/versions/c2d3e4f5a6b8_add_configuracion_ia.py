"""Add ConfiguracionIA model for IA provider configuration

Revision ID: c2d3e4f5a6b8
Revises: a1b2c3d4e5f7
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c2d3e4f5a6b8"
down_revision = "a1b2c3d4e5f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "configuracion_ia",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("api_key_encrypted", sa.String(), nullable=False),
        sa.Column("model", sa.String(length=256), nullable=False),
        sa.Column("temperatura", sa.Float(), nullable=False, server_default="0.7"),
        sa.Column("max_tokens", sa.Integer(), nullable=False, server_default="4096"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_configuracion_ia_provider", "configuracion_ia", ["provider"], unique=False)
    op.create_index("ix_configuracion_ia_enabled", "configuracion_ia", ["enabled"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_configuracion_ia_enabled", table_name="configuracion_ia")
    op.drop_index("ix_configuracion_ia_provider", table_name="configuracion_ia")
    op.drop_table("configuracion_ia")
