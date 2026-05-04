"""Add indicador_valores_manuales for KPI tipo 2 (captura manual por periodo).

Revision ID: x1y2z3a4b5c6
Revises: r8s9t0u1v2w3
Create Date: 2026-05-03

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "x1y2z3a4b5c6"
down_revision = "r8s9t0u1v2w3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "indicador_valores_manuales",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("periodo", sa.String(length=7), nullable=False),
        sa.Column("valor", sa.Float(), nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "code", "periodo", name="uq_indicador_manual_user_code_periodo"),
    )
    op.create_index(
        "ix_indicador_valores_manuales_user_code",
        "indicador_valores_manuales",
        ["user_id", "code"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_indicador_valores_manuales_user_code", table_name="indicador_valores_manuales")
    op.drop_table("indicador_valores_manuales")
