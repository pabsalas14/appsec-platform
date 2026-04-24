"""BRD §3.1: Subdirección → Gerencia → Organización (plataforma) → Célula.

Revision ID: f3a9c1d2e8b0
Revises: 539cb3a12276
Create Date: 2026-04-24 12:00:00.000000

- Organización (GitHub/Atlassian) cuelga de Gerencia; deja de ser padre de Subdirección.
- Célula referencia solo organizacion_id (cadena completa vía org → gerencia → subdirección).
- Migra datos: una fila organizacions nueva por gerencia, copiando metadatos del org legado
  de la subdirección; reasigna celulas; elimina organizaciones padre sin gerencia_id.
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


revision: str = "f3a9c1d2e8b0"
down_revision: Union[str, None] = "539cb3a12276"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizacions",
        sa.Column("gerencia_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "organizacions",
        sa.Column("plataforma", sa.String(length=100), nullable=True),
    )
    op.add_column(
        "organizacions",
        sa.Column("url_base", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "organizacions",
        sa.Column("responsable", sa.String(length=255), nullable=True),
    )
    op.create_index(
        op.f("ix_organizacions_gerencia_id"),
        "organizacions",
        ["gerencia_id"],
        unique=False,
    )
    op.create_foreign_key(
        "organizacions_gerencia_id_fkey",
        "organizacions",
        "gerencias",
        ["gerencia_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    op.add_column(
        "subdireccions",
        sa.Column("director_nombre", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "subdireccions",
        sa.Column("director_contacto", sa.String(length=255), nullable=True),
    )

    op.add_column(
        "celulas",
        sa.Column("organizacion_id", sa.UUID(), nullable=True),
    )
    op.create_index(
        op.f("ix_celulas_organizacion_id"),
        "celulas",
        ["organizacion_id"],
        unique=False,
    )

    conn = op.get_bind()
    conn.execute(
        text(
            """
            INSERT INTO organizacions (
                id, user_id, nombre, codigo, descripcion,
                created_at, updated_at, deleted_at, deleted_by,
                gerencia_id, plataforma, url_base, responsable
            )
            SELECT
                gen_random_uuid(),
                g.user_id,
                LEFT(o.nombre || ' / ' || g.nombre, 255),
                LEFT(
                    COALESCE(o.codigo, 'ORG') || '-'
                    || SUBSTRING(REPLACE(CAST(g.id AS text), '-', '') FROM 1 FOR 12),
                    255
                ),
                o.descripcion,
                NOW(),
                NOW(),
                o.deleted_at,
                o.deleted_by,
                g.id,
                'GitHub',
                NULL,
                NULL
            FROM gerencias g
            INNER JOIN subdireccions s ON s.id = g.subdireccion_id
            INNER JOIN organizacions o ON o.id = s.organizacion_id
            """
        )
    )

    conn.execute(
        text(
            """
            UPDATE celulas c
            SET organizacion_id = o.id
            FROM organizacions o
            WHERE o.gerencia_id = c.gerencia_id
              AND c.gerencia_id IS NOT NULL
            """
        )
    )

    op.drop_constraint("subdireccions_organizacion_id_fkey", "subdireccions", type_="foreignkey")
    op.drop_index(op.f("ix_subdireccions_organizacion_id"), table_name="subdireccions")
    op.drop_column("subdireccions", "organizacion_id")

    conn.execute(text("DELETE FROM organizacions WHERE gerencia_id IS NULL"))

    op.alter_column("organizacions", "gerencia_id", nullable=False)

    conn.execute(text("UPDATE organizacions SET plataforma = 'GitHub' WHERE plataforma IS NULL"))
    op.alter_column(
        "organizacions",
        "plataforma",
        nullable=False,
        server_default=sa.text("'GitHub'"),
    )

    op.create_foreign_key(
        "celulas_organizacion_id_fkey",
        "celulas",
        "organizacions",
        ["organizacion_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.alter_column("celulas", "organizacion_id", nullable=False)

    op.drop_constraint("celulas_subdireccion_id_fkey", "celulas", type_="foreignkey")
    op.drop_constraint("celulas_gerencia_id_fkey", "celulas", type_="foreignkey")
    op.drop_index(op.f("ix_celulas_subdireccion_id"), table_name="celulas")
    op.drop_index(op.f("ix_celulas_gerencia_id"), table_name="celulas")
    op.drop_column("celulas", "subdireccion_id")
    op.drop_column("celulas", "gerencia_id")


def downgrade() -> None:
    raise NotImplementedError(
        "Reversión no soportada: los organizacions padre legados fueron eliminados. "
        "Restaurar desde backup o recrear datos manualmente."
    )
