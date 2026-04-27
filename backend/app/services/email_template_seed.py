"""Email template seed data (S18)."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_template import EmailTemplate


async def seed_email_templates(db: AsyncSession) -> None:
    """Load default email templates if they don't exist."""

    templates = [
        EmailTemplate(
            nombre="sla_vencida",
            asunto="Alerta: SLA Vencida para Vulnerabilidad",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <h2 style="color: #d32f2f;">Alerta de SLA Vencida</h2>
            <p>Estimado usuario,</p>
            <p>La vulnerabilidad <strong>{{ vulnerabilidad_id }}</strong> ha <strong>excedido su fecha límite de SLA</strong>.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
                <li>ID Vulnerabilidad: {{ vulnerabilidad_id }}</li>
                <li>Fuente: {{ fuente }}</li>
                <li>Severidad: {{ severidad }}</li>
                <li>Fecha Límite: {{ fecha_limite }}</li>
                <li>Responsable: {{ responsable }}</li>
            </ul>
            <p>Por favor, revise y actualice el estado de esta vulnerabilidad de inmediato.</p>
            <p><a href="{{ enlace_dashboard }}" style="background: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver en Dashboard</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Esta es una notificación automática. Si tiene preguntas, contacte al equipo de AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=["vulnerabilidad_id", "fuente", "severidad", "fecha_limite", "responsable", "enlace_dashboard"],
            descripcion="Notificación cuando SLA de vulnerabilidad vence",
            activo=True,
        ),
        EmailTemplate(
            nombre="vulnerabilidad_critica",
            asunto="Alerta Crítica: Nueva Vulnerabilidad Detectada",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #fff3cd;">
            <h2 style="color: #cc0000;">Vulnerabilidad Crítica Detectada</h2>
            <p>Estimado usuario,</p>
            <p>Se ha detectado una <strong>vulnerabilidad CRÍTICA</strong> en su ambiente.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
                <li>Título: {{ titulo }}</li>
                <li>Severidad: {{ severidad }}</li>
                <li>Aplicación: {{ aplicacion }}</li>
                <li>Fuente: {{ fuente }}</li>
                <li>Descripción: {{ descripcion }}</li>
            </ul>
            <p style="color: #cc0000;"><strong>Se requiere acción inmediata.</strong></p>
            <p><a href="{{ enlace_dashboard }}" style="background: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Revisar Ahora</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Esta es una notificación automática crítica del Sistema AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=["titulo", "severidad", "aplicacion", "fuente", "descripcion", "enlace_dashboard"],
            descripcion="Notificación de vulnerabilidad crítica detectada",
            activo=True,
        ),
        EmailTemplate(
            nombre="excepcion_temporal_aprobada",
            asunto="Excepción Temporal Aprobada",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #e8f5e9;">
            <h2 style="color: #2e7d32;">Excepción Temporal Aprobada</h2>
            <p>Estimado usuario,</p>
            <p>Su solicitud de excepción temporal ha sido <strong>aprobada</strong>.</p>
            <p><strong>Detalles de la Excepción:</strong></p>
            <ul>
                <li>Vulnerabilidad: {{ vulnerabilidad_id }}</li>
                <li>Tipo: {{ tipo_excepcion }}</li>
                <li>Vigencia: {{ fecha_inicio }} hasta {{ fecha_vencimiento }}</li>
                <li>Justificación: {{ justificacion }}</li>
                <li>Aprobador: {{ aprobador }}</li>
            </ul>
            <p>Puede proceder con el plan de remediación en la fecha especificada.</p>
            <p><a href="{{ enlace_detalles }}" style="background: #2e7d32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver Detalles</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Notificación automática del Sistema AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=[
                "vulnerabilidad_id",
                "tipo_excepcion",
                "fecha_inicio",
                "fecha_vencimiento",
                "justificacion",
                "aprobador",
                "enlace_detalles",
            ],
            descripcion="Notificación cuando excepción temporal es aprobada",
            activo=True,
        ),
        EmailTemplate(
            nombre="tema_emergente_actualizado",
            asunto="Tema Emergente Actualizado",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f0f4ff;">
            <h2 style="color: #1565c0;">Tema Emergente Actualizado</h2>
            <p>Estimado usuario,</p>
            <p>El tema emergente <strong>{{ titulo }}</strong> ha sido actualizado.</p>
            <p><strong>Información:</strong></p>
            <ul>
                <li>Tema: {{ titulo }}</li>
                <li>Estado Actual: {{ estado }}</li>
                <li>Tipo: {{ tipo }}</li>
                <li>Última Entrada: {{ ultima_entrada }}</li>
                <li>Responsable: {{ responsable }}</li>
            </ul>
            <p>Revise el tema en el dashboard para más detalles.</p>
            <p><a href="{{ enlace_tema }}" style="background: #1565c0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver Tema</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Notificación automática del Sistema AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=["titulo", "estado", "tipo", "ultima_entrada", "responsable", "enlace_tema"],
            descripcion="Notificación cuando tema emergente es actualizado",
            activo=True,
        ),
        EmailTemplate(
            nombre="iniciativa_hito_completado",
            asunto="Hito de Iniciativa Completado",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f3e5f5;">
            <h2 style="color: #6a1b9a;">Hito Completado</h2>
            <p>Estimado usuario,</p>
            <p>Se ha completado un hito en la iniciativa <strong>{{ iniciativa_titulo }}</strong>.</p>
            <p><strong>Detalles del Hito:</strong></p>
            <ul>
                <li>Iniciativa: {{ iniciativa_titulo }}</li>
                <li>Hito: {{ hito_nombre }}</li>
                <li>Fecha Planificada: {{ fecha_planificada }}</li>
                <li>Fecha Completada: {{ fecha_completada }}</li>
                <li>Progreso: {{ progreso }}%</li>
            </ul>
            <p>Felicitaciones por este logro!</p>
            <p><a href="{{ enlace_iniciativa }}" style="background: #6a1b9a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver Iniciativa</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Notificación automática del Sistema AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=[
                "iniciativa_titulo",
                "hito_nombre",
                "fecha_planificada",
                "fecha_completada",
                "progreso",
                "enlace_iniciativa",
            ],
            descripcion="Notificación cuando se completa hito de iniciativa",
            activo=True,
        ),
        EmailTemplate(
            nombre="tema_estancado",
            asunto="Tema Emergente Estancado - Requiere Atención",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #fbe9e7;">
            <h2 style="color: #bf360c;">Tema Emergente Estancado</h2>
            <p>Estimado usuario,</p>
            <p>El tema <strong>{{ titulo }}</strong> no ha sido actualizado en más de {{ dias }} días.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
                <li>Tema: {{ titulo }}</li>
                <li>Estado: {{ estado }}</li>
                <li>Tipo: {{ tipo }}</li>
                <li>Última Actividad: {{ ultima_actividad }}</li>
                <li>Responsable: {{ responsable }}</li>
            </ul>
            <p>Por favor, agregue una actualización en la bitácora para mantener el tema activo.</p>
            <p><a href="{{ enlace_tema }}" style="background: #bf360c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Actualizar Ahora</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Notificación automática del Sistema AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=["titulo", "dias", "estado", "tipo", "ultima_actividad", "responsable", "enlace_tema"],
            descripcion="Notificación de tema estancado sin actualizaciones",
            activo=True,
        ),
        EmailTemplate(
            nombre="vulnerabilidad_inactiva",
            asunto="Vulnerabilidad Sin Actualizar - Revisión Requerida",
            cuerpo_html="""
<html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #fce4ec;">
            <h2 style="color: #c2185b;">Vulnerabilidad Sin Actividad Reciente</h2>
            <p>Estimado usuario,</p>
            <p>La vulnerabilidad <strong>{{ vulnerabilidad_id }}</strong> no ha sido actualizada en {{ dias }} días.</p>
            <p><strong>Detalles:</strong></p>
            <ul>
                <li>ID: {{ vulnerabilidad_id }}</li>
                <li>Título: {{ titulo }}</li>
                <li>Estado: {{ estado }}</li>
                <li>Severidad: {{ severidad }}</li>
                <li>Última Actualización: {{ ultima_actualizacion }}</li>
                <li>Responsable: {{ responsable }}</li>
            </ul>
            <p>Revise el progreso y proporcione una actualización de estado.</p>
            <p><a href="{{ enlace_dashboard }}" style="background: #c2185b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver Vulnerabilidad</a></p>
            <hr/>
            <p style="font-size: 12px; color: #666;">
                Notificación automática del Sistema AppSec.
            </p>
        </div>
    </body>
</html>
            """.strip(),
            variables=[
                "vulnerabilidad_id",
                "dias",
                "titulo",
                "estado",
                "severidad",
                "ultima_actualizacion",
                "responsable",
                "enlace_dashboard",
            ],
            descripcion="Notificación de vulnerabilidad sin actualizaciones recientes",
            activo=True,
        ),
    ]

    for template in templates:
        # Check if already exists
        from sqlalchemy import select

        result = await db.execute(select(EmailTemplate).where(EmailTemplate.nombre == template.nombre))
        existing = result.scalar_one_or_none()

        if not existing:
            db.add(template)

    await db.flush()
