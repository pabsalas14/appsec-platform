"""
Dataset demo (BRD) — idempotente: jerarquía org (marcador `Direccion.codigo`), inventario
y registros por módulo con prefijo «[DEMO]» en títulos clave.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.activo_web import ActivoWeb
from app.models.aplicacion_movil import AplicacionMovil
from app.models.celula import Celula
from app.models.direccion import Direccion
from app.models.gerencia import Gerencia
from app.models.iniciativa import Iniciativa
from app.models.organizacion import Organizacion
from app.models.repositorio import Repositorio
from app.models.service_release import ServiceRelease
from app.models.servicio import Servicio
from app.models.subdireccion import Subdireccion
from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.seeds.demo_business_modules import (
    Ctx,
    ensure_demo_vulnerabilities,
    get_demo_vulnerability_ids,
    seed_programas_y_hallazgos,
)

DEMO_DIRECCION_CODIGO = "DEMO-APPSEC-ROOT"
DEMO_SUB_CODIGO = "DEMO-SUB-TEC"
DEMO_ORG_CODIGO = "DEMO-ORG-001"
DEMO_CEL_NOMBRE = "Célula Pagos y Core"
DEMO_REPO_NOMBRE = "core-banking-api"
DEMO_AW_NOMBRE = "Portal clientes (staging)"
DEMO_SVC_NOMBRE = "API Orquestación Pagos"
DEMO_AM_BUNDLE = "com.appsec.platform.demo.ios"
DEMO_AM_NOMBRE = "App móvil demo (iOS)"


async def _ensure_demo_business_context(db: AsyncSession, admin: User) -> Ctx:
    """Asegura dirección → … → célula, repositorio, activos, app móvil y datos BRD básicos."""
    now = datetime.now(UTC)
    uid = admin.id

    d = (
        await db.execute(
            select(Direccion).where(
                Direccion.user_id == uid,
                Direccion.codigo == DEMO_DIRECCION_CODIGO,
                Direccion.deleted_at.is_(None),
            )
        )
    ).scalar_one_or_none()
    if d is None:
        d = Direccion(
            id=uuid.uuid4(),
            user_id=uid,
            nombre="Dirección Demo AppSec",
            codigo=DEMO_DIRECCION_CODIGO,
            descripcion="Dataset de demostración (seed)",
        )
        db.add(d)
        await db.flush()

    sdir = (
        await db.execute(
            select(Subdireccion).where(
                Subdireccion.user_id == uid,
                Subdireccion.direccion_id == d.id,
                Subdireccion.codigo == DEMO_SUB_CODIGO,
            )
        )
    ).scalar_one_or_none()
    if sdir is None:
        sdir = Subdireccion(
            id=uuid.uuid4(),
            user_id=uid,
            direccion_id=d.id,
            nombre="Subdirección Tecnología",
            codigo=DEMO_SUB_CODIGO,
            descripcion="Subdirección de ejemplo",
        )
        db.add(sdir)
        await db.flush()

    ger = (
        await db.execute(
            select(Gerencia).where(
                Gerencia.user_id == uid,
                Gerencia.subdireccion_id == sdir.id,
                Gerencia.nombre == "Gerencia Plataformas",
            )
        )
    ).scalar_one_or_none()
    if ger is None:
        ger = Gerencia(
            id=uuid.uuid4(),
            user_id=uid,
            subdireccion_id=sdir.id,
            nombre="Gerencia Plataformas",
            descripcion="Gerencia de ejemplo",
        )
        db.add(ger)
        await db.flush()

    org = (
        await db.execute(
            select(Organizacion).where(
                Organizacion.user_id == uid,
                Organizacion.gerencia_id == ger.id,
                Organizacion.codigo == DEMO_ORG_CODIGO,
            )
        )
    ).scalar_one_or_none()
    if org is None:
        org = Organizacion(
            id=uuid.uuid4(),
            user_id=uid,
            gerencia_id=ger.id,
            nombre="Organización Demo (GitHub)",
            codigo=DEMO_ORG_CODIGO,
            descripcion="Organización con célula y repositorio demo",
            plataforma="GitHub",
        )
        db.add(org)
        await db.flush()

    cel = (
        await db.execute(
            select(Celula).where(
                Celula.user_id == uid,
                Celula.organizacion_id == org.id,
                Celula.nombre == DEMO_CEL_NOMBRE,
            )
        )
    ).scalar_one_or_none()
    if cel is None:
        cel = Celula(
            id=uuid.uuid4(),
            user_id=uid,
            organizacion_id=org.id,
            nombre=DEMO_CEL_NOMBRE,
            tipo="Squad",
            descripcion="Squad con inventario y hallazgos demo",
        )
        db.add(cel)
        await db.flush()

    repo = (
        await db.execute(
            select(Repositorio).where(
                Repositorio.user_id == uid,
                Repositorio.celula_id == cel.id,
                Repositorio.nombre == DEMO_REPO_NOMBRE,
            )
        )
    ).scalar_one_or_none()
    if repo is None:
        repo = Repositorio(
            id=uuid.uuid4(),
            user_id=uid,
            organizacion_id=org.id,
            celula_id=cel.id,
            nombre=DEMO_REPO_NOMBRE,
            url="https://github.com/appsec-platform-demo/core-banking-api",
            plataforma="GitHub",
            rama_default="main",
        )
        db.add(repo)
        await db.flush()

    aw = (
        await db.execute(
            select(ActivoWeb).where(
                ActivoWeb.user_id == uid,
                ActivoWeb.celula_id == cel.id,
                ActivoWeb.nombre == DEMO_AW_NOMBRE,
            )
        )
    ).scalar_one_or_none()
    if aw is None:
        aw = ActivoWeb(
            id=uuid.uuid4(),
            user_id=uid,
            celula_id=cel.id,
            nombre=DEMO_AW_NOMBRE,
            url="https://clientes-staging.example.com",
            ambiente="Staging",
            tipo="app",
        )
        db.add(aw)
        await db.flush()

    svc = (
        await db.execute(
            select(Servicio).where(
                Servicio.user_id == uid,
                Servicio.celula_id == cel.id,
                Servicio.nombre == DEMO_SVC_NOMBRE,
            )
        )
    ).scalar_one_or_none()
    if svc is None:
        svc = Servicio(
            id=uuid.uuid4(),
            user_id=uid,
            celula_id=cel.id,
            nombre=DEMO_SVC_NOMBRE,
            descripcion="Servicio crítico — releases demo asociados",
            criticidad="Alta",
        )
        db.add(svc)
        await db.flush()

    amov = (
        await db.execute(
            select(AplicacionMovil).where(
                AplicacionMovil.user_id == uid,
                AplicacionMovil.celula_id == cel.id,
                AplicacionMovil.bundle_id == DEMO_AM_BUNDLE,
            )
        )
    ).scalar_one_or_none()
    if amov is None:
        amov = AplicacionMovil(
            id=uuid.uuid4(),
            user_id=uid,
            celula_id=cel.id,
            nombre=DEMO_AM_NOMBRE,
            plataforma="iOS",
            bundle_id=DEMO_AM_BUNDLE,
        )
        db.add(amov)
        await db.flush()

    for nombre, version, est in [
        ("Release regulación 2026-Q1", "2.1.0", "Pendiente Aprobación"),
        ("Parche de seguridad enero", "1.0.4", "En Pruebas de Seguridad"),
    ]:
        ex_sr = (
            await db.execute(
                select(ServiceRelease).where(
                    ServiceRelease.user_id == uid,
                    ServiceRelease.servicio_id == svc.id,
                    ServiceRelease.nombre == nombre,
                )
            )
        ).scalar_one_or_none()
        if ex_sr is None:
            db.add(
                ServiceRelease(
                    id=uuid.uuid4(),
                    user_id=uid,
                    servicio_id=svc.id,
                    nombre=nombre,
                    version=version,
                    descripcion="Release de demostración",
                    estado_actual=est,
                    fecha_entrada=now - timedelta(days=3),
                )
            )
    await db.flush()

    for titulo, tipo, est in [
        ("Programa anual SAST 2026", "plataforma", "En progreso"),
        ("Estandarizar revisiones tercero", "proceso", "Planificada"),
    ]:
        ex_i = (await db.execute(select(Iniciativa).where(Iniciativa.user_id == uid, Iniciativa.titulo == titulo))).scalar_one_or_none()
        if ex_i is None:
            db.add(
                Iniciativa(
                    id=uuid.uuid4(),
                    user_id=uid,
                    celula_id=cel.id,
                    titulo=titulo,
                    descripcion="Iniciativa demo para vistas de roadmap.",
                    tipo=tipo,
                    estado=est,
                    fecha_inicio=now - timedelta(days=30),
                    fecha_fin_estimada=now + timedelta(days=90),
                )
            )
    await db.flush()

    ex_tema = (
        await db.execute(
            select(TemaEmergente).where(
                TemaEmergente.user_id == uid,
                TemaEmergente.titulo == "Aumento de intentos de fraude en canal digital",
            )
        )
    ).scalar_one_or_none()
    if ex_tema is None:
        db.add(
            TemaEmergente(
                id=uuid.uuid4(),
                user_id=uid,
                celula_id=cel.id,
                titulo="Aumento de intentos de fraude en canal digital",
                descripcion="Tema de ejemplo para módulo de temas emergentes.",
                tipo="operacion",
                impacto="medio",
                estado="en_analisis",
                fuente="Comité riesgo operativo (demo)",
            )
        )
    await db.flush()

    return Ctx(
        uid=uid,
        now=now,
        cel_id=cel.id,
        repo_id=repo.id,
        aw_id=aw.id,
        svc_id=svc.id,
        amov_id=amov.id,
    )


async def seed_demo_business_data(db: AsyncSession, admin: User) -> None:
    """Idempotente: contexto org + vulnerabilidades [DEMO] + todos los módulos sembrados."""
    ctx = await _ensure_demo_business_context(db, admin)
    await ensure_demo_vulnerabilities(db, admin, ctx)
    vids = await get_demo_vulnerability_ids(db, admin.id)
    await seed_programas_y_hallazgos(db, admin, ctx, vids)
    logger.info(
        "seed.demo_business.ok",
        extra={"event": "seed.demo_business.ok", "direccion_codigo": DEMO_DIRECCION_CODIGO},
    )
