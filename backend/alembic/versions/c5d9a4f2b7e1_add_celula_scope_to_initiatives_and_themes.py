"""Add celula scope to iniciativas and temas emergentes.

Revision ID: c5d9a4f2b7e1
Revises: f3a9c1d2e8b0
Create Date: 2026-04-24 12:30:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5d9a4f2b7e1"
down_revision: Union[str, None] = "f3a9c1d2e8b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "iniciativas",
        sa.Column("celula_id", sa.UUID(), nullable=True),
    )
    op.create_index(
        op.f("ix_iniciativas_celula_id"),
        "iniciativas",
        ["celula_id"],
        unique=False,
    )
    op.create_foreign_key(
        "iniciativas_celula_id_fkey",
        "iniciativas",
        "celulas",
        ["celula_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.add_column(
        "temas_emergentes",
        sa.Column("celula_id", sa.UUID(), nullable=True),
    )
    op.create_index(
        op.f("ix_temas_emergentes_celula_id"),
        "temas_emergentes",
        ["celula_id"],
        unique=False,
    )
    op.create_foreign_key(
        "temas_emergentes_celula_id_fkey",
        "temas_emergentes",
        "celulas",
        ["celula_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "temas_emergentes_celula_id_fkey",
        "temas_emergentes",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_temas_emergentes_celula_id"), table_name="temas_emergentes")
    op.drop_column("temas_emergentes", "celula_id")

    op.drop_constraint(
        "iniciativas_celula_id_fkey",
        "iniciativas",
        type_="foreignkey",
    )
    op.drop_index(op.f("ix_iniciativas_celula_id"), table_name="iniciativas")
    op.drop_column("iniciativas", "celula_id")
