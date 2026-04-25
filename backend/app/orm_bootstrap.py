"""Registra todas las clases ORM en ``Base.metadata``.

Usar en scripts (p. ej. ``seed``) y mantener alineado con ``alembic/env.py``:
importar aquí y llamar `import_all_orm()` al inicio, para que las relaciones
cruzadas resuelvan sin cargar toda la app FastAPI.
"""


def import_all_orm() -> None:
    import app.models.aceptacion_riesgo
    import app.models.actividad_mensual_sast
    import app.models.activo_web
    import app.models.actualizacion_iniciativa
    import app.models.actualizacion_tema
    import app.models.amenaza
    import app.models.aplicacion_movil
    import app.models.attachment
    import app.models.audit_log
    import app.models.auditoria
    import app.models.celula
    import app.models.changelog_entrada
    import app.models.cierre_conclusion
    import app.models.control_mitigacion
    import app.models.control_seguridad
    import app.models.control_source_code
    import app.models.dashboard_config
    import app.models.ejecucion_dast
    import app.models.ejecucion_mast
    import app.models.estado_cumplimiento
    import app.models.etapa_release
    import app.models.evidencia_auditoria
    import app.models.evidencia_regulacion
    import app.models.evidencia_remediacion
    import app.models.excepcion_vulnerabilidad
    import app.models.filtro_guardado
    import app.models.flujo_estatus
    import app.models.gerencia
    import app.models.hallazgo_auditoria
    import app.models.hallazgo_dast
    import app.models.hallazgo_mast
    import app.models.hallazgo_pipeline
    import app.models.hallazgo_sast
    import app.models.hallazgo_tercero
    import app.models.herramienta_externa
    import app.models.historial_vulnerabilidad
    import app.models.hito_iniciativa
    import app.models.indicador_formula
    import app.models.iniciativa
    import app.models.notificacion
    import app.models.organizacion
    import app.models.pipeline_release
    import app.models.plan_remediacion
    import app.models.programa_dast
    import app.models.programa_sast
    import app.models.programa_source_code
    import app.models.programa_threat_modeling
    import app.models.project
    import app.models.refresh_token
    import app.models.regla_so_d
    import app.models.regulacion_control
    import app.models.repositorio
    import app.models.revision_source_code
    import app.models.revision_tercero
    import app.models.role
    import app.models.service_release
    import app.models.servicio
    import app.models.servicio_regulado_registro
    import app.models.sesion_threat_modeling
    import app.models.subdireccion
    import app.models.system_setting
    import app.models.task
    import app.models.tema_emergente
    import app.models.tipo_prueba
    import app.models.user
    import app.models.vulnerabilidad  # noqa: F401
