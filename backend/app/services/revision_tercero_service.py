"""RevisionTercero service — async CRUD with enforced per-user ownership."""

from app.models.revision_tercero import RevisionTercero
from app.schemas.revision_tercero import RevisionTerceroCreate, RevisionTerceroUpdate
from app.services.base import BaseService

revision_tercero_svc = BaseService[RevisionTercero, RevisionTerceroCreate, RevisionTerceroUpdate](
    RevisionTercero,
    owner_field="user_id",
    audit_action_prefix="revision_tercero",
)
