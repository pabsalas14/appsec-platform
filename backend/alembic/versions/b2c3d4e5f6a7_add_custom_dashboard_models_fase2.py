"""Add CustomDashboard, CustomDashboardAccess, DashboardConfig (Fase 2)

Revision ID: b2c3d4e5f6a7
Revises: b2c3d4e5f6a8
Create Date: 2026-04-25 16:30:00.000000
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a7"
down_revision = "b2c3d4e5f6a8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create custom_dashboards table
    op.create_table(
        "custom_dashboards",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("descripcion", sa.String(length=1000), nullable=True),
        sa.Column("layout_json", postgresql.JSON(), nullable=False),
        sa.Column("is_system", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_template", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("icono", sa.String(length=64), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_custom_dashboards_created_by"), "custom_dashboards", ["created_by"], unique=False)

    # Create custom_dashboard_access table
    op.create_table(
        "custom_dashboard_access",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dashboard_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("puede_ver", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("puede_editar", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("puede_compartir", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["dashboard_id"], ["custom_dashboards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_custom_dashboard_access_dashboard_id"), "custom_dashboard_access", ["dashboard_id"], unique=False)
    op.create_index(op.f("ix_custom_dashboard_access_role_id"), "custom_dashboard_access", ["role_id"], unique=False)
    op.create_index(op.f("ix_custom_dashboard_access_user_id"), "custom_dashboard_access", ["user_id"], unique=False)

    # Create dashboard_config table
    op.create_table(
        "dashboard_config",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("dashboard_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("widget_id", sa.String(length=255), nullable=False),
        sa.Column("role_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visible", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("editable_by_role", sa.Boolean(), nullable=False, server_default="false"),
        sa.ForeignKeyConstraint(["dashboard_id"], ["custom_dashboards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_dashboard_config_dashboard_id"), "dashboard_config", ["dashboard_id"], unique=False)
    op.create_index(op.f("ix_dashboard_config_role_id"), "dashboard_config", ["role_id"], unique=False)
    op.create_index(op.f("ix_dashboard_config_widget_id"), "dashboard_config", ["widget_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_dashboard_config_widget_id"), table_name="dashboard_config")
    op.drop_index(op.f("ix_dashboard_config_role_id"), table_name="dashboard_config")
    op.drop_index(op.f("ix_dashboard_config_dashboard_id"), table_name="dashboard_config")
    op.drop_table("dashboard_config")

    op.drop_index(op.f("ix_custom_dashboard_access_user_id"), table_name="custom_dashboard_access")
    op.drop_index(op.f("ix_custom_dashboard_access_role_id"), table_name="custom_dashboard_access")
    op.drop_index(op.f("ix_custom_dashboard_access_dashboard_id"), table_name="custom_dashboard_access")
    op.drop_table("custom_dashboard_access")

    op.drop_index(op.f("ix_custom_dashboards_created_by"), table_name="custom_dashboards")
    op.drop_table("custom_dashboards")
