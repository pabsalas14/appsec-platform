"""Aggregate admin-only sub-router mounted at ``/api/v1/admin``.

Individual admin domains live as sibling modules (``users``, ``roles``,
``settings``, …) and are composed here so the main ``api/v1/router.py``
only needs to mount this single router.
"""

from fastapi import APIRouter

from app.api.v1.admin import users as admin_users
from app.api.v1.admin import roles as admin_roles
from app.api.v1.admin import settings as admin_settings
from app.api.v1.admin import regla_sods as admin_regla_sods
from app.api.v1.admin import herramienta_externas as admin_herramienta_externas
from app.api.v1.admin import system_health as admin_system_health

admin_router = APIRouter()

admin_router.include_router(
    admin_users.router, prefix="/users", tags=["Admin · Users"]
)
admin_router.include_router(
    admin_roles.router, prefix="/roles", tags=["Admin · Roles"]
)
admin_router.include_router(
    admin_settings.router, prefix="/settings", tags=["Admin · Settings"]
)
admin_router.include_router(
    admin_regla_sods.router, prefix="/regla-sods", tags=["Admin · ReglaSoD"]
)
admin_router.include_router(
    admin_herramienta_externas.router,
    prefix="/herramientas-externas",
    tags=["Admin · Herramientas Externas"],
)
admin_router.include_router(
    admin_system_health.router,
    prefix="/system-health",
    tags=["Admin · System Health"],
)
