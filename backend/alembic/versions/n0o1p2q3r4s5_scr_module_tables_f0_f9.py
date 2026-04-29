"""SCR Code Security Review — tablas módulo (fases 0–9 consolidadas).

Revision ID: n0o1p2q3r4s5
Revises: m1n2o3p4q5r6
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "n0o1p2q3r4s5"
down_revision = "m1n2o3p4q5r6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "code_security_scan_batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("github_org_slug", sa.String(length=255), nullable=True),
        sa.Column("estado", sa.String(length=64), server_default="PENDING", nullable=False),
        sa.Column("notas", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_code_security_scan_batches_deleted_at"), "code_security_scan_batches", ["deleted_at"])
    op.create_index(op.f("ix_code_security_scan_batches_deleted_by"), "code_security_scan_batches", ["deleted_by"])
    op.create_index(op.f("ix_code_security_scan_batches_github_org_slug"), "code_security_scan_batches", ["github_org_slug"])
    op.create_index(op.f("ix_code_security_scan_batches_user_id"), "code_security_scan_batches", ["user_id"])

    op.create_table(
        "code_security_reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titulo", sa.String(length=255), nullable=False),
        sa.Column("estado", sa.String(length=64), server_default="PENDING", nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("progreso", sa.Integer(), server_default="0", nullable=False),
        sa.Column("rama_analizar", sa.String(length=255), nullable=False),
        sa.Column("url_repositorio", sa.Text(), nullable=True),
        sa.Column("scan_mode", sa.String(length=64), nullable=False),
        sa.Column("repositorio_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("github_org_slug", sa.String(length=255), nullable=True),
        sa.Column("scan_batch_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["repositorio_id"], ["repositorios.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["scan_batch_id"], ["code_security_scan_batches.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_code_security_reviews_deleted_at"), "code_security_reviews", ["deleted_at"])
    op.create_index(op.f("ix_code_security_reviews_deleted_by"), "code_security_reviews", ["deleted_by"])
    op.create_index(op.f("ix_code_security_reviews_estado"), "code_security_reviews", ["estado"])
    op.create_index(op.f("ix_code_security_reviews_repositorio_id"), "code_security_reviews", ["repositorio_id"])
    op.create_index(op.f("ix_code_security_reviews_scan_batch_id"), "code_security_reviews", ["scan_batch_id"])
    op.create_index(op.f("ix_code_security_reviews_user_id"), "code_security_reviews", ["user_id"])

    op.create_table(
        "code_security_findings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fingerprint", sa.String(length=128), nullable=False),
        sa.Column("archivo", sa.String(length=1024), nullable=False),
        sa.Column("linea_inicio", sa.Integer(), nullable=False),
        sa.Column("linea_fin", sa.Integer(), nullable=False),
        sa.Column("tipo_malicia", sa.String(length=128), nullable=False),
        sa.Column("severidad", sa.String(length=32), nullable=False),
        sa.Column("confianza", sa.Float(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=False),
        sa.Column("codigo_snippet", sa.Text(), nullable=True),
        sa.Column("impacto", sa.Text(), nullable=True),
        sa.Column("explotabilidad", sa.Text(), nullable=True),
        sa.Column("remediacion_sugerida", sa.Text(), nullable=True),
        sa.Column("estado", sa.String(length=64), server_default="DETECTED", nullable=False),
        sa.Column("asignado_a_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["asignado_a_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["review_id"], ["code_security_reviews.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("review_id", "fingerprint", name="uq_scr_finding_review_fingerprint"),
    )
    op.create_index(op.f("ix_code_security_findings_deleted_at"), "code_security_findings", ["deleted_at"])
    op.create_index(op.f("ix_code_security_findings_deleted_by"), "code_security_findings", ["deleted_by"])
    op.create_index(op.f("ix_code_security_findings_review_id"), "code_security_findings", ["review_id"])
    op.create_index(op.f("ix_code_security_findings_severidad"), "code_security_findings", ["severidad"])
    op.create_index(op.f("ix_code_security_findings_user_id"), "code_security_findings", ["user_id"])
    op.create_index(op.f("ix_code_security_findings_asignado_a_id"), "code_security_findings", ["asignado_a_id"])

    op.create_table(
        "code_security_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_ts", sa.DateTime(timezone=True), nullable=False),
        sa.Column("commit_hash", sa.String(length=64), nullable=False),
        sa.Column("autor", sa.String(length=512), nullable=False),
        sa.Column("archivo", sa.String(length=1024), nullable=False),
        sa.Column("accion", sa.String(length=32), nullable=False),
        sa.Column("mensaje_commit", sa.Text(), nullable=True),
        sa.Column("nivel_riesgo", sa.String(length=32), nullable=False),
        sa.Column(
            "indicadores",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["review_id"], ["code_security_reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_code_security_events_event_ts"), "code_security_events", ["event_ts"])
    op.create_index(op.f("ix_code_security_events_review_id"), "code_security_events", ["review_id"])

    op.create_table(
        "code_security_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resumen_ejecutivo", sa.Text(), nullable=False),
        sa.Column(
            "desglose_severidad",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("narrativa_evolucion", sa.Text(), nullable=True),
        sa.Column(
            "pasos_remediacion",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
        sa.Column("puntuacion_riesgo_global", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["deleted_by"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["review_id"], ["code_security_reviews.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("review_id"),
    )
    op.create_index(op.f("ix_code_security_reports_deleted_at"), "code_security_reports", ["deleted_at"])
    op.create_index(op.f("ix_code_security_reports_deleted_by"), "code_security_reports", ["deleted_by"])
    op.create_index(op.f("ix_code_security_reports_review_id"), "code_security_reports", ["review_id"])

    op.create_table(
        "code_security_finding_histories",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("finding_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("accion", sa.String(length=128), nullable=False),
        sa.Column("detalle", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["finding_id"], ["code_security_findings.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["usuario_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_code_security_finding_histories_finding_id"), "code_security_finding_histories", ["finding_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_code_security_finding_histories_finding_id"), table_name="code_security_finding_histories")
    op.drop_table("code_security_finding_histories")
    op.drop_index(op.f("ix_code_security_reports_deleted_by"), table_name="code_security_reports")
    op.drop_index(op.f("ix_code_security_reports_deleted_at"), table_name="code_security_reports")
    op.drop_index(op.f("ix_code_security_reports_review_id"), table_name="code_security_reports")
    op.drop_table("code_security_reports")
    op.drop_index(op.f("ix_code_security_events_review_id"), table_name="code_security_events")
    op.drop_index(op.f("ix_code_security_events_event_ts"), table_name="code_security_events")
    op.drop_table("code_security_events")
    op.drop_index(op.f("ix_code_security_findings_asignado_a_id"), table_name="code_security_findings")
    op.drop_index(op.f("ix_code_security_findings_user_id"), table_name="code_security_findings")
    op.drop_index(op.f("ix_code_security_findings_severidad"), table_name="code_security_findings")
    op.drop_index(op.f("ix_code_security_findings_review_id"), table_name="code_security_findings")
    op.drop_index(op.f("ix_code_security_findings_deleted_by"), table_name="code_security_findings")
    op.drop_index(op.f("ix_code_security_findings_deleted_at"), table_name="code_security_findings")
    op.drop_table("code_security_findings")
    op.drop_index(op.f("ix_code_security_reviews_user_id"), table_name="code_security_reviews")
    op.drop_index(op.f("ix_code_security_reviews_scan_batch_id"), table_name="code_security_reviews")
    op.drop_index(op.f("ix_code_security_reviews_repositorio_id"), table_name="code_security_reviews")
    op.drop_index(op.f("ix_code_security_reviews_estado"), table_name="code_security_reviews")
    op.drop_index(op.f("ix_code_security_reviews_deleted_by"), table_name="code_security_reviews")
    op.drop_index(op.f("ix_code_security_reviews_deleted_at"), table_name="code_security_reviews")
    op.drop_table("code_security_reviews")
    op.drop_index(op.f("ix_code_security_scan_batches_user_id"), table_name="code_security_scan_batches")
    op.drop_index(op.f("ix_code_security_scan_batches_github_org_slug"), table_name="code_security_scan_batches")
    op.drop_index(op.f("ix_code_security_scan_batches_deleted_by"), table_name="code_security_scan_batches")
    op.drop_index(op.f("ix_code_security_scan_batches_deleted_at"), table_name="code_security_scan_batches")
    op.drop_table("code_security_scan_batches")
