"""
Registros demo por dominio (BRD) — idempotencia por `user_id` + nombre/título `«[DEMO] …`».

Llamado solo desde `demo_business_seed.seed_demo_business_data`.
"""

from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.aceptacion_riesgo import AceptacionRiesgo
from app.models.actividad_mensual_dast import ActividadMensualDast
from app.models.actividad_mensual_sast import ActividadMensualSast
from app.models.actividad_mensual_servicios_regulados import ActividadMensualServiciosRegulados
from app.models.actividad_mensual_source_code import ActividadMensualSourceCode
from app.models.actualizacion_iniciativa import ActualizacionIniciativa
from app.models.actualizacion_tema import ActualizacionTema
from app.models.amenaza import Amenaza
from app.models.aplicacion_movil import AplicacionMovil
from app.models.auditoria import Auditoria
from app.models.cierre_conclusion import CierreConclusion
from app.models.changelog_entrada import ChangelogEntrada
from app.models.control_mitigacion import ControlMitigacion
from app.models.control_source_code import ControlSourceCode
from app.models.ejecucion_dast import EjecucionDast
from app.models.ejecucion_mast import EjecucionMAST
from app.models.estado_cumplimiento import EstadoCumplimiento
from app.models.etapa_release import EtapaRelease
from app.models.evidencia_auditoria import EvidenciaAuditoria
from app.models.evidencia_regulacion import EvidenciaRegulacion
from app.models.evidencia_remediacion import EvidenciaRemediacion
from app.models.excepcion_vulnerabilidad import ExcepcionVulnerabilidad
from app.models.filtro_guardado import FiltroGuardado
from app.models.flujo_estatus import FlujoEstatus
from app.models.hallazgo_auditoria import HallazgoAuditoria
from app.models.hallazgo_dast import HallazgoDast
from app.models.hallazgo_mast import HallazgoMAST
from app.models.hallazgo_pipeline import HallazgoPipeline
from app.models.hallazgo_sast import HallazgoSast
from app.models.hallazgo_tercero import HallazgoTercero
from app.models.hito_iniciativa import HitoIniciativa
from app.models.iniciativa import Iniciativa
from app.models.notificacion import Notificacion
from app.models.okr_categoria import OkrCategoria
from app.models.okr_cierre_q import OkrCierreQ
from app.models.okr_compromiso import OkrCompromiso
from app.models.okr_evidencia import OkrEvidencia
from app.models.okr_plan_anual import OkrPlanAnual
from app.models.okr_revision_q import OkrRevisionQ
from app.models.okr_subcompromiso import OkrSubcompromiso
from app.models.pipeline_release import PipelineRelease
from app.models.plan_remediacion import PlanRemediacion
from app.models.programa_dast import ProgramaDast
from app.models.programa_sast import ProgramaSast
from app.models.programa_source_code import ProgramaSourceCode
from app.models.programa_threat_modeling import ProgramaThreatModeling
from app.models.project import Project
from app.models.regulacion_control import RegulacionControl
from app.models.revision_source_code import RevisionSourceCode
from app.models.revision_tercero import RevisionTercero
from app.models.servicio_regulado_registro import ServicioReguladoRegistro
from app.models.service_release import ServiceRelease
from app.models.sesion_threat_modeling import SesionThreatModeling
from app.models.task import Task
from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.schemas.vulnerabilidad import VulnerabilidadCreate
from app.services.vulnerabilidad_service import vulnerabilidad_svc

P = "[DEMO] "

# Revisión tercero (nombre comercial único para idempotencia)
DEMO_TERCERO_EMPRESA = f"{P}Pentest Demo SA"


@dataclass
class Ctx:
    uid: uuid.UUID
    now: datetime
    cel_id: uuid.UUID
    repo_id: uuid.UUID
    aw_id: uuid.UUID
    svc_id: uuid.UUID
    amov_id: uuid.UUID


def _sha() -> str:
    return hashlib.sha256(b"appsec-platform-demo-seed").hexdigest()


async def _count_demo_vulns(db: AsyncSession, uid: uuid.UUID) -> int:
    return int(
        await db.scalar(
            select(func.count())
            .select_from(Vulnerabilidad)
            .where(Vulnerabilidad.user_id == uid, Vulnerabilidad.titulo.startswith("[DEMO]"))
        )
        or 0
    )


async def get_demo_vulnerability_ids(db: AsyncSession, uid: uuid.UUID) -> list[uuid.UUID]:
    r = await db.execute(
        select(Vulnerabilidad.id)
        .where(Vulnerabilidad.user_id == uid, Vulnerabilidad.titulo.startswith("[DEMO]"))
        .order_by(Vulnerabilidad.created_at)
    )
    return [row[0] for row in r.all()]


async def ensure_demo_vulnerabilities(db: AsyncSession, admin: User, ctx: Ctx) -> None:
    if await _count_demo_vulns(db, admin.id) >= 4:
        return
    base_extra = {"user_id": admin.id}
    for spec in [
        {
            "titulo": f"{P}SQLi en búsqueda de cuentas",
            "fuente": "SAST",
            "severidad": "Critica",
            "estado": "abierta",
            "repositorio_id": ctx.repo_id,
        },
        {
            "titulo": f"{P}XSS almacenado en comentarios",
            "fuente": "DAST",
            "severidad": "Alta",
            "estado": "en_remediacion",
            "repositorio_id": ctx.repo_id,
        },
        {
            "titulo": f"{P}Headers de seguridad faltantes",
            "fuente": "DAST",
            "severidad": "Media",
            "estado": "en_revision",
            "activo_web_id": ctx.aw_id,
        },
        {
            "titulo": f"{P}Dependencia con CVE conocida",
            "fuente": "SCA",
            "severidad": "Alta",
            "estado": "cerrada",
            "servicio_id": ctx.svc_id,
        },
    ]:
        schema = VulnerabilidadCreate(
            titulo=spec["titulo"],
            descripcion="Dataset demo (seed) — ver jerarquía org demo.",
            fuente=spec["fuente"],
            severidad=spec["severidad"],
            estado=spec["estado"],
            repositorio_id=spec.get("repositorio_id"),
            activo_web_id=spec.get("activo_web_id"),
            servicio_id=spec.get("servicio_id"),
        )
        await vulnerabilidad_svc.create(db, schema, extra=base_extra)
    await db.flush()


async def seed_programas_y_hallazgos(
    db: AsyncSession, admin: User, ctx: Ctx, vid: list[uuid.UUID]
) -> None:
    # ── SAST
    r = await db.execute(
        select(ProgramaSast).where(ProgramaSast.user_id == admin.id, ProgramaSast.nombre == f"{P}Programa SAST 2026")
    )
    if r.scalar_one_or_none() is None:
        p = ProgramaSast(
            id=uuid.uuid4(),
            user_id=admin.id,
            repositorio_id=ctx.repo_id,
            nombre=f"{P}Programa SAST 2026",
            ano=2026,
            descripcion="Demo SAST",
            estado="Activo",
            metadatos_motor={"proveedor": "SonarQube", "version": "10.x"},
        )
        db.add(p)
        await db.flush()
        am = ActividadMensualSast(
            id=uuid.uuid4(),
            user_id=admin.id,
            programa_sast_id=p.id,
            mes=3,
            ano=2026,
            total_hallazgos=12,
            criticos=1,
            altos=3,
            medios=5,
            bajos=3,
            score=78.0,
        )
        db.add(am)
        await db.flush()
        db.add(
            HallazgoSast(
                id=uuid.uuid4(),
                user_id=admin.id,
                actividad_sast_id=am.id,
                titulo=f"{P}SAST — Uso de crypto débil",
                descripcion="Hallazgo demo",
                severidad="Alta",
                herramienta="Semgrep",
                regla="weak-crypto",
                archivo="app/crypto.py",
                linea=42,
                estado="Abierto",
            )
        )
    await db.flush()

    # ── DAST
    r2 = await db.execute(
        select(ProgramaDast).where(ProgramaDast.user_id == admin.id, ProgramaDast.nombre == f"{P}Programa DAST 2026")
    )
    if r2.scalar_one_or_none() is None:
        pd = ProgramaDast(
            id=uuid.uuid4(),
            user_id=admin.id,
            activo_web_id=ctx.aw_id,
            nombre=f"{P}Programa DAST 2026",
            ano=2026,
            descripcion="Demo DAST",
            estado="Activo",
        )
        db.add(pd)
        await db.flush()
        db.add(
            ActividadMensualDast(
                id=uuid.uuid4(),
                user_id=admin.id,
                programa_dast_id=pd.id,
                mes=3,
                ano=2026,
                total_hallazgos=5,
                criticos=0,
                altos=2,
                medios=2,
                bajos=1,
            )
        )
        ej = EjecucionDast(
            id=uuid.uuid4(),
            user_id=admin.id,
            programa_dast_id=pd.id,
            fecha_inicio=ctx.now,
            fecha_fin=ctx.now,
            ambiente="Staging",
            herramienta="Burp",
            resultado="Exitoso",
        )
        db.add(ej)
        await db.flush()
        db.add(
            HallazgoDast(
                id=uuid.uuid4(),
                user_id=admin.id,
                ejecucion_dast_id=ej.id,
                titulo=f"{P}DAST — reflejado en búsqueda",
                descripcion="Demo",
                severidad="Alta",
                url=f"https://example.com/q=test",
                estado="Abierto",
            )
        )
    await db.flush()

    # ── Threat modeling
    r3 = await db.execute(
        select(ProgramaThreatModeling).where(
            ProgramaThreatModeling.user_id == admin.id, ProgramaThreatModeling.nombre == f"{P}Programa TM 2026"
        )
    )
    if r3.scalar_one_or_none() is None:
        ptm = ProgramaThreatModeling(
            id=uuid.uuid4(),
            user_id=admin.id,
            nombre=f"{P}Programa TM 2026",
            ano=2026,
            descripcion="Demo TM",
            activo_web_id=ctx.aw_id,
            servicio_id=None,
            estado="Activo",
        )
        db.add(ptm)
        await db.flush()
        ses = SesionThreatModeling(
            id=uuid.uuid4(),
            user_id=admin.id,
            programa_tm_id=ptm.id,
            fecha=ctx.now,
            participantes="AppSec, Arquitectura",
            contexto="Sesión demo",
            estado="Completada",
            ia_utilizada=False,
        )
        db.add(ses)
        await db.flush()
        amz = Amenaza(
            id=uuid.uuid4(),
            user_id=admin.id,
            sesion_id=ses.id,
            titulo=f"{P}AMENAZA — suplantación en login",
            descripcion="STRIDE Spoofing",
            categoria_stride="Spoofing",
            dread_damage=6,
            dread_reproducibility=5,
            dread_exploitability=6,
            dread_affected_users=7,
            dread_discoverability=5,
            score_total=5.8,
            estado="Identificada",
        )
        db.add(amz)
        await db.flush()
        db.add(
            ControlMitigacion(
                id=uuid.uuid4(),
                user_id=admin.id,
                amenaza_id=amz.id,
                nombre=f"{P}Control — MFA en login",
                descripcion="Mitigación demo",
                tipo="Preventivo",
                estado="Pendiente",
                responsable_id=admin.id,
            )
        )
    await db.flush()

    # ── Source code security
    r4 = await db.execute(
        select(ProgramaSourceCode).where(
            ProgramaSourceCode.user_id == admin.id, ProgramaSourceCode.nombre == f"{P}Programa Source Code 2026"
        )
    )
    if r4.scalar_one_or_none() is None:
        psc = ProgramaSourceCode(
            id=uuid.uuid4(),
            user_id=admin.id,
            repositorio_id=ctx.repo_id,
            nombre=f"{P}Programa Source Code 2026",
            ano=2026,
            descripcion="Revisiones de controles en código",
            estado="Activo",
        )
        db.add(psc)
        await db.flush()
        ctrl = ControlSourceCode(
            id=uuid.uuid4(),
            user_id=admin.id,
            nombre=f"{P}Control — branch protection",
            tipo="Branch Protection",
            descripcion="Obligatorio en main",
            obligatorio=True,
        )
        db.add(ctrl)
        await db.flush()
        db.add(
            ActividadMensualSourceCode(
                id=uuid.uuid4(),
                user_id=admin.id,
                programa_source_code_id=psc.id,
                mes=3,
                ano=2026,
                total_hallazgos=2,
            )
        )
        db.add(
            RevisionSourceCode(
                id=uuid.uuid4(),
                user_id=admin.id,
                programa_sc_id=psc.id,
                control_sc_id=ctrl.id,
                fecha_revision=ctx.now,
                resultado="Cumple",
                evidencia_filename="evidencia.pdf",
                evidencia_sha256=_sha(),
            )
        )
    await db.flush()

    # ── Servicios regulados
    r5 = await db.execute(
        select(ServicioReguladoRegistro).where(
            ServicioReguladoRegistro.user_id == admin.id, ServicioReguladoRegistro.nombre_regulacion == f"{P}CNBV KRI"
        )
    )
    if r5.scalar_one_or_none() is None:
        srr = ServicioReguladoRegistro(
            id=uuid.uuid4(),
            user_id=admin.id,
            servicio_id=ctx.svc_id,
            nombre_regulacion=f"{P}CNBV KRI",
            ciclo="Q1",
            ano=2026,
            estado="En Revision",
        )
        db.add(srr)
        await db.flush()
        rc = RegulacionControl(
            id=uuid.uuid4(),
            user_id=admin.id,
            nombre_regulacion="CNBV",
            nombre_control=f"{P}Control cifrado en tránsito",
            descripcion="Demo",
            obligatorio=True,
        )
        db.add(rc)
        await db.flush()
        db.add(
            EvidenciaRegulacion(
                id=uuid.uuid4(),
                user_id=admin.id,
                registro_id=srr.id,
                control_id=rc.id,
                descripcion="Evidencia de cumplimiento (demo)",
                filename="compliance.zip",
                sha256=_sha(),
                fecha=ctx.now,
            )
        )
        db.add(
            EstadoCumplimiento(
                id=uuid.uuid4(),
                user_id=admin.id,
                registro_id=srr.id,
                control_id=rc.id,
                estado="Parcial",
                porcentaje=70.0,
                notas="Pendiente hardening",
                fecha_evaluacion=ctx.now,
            )
        )
        db.add(
            ActividadMensualServiciosRegulados(
                id=uuid.uuid4(),
                user_id=admin.id,
                servicio_regulado_registro_id=srr.id,
                mes=3,
                ano=2026,
                total_hallazgos=1,
            )
        )
    await db.flush()

    # ── MAST
    r6 = await db.execute(
        select(EjecucionMAST).where(
            EjecucionMAST.user_id == admin.id, EjecucionMAST.aplicacion_movil_id == ctx.amov_id
        )
    )
    if r6.scalar_one_or_none() is None:
        ejm = EjecucionMAST(
            id=uuid.uuid4(),
            user_id=admin.id,
            aplicacion_movil_id=ctx.amov_id,
            ambiente="Test",
            fecha_inicio=ctx.now - timedelta(days=1),
            fecha_fin=ctx.now,
            resultado="Exitoso",
        )
        db.add(ejm)
        await db.flush()
        db.add(
            HallazgoMAST(
                id=uuid.uuid4(),
                user_id=admin.id,
                ejecucion_mast_id=ejm.id,
                nombre=f"{P}MAST — almacenamiento inseguro",
                descripcion="Demo",
                severidad="Media",
            )
        )
    await db.flush()

    # ── Releases + pipeline
    r7 = await db.execute(
        select(ServiceRelease).where(
            ServiceRelease.user_id == admin.id, ServiceRelease.nombre == f"{P}SR con pipeline y etapas"
        )
    )
    sr = r7.scalar_one_or_none()
    if sr is None:
        sr = ServiceRelease(
            id=uuid.uuid4(),
            user_id=admin.id,
            servicio_id=ctx.svc_id,
            nombre=f"{P}SR con pipeline y etapas",
            version="3.0.0-demo",
            descripcion="Release para etapas y pipeline",
            estado_actual="En Pruebas de Seguridad",
            fecha_entrada=ctx.now,
        )
        db.add(sr)
        await db.flush()
    if sr:
        n_et = await db.scalar(
            select(func.count()).select_from(EtapaRelease).where(EtapaRelease.service_release_id == sr.id)
        )
        if not n_et:
            db.add(
                EtapaRelease(
                    id=uuid.uuid4(),
                    user_id=admin.id,
                    service_release_id=sr.id,
                    etapa="Design Review",
                    estado="Aprobada",
                    aprobador_id=admin.id,
                    fecha_completada=ctx.now,
                )
            )
        n_pl = await db.scalar(
            select(func.count()).select_from(PipelineRelease).where(PipelineRelease.service_release_id == sr.id)
        )
        if not n_pl:
            pl = PipelineRelease(
                id=uuid.uuid4(),
                user_id=admin.id,
                service_release_id=sr.id,
                repositorio_id=ctx.repo_id,
                rama="main",
                scan_id="DEMO-SCAN-1",
                tipo="SAST",
                resultado="Exitoso",
            )
            db.add(pl)
            await db.flush()
            db.add(
                HallazgoPipeline(
                    id=uuid.uuid4(),
                    user_id=admin.id,
                    pipeline_release_id=pl.id,
                    titulo=f"{P}Pipeline — secret en log",
                    descripcion="Demo CI",
                    severidad="Alta",
                    regla="secrets-in-log",
                    estado="Abierto",
                )
            )
    await db.flush()

    # ── Revisión tercero
    r8 = await db.execute(
        select(RevisionTercero).where(
            RevisionTercero.user_id == admin.id, RevisionTercero.nombre_empresa == DEMO_TERCERO_EMPRESA
        )
    )
    if r8.scalar_one_or_none() is None:
        rt = RevisionTercero(
            id=uuid.uuid4(),
            user_id=admin.id,
            nombre_empresa=DEMO_TERCERO_EMPRESA,
            tipo="Pentest",
            servicio_id=ctx.svc_id,
            activo_web_id=None,
            fecha_inicio=ctx.now - timedelta(days=20),
            fecha_fin=ctx.now - timedelta(days=5),
            estado="Completada",
            informe_filename="reporte.pdf",
            informe_sha256=_sha(),
        )
        db.add(rt)
        await db.flush()
        db.add(
            HallazgoTercero(
                id=uuid.uuid4(),
                user_id=admin.id,
                revision_tercero_id=rt.id,
                titulo=f"{P}Tercero — IDOR en API",
                descripcion="Demo",
                severidad="Alta",
                cvss_score=7.1,
                estado="Abierto",
            )
        )
    await db.flush()

    # ── Auditoría
    r9 = await db.execute(select(Auditoria).where(Auditoria.user_id == admin.id, Auditoria.titulo == f"{P}Auditoría interna 2026"))
    if r9.scalar_one_or_none() is None:
        aud = Auditoria(
            id=uuid.uuid4(),
            user_id=admin.id,
            titulo=f"{P}Auditoría interna 2026",
            tipo="Interna",
            alcance="Canal digital y API core",
            fecha_inicio=ctx.now - timedelta(days=60),
            fecha_fin=ctx.now - timedelta(days=10),
            estado="Cerrada",
        )
        db.add(aud)
        await db.flush()
        db.add(
            HallazgoAuditoria(
                id=uuid.uuid4(),
                user_id=admin.id,
                auditoria_id=aud.id,
                titulo=f"{P}Hallazgo — segregación de funciones",
                descripcion="SoD en flujo de aprobación",
                severidad="Media",
                categoria="Gobierno",
                estado="Abierto",
            )
        )
        db.add(
            EvidenciaAuditoria(
                id=uuid.uuid4(),
                user_id=admin.id,
                auditoria_id=aud.id,
                nombre_archivo="muestras.zip",
                tipo_evidencia="documento",
                url_archivo="https://example.com/evidencia",
                hash_sha256=_sha(),
            )
        )
        db.add(
            PlanRemediacion(
                id=uuid.uuid4(),
                user_id=admin.id,
                auditoria_id=aud.id,
                descripcion=f"{P}Plan de remediación demo",
                acciones_recomendadas="Ajustar flujos y roles en IAM",
                responsable="CISO",
                fecha_limite=ctx.now + timedelta(days=30),
                estado="En progreso",
            )
        )
    await db.flush()

    # ── Excepción, aceptación, evidencia remediación (usa IDs de vulnerabilidades demo)
    if len(vid) >= 3:
        r10 = await db.execute(
            select(ExcepcionVulnerabilidad).where(
                ExcepcionVulnerabilidad.vulnerabilidad_id == vid[0], ExcepcionVulnerabilidad.user_id == admin.id
            )
        )
        if r10.scalar_one_or_none() is None:
            db.add(
                ExcepcionVulnerabilidad(
                    id=uuid.uuid4(),
                    user_id=admin.id,
                    vulnerabilidad_id=vid[0],
                    justificacion="Excepción por ventana de mantenimiento aprobada (demo).",
                    fecha_limite=ctx.now + timedelta(days=14),
                    estado="Pendiente",
                )
            )
        r11 = await db.execute(
            select(AceptacionRiesgo).where(
                AceptacionRiesgo.vulnerabilidad_id == vid[1], AceptacionRiesgo.user_id == admin.id
            )
        )
        if r11.scalar_one_or_none() is None:
            db.add(
                AceptacionRiesgo(
                    id=uuid.uuid4(),
                    user_id=admin.id,
                    vulnerabilidad_id=vid[1],
                    justificacion_negocio="Riesgo aceptado por exposición mínima en red interna (demo).",
                    propietario_riesgo_id=admin.id,
                    fecha_revision_obligatoria=ctx.now + timedelta(days=90),
                    estado="Pendiente",
                )
            )
        r12 = await db.execute(
            select(EvidenciaRemediacion).where(
                EvidenciaRemediacion.vulnerabilidad_id == vid[2], EvidenciaRemediacion.user_id == admin.id
            )
        )
        if r12.scalar_one_or_none() is None:
            db.add(
                EvidenciaRemediacion(
                    id=uuid.uuid4(),
                    user_id=admin.id,
                    vulnerabilidad_id=vid[2],
                    descripcion=f"{P}Parche desplegado en staging (demo).",
                    filename="patch.diff",
                    sha256=_sha(),
                )
            )
    await db.flush()

    # ── Iniciativa + hito + actualización
    r13 = await db.execute(
        select(Iniciativa).where(
            Iniciativa.user_id == admin.id, Iniciativa.titulo == f"{P}Iniciativa con hitos e historial"
        )
    )
    ini = r13.scalar_one_or_none()
    if ini is None:
        ini = Iniciativa(
            id=uuid.uuid4(),
            user_id=admin.id,
            celula_id=ctx.cel_id,
            titulo=f"{P}Iniciativa con hitos e historial",
            descripcion="Demo M5",
            tipo="plataforma",
            estado="En progreso",
            fecha_inicio=ctx.now - timedelta(days=14),
            fecha_fin_estimada=ctx.now + timedelta(days=120),
        )
        db.add(ini)
        await db.flush()
    n_h = await db.scalar(
        select(func.count()).select_from(HitoIniciativa).where(HitoIniciativa.iniciativa_id == ini.id)
    )
    if not n_h:
        db.add(
            HitoIniciativa(
                id=uuid.uuid4(),
                user_id=admin.id,
                iniciativa_id=ini.id,
                titulo=f"{P}Hito — diseño aprobado",
                estado="Completado",
                fecha_estimada=ctx.now,
                porcentaje_completado=100,
            )
        )
    n_a = await db.scalar(
        select(func.count()).select_from(ActualizacionIniciativa).where(ActualizacionIniciativa.iniciativa_id == ini.id)
    )
    if not n_a:
        db.add(
            ActualizacionIniciativa(
                id=uuid.uuid4(),
                user_id=admin.id,
                iniciativa_id=ini.id,
                titulo=f"{P}Actualización semanal",
                contenido="Avance: integración con pipeline listo (demo).",
                tipo_actualizacion="seguimiento",
            )
        )
    await db.flush()

    # ── Tema + actualización + cierre
    r14 = await db.execute(
        select(TemaEmergente).where(
            TemaEmergente.user_id == admin.id, TemaEmergente.titulo == f"{P}Tema con cierre y actualizaciones"
        )
    )
    tema = r14.scalar_one_or_none()
    if tema is None:
        tema = TemaEmergente(
            id=uuid.uuid4(),
            user_id=admin.id,
            celula_id=ctx.cel_id,
            titulo=f"{P}Tema con cierre y actualizaciones",
            descripcion="Seguimiento M7",
            tipo="operacion",
            impacto="alto",
            estado="en_analisis",
            fuente="Mesa de riesgo (demo)",
        )
        db.add(tema)
        await db.flush()
    n_ta = await db.scalar(select(func.count()).select_from(ActualizacionTema).where(ActualizacionTema.tema_id == tema.id))
    if not n_ta:
        db.add(
            ActualizacionTema(
                id=uuid.uuid4(),
                user_id=admin.id,
                tema_id=tema.id,
                titulo=f"{P}Actualización de contexto",
                contenido="Se validó con negocio (demo).",
                fuente="comité",
            )
        )
    n_cc = await db.scalar(select(func.count()).select_from(CierreConclusion).where(CierreConclusion.tema_id == tema.id))
    if not n_cc:
        db.add(
            CierreConclusion(
                id=uuid.uuid4(),
                user_id=admin.id,
                tema_id=tema.id,
                titulo=f"{P}Cierre — plan de contención",
                conclusion="Riesgo mitigado con controles compensatorios (demo).",
                recomendaciones="Monitoreo 30 días",
                fecha_cierre=ctx.now,
            )
        )
    await db.flush()

    # ── Flujo estatus + filtro guardado
    r15 = await db.execute(
        select(FlujoEstatus).where(
            FlujoEstatus.user_id == admin.id,
            FlujoEstatus.entity_type == "vulnerabilidad",
            FlujoEstatus.from_status == "abierta",
            FlujoEstatus.to_status == "en_remediacion",
        )
    )
    if r15.scalar_one_or_none() is None:
        db.add(
            FlujoEstatus(
                id=uuid.uuid4(),
                user_id=admin.id,
                entity_type="vulnerabilidad",
                from_status="abierta",
                to_status="en_remediacion",
                allowed=True,
            )
        )
    r16 = await db.execute(
        select(FiltroGuardado).where(
            FiltroGuardado.usuario_id == admin.id, FiltroGuardado.nombre == f"{P}Filtro dashboard home"
        )
    )
    if r16.scalar_one_or_none() is None:
        db.add(
            FiltroGuardado(
                id=uuid.uuid4(),
                usuario_id=admin.id,
                nombre=f"{P}Filtro dashboard home",
                modulo="vulnerabilidad",
                parametros={"severidad": "Critica", "estado": "abierta"},
                compartido=False,
            )
        )
    await db.flush()

    # ── OKR
    r17 = await db.execute(
        select(OkrCategoria).where(OkrCategoria.user_id == admin.id, OkrCategoria.nombre == f"{P}Categoría AppSec")
    )
    cat = r17.scalar_one_or_none()
    if cat is None:
        cat = OkrCategoria(
            id=uuid.uuid4(), user_id=admin.id, nombre=f"{P}Categoría AppSec", descripcion="OKR demo", activo=True
        )
        db.add(cat)
        await db.flush()
    r18 = await db.execute(
        select(OkrPlanAnual).where(
            OkrPlanAnual.user_id == admin.id, OkrPlanAnual.ano == 2026, OkrPlanAnual.colaborador_id == admin.id
        )
    )
    plan = r18.scalars().first()
    if plan is None:
        plan = OkrPlanAnual(
            id=uuid.uuid4(),
            user_id=admin.id,
            colaborador_id=admin.id,
            evaluador_id=admin.id,
            ano=2026,
            estado="active",
        )
        db.add(plan)
        await db.flush()
    r19 = await db.execute(
        select(OkrCompromiso).where(
            OkrCompromiso.user_id == admin.id, OkrCompromiso.nombre_objetivo == f"{P}Reducir deuda SAST"
        )
    )
    com = r19.scalar_one_or_none()
    if com is None:
        com = OkrCompromiso(
            id=uuid.uuid4(),
            user_id=admin.id,
            plan_id=plan.id,
            categoria_id=cat.id,
            nombre_objetivo=f"{P}Reducir deuda SAST",
            descripcion="KR demo",
            peso_global=1.0,
            fecha_inicio=ctx.now - timedelta(days=10),
            fecha_fin=ctx.now + timedelta(days=80),
            tipo_medicion="porcentaje",
        )
        db.add(com)
        await db.flush()
    r20 = await db.execute(
        select(OkrSubcompromiso).where(
            OkrSubcompromiso.user_id == admin.id, OkrSubcompromiso.nombre_sub_item == f"{P}Sub — limpieza críticos"
        )
    )
    subc = r20.scalar_one_or_none()
    if subc is None:
        subc = OkrSubcompromiso(
            id=uuid.uuid4(),
            user_id=admin.id,
            compromiso_id=com.id,
            nombre_sub_item=f"{P}Sub — limpieza críticos",
            peso_interno=0.5,
            evidencia_requerida=True,
        )
        db.add(subc)
        await db.flush()
    r21 = await db.execute(
        select(OkrRevisionQ).where(
            OkrRevisionQ.user_id == admin.id, OkrRevisionQ.subcompromiso_id == subc.id, OkrRevisionQ.quarter == "Q1"
        )
    )
    if r21.scalar_one_or_none() is None:
        revq = OkrRevisionQ(
            id=uuid.uuid4(),
            user_id=admin.id,
            subcompromiso_id=subc.id,
            quarter="Q1",
            avance_reportado=0.4,
            avance_validado=0.35,
            estado="submitted",
        )
        db.add(revq)
        await db.flush()
        db.add(
            OkrEvidencia(
                id=uuid.uuid4(),
                user_id=admin.id,
                revision_q_id=revq.id,
                url_evidencia="https://example.com/kr.pdf",
                nombre_archivo="kr.pdf",
                tipo_evidencia="documento",
            )
        )
    r22 = await db.execute(
        select(OkrCierreQ).where(
            OkrCierreQ.user_id == admin.id, OkrCierreQ.plan_id == plan.id, OkrCierreQ.quarter == "Q1"
        )
    )
    if r22.scalar_one_or_none() is None:
        db.add(
            OkrCierreQ(
                id=uuid.uuid4(),
                user_id=admin.id,
                plan_id=plan.id,
                quarter="Q1",
                retroalimentacion_general="Cierre trimestre demo: buen avance en remediación.",
                cerrado_at=ctx.now,
            )
        )
    await db.flush()

    # ── Proyecto + tareas
    r23 = await db.execute(
        select(Project).where(Project.user_id == admin.id, Project.name == f"{P}Proyecto AppSec Demo")
    )
    prj = r23.scalar_one_or_none()
    if prj is None:
        prj = Project(
            id=uuid.uuid4(),
            user_id=admin.id,
            name=f"{P}Proyecto AppSec Demo",
            description="Proyecto marco (tasks)",
            status="active",
        )
        db.add(prj)
        await db.flush()
    n_tk = await db.scalar(select(func.count()).select_from(Task).where(Task.project_id == prj.id))
    if not n_tk:
        db.add(
            Task(
                id=uuid.uuid4(),
                user_id=admin.id,
                project_id=prj.id,
                title=f"{P}Revisar hallazgos críticos",
                description="Seguimiento semanal",
                status="in_progress",
                completed=False,
            )
        )
    await db.flush()

    # Notificación in-app
    r24 = await db.execute(
        select(Notificacion).where(Notificacion.user_id == admin.id, Notificacion.titulo == f"{P}Bienvenida al demo")
    )
    if r24.scalar_one_or_none() is None:
        db.add(
            Notificacion(
                id=uuid.uuid4(),
                user_id=admin.id,
                titulo=f"{P}Bienvenida al demo",
                cuerpo="Dataset de demostración cargado. Explora módulos en el menú.",
                leida=False,
            )
        )
    r25 = await db.execute(
        select(ChangelogEntrada).where(
            ChangelogEntrada.user_id == admin.id, ChangelogEntrada.version == f"{P}1.0.0-demo"
        )
    )
    if r25.scalar_one_or_none() is None:
        db.add(
            ChangelogEntrada(
                id=uuid.uuid4(),
                user_id=admin.id,
                version=f"{P}1.0.0-demo",
                titulo="Demo seed completo de módulos",
                descripcion="Registros de ejemplo en todas las áreas con prefijo [DEMO].",
                tipo="improvement",
                fecha_publicacion=ctx.now,
                publicado=True,
            )
        )
    await db.flush()

    logger.info("seed.demo_modules.ok", extra={"event": "seed.demo_modules.ok"})
