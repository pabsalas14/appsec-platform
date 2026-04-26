"""Add deleted_by to kanban_columns (SoftDeleteMixin parity).

Revision ID: k1j2h3g4f5d6
Revises: v9u8t7s6r5q4
Create Date: 2026-04-26

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "k1j2h3g4f5d6"
down_revision: Union[str, None] = "v9u8t7s6r5q4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "kanban_columns",
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(op.f("ix_kanban_columns_deleted_by"), "kanban_columns", ["deleted_by"], unique=False)
    op.create_foreign_key(
        op.f("kanban_columns_deleted_by_fkey"),
        "kanban_columns",
        "users",
        ["deleted_by"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(op.f("kanban_columns_deleted_by_fkey"), "kanban_columns", type_="foreignkey")
    op.drop_index(op.f("ix_kanban_columns_deleted_by"), table_name="kanban_columns")
    op.drop_column("kanban_columns", "deleted_by")
