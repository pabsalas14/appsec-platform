"""harden refresh token sessions

Revision ID: 9c8d7e6f5a4b
Revises: f1a3b28c09d4
Create Date: 2026-04-21 18:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "9c8d7e6f5a4b"
down_revision: Union[str, None] = "f1a3b28c09d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "refresh_tokens",
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "refresh_tokens",
        sa.Column("parent_token_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "refresh_tokens",
        sa.Column("session_revoked_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.execute("UPDATE refresh_tokens SET family_id = id WHERE family_id IS NULL")
    op.alter_column("refresh_tokens", "family_id", nullable=False)

    op.create_index(
        op.f("ix_refresh_tokens_family_id"),
        "refresh_tokens",
        ["family_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_refresh_tokens_parent_token_id"),
        "refresh_tokens",
        ["parent_token_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_refresh_tokens_parent_token_id",
        "refresh_tokens",
        "refresh_tokens",
        ["parent_token_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_refresh_tokens_parent_token_id",
        "refresh_tokens",
        type_="foreignkey",
    )
    op.drop_index(
        op.f("ix_refresh_tokens_parent_token_id"),
        table_name="refresh_tokens",
    )
    op.drop_index(
        op.f("ix_refresh_tokens_family_id"),
        table_name="refresh_tokens",
    )
    op.drop_column("refresh_tokens", "session_revoked_at")
    op.drop_column("refresh_tokens", "parent_token_id")
    op.drop_column("refresh_tokens", "family_id")
