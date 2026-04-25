"""
Phase 22-24: IA Integration Endpoints
Threat Modeling (STRIDE/DREAD) and FP Triage
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.api.deps_ownership import require_role
from app.core.response import success, error
from app.models import ConfiguracionIA, SesionThreatModeling, Vulnerabilidad
from app.schemas import (
    ConfiguracionIARead,
    ConfiguracionIAUpdate,
    AmenazaRead,
    VulnerabilidadRead,
)
from app.services.ia_provider import (
    AIProviderType,
    get_ai_provider,
)
from app.services.threat_modeling_service import ThreatModelingService
from app.services.fp_triage_service import FPTriageService
from app.services.ia_config_service import ConfiguracionIAService

router = APIRouter()


# ============================================================================
# Threat Modeling Endpoints (Phase 22)
# ============================================================================


@router.post(
    "/sesion-threat-modelings/{sesion_id}/ia/suggest",
    response_model=dict,
    tags=["Threat Modeling - IA"],
)
async def suggest_threats_ia(
    sesion_id: str,
    contexto_adicional: Optional[str] = None,
    dry_run: bool = False,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """
    Generate threat modeling suggestions from IA (STRIDE/DREAD)
    """

    await require_role(
        current_user,
        ["super_admin", "chief_appsec", "lider_programa", "analista"],
    )

    sesion = await db.get(SesionThreatModeling, sesion_id)
    if not sesion:
        raise HTTPException(status_code=404, detail="Session not found")

    ia_config_service = ConfiguracionIAService(db)
    config = await ia_config_service.get_current_config()

    if not config:
        return error(status_code=400, message="IA configuration not found")

    try:
        provider = get_ai_provider(
            AIProviderType(config.ai_provider),
            api_key=config.api_key if config.ai_provider != "ollama" else None,
            model=config.ai_model,
            timeout_seconds=config.ai_timeout_seconds,
        )

        tm_service = ThreatModelingService(db, provider)
        threats = await tm_service.generate_threats_from_ai(
            sesion_id=sesion_id,
            technology_stack=sesion.tecnologia_stack or "Unknown",
            dry_run=dry_run,
        )

        return success(
            data={
                "threats_generated": len(threats),
                "threats": [AmenazaRead.from_orm(t) for t in threats],
                "provider": config.ai_provider,
                "dry_run": dry_run,
            },
            message=f"Generated {len(threats)} STRIDE threats with DREAD scoring",
        )

    except Exception as e:
        return error(status_code=500, message=f"IA threat generation failed: {str(e)}")


@router.post(
    "/vulnerabilidads/{vuln_id}/ia/classify-fp",
    response_model=dict,
    tags=["Vulnerabilities - IA Triage"],
)
async def classify_finding_fp(
    vuln_id: str,
    code_snippet: Optional[str] = None,
    repo_context: Optional[str] = None,
    dry_run: bool = False,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """
    Classify SAST/DAST finding for false positives using IA
    """

    await require_role(
        current_user,
        ["super_admin", "chief_appsec", "lider_programa", "analista"],
    )

    vulnerability = await db.get(Vulnerabilidad, vuln_id)
    if not vulnerability:
        raise HTTPException(status_code=404, detail="Vulnerability not found")

    ia_config_service = ConfiguracionIAService(db)
    config = await ia_config_service.get_current_config()

    if not config:
        return error(status_code=400, message="IA configuration not found")

    try:
        provider = get_ai_provider(
            AIProviderType(config.ai_provider),
            api_key=config.api_key if config.ai_provider != "ollama" else None,
            model=config.ai_model,
            timeout_seconds=config.ai_timeout_seconds,
        )

        triage_service = FPTriageService(db, provider)
        classification = await triage_service.classify_finding(
            vulnerabilidad_id=vuln_id,
            code_snippet=code_snippet,
            repo_context=repo_context,
            dry_run=dry_run,
        )

        return success(
            data={
                "vulnerabilidad_id": vuln_id,
                **classification,
                "provider": config.ai_provider,
            },
            message=f"Finding classified as: {classification['classification']}",
        )

    except Exception as e:
        return error(status_code=500, message=f"FP triage failed: {str(e)}")


@router.post(
    "/vulnerabilidads/{vuln_id}/ia/approve-triage",
    response_model=dict,
    tags=["Vulnerabilities - IA Triage"],
)
async def approve_triage_suggestion(
    vuln_id: str,
    final_classification: str,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """
    Analyst approves IA triage suggestion
    """

    await require_role(
        current_user,
        ["super_admin", "chief_appsec", "lider_programa", "analista"],
    )

    if final_classification not in [
        "Probable False Positive",
        "Requires Manual Review",
        "Confirmed Vulnerability",
    ]:
        return error(status_code=400, message="Invalid classification")

    try:
        triage_service = FPTriageService(db, None)
        updated_vuln = await triage_service.approve_triage_suggestion(
            vulnerabilidad_id=vuln_id,
            final_classification=final_classification,
            user_id=current_user.id,
        )

        return success(
            data=VulnerabilidadRead.from_orm(updated_vuln),
            message=f"Triage approved: {final_classification}",
        )

    except Exception as e:
        return error(status_code=500, message=f"Failed to approve triage: {str(e)}")


@router.get(
    "/admin/ia-config",
    response_model=dict,
    tags=["Admin - IA Configuration"],
)
async def get_ia_config(
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """Get current IA provider configuration (Super Admin only)"""

    await require_role(current_user, ["super_admin"])

    ia_config_service = ConfiguracionIAService(db)
    config = await ia_config_service.get_current_config()

    if not config:
        return success(data=None, message="No IA configuration found")

    return success(
        data=ConfiguracionIARead.from_orm(config),
        message="IA configuration retrieved",
    )


@router.put(
    "/admin/ia-config",
    response_model=dict,
    tags=["Admin - IA Configuration"],
)
async def update_ia_config(
    config_data: ConfiguracionIAUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """Update IA provider configuration (Super Admin only)"""

    await require_role(current_user, ["super_admin"])

    ia_config_service = ConfiguracionIAService(db)
    updated_config = await ia_config_service.update_config(config_data)

    return success(
        data=ConfiguracionIARead.from_orm(updated_config),
        message="IA configuration updated successfully",
    )


@router.post(
    "/admin/ia-config/test-connection",
    response_model=dict,
    tags=["Admin - IA Configuration"],
)
async def test_ia_connection(
    db: AsyncSession = Depends(deps.get_db),
    current_user=Depends(deps.get_current_user),
):
    """Test IA provider connectivity (Super Admin only)"""

    await require_role(current_user, ["super_admin"])

    ia_config_service = ConfiguracionIAService(db)
    test_result = await ia_config_service.test_connection()

    return test_result
