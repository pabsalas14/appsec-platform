"""add scr analysis metrics

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-05-01 17:10:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e3f4a5b6c7d8"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("code_security_reviews", sa.Column("started_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("code_security_reviews", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("code_security_reviews", sa.Column("duration_ms", sa.Integer(), nullable=True))
    op.add_column(
        "code_security_reviews",
        sa.Column("total_tokens_used", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "code_security_reviews",
        sa.Column("estimated_cost_usd", sa.Float(), nullable=False, server_default="0"),
    )

    op.create_table(
        "scr_analysis_metrics",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agent", sa.String(length=64), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=True),
        sa.Column("model", sa.String(length=255), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("tokens_used", sa.Integer(), server_default="0", nullable=False),
        sa.Column("estimated_cost_usd", sa.Float(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=32), server_default="success", nullable=False),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("extra", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["review_id"], ["code_security_reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_scr_analysis_metrics_review_id", "scr_analysis_metrics", ["review_id"], unique=False)
    op.create_index("ix_scr_analysis_metrics_user_id", "scr_analysis_metrics", ["user_id"], unique=False)
    op.create_index("ix_scr_analysis_metrics_agent", "scr_analysis_metrics", ["agent"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_scr_analysis_metrics_agent", table_name="scr_analysis_metrics")
    op.drop_index("ix_scr_analysis_metrics_user_id", table_name="scr_analysis_metrics")
    op.drop_index("ix_scr_analysis_metrics_review_id", table_name="scr_analysis_metrics")
    op.drop_table("scr_analysis_metrics")
    op.drop_column("code_security_reviews", "estimated_cost_usd")
    op.drop_column("code_security_reviews", "total_tokens_used")
    op.drop_column("code_security_reviews", "duration_ms")
    op.drop_column("code_security_reviews", "completed_at")
    op.drop_column("code_security_reviews", "started_at")
