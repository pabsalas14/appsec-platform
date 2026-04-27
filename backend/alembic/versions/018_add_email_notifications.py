"""Add email notification tables (S18).

Revision ID: 018_email_notifications
Revises: <previous_revision>
Create Date: 2026-04-26 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "018_email_notifications"
down_revision = None  # Change to actual previous revision
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create email_templates and email_logs tables."""
    # Create email_templates table
    op.create_table(
        "email_templates",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(100), nullable=False),
        sa.Column("asunto", sa.String(255), nullable=False),
        sa.Column("cuerpo_html", sa.Text(), nullable=False),
        sa.Column("variables", postgresql.JSONB(), nullable=True),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), server_default=sa.text("true"), nullable=False),
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
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nombre", name="uq_email_templates_nombre"),
    )
    op.create_index("ix_email_templates_nombre", "email_templates", ["nombre"], unique=False)

    # Create email_logs table
    op.create_table(
        "email_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notificacion_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("email_template_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("destinatario", sa.String(255), nullable=False),
        sa.Column("asunto", sa.String(255), nullable=False),
        sa.Column(
            "estado",
            sa.Enum("pendiente", "enviado", "fallido", name="email_log_estado"),
            server_default=sa.text("'pendiente'"),
            nullable=False,
        ),
        sa.Column("reintentos", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("error_mensaje", sa.Text(), nullable=True),
        sa.Column("ultimo_intento_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("enviado_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["email_template_id"], ["email_templates.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["notificacion_id"], ["notificacions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_email_logs_user_id", "email_logs", ["user_id"], unique=False)
    op.create_index("ix_email_logs_notificacion_id", "email_logs", ["notificacion_id"], unique=False)
    op.create_index("ix_email_logs_destinatario", "email_logs", ["destinatario"], unique=False)
    op.create_index("ix_email_logs_estado", "email_logs", ["estado"], unique=False)


def downgrade() -> None:
    """Drop email notification tables."""
    op.drop_index("ix_email_logs_estado", table_name="email_logs")
    op.drop_index("ix_email_logs_destinatario", table_name="email_logs")
    op.drop_index("ix_email_logs_notificacion_id", table_name="email_logs")
    op.drop_index("ix_email_logs_user_id", table_name="email_logs")
    op.drop_table("email_logs")

    # Drop enum type
    op.execute("DROP TYPE email_log_estado")

    op.drop_index("ix_email_templates_nombre", table_name="email_templates")
    op.drop_table("email_templates")
