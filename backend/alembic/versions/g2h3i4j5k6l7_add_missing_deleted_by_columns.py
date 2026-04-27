"""Add missing deleted_by columns for SoftDeleteMixin parity.

Some tables were created earlier with `deleted_at` but without `deleted_by`.
Alembic tracks revisions, so updating old migrations does not fix existing DBs.
This migration repairs running environments by adding the missing column + FK.

Revision ID: g2h3i4j5k6l7
Revises: f1c79cb2f259
Create Date: 2026-04-26
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "g2h3i4j5k6l7"
down_revision: Union[str, None] = "f1c79cb2f259"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TABLES: tuple[str, ...] = (
    "direccions",
    "custom_field_values",
    "actividad_mensual_dasts",
    "actividad_mensual_source_codes",
    "actividad_mensual_servicios_regulados",
)


def _add_deleted_by(table: str) -> None:
    # UUID type name is accepted by Postgres and matches SQLAlchemy UUID(as_uuid=True).
    op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS deleted_by UUID")
    op.execute(f"CREATE INDEX IF NOT EXISTS ix_{table}_deleted_by ON {table} (deleted_by)")
    op.execute(
        f"""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '{table}_deleted_by_fkey'
  ) THEN
    ALTER TABLE {table}
      ADD CONSTRAINT {table}_deleted_by_fkey
      FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
"""
    )


def _drop_deleted_by(table: str) -> None:
    op.execute(
        f"""
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = '{table}_deleted_by_fkey'
  ) THEN
    ALTER TABLE {table} DROP CONSTRAINT {table}_deleted_by_fkey;
  END IF;
END $$;
"""
    )
    op.execute(f"DROP INDEX IF EXISTS ix_{table}_deleted_by")
    op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS deleted_by")


def upgrade() -> None:
    for table in _TABLES:
        _add_deleted_by(table)


def downgrade() -> None:
    for table in _TABLES:
        _drop_deleted_by(table)
