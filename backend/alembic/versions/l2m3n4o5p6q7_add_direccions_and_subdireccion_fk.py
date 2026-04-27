"""Add direccions and optional subdireccions.direccion_id

Revision ID: l2m3n4o5p6q7
Revises: k1j2h3g4f5d6
Create Date: 2026-04-26 08:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "l2m3n4o5p6q7"
down_revision = "k1j2h3g4f5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "direccions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("codigo", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_direccions_user_id"), "direccions", ["user_id"], unique=False)
    op.create_index(op.f("ix_direccions_deleted_at"), "direccions", ["deleted_at"], unique=False)
    op.create_index(op.f("ix_direccions_deleted_by"), "direccions", ["deleted_by"], unique=False)

    op.add_column("subdireccions", sa.Column("direccion_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_index(op.f("ix_subdireccions_direccion_id"), "subdireccions", ["direccion_id"], unique=False)
    op.create_foreign_key(
        "fk_subdireccions_direccion_id_direccions",
        "subdireccions",
        "direccions",
        ["direccion_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_subdireccions_direccion_id_direccions", "subdireccions", type_="foreignkey")
    op.drop_index(op.f("ix_subdireccions_direccion_id"), table_name="subdireccions")
    op.drop_column("subdireccions", "direccion_id")

    op.drop_index(op.f("ix_direccions_deleted_at"), table_name="direccions")
    op.drop_index(op.f("ix_direccions_deleted_by"), table_name="direccions")
    op.drop_index(op.f("ix_direccions_user_id"), table_name="direccions")
    op.drop_table("direccions")
