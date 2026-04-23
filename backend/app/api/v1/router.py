"""API v1 router — aggregates all endpoint modules."""

from fastapi import APIRouter
from app.api.v1 import (
    activo_web,
    aplicacion_movil,
    audit_logs,
    auth,
    celula,
    client_logs,
    control_seguridad,
    dashboard,
    projects,
    repositorio,
    servicio,
    subdireccion,
    tasks,
    tipo_prueba,
    uploads,
    # ── Módulo 9 — Gestión de Vulnerabilidades ─────────────────────────────
    vulnerabilidad,
    historial_vulnerabilidad,
    excepcion_vulnerabilidad,
    aceptacion_riesgo,
    evidencia_remediacion,
)
from app.api.v1.admin.router import admin_router

api_router = APIRouter(prefix="/api/v1")

# ─── Core modules ─────────────────────────────────────────────────────────────

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(
    dashboard.router, prefix="/dashboard", tags=["Dashboard"]
)
api_router.include_router(
    audit_logs.router, prefix="/audit-logs", tags=["Audit logs"]
)
api_router.include_router(
    client_logs.router, prefix="/client-logs", tags=["Client logs"]
)
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(admin_router, prefix="/admin")


@api_router.get("/", tags=["Root"])
async def root():
    return {"status": "success", "data": {"message": "Welcome to the Framework API"}}


# ─── Catálogos Centrales (Módulo 1) ──────────────────────────────────────────
api_router.include_router(subdireccion.router, prefix="/subdireccions", tags=["Subdireccion"])
api_router.include_router(celula.router, prefix="/celulas", tags=["Celula"])
api_router.include_router(repositorio.router, prefix="/repositorios", tags=["Repositorio"])
api_router.include_router(activo_web.router, prefix="/activo_webs", tags=["ActivoWeb"])
api_router.include_router(servicio.router, prefix="/servicios", tags=["Servicio"])
api_router.include_router(aplicacion_movil.router, prefix="/aplicacion_movils", tags=["AplicacionMovil"])
api_router.include_router(tipo_prueba.router, prefix="/tipo_pruebas", tags=["TipoPrueba"])
api_router.include_router(control_seguridad.router, prefix="/control_seguridads", tags=["ControlSeguridad"])

# ─── Módulo 2 — ReglaSoD está bajo /api/v1/admin/regla-sods ──────────────────

# ─── Módulo 9 — Gestión de Vulnerabilidades ───────────────────────────────────
api_router.include_router(vulnerabilidad.router, prefix="/vulnerabilidads", tags=["Vulnerabilidad"])
api_router.include_router(
    historial_vulnerabilidad.router,
    prefix="/historial_vulnerabilidads",
    tags=["Historial Vulnerabilidad"],
)
api_router.include_router(
    excepcion_vulnerabilidad.router,
    prefix="/excepcion_vulnerabilidads",
    tags=["Excepcion Vulnerabilidad"],
)
api_router.include_router(
    aceptacion_riesgo.router,
    prefix="/aceptacion_riesgos",
    tags=["Aceptacion Riesgo"],
)
api_router.include_router(
    evidencia_remediacion.router,
    prefix="/evidencia_remediacions",
    tags=["Evidencia Remediacion"],
)
