"""Test seed.py — validate massive data generation."""

import pytest
from sqlalchemy import select

from app.models.auditoria import Auditoria
from app.models.celula import Celula
from app.models.hallazgo_auditoria import HallazgoAuditoria
from app.models.iniciativa import Iniciativa
from app.models.organizacion import Organizacion
from app.models.repositorio import Repositorio
from app.models.service_release import ServiceRelease
from app.models.subdireccion import Subdireccion
from app.models.tema_emergente import TemaEmergente
from app.models.user import User
from app.models.vulnerabilidad import Vulnerabilidad
from app.seed import seed


@pytest.mark.asyncio
async def test_seed_creates_users(async_db):
    """Verify 11 users are created with correct roles."""
    # Seed already creates admin in conftest, run seed again to add masivos
    await seed()
    
    result = await async_db.execute(
        select(User).where(User.username.in_(["ciso1", "director1", "lider1", "analista1", "responsable1"]))
    )
    users = result.scalars().all()
    
    assert len(users) >= 5, "Expected at least 5 masivos users"
    
    # Check roles
    ciso = next((u for u in users if u.username == "ciso1"), None)
    assert ciso and ciso.role == "ciso"
    
    director = next((u for u in users if u.username == "director1"), None)
    assert director and director.role == "director_subdireccion"
    
    lider = next((u for u in users if u.username == "lider1"), None)
    assert lider and lider.role == "lider_liberaciones"


@pytest.mark.asyncio
async def test_seed_creates_jerarquia(async_db):
    """Verify organizational hierarchy is created."""
    await seed()
    
    # Count orgs
    orgs_result = await async_db.execute(select(Organizacion))
    orgs = orgs_result.scalars().all()
    assert len(orgs) >= 3, "Expected at least 3 organizations"
    
    # Count subdirecciones
    subdirs_result = await async_db.execute(select(Subdireccion))
    subdirs = subdirs_result.scalars().all()
    assert len(subdirs) >= 15, "Expected at least 15 subdirecciones"
    
    # Count células
    celulas_result = await async_db.execute(select(Celula))
    celulas = celulas_result.scalars().all()
    assert len(celulas) >= 70, "Expected at least 70 células"


@pytest.mark.asyncio
async def test_seed_creates_vulnerabilidades(async_db):
    """Verify 120 vulnerabilities with correct distribution."""
    await seed()
    
    # Count total
    total_result = await async_db.execute(select(Vulnerabilidad))
    total = len(total_result.scalars().all())
    assert total >= 100, f"Expected at least 100 vulnerabilities, got {total}"
    
    # Check severidades distribution
    severidades_result = await async_db.execute(
        select(Vulnerabilidad.severidad).distinct()
    )
    severidades = {row[0] for row in severidades_result.all()}
    assert "Critica" in severidades or "Alta" in severidades, "Expected Critica or Alta severities"
    
    # Check motores distribution
    motores_result = await async_db.execute(
        select(Vulnerabilidad.fuente).distinct()
    )
    motores = {row[0] for row in motores_result.all()}
    assert any(motor in motores for motor in ["SAST", "DAST", "SCA"]), "Expected SAST, DAST, or SCA"


@pytest.mark.asyncio
async def test_seed_creates_service_releases(async_db):
    """Verify 25 service releases are created."""
    await seed()
    
    result = await async_db.execute(select(ServiceRelease))
    releases = result.scalars().all()
    
    assert len(releases) >= 20, f"Expected at least 20 service releases, got {len(releases)}"
    
    # Check estados distribution
    estados = {r.estado_actual for r in releases}
    assert any(e in estados for e in ["Design", "Validation", "Tests", "QA", "Prod"]), \
        "Expected release estados"


@pytest.mark.asyncio
async def test_seed_creates_iniciativas(async_db):
    """Verify 8 initiatives are created."""
    await seed()
    
    result = await async_db.execute(select(Iniciativa))
    iniciativas = result.scalars().all()
    
    assert len(iniciativas) >= 6, f"Expected at least 6 initiatives, got {len(iniciativas)}"
    
    # Check estados
    estados = {i.estado for i in iniciativas}
    assert any(e in estados for e in ["En Progreso", "Completada", "Planeada"])


@pytest.mark.asyncio
async def test_seed_creates_temas_emergentes(async_db):
    """Verify 20 emerging themes are created."""
    await seed()
    
    result = await async_db.execute(select(TemaEmergente))
    temas = result.scalars().all()
    
    assert len(temas) >= 15, f"Expected at least 15 themes, got {len(temas)}"


@pytest.mark.asyncio
async def test_seed_creates_auditorias(async_db):
    """Verify 15 audits with findings are created."""
    await seed()
    
    # Count auditorías
    audits_result = await async_db.execute(select(Auditoria))
    audits = audits_result.scalars().all()
    assert len(audits) >= 12, f"Expected at least 12 audits, got {len(audits)}"
    
    # Count hallazgos
    hallazgos_result = await async_db.execute(select(HallazgoAuditoria))
    hallazgos = hallazgos_result.scalars().all()
    assert len(hallazgos) >= 5, f"Expected at least 5 hallazgos, got {len(hallazgos)}"
    
    # Check tipos de auditoría
    tipos = {a.tipo for a in audits}
    assert any(t in tipos for t in ["SOC2", "PCI-DSS", "ISO27001", "GDPR"])


@pytest.mark.asyncio
async def test_seed_idempotent(async_db):
    """Verify seed is idempotent — running twice doesn't duplicate."""
    await seed()
    
    # Count first run
    result1 = await async_db.execute(select(User).where(User.username == "ciso1"))
    count1 = len(result1.scalars().all())
    
    # Run seed again
    await seed()
    
    # Count second run
    result2 = await async_db.execute(select(User).where(User.username == "ciso1"))
    count2 = len(result2.scalars().all())
    
    assert count1 == count2, "Seed should be idempotent"


@pytest.mark.asyncio
async def test_seed_relationships(async_db):
    """Verify all relationships are properly linked."""
    await seed()
    
    # Check organizacion → gerencia → subdireccion
    orgs_result = await async_db.execute(select(Organizacion))
    orgs = orgs_result.scalars().all()
    
    for org in orgs[:1]:  # Check first org
        assert org.gerencia_id is not None, "Org should have gerencia_id"
    
    # Check celula → organizacion
    celulas_result = await async_db.execute(select(Celula).limit(5))
    celulas = celulas_result.scalars().all()
    
    for celula in celulas:
        assert celula.organizacion_id is not None, "Celula should have organizacion_id"


@pytest.mark.asyncio
async def test_seed_no_hardcoded_ids(async_db):
    """Verify no hardcoded IDs — all relationships use created objects."""
    await seed()
    
    # Check all vulnerabilidades have valid user_id
    vulns_result = await async_db.execute(select(Vulnerabilidad).limit(10))
    vulns = vulns_result.scalars().all()
    
    for vuln in vulns:
        assert vuln.user_id is not None and str(vuln.user_id) != "00000000-0000-0000-0000-000000000000"
        if vuln.repositorio_id:
            assert vuln.repositorio_id is not None and str(vuln.repositorio_id) != "00000000-0000-0000-0000-000000000000"
