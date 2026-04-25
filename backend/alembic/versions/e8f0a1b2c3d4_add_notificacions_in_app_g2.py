"""add notificacions in-app (G2)

Revision ID: e8f0a1b2c3d4
Revises: c5d9a4f2b7e1
Create Date: 2026-04-25

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e8f0a1b2c3d4"
down_revision: Union[str, None] = "c5d9a4f2b7e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notificacions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("cuerpo", sa.Text(), nullable=True),
        sa.Column("leida", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notificacions_user_id"), "notificacions", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_notificacions_user_id"), table_name="notificacions")
    op.drop_table("notificacions")
