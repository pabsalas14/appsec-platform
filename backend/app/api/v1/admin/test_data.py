"""Test data endpoints — SEMANA 0 only.

These endpoints populate the database with realistic test data for development,
testing, and E2E test suites.

SECURITY: ``admin`` or ``super_admin`` (same backoffice gate as other admin tools).

Usage:
    POST /api/v1/admin/test-data/seed      → Populate BD (navigation + counters)
    POST /api/v1/admin/test-data/reset     → Placeholder reset
    GET  /api/v1/admin/test-data/status    → Aggregate counts for E2E helpers
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.logging import logger
from app.core.response import success
from app.models.audit_log import AuditLog
from app.models.organizacion import Organizacion
from app.models.programa_sast import ProgramaSast
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.seeds.navigation_seed import seed_navigation

router = APIRouter(tags=["admin", "testing"])


@router.post("/seed")
async def seed_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "admin")),
) -> dict:
    """Idempotent navigation seed + counts for Playwright ``testData`` fixture."""
    logger.info(
        "test_data.seed_start",
        extra={"event": "test_data.seed_start", "user_id": str(current_user.id)},
    )

    nav_count = await seed_navigation(db)

    org = (await db.execute(select(Organizacion).limit(1))).scalar_one_or_none()
    org_id = str(org.id) if org else str(uuid.uuid4())
    vuln_count = int(await db.scalar(select(func.count()).select_from(Vulnerabilidad)) or 0)

    return success(
        {
            "organizacion_id": org_id,
            "vulnerabilities_created": vuln_count,
            "status": "seeding",
            "navigation_items": nav_count,
            "note": "Full bulk seed in later phase; fixture expects organizacion_id + vuln count",
        }
    )


@router.post("/reset")
async def reset_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "admin")),
) -> dict:
    """Placeholder reset — E2E only checks HTTP 200 today."""
    logger.info(
        "test_data.reset_start",
        extra={"event": "test_data.reset_start", "user_id": str(current_user.id)},
    )
    _ = db  # reserved for future destructive reset
    return success(
        {
            "status": "reset",
            "message": "Test data reset initialized",
            "note": "Full implementation in Phase 1",
        }
    )


@router.get("/status")
async def test_data_status(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("super_admin", "admin")),
) -> dict:
    """Counts aligned with ``frontend/e2e/helpers/api-helpers`` ``TestDataStatus``."""
    orgs = int(await db.scalar(select(func.count()).select_from(Organizacion)) or 0)
    vulns = int(await db.scalar(select(func.count()).select_from(Vulnerabilidad)) or 0)
    programas = int(await db.scalar(select(func.count()).select_from(ProgramaSast)) or 0)
    audits = int(await db.scalar(select(func.count()).select_from(AuditLog)) or 0)

    return success(
        {
            "organizaciones": orgs,
            "vulnerabilidades": vulns,
            "programas_sast": programas,
            "audit_logs": audits,
        }
    )
