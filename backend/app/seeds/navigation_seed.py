"""Navigation items seed — initialize default sidebar navigation structure.

Fase 7 default navigation:
- Dashboard (parent)
  - Executive
  - Team
  - Programs
  - Vulnerabilities
  - Concentrado
  - Operation
  - Kanban
  - Initiatives
  - Themes
- Vulnerabilities
- Releases
- Programs
- Initiatives
- Themes
- Admin (admin only)
  - Dashboards
  - Custom Fields
  - Validation Rules
  - Catalogs
  - Navigation
  - AI Automation
  - Users/Roles
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.navigation_item import NavigationItem


DEFAULT_NAVIGATION = [
    # Main items (no parent)
    {
        "label": "Dashboard",
        "href": "/dashboards",
        "icon": "layout-grid",
        "orden": 0,
        "visible": True,
        "required_role": None,
        "parent_id": None,
        "children": [
            {
                "label": "Executive",
                "href": "/dashboards/executive",
                "icon": "trending-up",
                "orden": 0,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Team",
                "href": "/dashboards/team",
                "icon": "users",
                "orden": 1,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Programs",
                "href": "/dashboards/programs",
                "icon": "book-open",
                "orden": 2,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Vulnerabilities",
                "href": "/dashboards/vulnerabilities",
                "icon": "alert-triangle",
                "orden": 3,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Concentrado",
                "href": "/dashboards/concentrado",
                "icon": "bar-chart-3",
                "orden": 4,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Operation",
                "href": "/dashboards/operation",
                "icon": "settings",
                "orden": 5,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Kanban",
                "href": "/dashboards/kanban",
                "icon": "kanban",
                "orden": 6,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Initiatives",
                "href": "/dashboards/initiatives",
                "icon": "rocket",
                "orden": 7,
                "visible": True,
                "required_role": None,
            },
            {
                "label": "Themes",
                "href": "/dashboards/temas",
                "icon": "lightbulb",
                "orden": 8,
                "visible": True,
                "required_role": None,
            },
        ],
    },
    {
        "label": "Vulnerabilities",
        "href": "/vulnerabilities",
        "icon": "alert-circle",
        "orden": 1,
        "visible": True,
        "required_role": None,
        "parent_id": None,
    },
    {
        "label": "Releases",
        "href": "/releases",
        "icon": "rocket",
        "orden": 2,
        "visible": True,
        "required_role": None,
        "parent_id": None,
    },
    {
        "label": "Programs",
        "href": "/programs",
        "icon": "package",
        "orden": 3,
        "visible": True,
        "required_role": None,
        "parent_id": None,
    },
    {
        "label": "Initiatives",
        "href": "/initiatives",
        "icon": "target",
        "orden": 4,
        "visible": True,
        "required_role": None,
        "parent_id": None,
    },
    {
        "label": "Themes",
        "href": "/themes",
        "icon": "zap",
        "orden": 5,
        "visible": True,
        "required_role": None,
        "parent_id": None,
    },
    {
        "label": "Admin",
        "href": "/admin",
        "icon": "shield",
        "orden": 6,
        "visible": True,
        "required_role": "admin",
        "parent_id": None,
        "children": [
            {
                "label": "Dashboards",
                "href": "/admin/dashboards",
                "icon": "layout",
                "orden": 0,
                "visible": True,
                "required_role": "admin",
            },
            {
                "label": "Custom Fields",
                "href": "/admin/custom-fields",
                "icon": "code",
                "orden": 1,
                "visible": True,
                "required_role": "admin",
            },
            {
                "label": "Validation Rules",
                "href": "/admin/validation-rules",
                "icon": "check-circle",
                "orden": 2,
                "visible": True,
                "required_role": "admin",
            },
            {
                "label": "Catalogs",
                "href": "/admin/catalogs",
                "icon": "list",
                "orden": 3,
                "visible": True,
                "required_role": "admin",
            },
            {
                "label": "Navigation",
                "href": "/admin/navigation",
                "icon": "navigation",
                "orden": 4,
                "visible": True,
                "required_role": "admin",
            },
            {
                "label": "AI Automation",
                "href": "/admin/ai-automation",
                "icon": "brain",
                "orden": 5,
                "visible": True,
                "required_role": "admin",
            },
            {
                "label": "Users & Roles",
                "href": "/admin/users",
                "icon": "users-cog",
                "orden": 6,
                "visible": True,
                "required_role": "admin",
            },
        ],
    },
]


async def seed_navigation(db: AsyncSession) -> int:
    """Seed default navigation items. Returns count created."""
    # Check if already seeded
    existing = await db.scalar(select(NavigationItem))
    if existing:
        return 0  # Already seeded
    
    count = 0
    parent_map = {}  # Track parent IDs for children
    
    for item_data in DEFAULT_NAVIGATION:
        children = item_data.pop("children", [])
        
        # Create parent
        parent_item = NavigationItem(**item_data)
        db.add(parent_item)
        await db.flush()  # Flush to get ID
        
        parent_map[item_data["label"]] = parent_item.id
        count += 1
        
        # Create children
        for child_data in children:
            child_item = NavigationItem(
                **child_data,
                parent_id=parent_item.id,
            )
            db.add(child_item)
            count += 1
    
    await db.flush()
    return count
