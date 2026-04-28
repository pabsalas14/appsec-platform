"""
Carga de volumen **UAT de un solo golpe** — solo con base de datos desechable.

Inyecta exactamente 5.000 `Vulnerabilidad` con distribución fija (BRD/QA):
  - 1.000 Crítica
  - 2.000 Alta
  - 1.500 Media
  - 500 Baja

Requisitos de seguridad:
  - `SEED_UAT_VOLUME=1` (obligatorio) para no ejecutar por accidente.
  - Depende de un repositorio existente (p. ej. seed demo: `core-banking-api`).

Uso (después de `make clean` + `make up` + `make seed` en DB nueva):

  docker compose exec -e SEED_UAT_VOLUME=1 backend python -m app.seeds.seed_uat_volume

O: `make seed-uat-volumen` (ver Makefile).
"""

from __future__ import annotations

import asyncio
import os

from sqlalchemy import func, select

from app.config import settings
from app.core.logging import configure_logging, logger
from app.database import async_session
from app.models.repositorio import Repositorio
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.orm_bootstrap import import_all_orm
from app.schemas.vulnerabilidad import VulnerabilidadCreate
from app.services.vulnerabilidad_service import vulnerabilidad_svc

import_all_orm()

PREFIX = "[DEMO-VOL] UAT carga — "
# Total 5000: 1000 + 2000 + 1500 + 500
BUCKETS: list[tuple[str, int]] = [
    ("Critica", 1000),
    ("Alta", 2000),
    ("Media", 1500),
    ("Baja", 500),
]
FUENTES = ("SAST", "DAST", "SCA")
TARGET_TOTAL = sum(n for _, n in BUCKETS)


async def _run() -> None:
    if os.environ.get("SEED_UAT_VOLUME") != "1":
        logger.error(
            "seed_uat_volume.blocked",
            extra={"event": "seed_uat_volume.blocked", "reason": "SEED_UAT_VOLUME is not 1"},
        )
        raise SystemExit(2)

    async with async_session() as db, db.begin():
        admin = (await db.execute(select(User).where(User.username == "admin").limit(1))).scalar_one_or_none()
        if not admin:
            logger.error("seed_uat_volume.no_admin", extra={"event": "seed_uat_volume.no_admin"})
            raise SystemExit(1)

        existing = int(
            await db.scalar(
                select(func.count())
                .select_from(Vulnerabilidad)
                .where(Vulnerabilidad.user_id == admin.id, Vulnerabilidad.titulo.startswith(PREFIX))
            )
            or 0
        )
        if existing >= TARGET_TOTAL:
            logger.info(
                "seed_uat_volume.skip",
                extra={"event": "seed_uat_volume.skip", "existing": existing, "target": TARGET_TOTAL},
            )
            logger.info(
                "seed_uat_volume.already_filled",
                extra={
                    "event": "seed_uat_volume.already_filled",
                    "existing": existing,
                    "target": TARGET_TOTAL,
                },
            )
            return

        # Primer repositorio del admin (el demo vive en el primero creado por seed)
        row = await db.execute(
            select(Repositorio)
            .where(Repositorio.user_id == admin.id, Repositorio.deleted_at.is_(None))
            .order_by(Repositorio.created_at)
            .limit(1)
        )
        repo = row.scalar_one_or_none()
        if not repo:
            logger.error("seed_uat_volume.no_repo", extra={"event": "seed_uat_volume.no_repo"})
            raise SystemExit(1)

        base_extra: dict[str, object] = {"user_id": admin.id}
        repo_id = repo.id
        seq = 0
        f_idx = 0
        for severidad, n in BUCKETS:
            for _ in range(n):
                seq += 1
                titulo = f"{PREFIX}n={seq:05d} {severidad}"
                fuente = FUENTES[f_idx % len(FUENTES)]
                f_idx += 1
                schema = VulnerabilidadCreate(
                    titulo=titulo[:255],
                    descripcion="Carga UAT de un solo uso — base desechable.",
                    fuente=fuente,
                    severidad=severidad,
                    estado="abierta",
                    repositorio_id=repo_id,
                )
                await vulnerabilidad_svc.create(db, schema, extra=base_extra)
                if seq % 500 == 0:
                    logger.info(
                        "seed_uat_volume.progress",
                        extra={"event": "seed_uat_volume.progress", "n": seq, "target": TARGET_TOTAL},
                    )

        logger.info(
            "seed_uat_volume.done",
            extra={"event": "seed_uat_volume.done", "total": TARGET_TOTAL, "repositorio_id": str(repo_id)},
        )


def main() -> None:
    configure_logging(settings)
    asyncio.run(_run())


if __name__ == "__main__":
    main()
