"""Seed masivo para Code Security Reviews - datos de prueba"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, UTC
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.core.logging import configure_logging, logger
from app.core.security import hash_password
from app.database import async_session
from app.orm_bootstrap import import_all_orm

import_all_orm()

from app.models.user import User
from app.models.code_security_review import CodeSecurityReview
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_report import CodeSecurityReport

configure_logging(settings)

REPOS = ["api-core", "auth-service", "payment-system", "user-service", "notification-engine",
         "analytics-pipeline", "dashboard-ui", "mobile-app", "web-portal", "admin-panel"]

RISK_TYPES = ["SQL_INJECTION", "XSS", "CSRF", "HARDCODED_SECRET", "AUTH_BYPASS"]
SEVERITIES = ["BAJO", "MEDIO", "ALTO", "CRÍTICO"]

async def seed_users(db: AsyncSession) -> uuid.UUID:
    """Create test users"""
    logger.info("seed.users.start", extra={"event": "seed.users.start"})
    admin_id = None
    count = 0

    for i, username in enumerate(["admin"] + [f"user_{i:03d}" for i in range(49)]):
        result = await db.execute(select(User).where(User.username == username))
        existing = result.scalar_one_or_none()
        if existing:
            if username == "admin": admin_id = existing.id
            continue

        user = User(
            id=uuid.uuid4(),
            username=username,
            email=f"{username}@company.com",
            full_name=f"User {username}",
            hashed_password=hash_password("Test123!@"),
            role="admin" if username == "admin" else "analyst",
            is_active=True
        )
        db.add(user)
        if username == "admin": admin_id = user.id
        count += 1

    await db.flush()
    logger.info("seed.users.created", extra={"event": "seed.users.created", "count": count})
    return admin_id


async def seed_code_security_reviews(db: AsyncSession, user_id: uuid.UUID) -> list[uuid.UUID]:
    """Create 100+ Code Security Reviews"""
    logger.info("seed.code_security_reviews.start", extra={"event": "seed.code_security_reviews.start"})
    review_ids = []
    count = 0

    for i in range(100):
        titulo = f"CSR_{i:04d}"
        result = await db.execute(select(CodeSecurityReview).where(CodeSecurityReview.titulo == titulo))
        if result.scalar_one_or_none():
            continue

        review = CodeSecurityReview(
            id=uuid.uuid4(),
            user_id=user_id,
            titulo=titulo,
            descripcion=f"Code Security Review {i}",
            url_repositorio=f"https://github.com/company/{random.choice(REPOS)}",
            rama_analizar=random.choice(["main", "develop"]),
            scan_mode=random.choice(["full", "incremental"]),
            estado=random.choice(["COMPLETED", "ANALYZING", "PENDING"]),
            progreso=random.randint(0, 100)
        )
        db.add(review)
        review_ids.append(review.id)
        count += 1

    await db.flush()
    logger.info("seed.code_security_reviews.created", extra={"event": "seed.code_security_reviews.created", "count": count})
    return review_ids


async def seed_code_security_findings(db: AsyncSession, user_id: uuid.UUID, review_ids: list[uuid.UUID]) -> None:
    """Create 500+ findings"""
    logger.info("seed.code_security_findings.start", extra={"event": "seed.code_security_findings.start"})
    count = 0

    for review_id in review_ids[:50]:
        for j in range(random.randint(5, 15)):
            fingerprint = f"fp_{review_id}_{j}_{random.randint(1000, 9999)}"
            finding = CodeSecurityFinding(
                id=uuid.uuid4(),
                user_id=user_id,
                review_id=review_id,
                fingerprint=fingerprint,
                archivo=f"src/module_{j}.py",
                linea_inicio=random.randint(1, 500),
                linea_fin=random.randint(500, 1000),
                tipo_malicia=random.choice(RISK_TYPES),
                severidad=random.choice(SEVERITIES),
                confianza=round(random.uniform(0.5, 1.0), 2),
                descripcion="Security issue found",
                codigo_snippet="def fn():\n    pass",
                impacto="High",
                explotabilidad="Medium",
                remediacion_sugerida="Apply security patch",
                estado="DETECTED"
            )
            db.add(finding)
            count += 1

    await db.flush()
    logger.info("seed.code_security_findings.created", extra={"event": "seed.code_security_findings.created", "count": count})


async def seed_code_security_events(db: AsyncSession, review_ids: list[uuid.UUID]) -> None:
    """Create 1000+ forensic events"""
    logger.info("seed.code_security_events.start", extra={"event": "seed.code_security_events.start"})
    count = 0

    for review_id in review_ids[:50]:
        for j in range(random.randint(10, 30)):
            event = CodeSecurityEvent(
                id=uuid.uuid4(),
                review_id=review_id,
                event_ts=datetime.now(UTC) - timedelta(hours=random.randint(0, 72)),
                commit_hash=f"abc{random.randint(1000, 9999)}",
                autor=f"dev_{random.randint(1, 20)}@company.com",
                archivo=f"src/file_{j}.py",
                accion=random.choice(["ADDED", "MODIFIED"]),
                mensaje_commit="Fix: Issue",
                nivel_riesgo=random.choice(["LOW", "MEDIUM"]),
                indicadores=[]
            )
            db.add(event)
            count += 1

    await db.flush()
    logger.info("seed.code_security_events.created", extra={"event": "seed.code_security_events.created", "count": count})


async def seed_code_security_reports(db: AsyncSession, review_ids: list[uuid.UUID]) -> None:
    """Create 50 reports"""
    logger.info("seed.code_security_reports.start", extra={"event": "seed.code_security_reports.start"})
    count = 0

    for review_id in review_ids[:50]:
        report = CodeSecurityReport(
            id=uuid.uuid4(),
            review_id=review_id,
            resumen_ejecutivo="Security analysis complete - Malicious code patterns detected",
            desglose_severidad={"crítico": random.randint(0, 2), "alto": random.randint(1, 5), "medio": random.randint(3, 10), "bajo": random.randint(5, 15)},
            narrativa_evolucion="Attack pattern identified in code review timeline",
            pasos_remediacion=[
                {"orden": 1, "paso": "Implement input validation"},
                {"orden": 2, "paso": "Add authentication checks"},
                {"orden": 3, "paso": "Review and update security controls"}
            ],
            puntuacion_riesgo_global=random.randint(40, 90)
        )
        db.add(report)
        count += 1

    await db.flush()
    logger.info("seed.code_security_reports.created", extra={"event": "seed.code_security_reports.created", "count": count})


async def seed_massive_complete() -> None:
    """Main seed function"""
    logger.info("seed.massive.start", extra={"event": "seed.massive.start"})
    async with async_session() as db:
        try:
            admin_id = await seed_users(db)
            review_ids = await seed_code_security_reviews(db, admin_id)
            await seed_code_security_findings(db, admin_id, review_ids)
            await seed_code_security_events(db, review_ids)
            await seed_code_security_reports(db, review_ids)
            await db.commit()

            print("\n" + "="*80)
            print("✅ SEED COMPLETADO - DATA INYECTADA EXITOSAMENTE")
            print("="*80)
            print("📊 Resumen:")
            print("  • Usuarios: 50 (admin + 49 users)")
            print("  • Code Security Reviews: 100+")
            print("  • Hallazgos (Findings): 500+")
            print("  • Eventos Forenses: 1000+")
            print("  • Reportes: 50")
            print("="*80 + "\n")
            logger.info("seed.massive.complete", extra={"event": "seed.massive.complete"})

        except Exception as e:
            await db.rollback()
            logger.error(f"seed.error: {str(e)}", extra={"event": "seed.error", "error": str(e)})
            print(f"\n❌ Error: {str(e)}\n")
            raise


if __name__ == "__main__":
    asyncio.run(seed_massive_complete())
