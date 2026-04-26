"""Add formulas table (admin reusable formulas, Fase 5)

Revision ID: z9y8x7w6v5u4
Revises: u5v6w7x8y9z0
Create Date: 2026-04-26

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "z9y8x7w6v5u4"
down_revision: Union[str, None] = "u5v6w7x8y9z0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "formulas",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("formula_text", sa.Text(), nullable=False),
        sa.Column(
            "motor",
            sa.String(length=100),
            nullable=False,
            server_default=sa.text("'formula_engine'"),
        ),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_formulas_nombre"), "formulas", ["nombre"], unique=False)
    op.create_index(op.f("ix_formulas_deleted_at"), "formulas", ["deleted_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_formulas_deleted_at"), table_name="formulas")
    op.drop_index(op.f("ix_formulas_nombre"), table_name="formulas")
    op.drop_table("formulas")
