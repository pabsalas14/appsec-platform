"""Registra todas las clases ORM en ``Base.metadata``.

Usar en scripts (p. ej. ``seed``) y mantener alineado con ``alembic/env.py``:
importar aquí y llamar `import_all_orm()` al inicio, para que las relaciones
cruzadas resuelvan sin cargar toda la app FastAPI.
"""


def import_all_orm() -> None:
    import app.models.user  # noqa: F401
    import app.models.task  # noqa: F401
    import app.models.refresh_token  # noqa: F401
    import app.models.audit_log  # noqa: F401
    import app.models.project  # noqa: F401
    import app.models.role  # noqa: F401
    import app.models.system_setting  # noqa: F401
    import app.models.attachment  # noqa: F401
    import app.models.subdireccion  # noqa: F401
    import app.models.celula  # noqa: F401
    import app.models.repositorio  # noqa: F401
    import app.models.activo_web  # noqa: F401
    import app.models.servicio  # noqa: F401
    import app.models.aplicacion_movil  # noqa: F401
    import app.models.tipo_prueba  # noqa: F401
    import app.models.control_seguridad  # noqa: F401
    import app.models.regla_so_d  # noqa: F401
    import app.models.herramienta_externa  # noqa: F401
    import app.models.vulnerabilidad  # noqa: F401
    import app.models.historial_vulnerabilidad  # noqa: F401
    import app.models.excepcion_vulnerabilidad  # noqa: F401
    import app.models.aceptacion_riesgo  # noqa: F401
    import app.models.evidencia_remediacion  # noqa: F401
    import app.models.service_release  # noqa: F401
    import app.models.etapa_release  # noqa: F401
    import app.models.pipeline_release  # noqa: F401
    import app.models.hallazgo_pipeline  # noqa: F401
    import app.models.revision_tercero  # noqa: F401
    import app.models.hallazgo_tercero  # noqa: F401
    import app.models.programa_sast  # noqa: F401
    import app.models.actividad_mensual_sast  # noqa: F401
    import app.models.hallazgo_sast  # noqa: F401
    import app.models.programa_dast  # noqa: F401
    import app.models.ejecucion_dast  # noqa: F401
    import app.models.hallazgo_dast  # noqa: F401
    import app.models.programa_threat_modeling  # noqa: F401
    import app.models.sesion_threat_modeling  # noqa: F401
    import app.models.amenaza  # noqa: F401
    import app.models.control_mitigacion  # noqa: F401
    import app.models.programa_source_code  # noqa: F401
    import app.models.control_source_code  # noqa: F401
    import app.models.revision_source_code  # noqa: F401
    import app.models.servicio_regulado_registro  # noqa: F401
    import app.models.regulacion_control  # noqa: F401
    import app.models.evidencia_regulacion  # noqa: F401
    import app.models.estado_cumplimiento  # noqa: F401
    import app.models.ejecucion_mast  # noqa: F401
    import app.models.hallazgo_mast  # noqa: F401
    import app.models.iniciativa  # noqa: F401
    import app.models.organizacion  # noqa: F401
    import app.models.gerencia  # noqa: F401
    import app.models.hito_iniciativa  # noqa: F401
    import app.models.actualizacion_iniciativa  # noqa: F401
    import app.models.auditoria  # noqa: F401
    import app.models.hallazgo_auditoria  # noqa: F401
    import app.models.evidencia_auditoria  # noqa: F401
    import app.models.plan_remediacion  # noqa: F401
    import app.models.tema_emergente  # noqa: F401
    import app.models.actualizacion_tema  # noqa: F401
    import app.models.cierre_conclusion  # noqa: F401
    import app.models.flujo_estatus  # noqa: F401
    import app.models.indicador_formula  # noqa: F401
    import app.models.filtro_guardado  # noqa: F401
    import app.models.dashboard_config  # noqa: F401
    import app.models.changelog_entrada  # noqa: F401
    import app.models.notificacion  # noqa: F401
