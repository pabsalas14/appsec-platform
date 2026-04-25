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

from app.config import settings
from app.core.logging import configure_logging, logger
from app.core.security import hash_password, validate_password_strength
from app.database import async_session
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.models.regla_so_d import ReglaSoD
from app.models.tipo_prueba import TipoPrueba
from app.models.control_seguridad import ControlSeguridad
from app.models.herramienta_externa import HerramientaExterna
from app.api.v1.admin.settings import DEFAULT_SETTINGS


# ─── Admin user ───────────────────────────────────────────────────────────────

async def _seed_admin(db) -> User:
    """Create the initial admin user if it doesn't exist. Returns the user."""
    result = await db.execute(select(User).where(User.username == "admin"))
    existing = result.scalar_one_or_none()

    if existing:
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


# ─── System settings ─────────────────────────────────────────────────────────

async def _seed_settings(db) -> None:
    """Insert all DEFAULT_SETTINGS using on_conflict_do_nothing."""
    count = 0
    for row in DEFAULT_SETTINGS:
        stmt = (
            pg_insert(SystemSetting)
            .values(**row)
            .on_conflict_do_nothing(index_elements=[SystemSetting.key])
        )
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
    {"nombre": "SAST — Análisis Estático",     "categoria": "SAST", "descripcion": "Análisis de código fuente sin ejecución"},
    {"nombre": "DAST — Análisis Dinámico",      "categoria": "DAST", "descripcion": "Análisis de la aplicación en ejecución"},
    {"nombre": "SCA — Composición de Software", "categoria": "SCA",  "descripcion": "Análisis de dependencias y OSS"},
    {"nombre": "Threat Modeling",               "categoria": "TM",   "descripcion": "Modelado de amenazas y arquitectura"},
    {"nombre": "MAST — Análisis Móvil",         "categoria": "MAST", "descripcion": "Análisis estático y dinámico de apps móviles"},
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
    {"nombre": "Branch Protection (PRs requeridos)",          "tipo": "fuente",          "descripcion": "Requiere PRs con revisores para fusionar a rama principal", "obligatorio": True},
    {"nombre": "Secret Scanning habilitado",                  "tipo": "fuente",          "descripcion": "Escaneo automático de secretos en todos los commits",       "obligatorio": True},
    {"nombre": "Dependency Alerts habilitado",                "tipo": "sca",             "descripcion": "Alertas automáticas de dependencias vulnerables",           "obligatorio": True},
    {"nombre": "SAST en CI/CD",                               "tipo": "pipeline",        "descripcion": "Análisis estático en cada Pull Request",                   "obligatorio": True},
    {"nombre": "DAST en ambiente de staging",                 "tipo": "pipeline",        "descripcion": "Análisis dinámico antes de promover a producción",         "obligatorio": False},
    {"nombre": "Image Scanning (contenedores)",               "tipo": "infraestructura", "descripcion": "Escaneo de vulnerabilidades en imágenes Docker",           "obligatorio": True},
    {"nombre": "IaC Scanning (Terraform/Helm)",               "tipo": "infraestructura", "descripcion": "Análisis estático de infraestructura como código",        "obligatorio": False},
    {"nombre": "Pentest anual externo",                       "tipo": "auditoria",       "descripcion": "Prueba de penetración por tercero independiente",          "obligatorio": True},
    {"nombre": "Threat Modeling por servicio crítico",        "tipo": "arquitectura",    "descripcion": "TM obligatorio para servicios de criticidad alta o crítica","obligatorio": True},
    {"nombre": "MFA en accesos privilegiados",                "tipo": "acceso",          "descripcion": "Multi-factor en todos los accesos con privilegios elevados","obligatorio": True},
    {"nombre": "SBOM generado en cada release",               "tipo": "sca",             "descripcion": "Software Bill of Materials automático por release",        "obligatorio": False},
    {"nombre": "Revisión de código de seguridad (SAST manual)","tipo": "fuente",         "descripcion": "Revisión manual por equipo AppSec en cambios críticos",   "obligatorio": False},
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
    {"nombre": "SonarQube",            "tipo": "SAST",                  "url_base": "https://sonarqube.internal.example.com", "api_token": "sq_token_placeholder"},
    {"nombre": "GitHub Advanced Sec.", "tipo": "SCA",                   "url_base": "https://api.github.com",                 "api_token": "ghp_placeholder_token"},
    {"nombre": "DefectDojo",           "tipo": "VulnerabilityManager",  "url_base": "https://defectdojo.internal.example.com","api_token": "dd_placeholder_token"},
    {"nombre": "BurpSuite Enterprise", "tipo": "DAST",                  "url_base": "https://burp.internal.example.com",      "api_token": "burp_placeholder_token"},
    {"nombre": "Trivy",                "tipo": "CI/CD",                 "url_base": "",                                       "api_token": ""},
]


async def _seed_herramientas(db, admin_id: uuid.UUID) -> None:
    count = 0
    for herr in HERRAMIENTAS_SEEDS:
        # Avoid duplicate tools by name
        result = await db.execute(
            select(HerramientaExterna).where(HerramientaExterna.nombre == herr["nombre"])
        )
        if result.scalar_one_or_none():
            continue
        db.add(HerramientaExterna(id=uuid.uuid4(), user_id=admin_id, **herr))
        count += 1
    await db.flush()
    logger.info(
        "seed.herramienta_externa_inserted",
        extra={"event": "seed.herramienta_externa_inserted", "new_count": count},
    )


# ─── Entry point ─────────────────────────────────────────────────────────────

async def seed() -> None:
    """Run all seed operations. Safe to run multiple times."""
    logger.info("seed.start", extra={"event": "seed.start"})

    async with async_session() as db, db.begin():
        admin = await _seed_admin(db)
        await _seed_settings(db)
        await _seed_regla_sods(db, admin.id)
        await _seed_tipos_prueba(db, admin.id)
        await _seed_controles(db, admin.id)
        await _seed_herramientas(db, admin.id)

    logger.info("seed.complete", extra={"event": "seed.complete"})


if __name__ == "__main__":
    configure_logging(settings)
    asyncio.run(seed())
