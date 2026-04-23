"""Admin-facing User service.

Unlike ``task_svc`` / ``project_svc``, this service has NO ``owner_field``
because Users are not "owned" by anyone — they are the owners. All endpoints
using this service must be gated by ``require_role('admin')``.

``audit_action_prefix="user"`` ensures every mutation writes an
``audit_logs`` row (``user.create``, ``user.update``, ``user.delete``).
"""

from app.models.user import User
from app.schemas.user_admin import UserAdminCreate, UserAdminUpdate
from app.services.base import BaseService

user_admin_svc = BaseService[User, UserAdminCreate, UserAdminUpdate](
    User,
    owner_field=None,
    audit_action_prefix="user",
)
