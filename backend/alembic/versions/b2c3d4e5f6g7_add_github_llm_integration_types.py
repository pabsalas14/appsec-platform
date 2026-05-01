"""Add GitHub and LLM integration types to herramienta_externas

Revision ID: b2c3d4e5f6g7
Revises: z9y8x7w6v5u4
Create Date: 2026-05-01

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b2c3d4e5f6g7"
down_revision: Union[str, None] = "z9y8x7w6v5u4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade: Add GitHub and LLM to allowed herramienta_externas types."""
    # Drop the old constraint
    op.execute(
        "ALTER TABLE herramienta_externas DROP CONSTRAINT IF EXISTS chk_herramienta_externa_tipo_valido"
    )

    # Add the new constraint with GitHub and LLM types
    op.execute(
        """
        ALTER TABLE herramienta_externas
        ADD CONSTRAINT chk_herramienta_externa_tipo_valido
        CHECK (tipo IN ('SAST', 'DAST', 'SCA', 'TM', 'MAST', 'Terceros', 'CI/CD', 'BugBounty', 'VulnerabilityManager', 'GitHub', 'LLM'))
        """
    )


def downgrade() -> None:
    """Downgrade: Remove GitHub and LLM types."""
    # Drop the new constraint
    op.execute(
        "ALTER TABLE herramienta_externas DROP CONSTRAINT IF EXISTS chk_herramienta_externa_tipo_valido"
    )

    # Restore the old constraint
    op.execute(
        """
        ALTER TABLE herramienta_externas
        ADD CONSTRAINT chk_herramienta_externa_tipo_valido
        CHECK (tipo IN ('SAST', 'DAST', 'SCA', 'TM', 'MAST', 'Terceros', 'CI/CD', 'BugBounty', 'VulnerabilityManager'))
        """
    )
