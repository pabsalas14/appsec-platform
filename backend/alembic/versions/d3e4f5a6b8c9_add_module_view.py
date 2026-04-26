"""Add ModuleView model for user-owned view configurations

Revision ID: d3e4f5a6b8c9
Revises: c2d3e4f5a6b8
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "d3e4f5a6b8c9"
down_revision = "c2d3e4f5a6b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "module_views",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("module_name", sa.String(length=128), nullable=False),
        sa.Column("nombre", sa.String(length=256), nullable=False),
        sa.Column("tipo", sa.String(length=64), nullable=False),
        sa.Column("columns_config", postgresql.JSONB(), nullable=True, server_default="'[]'::jsonb"),
        sa.Column("filters", postgresql.JSONB(), nullable=True, server_default="'{}'::jsonb"),
        sa.Column("sort_by", sa.String(length=128), nullable=True),
        sa.Column("page_size", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_module_views_module_name", "module_views", ["module_name"], unique=False)
    op.create_index("ix_module_views_tipo", "module_views", ["tipo"], unique=False)
    op.create_index("ix_module_views_user_id", "module_views", ["user_id"], unique=False)
    op.create_index("ix_module_views_deleted_at", "module_views", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_module_views_deleted_at", table_name="module_views")
    op.drop_index("ix_module_views_user_id", table_name="module_views")
    op.drop_index("ix_module_views_tipo", table_name="module_views")
    op.drop_index("ix_module_views_module_name", table_name="module_views")
    op.drop_table("module_views")
