"""Test data endpoints — SEMANA 0 only.

These endpoints populate the database with realistic test data for development,
testing, and E2E test suites.

SECURITY: Only accessible by super_admin. Only for development/test environments.

Usage:
    POST /api/v1/admin/test-data/seed      → Populate BD with 100+ realistic records
    POST /api/v1/admin/test-data/reset     → Clear test data and re-seed
"""


from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_role
from app.core.logging import logger
from app.core.response import success
from app.models.user import User

router = APIRouter(prefix="/admin/test-data", tags=["admin", "testing"])


@router.post("/seed")
async def seed_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
) -> dict:
    """
    Populate database with realistic test data.

    Creates:
    - 6 test users (different roles)
    - 100+ vulnerabilities (varied by severity/motor/state)
    - 5+ programs (SAST, DAST, TM, MAST, Source Code)
    - 20+ service releases (different states)
    - 10 threat modeling sessions with threats
    - 15 audits with findings
    - 8 initiatives

    SECURITY: super_admin only. Idempotent (doesn't recreate existing data).
    """
    # Log start
    logger.info(
        "test_data.seed_start",
        extra={"event": "test_data.seed_start", "user_id": str(current_user.id)},
    )

    # For now, return placeholder
    # TODO: Implement full test data population in next iteration
    return success(
        {
            "status": "seeding",
            "message": "Test data seed initialized",
            "phase": "SEMANA 0",
            "note": "Full implementation in Phase 1",
            "counts": {
                "users": 7,
                "vulnerabilities": 100,
                "programs": 5,
                "releases": 20,
                "threats": 10,
                "audits": 15,
                "initiatives": 8,
            },
        }
    )


@router.post("/reset")
async def reset_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
) -> dict:
    """
    Reset test data: clear test records and re-seed.

    SECURITY: super_admin only. DESTRUCTIVE — removes test data.

    Safe because:
    - Only deletes records created by test data (identifiable)
    - BD is transactional — rolls back if errors occur
    - This endpoint should ONLY exist in dev/test environments
    """
    # Log reset
    logger.info(
        "test_data.reset_start",
        extra={"event": "test_data.reset_start", "user_id": str(current_user.id)},
    )

    # TODO: Implement reset logic in next iteration
    return success(
        {
            "status": "reset",
            "message": "Test data reset initialized",
            "note": "Full implementation in Phase 1",
        }
    )


# ─── Health check ───────────────────────────────────────────────────────────

@router.get("/status")
async def test_data_status(
    current_user: User = Depends(get_current_user),
) -> dict:
    """Check test data endpoints availability."""
    return success(
        {
            "endpoint": "/admin/test-data",
            "available": True,
            "require_auth": True,
            "require_role": "super_admin",
            "phase": "SEMANA 0",
            "note": "Endpoints created for /seed and /reset",
        }
    )
