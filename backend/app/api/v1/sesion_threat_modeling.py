"""SesionThreatModeling CRUD endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.sesion_threat_modeling import SesionThreatModeling
from app.models.user import User
from app.schemas.sesion_threat_modeling import (
    SesionThreatModelingCreate,
    SesionThreatModelingIASuggestRead,
    SesionThreatModelingIASuggestRequest,
    SesionThreatModelingRead,
    SesionThreatModelingUpdate,
)
from app.services.audit_service import record as audit_record
from app.services.ia_provider import run_prompt
from app.services.sesion_threat_modeling_service import sesion_threat_modeling_svc

router = APIRouter()


def _extract_suggested_threats(content: str) -> list[str]:
    """Extract lightweight bullet-list suggestions from LLM response."""
    out: list[str] = []
    for raw_line in content.splitlines():
        line = raw_line.strip()
        if line.startswith("- "):
            value = line[2:].strip()
            if value:
                out.append(value)
    return out[:20]


@router.get("")
async def list_sesion_threat_modelings(
    programa_tm_id: Optional[UUID] = Query(None, description="Filter by programa_tm_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List sesiones de threat modeling, optionally filtered by programa."""
    filters: dict = {"user_id": current_user.id}
    if programa_tm_id is not None:
        filters["programa_tm_id"] = programa_tm_id
    items = await sesion_threat_modeling_svc.list(db, filters=filters)
    return success([SesionThreatModelingRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_sesion_threat_modeling(
    entity: SesionThreatModeling = Depends(require_ownership(sesion_threat_modeling_svc)),
):
    """Get a single owned sesion de threat modeling by ID."""
    return success(SesionThreatModelingRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_sesion_threat_modeling(
    entity_in: SesionThreatModelingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sesion de threat modeling for the current user."""
    entity = await sesion_threat_modeling_svc.create(db, entity_in, extra={"user_id": current_user.id})
    return success(SesionThreatModelingRead.model_validate(entity).model_dump(mode="json"))


@router.post("/{id}/ia/suggest")
async def suggest_sesion_threat_modeling(
    id: UUID,
    payload: SesionThreatModelingIASuggestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.IA.EXECUTE)),
):
    """Run IA provider on session context and return suggested threats."""
    session = await sesion_threat_modeling_svc.get(db, id, scope={"user_id": current_user.id})
    if not session:
        raise NotFoundException("SesionThreatModeling not found")

    prompt = (
        "Eres un asistente AppSec. Propón amenazas STRIDE para una sesión de threat modeling.\n"
        f"Fecha: {session.fecha.isoformat()}\n"
        f"Participantes: {session.participantes or 'N/A'}\n"
        f"Contexto: {session.contexto or 'N/A'}\n"
        f"Estado: {session.estado}\n"
        f"Contexto adicional: {payload.contexto_adicional or 'N/A'}\n\n"
        "Entrega 5-10 amenazas en viñetas con formato '- <amenaza>'."
    )

    result = await run_prompt(db, prompt=prompt, dry_run=payload.dry_run)
    if not payload.dry_run:
        await sesion_threat_modeling_svc.update(
            db,
            session.id,
            SesionThreatModelingUpdate(ia_utilizada=True),
            scope={"user_id": current_user.id},
        )

    suggested = _extract_suggested_threats(result.content)
    await audit_record(
        db,
        action="sesion_threat_modeling.ia_suggest",
        entity_type="sesion_threat_modeling",
        entity_id=session.id,
        metadata={
            "provider": result.provider,
            "model": result.model,
            "dry_run": payload.dry_run,
            "suggested_threats": len(suggested),
        },
    )
    response = SesionThreatModelingIASuggestRead(
        provider=result.provider,
        model=result.model,
        dry_run=payload.dry_run,
        content=result.content,
        suggested_threats=suggested,
    )
    return success(response.model_dump())


@router.patch("/{id}")
async def update_sesion_threat_modeling(
    entity_in: SesionThreatModelingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: SesionThreatModeling = Depends(require_ownership(sesion_threat_modeling_svc)),
):
    """Partially update an owned sesion de threat modeling."""
    updated = await sesion_threat_modeling_svc.update(
        db, entity.id, entity_in, scope={"user_id": current_user.id}
    )
    return success(SesionThreatModelingRead.model_validate(updated).model_dump(mode="json"))


@router.delete("/{id}")
async def delete_sesion_threat_modeling(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity: SesionThreatModeling = Depends(require_ownership(sesion_threat_modeling_svc)),
):
    """Delete an owned sesion de threat modeling."""
    await sesion_threat_modeling_svc.delete(db, entity.id, scope={"user_id": current_user.id})
    return success(None, meta={"message": "SesionThreatModeling deleted"})
