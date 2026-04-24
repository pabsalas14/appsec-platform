"""Admin system-settings endpoints.

Seeds a handful of default settings on first access so the UI has something
editable out of the box.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice
from app.core.exceptions import NotFoundException
from app.core.response import success
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.system_setting import SystemSettingRead, SystemSettingUpsert
from app.services.audit_service import record as audit_record

router = APIRouter()


DEFAULT_SETTINGS: list[dict] = [
    # ── Identidad de la plataforma ────────────────────────────────────────────
    {
        "key": "app.display_name",
        "value": "AppSec Platform",
        "description": "Nombre del producto mostrado en el header del UI.",
    },
    {
        "key": "app.default_theme",
        "value": "dark",
        "description": "Tema inicial para nuevos usuarios (light | dark | system).",
    },
    {
        "key": "features.registration_open",
        "value": False,
        "description": "Si el auto-registro público está habilitado.",
    },
    {
        "key": "features.audit_log_retention_days",
        "value": 365,
        "description": "Días de retención de audit_logs antes de purga.",
    },

    # ── 1. Tipos de programas anuales ─────────────────────────────────────────
    {
        "key": "catalogo.tipos_programa",
        "value": ["SAST", "DAST", "SCA", "Threat Modeling", "MAST", "Source Code Security", "Servicios Regulados"],
        "description": "Tipos de programas anuales disponibles. Editable vía admin.",
    },

    # ── 2. Estatus de vulnerabilidades ────────────────────────────────────────
    {
        "key": "catalogo.estatus_vulnerabilidad",
        "value": [
            {"id": "abierta",        "label": "Abierta",           "color": "red",    "orden": 1, "es_terminal": False},
            {"id": "en_revision",    "label": "En Revisión",       "color": "orange", "orden": 2, "es_terminal": False},
            {"id": "en_remediacion", "label": "En Remediación",    "color": "yellow", "orden": 3, "es_terminal": False},
            {"id": "verificacion",   "label": "En Verificación",   "color": "blue",   "orden": 4, "es_terminal": False},
            {"id": "cerrada",        "label": "Cerrada",           "color": "green",  "orden": 5, "es_terminal": True},
            {"id": "falso_positivo", "label": "Falso Positivo",    "color": "gray",   "orden": 6, "es_terminal": True},
            {"id": "riesgo_aceptado","label": "Riesgo Aceptado",   "color": "purple", "orden": 7, "es_terminal": True},
            {"id": "excepcion",      "label": "Excepción Activa",  "color": "purple", "orden": 8, "es_terminal": False},
        ],
        "description": "Flujo de estatus de vulnerabilidades. Editable vía admin.",
    },

    # ── 3. Tipos de iniciativas ───────────────────────────────────────────────
    {
        "key": "catalogo.tipos_iniciativa",
        "value": ["RFI", "Proceso", "Plataforma", "Capacitación", "Cumplimiento", "Mejora Continua"],
        "description": "Tipos de iniciativas AppSec disponibles.",
    },

    # ── 4. Severidades y SLA base (días) ─────────────────────────────────────
    {
        "key": "sla.severidades",
        "value": [
            {"id": "critica", "label": "Crítica", "color": "red",    "sla_dias": 7,  "cvss_min": 9.0, "cvss_max": 10.0},
            {"id": "alta",    "label": "Alta",    "color": "orange", "sla_dias": 30, "cvss_min": 7.0, "cvss_max": 8.9},
            {"id": "media",   "label": "Media",   "color": "yellow", "sla_dias": 60, "cvss_min": 4.0, "cvss_max": 6.9},
            {"id": "baja",    "label": "Baja",    "color": "blue",   "sla_dias": 90, "cvss_min": 0.1, "cvss_max": 3.9},
            {"id": "info",    "label": "Informativa", "color": "gray", "sla_dias": 180, "cvss_min": 0.0, "cvss_max": 0.0},
        ],
        "description": "Severidades con SLA en días. Ajustable por super_admin.",
    },

    # ── 4b. SLA por motor y severidad ─────────────────────────────────────────
    {
        "key": "sla.por_motor",
        "value": {
            "SAST":            {"critica": 7,  "alta": 30, "media": 60,  "baja": 90},
            "DAST":            {"critica": 7,  "alta": 30, "media": 60,  "baja": 90},
            "SCA":             {"critica": 7,  "alta": 30, "media": 90,  "baja": 180},
            "ThreatModeling":  {"critica": 14, "alta": 45, "media": 90,  "baja": 180},
            "MAST":            {"critica": 7,  "alta": 30, "media": 60,  "baja": 90},
            "Auditoria":       {"critica": 7,  "alta": 30, "media": 90,  "baja": 180},
            "Terceros":        {"critica": 7,  "alta": 30, "media": 60,  "baja": 90},
        },
        "description": "SLA en días por motor de hallazgo y severidad. Sobrescribe sla.severidades por motor.",
    },

    # ── 5. Tipos de auditorías ────────────────────────────────────────────────
    {
        "key": "catalogo.tipos_auditoria",
        "value": ["Interna", "Externa", "Regulatoria", "Red Team", "Penetration Test"],
        "description": "Tipos de auditorías disponibles.",
    },

    # ── 6. Regulaciones y marcos normativos ───────────────────────────────────
    {
        "key": "catalogo.regulaciones",
        "value": [
            {"id": "cnbv",    "nombre": "CNBV",           "descripcion": "Comisión Nacional Bancaria y de Valores"},
            {"id": "pci_dss", "nombre": "PCI DSS v4.0",   "descripcion": "Payment Card Industry Data Security Standard"},
            {"id": "iso27001","nombre": "ISO 27001:2022",  "descripcion": "Gestión de seguridad de la información"},
            {"id": "nist_csf","nombre": "NIST CSF 2.0",   "descripcion": "Cybersecurity Framework"},
            {"id": "owasp_asvs","nombre": "OWASP ASVS 4.0","descripcion": "Application Security Verification Standard"},
            {"id": "sox",     "nombre": "SOX",             "descripcion": "Sarbanes-Oxley Act"},
            {"id": "gdpr",    "nombre": "GDPR",            "descripcion": "General Data Protection Regulation"},
        ],
        "description": "Catálogo de regulaciones y marcos normativos. Editable.",
    },

    # ── 7. Tecnologías del stack ──────────────────────────────────────────────
    {
        "key": "catalogo.tecnologias",
        "value": [
            "Python", "Java", "JavaScript", "TypeScript", "Go", "Rust", "C", "C++",
            "C#", ".NET", "PHP", "Ruby", "Swift", "Kotlin", "Scala",
            "React", "Vue.js", "Angular", "Next.js", "Node.js",
            "Spring Boot", "FastAPI", "Django", "Flask", "Laravel",
            "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
            "Docker", "Kubernetes", "Terraform", "AWS", "GCP", "Azure",
            "Android", "iOS", "React Native", "Flutter",
        ],
        "description": "Tecnologías disponibles para catalogar servicios y repositorios.",
    },

    # ── 8. Pesos de scoring por categoría/motor ───────────────────────────────
    {
        "key": "scoring.pesos_motor",
        "value": {
            "SAST":           {"peso": 25, "descripcion": "Análisis estático de código"},
            "DAST":           {"peso": 25, "descripcion": "Análisis dinámico (web)"},
            "SCA":            {"peso": 20, "descripcion": "Análisis de composición de software"},
            "ThreatModeling": {"peso": 15, "descripcion": "Modelado de amenazas"},
            "MAST":           {"peso": 15, "descripcion": "Análisis de aplicaciones móviles"},
        },
        "description": "Pesos porcentuales por motor para el Security Maturity Score. Deben sumar 100.",
    },
    {
        "key": "scoring.pesos_severidad",
        "value": {
            "critica": 40,
            "alta":    30,
            "media":   20,
            "baja":    10,
        },
        "description": "Pesos por severidad para el cálculo de scoring. Deben sumar 100.",
    },

    # ── 9. Tipos de temas emergentes ──────────────────────────────────────────
    {
        "key": "catalogo.tipos_tema_emergente",
        "value": [
            "Vulnerabilidad Zero-Day",
            "Amenaza Activa (In-The-Wild)",
            "Cambio Regulatorio",
            "Nueva Tecnología en Stack",
            "Breach / Incidente Externo",
            "Advisory de Proveedor",
            "Investigación / Threat Intelligence",
        ],
        "description": "Tipos de temas emergentes disponibles en el módulo de Temas Emergentes.",
    },

    # ── 11. Roles base y permisos ─────────────────────────────────────────────
    {
        "key": "rbac.roles_base",
        "value": [
            {"rol": "super_admin",    "descripcion": "Todo + configuración + gestión de usuarios/roles"},
            {"rol": "chief_appsec",   "descripcion": "Lectura total + aprobaciones + dashboard ejecutivo"},
            {"rol": "lider_programa", "descripcion": "Gestión completa de programas asignados"},
            {"rol": "analista",       "descripcion": "Operación diaria: triaje, actividades, releases"},
            {"rol": "auditor",        "descripcion": "Lectura total (incluye audit logs) sin modificar"},
            {"rol": "readonly",       "descripcion": "Solo dashboards ejecutivos"},
        ],
        "description": "Definición de roles base AppSec. Los roles reales se gestionan en /admin/roles.",
    },

    # ── 12. Plantillas de notificaciones in-app ───────────────────────────────
    {
        "key": "notificaciones.plantillas",
        "value": [
            {"tipo": "sla_proximo",      "activa": True,  "dias_anticipacion": 5,  "descripcion": "SLA próximo a vencer"},
            {"tipo": "vuln_critica",     "activa": True,  "descripcion": "Nueva vulnerabilidad crítica asignada"},
            {"tipo": "release_pendiente","activa": True,  "descripcion": "Release pendiente de aprobación"},
            {"tipo": "estado_cambiado",  "activa": True,  "descripcion": "Cambio de estado en ítem asignado"},
            {"tipo": "reporte_scoring",  "activa": True,  "descripcion": "Reporte mensual de scoring disponible"},
            {"tipo": "sla_vencido",      "activa": True,  "descripcion": "SLA vencido sin remediar"},
        ],
        "description": "Configuración de notificaciones in-app. activa=false deshabilita sin eliminar.",
    },

    # ── 13. Umbrales de semáforos ─────────────────────────────────────────────
    {
        "key": "semaforo.umbrales",
        "value": {
            "cumplimiento_sla": {
                "verde":    {"min": 85, "descripcion": "≥85% de vulns dentro del SLA"},
                "amarillo": {"min": 70, "descripcion": "70%–84% dentro del SLA"},
                "rojo":     {"min": 0,  "descripcion": "<70% dentro del SLA"},
            },
            "scoring_madurez": {
                "verde":    {"min": 75, "descripcion": "Score de madurez ≥75"},
                "amarillo": {"min": 50, "descripcion": "Score entre 50 y 74"},
                "rojo":     {"min": 0,  "descripcion": "Score <50"},
            },
            "kri_cnbv": {
                "verde":    {"max": 10, "descripcion": "≤10% controles deficientes"},
                "amarillo": {"max": 25, "descripcion": "11%–25% controles deficientes"},
                "rojo":     {"max": 100,"descripcion": ">25% controles deficientes"},
            },
        },
        "description": "Umbrales de semáforos verde/amarillo/rojo para dashboards.",
    },

    # ── Reglas SoD iniciales ──────────────────────────────────────────────────
    {
        "key": "sod.reglas_seed",
        "value": [
            {"accion": "vulnerabilidad.aceptar_riesgo",    "enabled": True,  "descripcion": "Quien registra el riesgo no puede ser quien lo aprueba"},
            {"accion": "vulnerabilidad.aprobar_excepcion", "enabled": True,  "descripcion": "Quien solicita la excepción no puede aprobarla"},
            {"accion": "release.aprobar",                  "enabled": True,  "descripcion": "Quien crea el release no puede aprobarlo"},
            {"accion": "auditoria.cerrar_hallazgo",        "enabled": False, "descripcion": "SoD en cierre de hallazgos (desactivado por default)"},
        ],
        "description": "Semilla de reglas SoD. Se crean también como ReglaSoD en la tabla regla_sods vía make seed.",
    },

    # ── IA multi-proveedor ────────────────────────────────────────────────────
    {
        "key": "ia.proveedor_activo",
        "value": "ollama",
        "description": "Proveedor IA activo: ollama | anthropic | openai | openrouter",
    },
    {
        "key": "ia.modelo",
        "value": "llama3.1:8b",
        "description": "Modelo IA activo según el proveedor seleccionado.",
    },
    {
        "key": "ia.temperatura",
        "value": 0.3,
        "description": "Temperatura del modelo IA (0.0 = determinista, 1.0 = creativo).",
    },
    {
        "key": "ia.max_tokens",
        "value": 4096,
        "description": "Máximo de tokens por respuesta IA.",
    },
    {
        "key": "ia.timeout_segundos",
        "value": 60,
        "description": "Timeout en segundos para llamadas al proveedor IA.",
    },
    {
        "key": "ia.sanitizar_datos_paga",
        "value": True,
        "description": "Si True, anonimiza datos sensibles antes de enviar a proveedor de paga.",
    },

    # ── Límites operativos (S4/S6) ────────────────────────────────────────────
    {
        "key": "limites.bulk_max_registros",
        "value": 500,
        "description": "Máximo de registros en operaciones masivas (assign, status change, etc.).",
    },
    {
        "key": "limites.import_csv_max_rows",
        "value": 5000,
        "description": "Máximo de filas por importación CSV.",
    },
    {
        "key": "limites.export_max_rows",
        "value": 10000,
        "description": "Máximo de filas por exportación.",
    },
    {
        "key": "limites.upload_max_mb",
        "value": 10,
        "description": "Tamaño máximo de archivo adjunto en MB.",
    },
    {
        "key": "limites.page_size_max",
        "value": 100,
        "description": "Tamaño máximo de página en endpoints paginados.",
    },

    # ── KRI CNBV ──────────────────────────────────────────────────────────────
    {
        "key": "kri.cnbv_kri0025_ciclo",
        "value": "trimestral",
        "description": "Ciclo de cálculo del KRI0025 CNBV (trimestral | mensual).",
    },
    {
        "key": "kri.cnbv_kri0025_pesos_owasp",
        "value": {
            "A01_broken_access_control":       15,
            "A02_cryptographic_failures":      10,
            "A03_injection":                   15,
            "A04_insecure_design":             10,
            "A05_security_misconfiguration":   10,
            "A06_vulnerable_components":        8,
            "A07_identification_failures":     10,
            "A08_software_data_integrity":      8,
            "A09_logging_monitoring_failures":  7,
            "A10_ssrf":                         7,
        },
        "description": "Pesos por categoría OWASP Top 10 para el KRI0025. Deben sumar 100.",
    },

    # ── Indicadores base (XXX-001 a XXX-005) ──────────────────────────────────
    {
        "key": "indicadores.base",
        "value": [
            {
                "code": "XXX-001",
                "nombre": "# Vulnerabilidades Críticas y Altas identificadas/mes",
                "motor": "multi",
                "formula": {"type": "count", "entity": "hallazgo", "filters": [{"field": "severity", "value": ["CRITICA", "ALTA"]}, {"field": "created_month", "value": "current"}]},
                "sla_config": {"CRITICA": 7, "ALTA": 30, "MEDIA": 60, "BAJA": 90},
                "threshold_green": 5,
                "threshold_yellow": 10,
                "threshold_red": 0,
                "periodicidad": "monthly",
            },
            {
                "code": "XXX-002",
                "nombre": "% de vulnerabilidades Críticas/Altas remediadas",
                "motor": "multi",
                "formula": {"type": "ratio", "numerator": "remediadas", "denominator": "identificadas"},
                "sla_config": {"CRITICA": 7, "ALTA": 30},
                "threshold_green": 85,
                "threshold_yellow": 70,
                "threshold_red": 0,
                "periodicidad": "monthly",
            },
            {
                "code": "XXX-003",
                "nombre": "Backlog activo: Vulnerabilidades Críticas/Altas sin remediar",
                "motor": "multi",
                "formula": {"type": "count", "filters": [{"field": "estatus", "value": ["ABIERTA", "EN_REMEDIACION"]}, {"field": "severidad", "value": ["CRITICA", "ALTA"]}]},
                "sla_config": {"CRITICA": 7, "ALTA": 30},
                "threshold_green": 5,
                "threshold_yellow": 15,
                "threshold_red": 25,
                "periodicidad": "monthly",
            },
            {
                "code": "XXX-004",
                "nombre": "% de vulnerabilidades con SLA vencido",
                "motor": "multi",
                "formula": {"type": "ratio", "numerator": "sla_vencido", "denominator": "activas"},
                "sla_config": {"CRITICA": 7, "ALTA": 30},
                "threshold_green": 0,
                "threshold_yellow": 10,
                "threshold_red": 20,
                "periodicidad": "monthly",
            },
            {
                "code": "XXX-005",
                "nombre": "Cambios/releases con vulnerabilidades Críticas/Altas detectadas",
                "motor": "multi",
                "formula": {"type": "count", "entity": "service_release", "filters": [{"field": "tiene_vulns_altas", "value": True}]},
                "sla_config": {},
                "threshold_green": 0,
                "threshold_yellow": 1,
                "threshold_red": 5,
                "periodicidad": "monthly",
            },
        ],
        "description": "Definición de indicadores base del sistema. Editable vía admin.",
    },

    # ── Dashboards base ───────────────────────────────────────────────────────
    {
        "key": "dashboards.lista",
        "value": [
            {"id": 1, "nombre": "Ejecutivo/General", "icon": "BarChart3", "ruta": "/dashboards/ejecutivo"},
            {"id": 2, "nombre": "Equipo", "icon": "Users", "ruta": "/dashboards/equipo"},
            {"id": 3, "nombre": "Programas Consolidado", "icon": "GitBranch", "ruta": "/dashboards/programas"},
            {"id": 4, "nombre": "Detalle Programa", "icon": "Layers", "ruta": "/dashboards/programa-detalle"},
            {"id": 5, "nombre": "Vulnerabilidades Multi-Dim", "icon": "AlertTriangle", "ruta": "/dashboards/vulns"},
            {"id": 6, "nombre": "Releases (Tabla)", "icon": "Table", "ruta": "/dashboards/releases-tabla"},
            {"id": 7, "nombre": "Releases (Kanban)", "icon": "LayoutGrid", "ruta": "/dashboards/releases-kanban"},
            {"id": 8, "nombre": "Iniciativas", "icon": "CheckSquare", "ruta": "/dashboards/iniciativas"},
            {"id": 9, "nombre": "Temas Emergentes", "icon": "AlertCircle", "ruta": "/dashboards/temas"},
        ],
        "description": "Catálogo de 9 dashboards disponibles en la plataforma.",
    },

    # ── Permisos granulares base ──────────────────────────────────────────────
    {
        "key": "permisos.modulos",
        "value": [
            "vulnerabilidades",
            "releases",
            "programas",
            "iniciativas",
            "auditorias",
            "temas_emergentes",
            "dashboards",
            "admin",
        ],
        "description": "Módulos de la plataforma para RBAC granular.",
    },

    # ── Flujos de estado por entidad ──────────────────────────────────────────
    {
        "key": "flujos.vulnerabilidad_default",
        "value": [
            {"from": "abierta", "to": "en_revision", "allowed": True, "requires_justification": False, "requires_approval": False},
            {"from": "en_revision", "to": "en_remediacion", "allowed": True, "requires_justification": False, "requires_approval": False},
            {"from": "en_remediacion", "to": "verificacion", "allowed": True, "requires_justification": False, "requires_approval": False},
            {"from": "verificacion", "to": "cerrada", "allowed": True, "requires_justification": False, "requires_approval": True},
            {"from": "abierta", "to": "falso_positivo", "allowed": True, "requires_justification": True, "requires_approval": False},
            {"from": "abierta", "to": "riesgo_aceptado", "allowed": True, "requires_justification": True, "requires_approval": True},
        ],
        "description": "Flujo de estados por defecto para vulnerabilidades (configurable).",
    },

    # ── Seguridad Headers (OWASP S8) ──────────────────────────────────────────
    {
        "key": "seguridad.headers_http",
        "value": {
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "X-XSS-Protection": "1; mode=block",
        },
        "description": "Cabeceras HTTP de seguridad OWASP aplicadas por Nginx/FastAPI.",
    },

    # ── Trazabilidad y Auditoría ──────────────────────────────────────────────
    {
        "key": "auditoria.retencion_dias",
        "value": 730,
        "description": "Días de retención de audit logs antes de purga archivada.",
    },
    {
        "key": "auditoria.verificar_hash_chain",
        "value": True,
        "description": "Si True, valida la cadena de hashes de audit log en cada lectura (regla A4).",
    },
]



async def _ensure_seeded(db: AsyncSession) -> None:
    for row in DEFAULT_SETTINGS:
        stmt = (
            pg_insert(SystemSetting)
            .values(**row)
            .on_conflict_do_nothing(index_elements=[SystemSetting.key])
        )
        await db.execute(stmt)
    await db.flush()


@router.get("")
async def list_settings(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    await _ensure_seeded(db)
    rows = (
        await db.execute(select(SystemSetting).order_by(SystemSetting.key))
    ).scalars().all()
    return success(
        [SystemSettingRead.model_validate(r).model_dump(mode="json") for r in rows]
    )


@router.get("/{key}")
async def get_setting(
    key: str,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    row = (
        await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    ).scalar_one_or_none()
    if not row:
        raise NotFoundException("Setting not found")
    return success(SystemSettingRead.model_validate(row).model_dump(mode="json"))


@router.put("/{key}")
async def put_setting(
    key: str,
    payload: SystemSettingUpsert,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_backoffice),
):
    """Upsert a setting by key. The description is optional."""
    row = (
        await db.execute(select(SystemSetting).where(SystemSetting.key == key))
    ).scalar_one_or_none()
    if row is None:
        row = SystemSetting(
            key=key, value=payload.value, description=payload.description
        )
        db.add(row)
    else:
        row.value = payload.value
        if payload.description is not None:
            row.description = payload.description
    await db.flush()
    await db.refresh(row)

    await audit_record(
        db,
        action="system_setting.update",
        entity_type="system_settings",
        entity_id=key,
        metadata={"key": key},
    )
    return success(SystemSettingRead.model_validate(row).model_dump(mode="json"))
