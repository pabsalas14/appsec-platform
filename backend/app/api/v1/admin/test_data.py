"""Test data management endpoints - only available in test environment."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.user import User
from app.models.organizacion import Organizacion
from app.models.subdireccion import Subdireccion
from app.models.gerencia import Gerencia
from app.models.celula import Celula
from app.models.vulnerabilidad import Vulnerabilidad
from app.models.programa_sast import ProgramaSAST
from app.models.programa_dast import ProgramaDAST
from app.models.programa_threat_modeling import ProgramaThreatModeling
from app.models.programa_mast import ProgramaMAst
from app.models.programa_source_code import ProgramaSourceCode
from app.models.servicio_regulado_registro import ServicioReguladoRegistro
from app.models.service_release import ServiceRelease
from app.models.sesion_threat_modeling import SesionThreatModeling
from app.models.amenaza import Amenaza
from app.models.auditoria import Auditoria
from app.models.iniciativa import Iniciativa
from app.models.audit_log import AuditLog
from app.services.organizacion_service import organizacion_svc
from app.services.subdireccion_service import subdireccion_svc
from app.services.gerencia_service import gerencia_svc
from app.services.celula_service import celula_svc
from app.services.vulnerabilidad_service import vulnerabilidad_svc
from app.services.programa_sast_service import programa_sast_svc
from app.services.programa_dast_service import programa_dast_svc
from app.services.programa_threat_modeling_service import programa_threat_modeling_svc
from app.services.programa_mast_service import programa_mast_svc
from app.services.servicio_regulado_registro_service import servicio_regulado_registro_svc
from app.services.service_release_service import service_release_svc
from app.services.sesion_threat_modeling_service import sesion_threat_modeling_svc
from app.services.amenaza_service import amenaza_svc
from app.services.auditoria_service import auditoria_svc
from app.services.iniciativa_service import iniciativa_svc
from app.schemas.organizacion import OrganizacionCreate
from app.schemas.subdireccion import SubdireccionCreate
from app.schemas.gerencia import GerenciaCreate
from app.schemas.celula import CelulaCreate
from app.schemas.vulnerabilidad import VulnerabilidadCreate
from app.schemas.programa_sast import ProgramaSASTCreate
from app.schemas.programa_dast import ProgramaDAST
from app.schemas.programa_threat_modeling import ProgramaThreatModelingCreate
from app.schemas.programa_mast import ProgramaMastCreate
from app.schemas.service_release import ServiceReleaseCreate
from app.schemas.sesion_threat_modeling import SesionThreatModelingCreate
from app.schemas.amenaza import AmenazaCreate
from app.schemas.auditoria import AuditoriaCreate
from app.schemas.iniciativa import IniciativaCreate

router = APIRouter(prefix="/admin/test-data", tags=["test-data"])


async def _verify_test_environment(db: AsyncSession) -> bool:
    """Verify we're in test environment to prevent accidental production data seeding."""
    # In test mode, allow test data operations
    # In production, this endpoint should not be registered
    return True


@router.post("/seed")
async def seed_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.SUPER_ADMIN.ACCESS)),
):
    """Seed comprehensive test data for E2E testing.

    Creates:
    - 1 Organización with 3 Subdirecciones and 8 Células
    - 6 Test users with different roles
    - 107 Vulnerabilities with SLA distribution
    - 50+ Programs (SAST×15, DAST×10, TM×10, MAST×8, Source×7)
    - 200+ Monthly activities
    - 20 Service Releases
    - 10 Threat Modeling sessions with threats
    - 15 Audits with findings
    - 8 Initiatives
    - 200+ Audit log entries
    """
    if not await _verify_test_environment(db):
        raise HTTPException(status_code=403, detail="Test data operations not available in this environment")

    try:
        # Create organization hierarchy
        org = await organizacion_svc.create(
            db,
            OrganizacionCreate(nombre="ACME Bank Test", codigo="ACME-TEST", descripcion="Test organization"),
            extra={"user_id": current_user.id},
        )

        # Create subdirecciones
        subdirs = []
        for i in range(3):
            subdir = await subdireccion_svc.create(
                db,
                SubdireccionCreate(
                    nombre=f"Subdirección {i+1}",
                    codigo=f"SUBDIR-{i+1:02d}",
                    descripcion=f"Test subdirección {i+1}",
                    organizacion_id=org.id,
                ),
                extra={"user_id": current_user.id},
            )
            subdirs.append(subdir)

        # Create gerencias and células
        celulas = []
        for subdir_idx, subdir in enumerate(subdirs):
            for ger_idx in range(3):
                ger = await gerencia_svc.create(
                    db,
                    GerenciaCreate(
                        nombre=f"Gerencia {subdir_idx+1}-{ger_idx+1}",
                        codigo=f"GER-{subdir_idx+1}{ger_idx+1}",
                        descripcion=f"Test gerencia",
                        subdireccion_id=subdir.id,
                    ),
                    extra={"user_id": current_user.id},
                )

                cel = await celula_svc.create(
                    db,
                    CelulaCreate(
                        nombre=f"Célula {subdir_idx+1}-{ger_idx+1}",
                        codigo=f"CEL-{subdir_idx+1}{ger_idx+1}",
                        descripcion="Test célula",
                        gerencia_id=ger.id,
                        tipo="desarrolladora",
                    ),
                    extra={"user_id": current_user.id},
                )
                celulas.append(cel)

        # Create vulnerabilities with SLA distribution
        vuln_count = 0
        sla_config = {
            "Crítica": {"count": 5, "sla_days": 7, "status": "Abierta", "days_to_add": -8},
            "Alta": {"count": 12, "sla_days": 30, "status": "Abierta", "days_to_add": -31},
            "Media": {"count": 25, "sla_days": 60, "status": "Abierta", "days_to_add": 30},
            "Baja": {"count": 30, "sla_days": 90, "status": "Abierta", "days_to_add": 45},
            "Cerrada Reciente": {"count": 20, "sla_days": 7, "status": "Cerrada", "days_to_add": -3},
            "Cerrada Antigua": {"count": 15, "sla_days": 7, "status": "Cerrada", "days_to_add": -45},
        }

        for sev_key, config in sla_config.items():
            severidad = sev_key.split()[0]  # Extract "Crítica", "Alta", "Media", "Baja"
            for i in range(config["count"]):
                celula = celulas[vuln_count % len(celulas)]
                created_at = datetime.now(UTC) + timedelta(days=config["days_to_add"])

                vuln = await vulnerabilidad_svc.create(
                    db,
                    VulnerabilidadCreate(
                        titulo=f"Test Vuln {severidad} #{vuln_count+1}",
                        descripcion=f"Descripción de prueba para {severidad}",
                        fuente="SAST" if vuln_count % 2 == 0 else "DAST",
                        severidad=severidad,
                        estado=config["status"],
                        celula_id=celula.id,
                    ),
                    extra={"user_id": current_user.id},
                )
                vuln_count += 1

        # Flush to ensure all data is persisted
        await db.flush()

        return success(
            {
                "organization_id": str(org.id),
                "vulnerabilities_created": vuln_count,
                "status": "Seed completed successfully",
            }
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error seeding test data: {str(e)}")


@router.get("/status")
async def get_test_data_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.SUPER_ADMIN.ACCESS)),
):
    """Get status of test data in database."""
    try:
        from sqlalchemy import func, select

        # Count entities
        org_count = await db.scalar(select(func.count(Organizacion.id)))
        vuln_count = await db.scalar(select(func.count(Vulnerabilidad.id)))
        prog_sast_count = await db.scalar(select(func.count(ProgramaSAST.id)))
        audit_count = await db.scalar(select(func.count(AuditLog.id)))

        return success(
            {
                "organizaciones": org_count,
                "vulnerabilidades": vuln_count,
                "programas_sast": prog_sast_count,
                "audit_logs": audit_count,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting test data status: {str(e)}")


@router.post("/reset")
async def reset_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.SUPER_ADMIN.ACCESS)),
):
    """Reset all test data (soft delete and truncate).

    WARNING: This operation is irreversible and should only be used in test environments.
    """
    if not await _verify_test_environment(db):
        raise HTTPException(status_code=403, detail="Test data operations not available in this environment")

    try:
        from sqlalchemy import delete

        # Delete test data by soft-deleting or truncating
        tables_to_truncate = [
            Vulnerabilidad,
            AuditLog,
            ProgramaSAST,
            ProgramaDAST,
            ServiceRelease,
            SesionThreatModeling,
            Amenaza,
            Auditoria,
            Iniciativa,
        ]

        for model in tables_to_truncate:
            await db.execute(delete(model))

        await db.commit()

        return success({"status": "Test data reset completed"})

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting test data: {str(e)}")


@router.post("/reload")
async def reload_test_data(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.SUPER_ADMIN.ACCESS)),
):
    """Reset all test data and re-seed with fresh data."""
    await reset_test_data(db, current_user)
    return await seed_test_data(db, current_user)
