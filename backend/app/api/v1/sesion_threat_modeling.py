"""SesionThreatModeling CRUD endpoints."""

import json
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, require_permission
from app.api.deps_ownership import require_ownership
from app.core.exceptions import NotFoundException
from app.core.permissions import P
from app.core.response import success
from app.models.amenaza import Amenaza
from app.models.sesion_threat_modeling import SesionThreatModeling
from app.models.user import User
from app.schemas.amenaza import AmenazaCreate
from app.schemas.sesion_threat_modeling import (
    SesionThreatModelingCreate,
    SesionThreatModelingIASuggestRead,
    SesionThreatModelingIASuggestRequest,
    SesionThreatModelingRead,
    SesionThreatModelingUpdate,
)
from app.services.amenaza_service import amenaza_svc
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


def _extract_structured_threats(content: str) -> list[dict]:
    """Parse JSON threat list from model output."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return []
    if not isinstance(data, dict):
        return []
    threats = data.get("threats")
    if not isinstance(threats, list):
        return []
    allowed_stride = {
        "Spoofing",
        "Tampering",
        "Repudiation",
        "Information Disclosure",
        "Denial of Service",
        "Elevation of Privilege",
    }
    parsed: list[dict] = []
    for item in threats:
        if not isinstance(item, dict):
            continue
        titulo = str(item.get("titulo", "")).strip()
        categoria = str(item.get("categoria_stride", "")).strip()
        if not titulo or categoria not in allowed_stride:
            continue
        try:
            d_damage = int(item.get("dread_damage", 5))
            d_repr = int(item.get("dread_reproducibility", 5))
            d_expl = int(item.get("dread_exploitability", 5))
            d_users = int(item.get("dread_affected_users", 5))
            d_disc = int(item.get("dread_discoverability", 5))
        except (TypeError, ValueError):
            continue
        scores = [d_damage, d_repr, d_expl, d_users, d_disc]
        if any(s < 1 or s > 10 for s in scores):
            continue
        estado = str(item.get("estado", "Abierta")).strip() or "Abierta"
        parsed.append(
            {
                "titulo": titulo[:255],
                "descripcion": str(item.get("descripcion", "")).strip() or None,
                "categoria_stride": categoria,
                "dread_damage": d_damage,
                "dread_reproducibility": d_repr,
                "dread_exploitability": d_expl,
                "dread_affected_users": d_users,
                "dread_discoverability": d_disc,
                "estado": estado,
            }
        )
    return parsed[:20]


@router.get("")
async def list_sesion_threat_modelings(
    programa_tm_id: UUID | None = Query(None, description="Filter by programa_tm_id"),
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
        "Responde SOLO JSON con esta forma:\n"
        '{"threats":['
        '{"titulo":"...","descripcion":"...","categoria_stride":'
        '"Spoofing|Tampering|Repudiation|Information Disclosure|'
        'Denial of Service|Elevation of Privilege",'
        '"dread_damage":1,"dread_reproducibility":1,"dread_exploitability":1,'
        '"dread_affected_users":1,"dread_discoverability":1,"estado":"Abierta"}'
        "]}"
    )

    result = await run_prompt(db, prompt=prompt, dry_run=payload.dry_run)
    structured = _extract_structured_threats(result.content)
    if not payload.dry_run:
        await sesion_threat_modeling_svc.update(
            db,
            session.id,
            SesionThreatModelingUpdate(ia_utilizada=True),
            scope={"user_id": current_user.id},
        )

    created_ids: list[str] = []
    if not payload.dry_run and payload.crear_amenazas:
        for row in structured:
            entity: Amenaza = await amenaza_svc.create(
                db,
                AmenazaCreate(
                    sesion_id=session.id,
                    titulo=row["titulo"],
                    descripcion=row.get("descripcion"),
                    categoria_stride=row["categoria_stride"],
                    dread_damage=row["dread_damage"],
                    dread_reproducibility=row["dread_reproducibility"],
                    dread_exploitability=row["dread_exploitability"],
                    dread_affected_users=row["dread_affected_users"],
                    dread_discoverability=row["dread_discoverability"],
                    estado=row["estado"],
                ),
                extra={"user_id": current_user.id},
            )
            created_ids.append(str(entity.id))

    suggested = [x["titulo"] for x in structured] if structured else _extract_suggested_threats(result.content)
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
            "created_amenazas": len(created_ids),
        },
    )
    response = SesionThreatModelingIASuggestRead(
        provider=result.provider,
        model=result.model,
        dry_run=payload.dry_run,
        content=result.content,
        suggested_threats=suggested,
        created_amenaza_ids=created_ids,
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
    updated = await sesion_threat_modeling_svc.update(db, entity.id, entity_in, scope={"user_id": current_user.id})
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
