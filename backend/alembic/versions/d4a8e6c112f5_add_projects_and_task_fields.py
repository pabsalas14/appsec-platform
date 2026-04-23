"""add projects table + task.project_id + task.status

Revision ID: d4a8e6c112f5
Revises: c3e9d7a42b11
Create Date: 2026-04-22 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d4a8e6c112f5"
down_revision: Union[str, None] = "c3e9d7a42b11"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.String(length=32),
            server_default=sa.text("'active'"),
            nullable=False,
        ),
        sa.Column("color", sa.String(length=16), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_projects_user_id"), "projects", ["user_id"], unique=False
    )

    # ─── Task — new columns ──
    op.add_column(
        "tasks",
        sa.Column(
            "status",
            sa.String(length=32),
            server_default=sa.text("'todo'"),
            nullable=False,
        ),
    )
    op.add_column(
        "tasks",
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_tasks_project_id_projects",
        "tasks",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_tasks_project_id"), "tasks", ["project_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_project_id"), table_name="tasks")
    op.drop_constraint("fk_tasks_project_id_projects", "tasks", type_="foreignkey")
    op.drop_column("tasks", "project_id")
    op.drop_column("tasks", "status")

    op.drop_index(op.f("ix_projects_user_id"), table_name="projects")
    op.drop_table("projects")
