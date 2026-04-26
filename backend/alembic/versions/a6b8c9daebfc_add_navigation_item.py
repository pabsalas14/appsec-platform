"""Add NavigationItem model for customizable navigation menu

Revision ID: a6b8c9daebfc
Revises: f5a6b8c9daeb
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a6b8c9daebfc"
down_revision = "f5a6b8c9daeb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "navigation_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("label", sa.String(length=256), nullable=False),
        sa.Column("icon", sa.String(length=128), nullable=False),
        sa.Column("href", sa.String(length=512), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("visible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("required_role", sa.String(length=64), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["parent_id"], ["navigation_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_navigation_items_orden", "navigation_items", ["orden"], unique=False)
    op.create_index("ix_navigation_items_visible", "navigation_items", ["visible"], unique=False)
    op.create_index("ix_navigation_items_parent_id", "navigation_items", ["parent_id"], unique=False)
    op.create_index("ix_navigation_items_deleted_at", "navigation_items", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_navigation_items_deleted_at", table_name="navigation_items")
    op.drop_index("ix_navigation_items_parent_id", table_name="navigation_items")
    op.drop_index("ix_navigation_items_visible", table_name="navigation_items")
    op.drop_index("ix_navigation_items_orden", table_name="navigation_items")
    op.drop_table("navigation_items")
