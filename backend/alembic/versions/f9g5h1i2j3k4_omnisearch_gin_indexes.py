"""omnisearch gin indexes for full-text search

Revision ID: f9g5h1i2j3k4
Revises: f8de3f84456a
Create Date: 2026-04-26 00:00:00.000000

Add GIN indexes on searchable text fields for omnisearch functionality.
Enables efficient full-text search across vulnerabilities, plans, themes, initiatives, and findings.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f9g5h1i2j3k4"
down_revision: Union[str, None] = "f8de3f84456a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create GIN indexes for omnisearch."""
    # gin_trgm_ops requires pg_trgm extension on fresh PostgreSQL instances.
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    specs = [
        ("ix_vulnerabilidads_titulo_gin", "vulnerabilidads", "titulo"),
        ("ix_vulnerabilidads_descripcion_gin", "vulnerabilidads", "descripcion"),
        ("ix_planes_remediacion_descripcion_gin", "planes_remediacion", "descripcion"),
        (
            "ix_planes_remediacion_acciones_gin",
            "planes_remediacion",
            "acciones_recomendadas",
        ),
        ("ix_temas_emergentes_titulo_gin", "temas_emergentes", "titulo"),
        ("ix_temas_emergentes_descripcion_gin", "temas_emergentes", "descripcion"),
        ("ix_iniciativas_titulo_gin", "iniciativas", "titulo"),
        ("ix_iniciativas_descripcion_gin", "iniciativas", "descripcion"),
        ("ix_hallazgo_sasts_titulo_gin", "hallazgo_sasts", "titulo"),
        ("ix_hallazgo_sasts_descripcion_gin", "hallazgo_sasts", "descripcion"),
        ("ix_hallazgo_dasts_titulo_gin", "hallazgo_dasts", "titulo"),
        ("ix_hallazgo_dasts_descripcion_gin", "hallazgo_dasts", "descripcion"),
        ("ix_hallazgo_masts_titulo_gin", "hallazgo_masts", "titulo"),
        ("ix_hallazgo_masts_descripcion_gin", "hallazgo_masts", "descripcion"),
        ("ix_control_seguridads_nombre_gin", "control_seguridads", "nombre"),
        ("ix_auditorias_titulo_gin", "auditorias", "titulo"),
    ]

    for index_name, table_name, column_name in specs:
        columns = {c["name"] for c in inspector.get_columns(table_name)}
        if column_name not in columns:
            continue
        op.create_index(
            index_name,
            table_name,
            [column_name],
            postgresql_using="gin",
            postgresql_ops={column_name: "gin_trgm_ops"},
        )


def downgrade() -> None:
    """Drop all GIN indexes."""
    op.drop_index("ix_auditorias_titulo_gin", table_name="auditorias")
    op.drop_index("ix_control_seguridads_nombre_gin", table_name="control_seguridads")
    op.drop_index("ix_hallazgo_masts_descripcion_gin", table_name="hallazgo_masts")
    op.drop_index("ix_hallazgo_masts_titulo_gin", table_name="hallazgo_masts")
    op.drop_index("ix_hallazgo_dasts_descripcion_gin", table_name="hallazgo_dasts")
    op.drop_index("ix_hallazgo_dasts_titulo_gin", table_name="hallazgo_dasts")
    op.drop_index("ix_hallazgo_sasts_descripcion_gin", table_name="hallazgo_sasts")
    op.drop_index("ix_hallazgo_sasts_titulo_gin", table_name="hallazgo_sasts")
    op.drop_index("ix_iniciativas_descripcion_gin", table_name="iniciativas")
    op.drop_index("ix_iniciativas_titulo_gin", table_name="iniciativas")
    op.drop_index("ix_temas_emergentes_descripcion_gin", table_name="temas_emergentes")
    op.drop_index("ix_temas_emergentes_titulo_gin", table_name="temas_emergentes")
    op.drop_index("ix_planes_remediacion_acciones_gin", table_name="planes_remediacion")
    op.drop_index("ix_planes_remediacion_descripcion_gin", table_name="planes_remediacion")
    op.drop_index("ix_vulnerabilidads_descripcion_gin", table_name="vulnerabilidads")
    op.drop_index("ix_vulnerabilidads_titulo_gin", table_name="vulnerabilidads")
