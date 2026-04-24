"""
Alembic environment configuration — async-aware.

Reads the DATABASE_URL from ``app.config.settings`` so the connection string
is always consistent with the running application.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

from app.config import settings
from app.database import Base

# Import ALL models here so Alembic can detect them for --autogenerate.
import app.models.user            # noqa: F401
import app.models.task            # noqa: F401
import app.models.refresh_token   # noqa: F401
import app.models.audit_log       # noqa: F401
import app.models.project         # noqa: F401
import app.models.role            # noqa: F401
import app.models.system_setting  # noqa: F401
import app.models.attachment      # noqa: F401

# ─── Alembic Config ──────────────────────────────────────────────────────────

config = context.config

# Override sqlalchemy.url with the real async URL from settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

import app.models.subdireccion   # noqa: F401

import app.models.celula   # noqa: F401

import app.models.repositorio   # noqa: F401

import app.models.activo_web   # noqa: F401

import app.models.servicio   # noqa: F401

import app.models.aplicacion_movil   # noqa: F401

import app.models.tipo_prueba   # noqa: F401

import app.models.control_seguridad   # noqa: F401

import app.models.regla_so_d   # noqa: F401

import app.models.herramienta_externa   # noqa: F401

import app.models.vulnerabilidad   # noqa: F401

import app.models.historial_vulnerabilidad   # noqa: F401

import app.models.excepcion_vulnerabilidad   # noqa: F401

import app.models.aceptacion_riesgo   # noqa: F401

import app.models.evidencia_remediacion   # noqa: F401

import app.models.service_release   # noqa: F401

import app.models.etapa_release   # noqa: F401

import app.models.pipeline_release   # noqa: F401

import app.models.hallazgo_pipeline   # noqa: F401

import app.models.revision_tercero   # noqa: F401

import app.models.hallazgo_tercero   # noqa: F401

import app.models.programa_sast   # noqa: F401

import app.models.actividad_mensual_sast   # noqa: F401

import app.models.hallazgo_sast   # noqa: F401

import app.models.programa_dast   # noqa: F401

import app.models.ejecucion_dast   # noqa: F401

import app.models.hallazgo_dast   # noqa: F401

import app.models.programa_threat_modeling   # noqa: F401

import app.models.sesion_threat_modeling   # noqa: F401

import app.models.amenaza   # noqa: F401

import app.models.control_mitigacion   # noqa: F401

import app.models.programa_source_code   # noqa: F401

import app.models.control_source_code   # noqa: F401

import app.models.revision_source_code   # noqa: F401

import app.models.servicio_regulado_registro   # noqa: F401

import app.models.regulacion_control   # noqa: F401

import app.models.evidencia_regulacion   # noqa: F401

import app.models.estado_cumplimiento   # noqa: F401

import app.models.ejecucion_mast   # noqa: F401

import app.models.hallazgo_mast   # noqa: F401

import app.models.iniciativa   # noqa: F401

import app.models.organizacion   # noqa: F401

import app.models.gerencia   # noqa: F401

target_metadata = Base.metadata


# ─── Offline mode (generates SQL without connecting) ─────────────────────────

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# ─── Online mode (async connection) ─────────────────────────────────────────

def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine and run migrations."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


# ─── Entry point ─────────────────────────────────────────────────────────────

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
