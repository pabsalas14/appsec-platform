"""Aggregate admin-only sub-router mounted at ``/api/v1/admin``.

Individual admin domains live as sibling modules (``users``, ``roles``,
``settings``, …) and are composed here so the main ``api/v1/router.py``
only needs to mount this single router.
"""

from fastapi import APIRouter

from app.api.v1.admin import ai_automation_rules as admin_ai_automation_rules
from app.api.v1.admin import builders as admin_builders
from app.api.v1.admin import configuracion_ia as admin_configuracion_ia
from app.api.v1.admin import custom_fields as admin_custom_fields
from app.api.v1.admin import dashboard_builder as admin_dashboard_builder
from app.api.v1.admin import herramienta_externas as admin_herramienta_externas
from app.api.v1.admin import ia_config as admin_ia_config
from app.api.v1.admin import module_views as admin_module_views
from app.api.v1.admin import navigation_items as admin_navigation_items
from app.api.v1.admin import query_builder as admin_query_builder
from app.api.v1.admin import regla_sods as admin_regla_sods
from app.api.v1.admin import roles as admin_roles
from app.api.v1.admin import settings as admin_settings
from app.api.v1.admin import system_catalogs as admin_system_catalogs
from app.api.v1.admin import system_health as admin_system_health
from app.api.v1.admin import test_data as admin_test_data
from app.api.v1.admin import users as admin_users
from app.api.v1.admin import validation_rules as admin_validation_rules

admin_router = APIRouter()

admin_router.include_router(admin_users.router, prefix="/users", tags=["Admin · Users"])
admin_router.include_router(admin_roles.router, prefix="/roles", tags=["Admin · Roles"])
admin_router.include_router(admin_settings.router, prefix="/settings", tags=["Admin · Settings"])
admin_router.include_router(admin_regla_sods.router, prefix="/regla-sods", tags=["Admin · ReglaSoD"])
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
admin_router.include_router(
    admin_ia_config.router,
    prefix="/ia-config",
    tags=["Admin · IA Config"],
)
admin_router.include_router(
    admin_test_data.router,
    prefix="/test-data",
    tags=["Admin · Test Data (SEMANA 0)"],
)
admin_router.include_router(
    admin_system_catalogs.router,
    prefix="/system-catalogs",
    tags=["Admin · System Catalog"],
)
admin_router.include_router(
    admin_configuracion_ia.router,
    prefix="/configuraciones-ia",
    tags=["Admin · Configuración IA"],
)
admin_router.include_router(
    admin_module_views.router,
    prefix="/module-views",
    tags=["Admin · Module Views"],
)
admin_router.include_router(
    admin_custom_fields.router,
    prefix="/custom-fields",
    tags=["Admin · Custom Fields"],
)
admin_router.include_router(
    admin_validation_rules.router,
    prefix="/validation-rules",
    tags=["Admin · Validation Rules"],
)
admin_router.include_router(
    admin_ai_automation_rules.router,
    prefix="/ai-rules",
    tags=["Admin · AI Automation Rules"],
)
admin_router.include_router(
    admin_navigation_items.router,
    prefix="/navigation",
    tags=["Admin · Navigation"],
)
admin_router.include_router(admin_query_builder.router)
admin_router.include_router(admin_dashboard_builder.router)
admin_router.include_router(admin_builders.builders_router, tags=["Admin · Builders"])
