"""ChangelogEntrada service — system-level entity (super_admin only creates)."""

from app.models.changelog_entrada import ChangelogEntrada
from app.schemas.changelog_entrada import ChangelogEntradaCreate, ChangelogEntradaUpdate
from app.services.base import BaseService

changelog_entrada_svc = BaseService[ChangelogEntrada, ChangelogEntradaCreate, ChangelogEntradaUpdate](
    ChangelogEntrada,
    owner_field=None,
    audit_action_prefix="changelog_entrada",
)

