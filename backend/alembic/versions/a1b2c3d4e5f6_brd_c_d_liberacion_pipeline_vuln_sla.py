"""BRD fases C–D: contexto liberación Jira, pipeline L1 (scan, mes, DAST) y D2 soporta métricas.

- service_releases: `contexto_liberacion` (JSONB), `fecha_entrada` (tz)
- pipeline_releases: `scan_id`, `mes`, `activo_web_id` (DAST vía activo web), `liberado_con_vulns_criticas_o_altas` (bool)
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "e9f1a2b3c4d5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("pipeline_releases", "repositorio_id", nullable=True)
    op.add_column(
        "service_releases",
        sa.Column("contexto_liberacion", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "service_releases",
        sa.Column("fecha_entrada", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "pipeline_releases",
        sa.Column("scan_id", sa.String(length=255), nullable=True),
    )
    op.create_index(op.f("ix_pipeline_releases_scan_id"), "pipeline_releases", ["scan_id"], unique=False)
    op.add_column("pipeline_releases", sa.Column("mes", sa.Integer(), nullable=True))
    op.add_column(
        "pipeline_releases",
        sa.Column("activo_web_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_pipeline_releases_activo_web_id_activo_webs"),
        "pipeline_releases",
        "activo_webs",
        ["activo_web_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_pipeline_releases_activo_web_id"), "pipeline_releases", ["activo_web_id"], unique=False)
    op.add_column(
        "pipeline_releases",
        sa.Column(
            "liberado_con_vulns_criticas_o_altas",
            sa.Boolean(),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_pipeline_releases_activo_web_id"), table_name="pipeline_releases")
    op.drop_constraint(
        op.f("fk_pipeline_releases_activo_web_id_activo_webs"),
        "pipeline_releases",
        type_="foreignkey",
    )
    op.drop_column("pipeline_releases", "liberado_con_vulns_criticas_o_altas")
    op.drop_column("pipeline_releases", "activo_web_id")
    op.drop_column("pipeline_releases", "mes")
    op.drop_index(op.f("ix_pipeline_releases_scan_id"), table_name="pipeline_releases")
    op.drop_column("pipeline_releases", "scan_id")
    op.drop_column("service_releases", "fecha_entrada")
    op.drop_column("service_releases", "contexto_liberacion")
    op.alter_column("pipeline_releases", "repositorio_id", nullable=False)
