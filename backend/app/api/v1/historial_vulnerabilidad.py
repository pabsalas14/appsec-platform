"""HistorialVulnerabilidad endpoints — lectura e inserción (immutable por diseño).

El historial NO expone update ni delete — las entradas son inmutables una vez
creadas para mantener integridad del audit trail (tamper-evident).
La creación normalmente la hace el service de vulnerabilidades automáticamente;
este endpoint existe para creación manual y consulta.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.deps_ownership import require_ownership
from app.core.response import success
from app.models.historial_vulnerabilidad import HistorialVulnerabilidad
from app.models.user import User
from app.schemas.historial_vulnerabilidad import (
    HistorialVulnerabilidadCreate,
    HistorialVulnerabilidadRead,
)
from app.services.historial_vulnerabilidad_service import historial_vulnerabilidad_svc

router = APIRouter()


@router.get("")
async def list_historial(
    vulnerabilidad_id: UUID | None = Query(None, description="Filtrar por vulnerabilidad"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista entradas de historial. Puede filtrarse por vulnerabilidad_id."""
    filters: dict = {"user_id": current_user.id}
    if vulnerabilidad_id:
        filters["vulnerabilidad_id"] = vulnerabilidad_id
    items = await historial_vulnerabilidad_svc.list(db, filters=filters)
    return success([HistorialVulnerabilidadRead.model_validate(x).model_dump(mode="json") for x in items])


@router.get("/{id}")
async def get_historial(
    entity: HistorialVulnerabilidad = Depends(require_ownership(historial_vulnerabilidad_svc)),
):
    """Obtiene una entrada de historial por ID."""
    return success(HistorialVulnerabilidadRead.model_validate(entity).model_dump(mode="json"))


@router.post("", status_code=201)
async def create_historial(
    entity_in: HistorialVulnerabilidadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Registra manualmente una entrada de historial.

    Normalmente esto lo hace el service de vulnerabilidades automáticamente
    al cambiar el estado. Solo usar para registros manuales.
    """
    entity = await historial_vulnerabilidad_svc.create(
        db, entity_in, extra={"user_id": current_user.id}
    )
    return success(HistorialVulnerabilidadRead.model_validate(entity).model_dump(mode="json"))
