"""
Database seed script — bootstraps initial data for the AppSec Platform.

Idempotente: usa on_conflict_do_nothing en todos los inserts.
Seguro de ejecutar múltiples veces — nunca sobreescribe datos existentes.

Usage:
    python -m app.seed
    make seed
"""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.admin.settings import DEFAULT_SETTINGS
from app.config import settings
from app.core.logging import configure_logging, logger
from app.core.security import hash_password, validate_password_strength
from app.database import async_session
from app.orm_bootstrap import import_all_orm

import_all_orm()

from app.models.catalog import Catalog
from app.models.control_seguridad import ControlSeguridad
from app.models.herramienta_externa import HerramientaExterna
from app.models.indicador_formula import IndicadorFormula
from app.models.regla_so_d import ReglaSoD
from app.models.role import Role
from app.models.system_setting import SystemSetting
from app.models.tipo_prueba import TipoPrueba
from app.models.user import User

# ─── Admin user ───────────────────────────────────────────────────────────────


async def _seed_admin(db) -> User:
    """Create the initial admin user if it doesn't exist. Returns the user."""
    result = await db.execute(select(User).where(User.username == "admin"))
    existing = result.scalar_one_or_none()

    if existing:
        if settings.SEED_FORCE_ADMIN_PASSWORD:
            validate_password_strength(settings.ADMIN_PASSWORD, username="admin")
            existing.hashed_password = hash_password(settings.ADMIN_PASSWORD)
            await db.flush()
            await db.refresh(existing)
            logger.warning(
                "seed.admin_password_reset",
                extra={"event": "seed.admin_password_reset", "user_id": str(existing.id)},
            )
        logger.info(
            "seed.admin_exists",
            extra={"event": "seed.admin_exists", "user_id": str(existing.id)},
        )
        return existing

    validate_password_strength(settings.ADMIN_PASSWORD, username="admin")
    admin = User(
        username="admin",
        email=settings.ADMIN_EMAIL,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        full_name="AppSec Administrator",
        role="admin",
        is_active=True,
    )
    db.add(admin)
    await db.flush()
    await db.refresh(admin)
    logger.info(
        "seed.admin_created",
        extra={
            "event": "seed.admin_created",
            "username": admin.username,
            "user_id": str(admin.id),
        },
    )
    return admin


# ─── Roles (SEMANA 0 — 4 nuevos roles) ─────────────────────────────────────────

ROLES_SEEDS = [
    {"name": "ciso", "description": "Chief Information Security Officer — visibilidad total"},
    {"name": "responsable_celula", "description": "Responsable de Célula — gestiona su célula"},
    {"name": "director_subdireccion", "description": "Director de Subdirección — ve datos de subdirección"},
    {"name": "lider_liberaciones", "description": "Líder de Liberaciones — gestiona flujo Kanban"},
]


async def _seed_roles(db) -> None:
    """Create base roles if they don't exist. SEMANA 0: Agrega 4 nuevos roles."""
    count = 0
    for role_data in ROLES_SEEDS:
        result = await db.execute(select(Role).where(Role.name == role_data["name"]))
        if result.scalar_one_or_none():
            continue
        db.add(Role(id=uuid.uuid4(), **role_data))
        count += 1
    await db.flush()
    if count:
        logger.info(
            "seed.roles_created",
            extra={"event": "seed.roles_created", "new_count": count, "roles": [r["name"] for r in ROLES_SEEDS]},
        )


# ─── System settings ─────────────────────────────────────────────────────────


async def _seed_settings(db) -> None:
    """Insert all DEFAULT_SETTINGS using on_conflict_do_nothing."""
    count = 0
    for row in DEFAULT_SETTINGS:
        stmt = pg_insert(SystemSetting).values(**row).on_conflict_do_nothing(index_elements=[SystemSetting.key])
        result = await db.execute(stmt)
        if result.rowcount:
            count += 1
    await db.flush()
    logger.info(
        "seed.settings_upserted",
        extra={
            "event": "seed.settings_upserted",
            "new_count": count,
            "defined_total": len(DEFAULT_SETTINGS),
        },
    )


# ─── Reglas SoD ───────────────────────────────────────────────────────────────

SOD_SEEDS = [
    {
        "accion": "vulnerabilidad.aceptar_riesgo",
        "enabled": True,
        "descripcion": "Quien registra el riesgo no puede ser quien lo aprueba",
        "alcance": "global",
    },
    {
        "accion": "vulnerabilidad.aprobar_excepcion",
        "enabled": True,
        "descripcion": "Quien solicita la excepción no puede aprobarla",
        "alcance": "global",
    },
    {
        "accion": "release.aprobar",
        "enabled": True,
        "descripcion": "Quien crea el release no puede aprobarlo",
        "alcance": "global",
    },
    {
        "accion": "auditoria.cerrar_hallazgo",
        "enabled": False,
        "descripcion": "SoD en cierre de hallazgos (desactivado por default)",
        "alcance": "auditoria",
    },
    {
        "accion": "scoring.aprobar_excepcion_kri",
        "enabled": True,
        "descripcion": "El analista que detecta el KRI no puede aprobar la excepción",
        "alcance": "scoring",
    },
]


async def _seed_regla_sods(db, admin_id: uuid.UUID) -> None:
    count = 0
    for sod in SOD_SEEDS:
        stmt = (
            pg_insert(ReglaSoD)
            .values(
                id=uuid.uuid4(),
                user_id=admin_id,
                **sod,
            )
            .on_conflict_do_nothing(index_elements=[ReglaSoD.accion])
        )
        result = await db.execute(stmt)
        if result.rowcount:
            count += 1
    await db.flush()
    logger.info(
        "seed.regla_sod_inserted",
        extra={"event": "seed.regla_sod_inserted", "new_count": count},
    )


# ─── Tipos de prueba base ─────────────────────────────────────────────────────

TIPO_PRUEBA_SEEDS = [
    {
        "nombre": "SAST — Análisis Estático",
        "categoria": "SAST",
        "descripcion": "Análisis de código fuente sin ejecución",
    },
    {
        "nombre": "DAST — Análisis Dinámico",
        "categoria": "DAST",
        "descripcion": "Análisis de la aplicación en ejecución",
    },
    {"nombre": "SCA — Composición de Software", "categoria": "SCA", "descripcion": "Análisis de dependencias y OSS"},
    {"nombre": "Threat Modeling", "categoria": "TM", "descripcion": "Modelado de amenazas y arquitectura"},
    {
        "nombre": "MAST — Análisis Móvil",
        "categoria": "MAST",
        "descripcion": "Análisis estático y dinámico de apps móviles",
    },
]


async def _seed_tipos_prueba(db, admin_id: uuid.UUID) -> None:
    count = 0
    for tp in TIPO_PRUEBA_SEEDS:
        # Evitar duplicado por name+user_id — check exists primero
        result = await db.execute(
            select(TipoPrueba).where(
                TipoPrueba.nombre == tp["nombre"],
                TipoPrueba.user_id == admin_id,
            )
        )
        if result.scalar_one_or_none():
            continue
        db.add(TipoPrueba(id=uuid.uuid4(), user_id=admin_id, **tp))
        count += 1
    await db.flush()
    logger.info(
        "seed.tipo_prueba_inserted",
        extra={"event": "seed.tipo_prueba_inserted", "new_count": count},
    )


# ─── Controles de seguridad base ──────────────────────────────────────────────

CONTROL_SEEDS = [
    {
        "nombre": "Branch Protection (PRs requeridos)",
        "tipo": "fuente",
        "descripcion": "Requiere PRs con revisores para fusionar a rama principal",
        "obligatorio": True,
    },
    {
        "nombre": "Secret Scanning habilitado",
        "tipo": "fuente",
        "descripcion": "Escaneo automático de secretos en todos los commits",
        "obligatorio": True,
    },
    {
        "nombre": "Dependency Alerts habilitado",
        "tipo": "sca",
        "descripcion": "Alertas automáticas de dependencias vulnerables",
        "obligatorio": True,
    },
    {
        "nombre": "SAST en CI/CD",
        "tipo": "pipeline",
        "descripcion": "Análisis estático en cada Pull Request",
        "obligatorio": True,
    },
    {
        "nombre": "DAST en ambiente de staging",
        "tipo": "pipeline",
        "descripcion": "Análisis dinámico antes de promover a producción",
        "obligatorio": False,
    },
    {
        "nombre": "Image Scanning (contenedores)",
        "tipo": "infraestructura",
        "descripcion": "Escaneo de vulnerabilidades en imágenes Docker",
        "obligatorio": True,
    },
    {
        "nombre": "IaC Scanning (Terraform/Helm)",
        "tipo": "infraestructura",
        "descripcion": "Análisis estático de infraestructura como código",
        "obligatorio": False,
    },
    {
        "nombre": "Pentest anual externo",
        "tipo": "auditoria",
        "descripcion": "Prueba de penetración por tercero independiente",
        "obligatorio": True,
    },
    {
        "nombre": "Threat Modeling por servicio crítico",
        "tipo": "arquitectura",
        "descripcion": "TM obligatorio para servicios de criticidad alta o crítica",
        "obligatorio": True,
    },
    {
        "nombre": "MFA en accesos privilegiados",
        "tipo": "acceso",
        "descripcion": "Multi-factor en todos los accesos con privilegios elevados",
        "obligatorio": True,
    },
    {
        "nombre": "SBOM generado en cada release",
        "tipo": "sca",
        "descripcion": "Software Bill of Materials automático por release",
        "obligatorio": False,
    },
    {
        "nombre": "Revisión de código de seguridad (SAST manual)",
        "tipo": "fuente",
        "descripcion": "Revisión manual por equipo AppSec en cambios críticos",
        "obligatorio": False,
    },
]


async def _seed_controles(db, admin_id: uuid.UUID) -> None:
    count = 0
    for ctrl in CONTROL_SEEDS:
        result = await db.execute(
            select(ControlSeguridad).where(
                ControlSeguridad.nombre == ctrl["nombre"],
                ControlSeguridad.user_id == admin_id,
            )
        )
        if result.scalar_one_or_none():
            continue
        db.add(ControlSeguridad(id=uuid.uuid4(), user_id=admin_id, **ctrl))
        count += 1
    await db.flush()
    logger.info(
        "seed.control_seguridad_inserted",
        extra={"event": "seed.control_seguridad_inserted", "new_count": count},
    )


# ─── Herramientas Externas Base ──────────────────────────────────────────────

HERRAMIENTAS_SEEDS = [
    {
        "nombre": "SonarQube",
        "tipo": "SAST",
        "url_base": "https://sonarqube.internal.example.com",
        "api_token": "sq_token_placeholder",
    },
    {
        "nombre": "GitHub Advanced Sec.",
        "tipo": "SCA",
        "url_base": "https://api.github.com",
        "api_token": "ghp_placeholder_token",
    },
    {
        "nombre": "DefectDojo",
        "tipo": "VulnerabilityManager",
        "url_base": "https://defectdojo.internal.example.com",
        "api_token": "dd_placeholder_token",
    },
    {
        "nombre": "BurpSuite Enterprise",
        "tipo": "DAST",
        "url_base": "https://burp.internal.example.com",
        "api_token": "burp_placeholder_token",
    },
    {"nombre": "Trivy", "tipo": "CI/CD", "url_base": "", "api_token": ""},
]


INDICADOR_FORMULA_SEEDS: list[dict] = [
    {
        "code": "XXX-001",
        "nombre": "Volumen hallazgos críticos + altos (vulnerabilidades)",
        "motor": "multi",
        "formula": {
            "type": "aggregate",
            "aggregation": "sum",
            "items": [
                {"type": "count", "entity": "vulnerabilidad", "filters": [{"field": "severidad", "value": "Critica"}]},
                {"type": "count", "entity": "vulnerabilidad", "filters": [{"field": "severidad", "value": "Alta"}]},
            ],
        },
        "sla_config": {"CRITICA": 7, "ALTA": 30, "MEDIA": 60, "BAJA": 90},
        "threshold_green": 5.0,
        "threshold_yellow": 12.0,
        "threshold_red": 20.0,
        "periodicidad": "monthly",
    },
    {
        "code": "XXX-001b",
        "nombre": "Conteo vulnerabilidades con SLA vencido",
        "motor": "multi",
        "formula": {
            "type": "count",
            "entity": "vulnerabilidad",
            "filters": [{"field": "sla", "value": "vencido"}],
        },
        "sla_config": {"DEFAULT": 30},
        "threshold_green": 0.0,
        "threshold_yellow": 5.0,
        "threshold_red": 15.0,
        "periodicidad": "monthly",
    },
    {
        "code": "XXX-002",
        "nombre": "% Vulnerabilidades en estados de cierre (remediación)",
        "motor": "multi",
        "formula": {
            "type": "ratio",
            "scale": 100.0,
            "numerator": {
                "type": "count",
                "entity": "vulnerabilidad",
                "filters": [
                    {
                        "field": "estado",
                        "op": "in",
                        "value": [
                            "Cerrada",
                            "Remediada",
                            "Cerrado",
                            "Remediada / Verificada",
                            "Falso positivo",
                        ],
                    }
                ],
            },
            "denominator": {"type": "count", "entity": "vulnerabilidad", "filters": []},
            "semantics": {"higher_is_better": True},
        },
        "threshold_green": 80.0,
        "threshold_yellow": 50.0,
        "threshold_red": 30.0,
        "periodicidad": "monthly",
    },
    {
        "code": "XXX-003",
        "nombre": "Backlog aprox. (vulnerabilidades en estados abiertos)",
        "motor": "multi",
        "formula": {
            "type": "count",
            "entity": "vulnerabilidad",
            "filters": [
                {
                    "field": "estado",
                    "op": "in",
                    "value": [
                        "Abierta",
                        "Activa",
                        "Nueva",
                        "En análisis",
                        "Pendiente",
                        "Asignada",
                    ],
                }
            ],
        },
        "threshold_green": 8.0,
        "threshold_yellow": 20.0,
        "threshold_red": 50.0,
        "periodicidad": "monthly",
    },
    {
        "code": "XXX-004",
        "nombre": "% Vulnerabilidades con SLA vencido",
        "motor": "multi",
        "formula": {
            "type": "ratio",
            "scale": 100.0,
            "numerator": {
                "type": "count",
                "entity": "vulnerabilidad",
                "filters": [{"field": "sla", "value": "vencido"}],
            },
            "denominator": {"type": "count", "entity": "vulnerabilidad", "filters": []},
        },
        "threshold_green": 2.0,
        "threshold_yellow": 8.0,
        "threshold_red": 20.0,
        "periodicidad": "monthly",
    },
    {
        "code": "XXX-005",
        "nombre": "Liberaciones de servicio con actividad (conteo)",
        "motor": "multi",
        "formula": {"type": "count", "entity": "service_release", "filters": []},
        "threshold_green": 3.0,
        "threshold_yellow": 10.0,
        "threshold_red": 30.0,
        "periodicidad": "monthly",
    },
    {
        "code": "KRI0025",
        "nombre": "Controles de catálogo (proxy KRI CNBV — afinar con OWASP CNBV)",
        "motor": "catálogo",
        "formula": {
            "type": "count",
            "entity": "control_seguridad",
            "filters": [],
            "semantics": {"higher_is_better": True},
        },
        "threshold_green": 20.0,
        "threshold_yellow": 10.0,
        "threshold_red": 1.0,
        "periodicidad": "quarterly",
    },
]


async def _seed_indicadores_formulas(db, admin_id: uuid.UUID) -> None:
    count = 0
    for row in INDICADOR_FORMULA_SEEDS:
        stmt = (
            pg_insert(IndicadorFormula)
            .values(
                id=uuid.uuid4(),
                user_id=admin_id,
                **row,
            )
            .on_conflict_do_nothing(index_elements=[IndicadorFormula.code])
        )
        result = await db.execute(stmt)
        if result.rowcount:
            count += 1
    await db.flush()
    logger.info(
        "seed.indicador_formula",
        extra={"event": "seed.indicador_formula", "new_count": count},
    )


async def _seed_herramientas(db, admin_id: uuid.UUID) -> None:
    count = 0
    for herr in HERRAMIENTAS_SEEDS:
        # Avoid duplicate tools by name
        result = await db.execute(select(HerramientaExterna).where(HerramientaExterna.nombre == herr["nombre"]))
        if result.scalar_one_or_none():
            continue
        db.add(HerramientaExterna(id=uuid.uuid4(), user_id=admin_id, **herr))
        count += 1
    await db.flush()
    logger.info(
        "seed.herramienta_externa_inserted",
        extra={"event": "seed.herramienta_externa_inserted", "new_count": count},
    )


# ─── Kanban Columns ──────────────────────────────────────────────────────────

KANBAN_COLUMN_SEEDS = [
    {
        "nombre": "Borrador",
        "color": "#6b7280",
        "icono": "file-text",
        "orden": 1,
        "estado_correspondiente": "Borrador",
        "descripcion": "Release en etapa de redacción inicial",
    },
    {
        "nombre": "En Revisión de Diseño",
        "color": "#3b82f6",
        "icono": "eye",
        "orden": 2,
        "estado_correspondiente": "En Revision de Diseno",
        "descripcion": "Esperando revisión del diseño arquitectónico",
    },
    {
        "nombre": "En Validación de Seguridad",
        "color": "#8b5cf6",
        "icono": "shield-check",
        "orden": 3,
        "estado_correspondiente": "En Validacion de Seguridad",
        "descripcion": "En proceso de validación de seguridad",
    },
    {
        "nombre": "Con Observaciones",
        "color": "#f59e0b",
        "icono": "alert-circle",
        "orden": 4,
        "estado_correspondiente": "Con Observaciones",
        "descripcion": "Tiene observaciones pendientes de resolver",
    },
    {
        "nombre": "En Pruebas de Seguridad",
        "color": "#ec4899",
        "icono": "beaker",
        "orden": 5,
        "estado_correspondiente": "En Pruebas de Seguridad",
        "descripcion": "Ejecutando pruebas de seguridad",
    },
    {
        "nombre": "Pendiente Aprobación",
        "color": "#f97316",
        "icono": "check-circle",
        "orden": 6,
        "estado_correspondiente": "Pendiente Aprobación",
        "descripcion": "Esperando aprobación final",
    },
    {
        "nombre": "En QA",
        "color": "#06b6d4",
        "icono": "zap",
        "orden": 7,
        "estado_correspondiente": "En QA",
        "descripcion": "En ambiente de Quality Assurance",
    },
    {
        "nombre": "En Producción",
        "color": "#10b981",
        "icono": "rocket",
        "orden": 8,
        "estado_correspondiente": "En Produccion",
        "descripcion": "Deployed en producción",
    },
]


async def _seed_kanban_columns(db) -> None:
    """Seed kanban columns for release board if they don't exist."""
    from app.models.kanban_column import KanbanColumn

    count = 0
    for col_data in KANBAN_COLUMN_SEEDS:
        stmt = (
            pg_insert(KanbanColumn)
            .values(
                id=uuid.uuid4(),
                **col_data,
            )
            .on_conflict_do_nothing(index_elements=[KanbanColumn.estado_correspondiente])
        )
        result = await db.execute(stmt)
        if result.rowcount:
            count += 1
    await db.flush()
    logger.info(
        "seed.kanban_columns_inserted",
        extra={"event": "seed.kanban_columns_inserted", "new_count": count},
    )


# ─── Catalogs (dynamic enums) ────────────────────────────────────────────────────

CATALOG_SEEDS = [
    {
        "type": "severidades",
        "display_name": "Severidades",
        "description": "Niveles de severidad de vulnerabilidades",
        "values": [
            {"label": "Crítica", "value": "critica", "color": "#dc2626", "order": 1},
            {"label": "Alta", "value": "alta", "color": "#ea580c", "order": 2},
            {"label": "Media", "value": "media", "color": "#f59e0b", "order": 3},
            {"label": "Baja", "value": "baja", "color": "#22c55e", "order": 4},
        ],
    },
    {
        "type": "estados",
        "display_name": "Estados de Vulnerabilidad",
        "description": "Estados del ciclo de vida de vulnerabilidades",
        "values": [
            {"label": "Abierta", "value": "abierta", "color": "#dc2626", "order": 1},
            {"label": "En Progreso", "value": "en_progreso", "color": "#f59e0b", "order": 2},
            {"label": "Cerrada", "value": "cerrada", "color": "#22c55e", "order": 3},
        ],
    },
    {
        "type": "motores",
        "display_name": "Motores de Análisis",
        "description": "Herramientas de análisis de seguridad",
        "values": [
            {"label": "SAST", "value": "sast", "color": "#3b82f6", "order": 1},
            {"label": "DAST", "value": "dast", "color": "#8b5cf6", "order": 2},
            {"label": "SCA", "value": "sca", "color": "#ec4899", "order": 3},
            {"label": "MAST", "value": "mast", "color": "#f97316", "order": 4},
            {"label": "MDA", "value": "mda", "color": "#06b6d4", "order": 5},
            {"label": "Secretos", "value": "secretos", "color": "#14b8a6", "order": 6},
        ],
    },
    {
        "type": "tipos_cambio",
        "display_name": "Tipos de Cambio",
        "description": "Clasificación de cambios en releases",
        "values": [
            {"label": "Hotfix", "value": "hotfix", "color": "#dc2626", "order": 1},
            {"label": "Feature", "value": "feature", "color": "#3b82f6", "order": 2},
            {"label": "Patch", "value": "patch", "color": "#22c55e", "order": 3},
        ],
    },
    {
        "type": "criticidades",
        "display_name": "Criticidades",
        "description": "Niveles de criticidad",
        "values": [
            {"label": "Crítica", "value": "critica", "color": "#dc2626", "order": 1},
            {"label": "Alta", "value": "alta", "color": "#ea580c", "order": 2},
            {"label": "Media", "value": "media", "color": "#f59e0b", "order": 3},
            {"label": "Baja", "value": "baja", "color": "#22c55e", "order": 4},
        ],
    },
    {
        "type": "programas",
        "display_name": "Programas de Seguridad",
        "description": "Programas de prueba de seguridad",
        "values": [
            {"label": "SAST", "value": "sast", "color": "#3b82f6", "order": 1},
            {"label": "DAST", "value": "dast", "color": "#8b5cf6", "order": 2},
            {"label": "SCA", "value": "sca", "color": "#ec4899", "order": 3},
            {"label": "MAST", "value": "mast", "color": "#f97316", "order": 4},
            {"label": "MDA", "value": "mda", "color": "#06b6d4", "order": 5},
            {"label": "Secretos", "value": "secretos", "color": "#14b8a6", "order": 6},
        ],
    },
    {
        "type": "estados_flujo_release",
        "display_name": "Estados Flujo Release",
        "description": "Etapas del flujo de liberación",
        "values": [
            {"label": "Design", "value": "design", "color": "#9333ea", "order": 1},
            {"label": "Validation", "value": "validation", "color": "#7c3aed", "order": 2},
            {"label": "Tests", "value": "tests", "color": "#3b82f6", "order": 3},
            {"label": "QA", "value": "qa", "color": "#06b6d4", "order": 4},
            {"label": "Prod", "value": "prod", "color": "#10b981", "order": 5},
        ],
    },
    {
        "type": "tipos_iniciativas",
        "display_name": "Tipos de Iniciativas",
        "description": "Clasificación de iniciativas",
        "values": [
            {"label": "RFI", "value": "rfi", "color": "#8b5cf6", "order": 1},
            {"label": "Proceso", "value": "proceso", "color": "#f59e0b", "order": 2},
            {"label": "Plataforma", "value": "plataforma", "color": "#3b82f6", "order": 3},
            {"label": "Custom", "value": "custom", "color": "#6b7280", "order": 4},
        ],
    },
    {
        "type": "tipos_temas",
        "display_name": "Tipos de Temas",
        "description": "Clasificación de temas emergentes",
        "values": [
            {"label": "Seguridad", "value": "seguridad", "color": "#dc2626", "order": 1},
            {"label": "Operación", "value": "operacion", "color": "#f59e0b", "order": 2},
            {"label": "Regulatorio", "value": "regulatorio", "color": "#3b82f6", "order": 3},
            {"label": "Custom", "value": "custom", "color": "#6b7280", "order": 4},
        ],
    },
]


async def _seed_catalogs(db) -> None:
    """Seed dynamic catalogs if they don't exist."""
    count = 0
    for cat_data in CATALOG_SEEDS:
        stmt = (
            pg_insert(Catalog)
            .values(
                id=str(uuid.uuid4()),
                type=cat_data["type"],
                display_name=cat_data["display_name"],
                description=cat_data.get("description"),
                values=cat_data.get("values", []),
                is_active=True,
            )
            .on_conflict_do_nothing(index_elements=[Catalog.type])
        )
        result = await db.execute(stmt)
        if result.rowcount:
            count += 1
    await db.flush()
    logger.info(
        "seed.catalogs_inserted",
        extra={"event": "seed.catalogs_inserted", "new_count": count},
    )


async def run_seed(db: AsyncSession) -> None:
    """Ejecuta inserts idempotentes sobre ``db`` (misma transacción que el caller).

    Usar desde tests con el engine de pytest; ``seed()`` delega aquí con ``async_session``.
    """
    from app.seeds.demo_business_seed import seed_demo_business_data
    from app.seeds.navigation_seed import seed_navigation

    admin = await _seed_admin(db)
    await _seed_roles(db)  # SEMANA 0: Crear 4 nuevos roles
    await _seed_settings(db)
    await _seed_regla_sods(db, admin.id)
    await _seed_tipos_prueba(db, admin.id)
    await _seed_controles(db, admin.id)
    await _seed_herramientas(db, admin.id)
    await _seed_indicadores_formulas(db, admin.id)
    await _seed_kanban_columns(db)  # Dashboard 7: Kanban columns
    await _seed_catalogs(db)  # Phase 6: Dynamic catalogs
    await seed_demo_business_data(db, admin)
    await seed_navigation(db)


async def seed() -> None:
    """Run all seed operations. Safe to run multiple times."""
    logger.info("seed.start", extra={"event": "seed.start"})

    async with async_session() as db, db.begin():
        await run_seed(db)

    logger.info("seed.complete", extra={"event": "seed.complete"})


if __name__ == "__main__":
    configure_logging(settings)
    asyncio.run(seed())
