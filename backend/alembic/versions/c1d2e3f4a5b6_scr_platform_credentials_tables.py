"""Tablas SCR — tokens GitHub y configuraciones LLM (cifrado en reposo).

Revision ID: c1d2e3f4a5b6
Revises: b7c8d9e0f1a3
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c1d2e3f4a5b6"
down_revision = "b7c8d9e0f1a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "scr_github_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("label", sa.String(length=255), nullable=False),
        sa.Column("platform", sa.String(length=32), server_default=sa.text("'github'"), nullable=False),
        sa.Column("token_secret", sa.String(length=4096), nullable=False),
        sa.Column("token_hint", sa.String(length=16), server_default=sa.text("'****'"), nullable=False),
        sa.Column("user_github", sa.String(length=255), nullable=True),
        sa.Column("org_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("repo_count", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("organizations_list", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("expiration_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_validated", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scr_github_tokens_deleted_at"), "scr_github_tokens", ["deleted_at"])
    op.create_index(op.f("ix_scr_github_tokens_deleted_by"), "scr_github_tokens", ["deleted_by"])
    op.create_index(op.f("ix_scr_github_tokens_user_id"), "scr_github_tokens", ["user_id"])

    op.create_table(
        "scr_llm_configurations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=255), nullable=False),
        sa.Column("api_key_secret", sa.String(length=4096), nullable=False),
        sa.Column("api_key_hint", sa.String(length=16), server_default=sa.text("'****'"), nullable=False),
        sa.Column("temperature", sa.Double(), server_default=sa.text("0.3"), nullable=False),
        sa.Column("max_tokens", sa.Integer(), server_default=sa.text("4096"), nullable=False),
        sa.Column("timeout_seconds", sa.Integer(), server_default=sa.text("300"), nullable=False),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scr_llm_configurations_deleted_at"), "scr_llm_configurations", ["deleted_at"])
    op.create_index(op.f("ix_scr_llm_configurations_deleted_by"), "scr_llm_configurations", ["deleted_by"])
    op.create_index(op.f("ix_scr_llm_configurations_user_id"), "scr_llm_configurations", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_scr_llm_configurations_user_id"), table_name="scr_llm_configurations")
    op.drop_index(op.f("ix_scr_llm_configurations_deleted_by"), table_name="scr_llm_configurations")
    op.drop_index(op.f("ix_scr_llm_configurations_deleted_at"), table_name="scr_llm_configurations")
    op.drop_table("scr_llm_configurations")

    op.drop_index(op.f("ix_scr_github_tokens_user_id"), table_name="scr_github_tokens")
    op.drop_index(op.f("ix_scr_github_tokens_deleted_by"), table_name="scr_github_tokens")
    op.drop_index(op.f("ix_scr_github_tokens_deleted_at"), table_name="scr_github_tokens")
    op.drop_table("scr_github_tokens")
