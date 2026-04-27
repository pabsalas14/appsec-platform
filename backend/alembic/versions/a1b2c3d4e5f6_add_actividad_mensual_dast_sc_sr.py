"""Add actividad_mensual_dasts, actividad_mensual_source_codes, actividad_mensual_servicios_regulados tables.

Revision ID: d4c3b2a1908f
Revises: w8v7u6t5s4r3
Create Date: 2026-04-26
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision: str = "d4c3b2a1908f"
down_revision: Union[str, None] = "w8v7u6t5s4r3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── actividad_mensual_dasts ───────────────────────────────────────────────
    op.create_table(
        "actividad_mensual_dasts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
        ),
        sa.Column(
            "programa_dast_id",
            UUID(as_uuid=True),
            sa.ForeignKey("programa_dasts.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False, index=True),
        sa.Column("total_hallazgos", sa.Integer(), nullable=True),
        sa.Column("criticos", sa.Integer(), nullable=True),
        sa.Column("altos", sa.Integer(), nullable=True),
        sa.Column("medios", sa.Integer(), nullable=True),
        sa.Column("bajos", sa.Integer(), nullable=True),
        sa.Column("sub_estado", sa.String(100), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── actividad_mensual_source_codes ────────────────────────────────────────
    op.create_table(
        "actividad_mensual_source_codes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
        ),
        sa.Column(
            "programa_source_code_id",
            UUID(as_uuid=True),
            sa.ForeignKey("programa_source_codes.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False, index=True),
        sa.Column("total_hallazgos", sa.Integer(), nullable=True),
        sa.Column("criticos", sa.Integer(), nullable=True),
        sa.Column("altos", sa.Integer(), nullable=True),
        sa.Column("medios", sa.Integer(), nullable=True),
        sa.Column("bajos", sa.Integer(), nullable=True),
        sa.Column("sub_estado", sa.String(100), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    # ── actividad_mensual_servicios_regulados ─────────────────────────────────
    op.create_table(
        "actividad_mensual_servicios_regulados",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
        ),
        sa.Column(
            "servicio_regulado_registro_id",
            UUID(as_uuid=True),
            sa.ForeignKey("servicio_regulado_registros.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("mes", sa.Integer(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False, index=True),
        sa.Column("total_hallazgos", sa.Integer(), nullable=True),
        sa.Column("criticos", sa.Integer(), nullable=True),
        sa.Column("altos", sa.Integer(), nullable=True),
        sa.Column("medios", sa.Integer(), nullable=True),
        sa.Column("bajos", sa.Integer(), nullable=True),
        sa.Column("sub_estado", sa.String(100), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("actividad_mensual_servicios_regulados")
    op.drop_table("actividad_mensual_source_codes")
    op.drop_table("actividad_mensual_dasts")
