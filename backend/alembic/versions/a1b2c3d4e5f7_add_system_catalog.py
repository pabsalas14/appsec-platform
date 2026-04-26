"""Add SystemCatalog model for system-wide key/value catalog

Revision ID: a1b2c3d4e5f7
Revises: b2c3d4e5f6a8
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a1b2c3d4e5f7"
down_revision = "b2c3d4e5f6a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "system_catalogs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tipo", sa.String(length=128), nullable=False),
        sa.Column("key", sa.String(length=256), nullable=False),
        sa.Column(
            "values",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tipo", "key", name="UQ_system_catalog_tipo_key"),
    )
    op.create_index("ix_system_catalogs_tipo", "system_catalogs", ["tipo"], unique=False)
    op.create_index("ix_system_catalogs_key", "system_catalogs", ["key"], unique=False)
    op.create_index("ix_system_catalogs_activo", "system_catalogs", ["activo"], unique=False)
    op.create_index("ix_system_catalogs_updated_at", "system_catalogs", ["updated_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_system_catalogs_updated_at", table_name="system_catalogs")
    op.drop_index("ix_system_catalogs_activo", table_name="system_catalogs")
    op.drop_index("ix_system_catalogs_key", table_name="system_catalogs")
    op.drop_index("ix_system_catalogs_tipo", table_name="system_catalogs")
    op.drop_table("system_catalogs")
