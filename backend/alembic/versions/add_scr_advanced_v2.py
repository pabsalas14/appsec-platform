"""add SCR advanced features - false positives, risk scoring, incremental

Revision ID: add_scr_advanced_v2
Revises: cce2f52e83ed
Create Date: 2026-05-01 06:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "add_scr_advanced_v2"
down_revision: Union[str, None] = "cce2f52e83ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add incremental analysis columns to code_security_reviews
    op.add_column("code_security_reviews", sa.Column("last_analyzed_commit", sa.String(length=64), nullable=True))
    op.add_column("code_security_reviews", sa.Column("last_analyzed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "code_security_reviews",
        sa.Column("analysis_version", sa.Integer(), server_default=sa.text("1"), nullable=False),
    )

    # Create code_security_false_positives table
    op.create_table(
        "code_security_false_positives",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("review_id", sa.UUID(), nullable=False),
        sa.Column("finding_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("pattern_type", sa.String(length=128), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["review_id"], ["code_security_reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["finding_id"], ["code_security_findings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_code_security_false_positives_review_id"), "code_security_false_positives", ["review_id"])
    op.create_index(
        op.f("ix_code_security_false_positives_finding_id"), "code_security_false_positives", ["finding_id"]
    )
    op.create_index(op.f("ix_code_security_false_positives_user_id"), "code_security_false_positives", ["user_id"])

    # Create risk_scoring_configs table
    op.create_table(
        "risk_scoring_configs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("nombre_config", sa.String(length=256), nullable=False),
        sa.Column(
            "patron_peso",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("weight_hidden_commits", sa.Integer(), server_default=sa.text("10"), nullable=False),
        sa.Column("weight_timing_anomalies", sa.Integer(), server_default=sa.text("15"), nullable=False),
        sa.Column("weight_critical_files", sa.Integer(), server_default=sa.text("20"), nullable=False),
        sa.Column("weight_mass_changes", sa.Integer(), server_default=sa.text("15"), nullable=False),
        sa.Column("weight_author_anomalies", sa.Integer(), server_default=sa.text("15"), nullable=False),
        sa.Column("weight_rapid_succession", sa.Integer(), server_default=sa.text("10"), nullable=False),
        sa.Column("weight_force_push", sa.Integer(), server_default=sa.text("25"), nullable=False),
        sa.Column("weight_dependency_changes", sa.Integer(), server_default=sa.text("20"), nullable=False),
        sa.Column("weight_external_merges", sa.Integer(), server_default=sa.text("15"), nullable=False),
        sa.Column("activa", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_risk_scoring_configs_user_id"), "risk_scoring_configs", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_risk_scoring_configs_user_id"), table_name="risk_scoring_configs")
    op.drop_table("risk_scoring_configs")
    op.drop_index(op.f("ix_code_security_false_positives_user_id"), table_name="code_security_false_positives")
    op.drop_index(op.f("ix_code_security_false_positives_finding_id"), table_name="code_security_false_positives")
    op.drop_index(op.f("ix_code_security_false_positives_review_id"), table_name="code_security_false_positives")
    op.drop_table("code_security_false_positives")
    op.drop_column("code_security_reviews", "analysis_version")
    op.drop_column("code_security_reviews", "last_analyzed_at")
    op.drop_column("code_security_reviews", "last_analyzed_commit")
