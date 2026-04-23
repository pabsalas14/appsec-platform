"""ReglaSoD service — global config entity managed by admin (no per-user ownership).

owner_field=None because SoD rules are org-wide configuration, not per-user
resources. Access control is enforced at the router level via require_role('admin').
audit_action_prefix is set so every mutation is traceable (ADR-0007).
"""

from app.models.regla_so_d import ReglaSoD
from app.schemas.regla_so_d import ReglaSoDCreate, ReglaSoDUpdate
from app.services.base import BaseService

regla_so_d_svc = BaseService[ReglaSoD, ReglaSoDCreate, ReglaSoDUpdate](
    ReglaSoD,
    owner_field=None,  # Global config — RBAC via require_role, not ownership
    audit_action_prefix="regla_sod",
)
