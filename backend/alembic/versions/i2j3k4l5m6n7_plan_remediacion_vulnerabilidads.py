"""plan_remediacion <-> vulnerabilidad M:N (spec 8)

Revision ID: i2j3k4l5m6n7
Revises: h1j2k3l4m5n6
Create Date: 2026-05-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "i2j3k4l5m6n7"
down_revision: Union[str, None] = "h1j2k3l4m5n6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "plan_remediacion_vulnerabilidads",
        sa.Column("plan_remediacion_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("vulnerabilidad_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["plan_remediacion_id"],
            ["planes_remediacion.id"],
            name="plan_remediacion_vulnerabilidads_plan_id_fkey",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["vulnerabilidad_id"],
            ["vulnerabilidads.id"],
            name="plan_remediacion_vulnerabilidads_vuln_id_fkey",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("plan_remediacion_id", "vulnerabilidad_id", name="pk_plan_remediacion_vulnerabilidads"),
    )
    op.create_index(
        "ix_plan_remediacion_vulnerabilidads_plan",
        "plan_remediacion_vulnerabilidads",
        ["plan_remediacion_id"],
        unique=False,
    )
    op.create_index(
        "ix_plan_remediacion_vulnerabilidads_vuln",
        "plan_remediacion_vulnerabilidads",
        ["vulnerabilidad_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_plan_remediacion_vulnerabilidads_vuln", table_name="plan_remediacion_vulnerabilidads")
    op.drop_index("ix_plan_remediacion_vulnerabilidads_plan", table_name="plan_remediacion_vulnerabilidads")
    op.drop_table("plan_remediacion_vulnerabilidads")
