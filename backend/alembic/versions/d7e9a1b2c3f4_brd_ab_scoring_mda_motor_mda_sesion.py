"""BRD fases A–B: sub_estado SAST mensual, metadatos_motor SAST/DAST, campos MDA en sesión TM.

Revision ID: d7e9a1b2c3f4
Revises: b4c2d0e1f3a2
Create Date: 2026-04-25
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d7e9a1b2c3f4"
down_revision = "b4c2d0e1f3a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "actividad_mensual_sasts",
        sa.Column("sub_estado", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "programa_sasts",
        sa.Column("metadatos_motor", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "programa_dasts",
        sa.Column("metadatos_motor", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "sesion_threat_modelings",
        sa.Column("backlog_tareas", sa.Text(), nullable=True),
    )
    op.add_column(
        "sesion_threat_modelings",
        sa.Column("plan_trabajo", sa.Text(), nullable=True),
    )
    op.add_column(
        "sesion_threat_modelings",
        sa.Column("activo_web_secundario_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_sesion_threat_modelings_activo_web_secundario_id",
        "sesion_threat_modelings",
        "activo_webs",
        ["activo_web_secundario_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_sesion_threat_modelings_activo_web_secundario_id",
        "sesion_threat_modelings",
        ["activo_web_secundario_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_sesion_threat_modelings_activo_web_secundario_id",
        table_name="sesion_threat_modelings",
    )
    op.drop_constraint(
        "fk_sesion_threat_modelings_activo_web_secundario_id",
        "sesion_threat_modelings",
        type_="foreignkey",
    )
    op.drop_column("sesion_threat_modelings", "activo_web_secundario_id")
    op.drop_column("sesion_threat_modelings", "plan_trabajo")
    op.drop_column("sesion_threat_modelings", "backlog_tareas")
    op.drop_column("programa_dasts", "metadatos_motor")
    op.drop_column("programa_sasts", "metadatos_motor")
    op.drop_column("actividad_mensual_sasts", "sub_estado")
