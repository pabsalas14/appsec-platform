"""Add soft-delete columns to validation_rules (align with ValidationRule model).

Revision ID: v9u8t7s6r5q4
Revises: d4c3b2a1908f
Create Date: 2026-04-26

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "v9u8t7s6r5q4"
down_revision: Union[str, None] = "d4c3b2a1908f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("validation_rules", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "validation_rules",
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(op.f("ix_validation_rules_deleted_at"), "validation_rules", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_validation_rules_deleted_by"), "validation_rules", ["deleted_by"], unique=False)
    op.create_foreign_key(
        op.f("validation_rules_deleted_by_fkey"),
        "validation_rules",
        "users",
        ["deleted_by"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("validation_rules_deleted_by_fkey"), "validation_rules", type_="foreignkey")
    op.drop_index(op.f("ix_validation_rules_deleted_by"), table_name="validation_rules")
    op.drop_index(op.f("ix_validation_rules_deleted_at"), table_name="validation_rules")
    op.drop_column("validation_rules", "deleted_by")
    op.drop_column("validation_rules", "deleted_at")
