"""Navigation Item service — admin-managed CRUD."""

from app.models.navigation_item import NavigationItem
from app.schemas.navigation_item import NavigationItemCreate, NavigationItemUpdate
from app.services.base import BaseService

navigation_item_svc = BaseService[NavigationItem, NavigationItemCreate, NavigationItemUpdate](
    NavigationItem,
    audit_action_prefix="navigation_item",
)
