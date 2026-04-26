"""repositorio por organizacion y responsable por repo

Revision ID: b7c8d9e0f1a2
Revises: u5v6w7x8y9z0
Create Date: 2026-04-26 13:20:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "b7c8d9e0f1a2"
down_revision = "u5v6w7x8y9z0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "repositorios",
        sa.Column("organizacion_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "repositorios",
        sa.Column("subdireccion_responsable_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("repositorios", sa.Column("responsable_nombre", sa.String(length=255), nullable=True))
    op.add_column("repositorios", sa.Column("responsable_contacto", sa.String(length=255), nullable=True))

    op.create_index(op.f("ix_repositorios_organizacion_id"), "repositorios", ["organizacion_id"], unique=False)
    op.create_index(
        op.f("ix_repositorios_subdireccion_responsable_id"),
        "repositorios",
        ["subdireccion_responsable_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_repositorios_organizacion_id_organizacions",
        "repositorios",
        "organizacions",
        ["organizacion_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_foreign_key(
        "fk_repositorios_subdireccion_responsable_id_subdireccions",
        "repositorios",
        "subdireccions",
        ["subdireccion_responsable_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.execute(
        """
        UPDATE repositorios r
        SET organizacion_id = c.organizacion_id
        FROM celulas c
        WHERE r.celula_id = c.id
        """
    )
    op.alter_column("repositorios", "organizacion_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.alter_column("repositorios", "celula_id", existing_type=postgresql.UUID(as_uuid=True), nullable=True)


def downgrade() -> None:
    op.alter_column("repositorios", "celula_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)
    op.drop_constraint("fk_repositorios_subdireccion_responsable_id_subdireccions", "repositorios", type_="foreignkey")
    op.drop_constraint("fk_repositorios_organizacion_id_organizacions", "repositorios", type_="foreignkey")
    op.drop_index(op.f("ix_repositorios_subdireccion_responsable_id"), table_name="repositorios")
    op.drop_index(op.f("ix_repositorios_organizacion_id"), table_name="repositorios")
    op.drop_column("repositorios", "responsable_contacto")
    op.drop_column("repositorios", "responsable_nombre")
    op.drop_column("repositorios", "subdireccion_responsable_id")
    op.drop_column("repositorios", "organizacion_id")
