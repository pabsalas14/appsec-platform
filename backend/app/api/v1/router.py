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
    # ── Módulo 8 — Operación (Releases) ────────────────────────────────────
    service_release,
    etapa_release,
    pipeline_release,
    hallazgo_pipeline,
    revision_tercero,
    hallazgo_tercero,
    # ── Módulo 3 — Programas Anuales ────────────────────────────────────────
    programa_sast,
    actividad_mensual_sast,
    hallazgo_sast,
    programa_dast,
    ejecucion_dast,
    hallazgo_dast,
    programa_threat_modeling,
    sesion_threat_modeling,
    amenaza,
    control_mitigacion,
    programa_source_code,
    control_source_code,
    revision_source_code,
    servicio_regulado_registro,
    regulacion_control,
    evidencia_regulacion,
    estado_cumplimiento,
    # ── Módulo 4 — MAST ───────────────────────────────────────────────────────
    ejecucion_mast,
    hallazgo_mast,
    # ── Módulo 1 — Catálogos Centrales (Organización) ──────────────────────────
    organizacion,
    gerencia,
    # ── Módulo 5 — Iniciativas ────────────────────────────────────────────────
    iniciativa,
    hito_iniciativa,
    actualizacion_iniciativa,
    # ── Módulo 6 — Auditorías ─────────────────────────────────────────────────
    auditoria,
    hallazgo_auditoria,
    evidencia_auditoria,
    plan_remediacion,
    # ── Módulo 7 — Temas Emergentes ───────────────────────────────────────────
    tema_emergente,
    actualizacion_tema,
    cierre_conclusion,
    # ── Módulo 2 — Panel de Administración (transversal) ──────────────────────
    flujo_estatus,
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
api_router.include_router(service_release.router, prefix="/service_releases", tags=["Service_release"])
api_router.include_router(etapa_release.router, prefix="/etapa_releases", tags=["Etapa_release"])
api_router.include_router(pipeline_release.router, prefix="/pipeline_releases", tags=["Pipeline_release"])
api_router.include_router(hallazgo_pipeline.router, prefix="/hallazgo_pipelines", tags=["Hallazgo_pipeline"])
api_router.include_router(revision_tercero.router, prefix="/revision_terceros", tags=["Revision_tercero"])
api_router.include_router(hallazgo_tercero.router, prefix="/hallazgo_terceros", tags=["Hallazgo_tercero"])
api_router.include_router(programa_sast.router, prefix="/programa_sasts", tags=["Programa_sast"])
api_router.include_router(actividad_mensual_sast.router, prefix="/actividad_mensual_sasts", tags=["Actividad_mensual_sast"])
api_router.include_router(hallazgo_sast.router, prefix="/hallazgo_sasts", tags=["Hallazgo_sast"])
api_router.include_router(programa_dast.router, prefix="/programa_dasts", tags=["Programa_dast"])
api_router.include_router(ejecucion_dast.router, prefix="/ejecucion_dasts", tags=["Ejecucion_dast"])
api_router.include_router(hallazgo_dast.router, prefix="/hallazgo_dasts", tags=["Hallazgo_dast"])
api_router.include_router(programa_threat_modeling.router, prefix="/programa_threat_modelings", tags=["Programa_threat_modeling"])
api_router.include_router(sesion_threat_modeling.router, prefix="/sesion_threat_modelings", tags=["Sesion_threat_modeling"])
api_router.include_router(amenaza.router, prefix="/amenazas", tags=["Amenaza"])
api_router.include_router(control_mitigacion.router, prefix="/control_mitigacions", tags=["Control_mitigacion"])
api_router.include_router(programa_source_code.router, prefix="/programa_source_codes", tags=["Programa_source_code"])
api_router.include_router(control_source_code.router, prefix="/control_source_codes", tags=["Control_source_code"])
api_router.include_router(revision_source_code.router, prefix="/revision_source_codes", tags=["Revision_source_code"])
api_router.include_router(servicio_regulado_registro.router, prefix="/servicio_regulado_registros", tags=["Servicio_regulado_registro"])
api_router.include_router(regulacion_control.router, prefix="/regulacion_controls", tags=["Regulacion_control"])
api_router.include_router(evidencia_regulacion.router, prefix="/evidencia_regulacions", tags=["Evidencia_regulacion"])
api_router.include_router(estado_cumplimiento.router, prefix="/estado_cumplimientos", tags=["Estado_cumplimiento"])
api_router.include_router(ejecucion_mast.router, prefix="/ejecucion_masts", tags=["Ejecucion_mast"])
api_router.include_router(hallazgo_mast.router, prefix="/hallazgo_masts", tags=["Hallazgo_mast"])

# ─── Módulo 1 — Catálogos Centrales (Organización) ──────────────────────────
api_router.include_router(organizacion.router, prefix="/organizacions", tags=["Organizacion"])
api_router.include_router(gerencia.router, prefix="/gerencias", tags=["Gerencia"])

# ─── Módulo 5 — Iniciativas ───────────────────────────────────────────────────
api_router.include_router(iniciativa.router, prefix="/iniciativas", tags=["Iniciativa"])
api_router.include_router(hito_iniciativa.router, prefix="/hito_iniciativas", tags=["Hito_iniciativa"])
api_router.include_router(actualizacion_iniciativa.router, prefix="/actualizacion_iniciativas", tags=["Actualizacion_iniciativa"])

# ─── Módulo 6 — Auditorías ────────────────────────────────────────────────────
api_router.include_router(auditoria.router, prefix="/auditorias", tags=["Auditoria"])
api_router.include_router(hallazgo_auditoria.router, prefix="/hallazgo_auditorias", tags=["Hallazgo_auditoria"])
api_router.include_router(evidencia_auditoria.router, prefix="/evidencia_auditorias", tags=["Evidencia_auditoria"])
api_router.include_router(plan_remediacion.router, prefix="/plan_remediacions", tags=["Plan_remediacion"])

# ─── Módulo 7 — Temas Emergentes ──────────────────────────────────────────────
api_router.include_router(tema_emergente.router, prefix="/temas_emergentes", tags=["Tema_emergente"])
api_router.include_router(actualizacion_tema.router, prefix="/actualizacion_temas", tags=["Actualizacion_tema"])
api_router.include_router(cierre_conclusion.router, prefix="/cierre_conclusiones", tags=["Cierre_conclusion"])

# ─── Módulo 2 — Panel de Administración (transversal) ─────────────────────────
api_router.include_router(flujo_estatus.router, prefix="/flujos_estatus", tags=["Flujo_estatus"])
