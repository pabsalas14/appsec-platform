import asyncio
import random
from datetime import datetime, timedelta, UTC
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session as SessionLocal
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.models.programa_sast import ProgramaSast
from app.models.programa_dast import ProgramaDast
from app.models.programa_source_code import ProgramaSourceCode
from app.models.iniciativa import Iniciativa
from app.models.tema_emergente import TemaEmergente
from app.models.service_release import ServiceRelease
from app.core.security import hash_password as get_password_hash
from app.orm_bootstrap import import_all_orm
from sqlalchemy import select

import_all_orm()

async def populate():
    async with SessionLocal() as db:
        print("Restaurando admin...")
        # El admin ya existe en tu DB como admin@example.com.
        # Vamos directo a poblar analistas.
        admin_obj = (await db.execute(select(User).where(User.email == "admin@example.com"))).scalars().first()


        print("Creando analistas...")
        nombres = [
            "Ana López", "Carlos Vega", "María Ruiz", "Jorge Martínez", 
            "Sandra Peña", "Luis Herrera", "Patricia Gómez", "Diego Silva", 
            "Carmen Téllez", "Roberto Castro"
        ]
        
        analistas_db = []
        for n in nombres:
            email = f"{n.lower().replace(' ', '.').replace('ó', 'o').replace('í', 'i')}@banco.com"
            username = email.split('@')[0]
            q = await db.execute(User.__table__.select().where(User.email == email))
            if not q.fetchone():
                user = User(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash("password123"),
                    full_name=n,
                    role="Analyst",
                    is_active=True
                )
                db.add(user)
                analistas_db.append(user)
        
        await db.commit()
        
        # Reload analysts from DB to get IDs
        q_analyst = await db.execute(select(User).where(User.role == "Analyst"))
        analistas = q_analyst.scalars().all()
        
        if not analistas:
            print("No se encontraron analistas para asignar vulnerabilidades.")
            return

        print(f"Poblando vulnerabilidades para {len(analistas)} analistas...")
        
        fuentes = ["Seguridad API", "Web Banking", "App Móvil", "Infraestructura Cloud", "Terceros"]
        severidades = ["Critica", "Alta", "Media", "Baja"]
        estados = ["Abierta", "Cerrada", "En Progreso"]
        
        vulns_to_create = 150
        created = 0
        
        for _ in range(vulns_to_create):
            analista = random.choice(analistas)
            
            # Fecha de creación entre hoy y hace 4 meses
            days_ago = random.randint(0, 120)
            created_at = datetime.now(UTC) - timedelta(days=days_ago)
            
            # SLA vencimiento entre -10 días y +30 días
            sla_days = random.randint(-10, 30)
            fecha_limite_sla = created_at + timedelta(days=sla_days)
            
            v = Vulnerabilidad(
                titulo=f"Vulnerabilidad Detectada - {random.randint(1000,9999)}",
                descripcion="Descripción generada aleatoriamente para mock.",
                fuente=random.choice(fuentes),
                severidad=random.choice(severidades),
                estado=random.choice(estados),
                responsable_id=analista.id,
                user_id=analista.id,
                created_at=created_at,
                fecha_limite_sla=fecha_limite_sla
            )
            db.add(v)
            created += 1
            
        await db.commit()
        print(f"¡Éxito! Se inyectaron {created} vulnerabilidades distribuidas entre el equipo.")

        print("Obteniendo repositorio y activo base...")
        from app.models.repositorio import Repositorio
        from app.models.servicio import Servicio
        from app.models.activo_web import ActivoWeb
        repo_obj = (await db.execute(select(Repositorio).limit(1))).scalars().first()
        servicio_obj = (await db.execute(select(Servicio).limit(1))).scalars().first()
        activo_obj = (await db.execute(select(ActivoWeb).limit(1))).scalars().first()
        
        # Create dummy repo and service if not exist
        if not repo_obj:
            repo_obj = Repositorio(id=uuid.uuid4(), celula_id=uuid.uuid4(), nombre="repo-mock", url="http://git", activo=True)
            db.add(repo_obj)
        if not servicio_obj:
            servicio_obj = Servicio(id=uuid.uuid4(), celula_id=uuid.uuid4(), nombre="srv-mock", descripcion="mock")
            db.add(servicio_obj)
        if not activo_obj:
            activo_obj = ActivoWeb(id=uuid.uuid4(), celula_id=uuid.uuid4(), url="https://mock.com", nombre="mock-web", activo=True)
            db.add(activo_obj)
        await db.commit()

        print("Poblando Programas (SAST, DAST, Source Code)...")
        for i in range(1, 6):
            # SAST
            db.add(ProgramaSast(
                nombre=f"Programa SAST Q{i}",
                ano=2026,
                estado=random.choice(["Activo", "En Pausa", "Completado"]),
                user_id=random.choice(analistas).id,
                repositorio_id=repo_obj.id,
                descripcion="Análisis estático mock"
            ))
            # DAST
            db.add(ProgramaDast(
                nombre=f"Programa DAST Q{i}",
                ano=2026,
                estado=random.choice(["Activo", "Completado"]),
                user_id=random.choice(analistas).id,
                activo_web_id=activo_obj.id,
                descripcion="Análisis dinámico mock"
            ))
            # Source Code
            db.add(ProgramaSourceCode(
                nombre=f"Revisión Código Seguro Q{i}",
                ano=2026,
                estado="Activo",
                user_id=random.choice(analistas).id,
                repositorio_id=repo_obj.id,
                descripcion="Revisión manual mock"
            ))
        await db.commit()

        print("Poblando Iniciativas Estratégicas y Temas Emergentes...")
        for i in range(1, 6):
            db.add(Iniciativa(
                titulo=f"Iniciativa de Seguridad {i}",
                estado=random.choice(["No Iniciado", "En Progreso", "Completado"]),
                tipo="Estratégica",
                user_id=random.choice(analistas).id
            ))
            db.add(TemaEmergente(
                titulo=f"Investigación Ciberataque Tipo {i}",
                descripcion="Análisis de amenaza en curso.",
                tipo="Operativo",
                impacto="Alto",
                fuente="CSIRT",
                estado=random.choice(["Abierto", "En Análisis", "Cerrado"]),
                user_id=random.choice(analistas).id
            ))
        await db.commit()

        print("Poblando Service Releases (Liberaciones)...")
        for i in range(1, 15):
            db.add(ServiceRelease(
                nombre=f"Pase a Producción App {i}",
                version=f"v1.{i}.0",
                estado_actual=random.choice(["Aprobado", "En Revisión", "Rechazado", "Excepción"]),
                fecha_entrada=datetime.now(UTC) - timedelta(days=random.randint(1, 20)),
                servicio_id=servicio_obj.id,
                user_id=random.choice(analistas).id
            ))
        await db.commit()
        print("Datos inyectados exitosamente en todos los módulos.")

if __name__ == "__main__":
    asyncio.run(populate())
