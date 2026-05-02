"""add historico_scoring_mensual — motor de madurez (spec 12)

Revision ID: h1j2k3l4m5n6
Revises: f4a5b6c7d8e9
Create Date: 2026-05-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "h1j2k3l4m5n6"
down_revision: Union[str, None] = "f4a5b6c7d8e9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "historico_scoring_mensuals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("anio", sa.Integer(), nullable=False),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("scope_kind", sa.String(length=32), nullable=False),
        sa.Column("scope_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score_total", sa.Float(), nullable=False),
        sa.Column("score_vulnerabilidades", sa.Float(), nullable=False),
        sa.Column("score_programas", sa.Float(), nullable=False),
        sa.Column("score_iniciativas", sa.Float(), nullable=False),
        sa.Column("score_okrs", sa.Float(), nullable=False),
        sa.Column("pesos_json", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("detalle_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("computed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "anio", "mes", "scope_kind", "scope_id", name="uq_historico_scoring_mensual_scope"),
    )
    op.create_index("ix_historico_scoring_mensuals_user_id", "historico_scoring_mensuals", ["user_id"])
    op.create_index("ix_historico_scoring_mensuals_anio_mes", "historico_scoring_mensuals", ["anio", "mes"])
    op.create_index("ix_historico_scoring_mensuals_scope_kind", "historico_scoring_mensuals", ["scope_kind"])
    op.create_index("ix_historico_scoring_mensuals_scope_id", "historico_scoring_mensuals", ["scope_id"])


def downgrade() -> None:
    op.drop_index("ix_historico_scoring_mensuals_scope_id", table_name="historico_scoring_mensuals")
    op.drop_index("ix_historico_scoring_mensuals_scope_kind", table_name="historico_scoring_mensuals")
    op.drop_index("ix_historico_scoring_mensuals_anio_mes", table_name="historico_scoring_mensuals")
    op.drop_index("ix_historico_scoring_mensuals_user_id", table_name="historico_scoring_mensuals")
    op.drop_table("historico_scoring_mensuals")
