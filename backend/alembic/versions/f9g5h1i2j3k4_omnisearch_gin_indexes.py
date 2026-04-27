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
    # Vulnerabilidades
    op.create_index(
        "ix_vulnerabilidads_titulo_gin",
        "vulnerabilidads",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_vulnerabilidads_descripcion_gin",
        "vulnerabilidads",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Planes de Remediación
    op.create_index(
        "ix_planes_remediacion_descripcion_gin",
        "planes_remediacion",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_planes_remediacion_acciones_gin",
        "planes_remediacion",
        ["acciones_recomendadas"],
        postgresql_using="gin",
        postgresql_ops={"acciones_recomendadas": "gin_trgm_ops"},
    )

    # Temas Emergentes
    op.create_index(
        "ix_temas_emergentes_titulo_gin",
        "temas_emergentes",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_temas_emergentes_descripcion_gin",
        "temas_emergentes",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Iniciativas
    op.create_index(
        "ix_iniciativas_titulo_gin",
        "iniciativas",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_iniciativas_descripcion_gin",
        "iniciativas",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Hallazgos SAST
    op.create_index(
        "ix_hallazgo_sasts_titulo_gin",
        "hallazgo_sasts",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_hallazgo_sasts_descripcion_gin",
        "hallazgo_sasts",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Hallazgos DAST
    op.create_index(
        "ix_hallazgo_dasts_titulo_gin",
        "hallazgo_dasts",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_hallazgo_dasts_descripcion_gin",
        "hallazgo_dasts",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Hallazgos MAST
    op.create_index(
        "ix_hallazgo_masts_titulo_gin",
        "hallazgo_masts",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_hallazgo_masts_descripcion_gin",
        "hallazgo_masts",
        ["descripcion"],
        postgresql_using="gin",
        postgresql_ops={"descripcion": "gin_trgm_ops"},
    )

    # Controles de Seguridad
    op.create_index(
        "ix_control_seguridads_nombre_gin",
        "control_seguridads",
        ["nombre"],
        postgresql_using="gin",
        postgresql_ops={"nombre": "gin_trgm_ops"},
    )

    # Auditorías
    op.create_index(
        "ix_auditorias_titulo_gin",
        "auditorias",
        ["titulo"],
        postgresql_using="gin",
        postgresql_ops={"titulo": "gin_trgm_ops"},
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
