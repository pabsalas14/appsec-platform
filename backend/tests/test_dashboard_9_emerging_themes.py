"""
Test suite for Dashboard 9: Emerging Themes (Temas Emergentes).

Tests for:
- GET /api/v1/dashboard/emerging-themes-summary
- GET /api/v1/dashboard/tema/{id}/detail
"""

import pytest
from datetime import UTC, datetime, timedelta
from uuid import uuid4

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.tema_emergente import TemaEmergente
from app.models.actualizacion_tema import ActualizacionTema
from app.models.celula import Celula
from app.models.organizacion import Organizacion
from app.models.gerencia import Gerencia
from app.models.subdireccion import Subdireccion
from app.core.security import hash_password


# ─── FIXTURES ────────────────────────────────────────────────────────────────


@pytest.fixture
async def admin_user(session_factory) -> User:
    """Create an admin user for tests."""
    async with session_factory() as db:
        user = User(
            username=f"admin_{uuid4().hex[:8]}",
            email=f"admin_{uuid4().hex[:8]}@test.local",
            hashed_password=hash_password("TestPassword123!"),
            full_name="Admin User",
            role="admin",
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user


@pytest.fixture
async def standard_user(session_factory) -> User:
    """Create a standard user for tests."""
    async with session_factory() as db:
        user = User(
            username=f"user_{uuid4().hex[:8]}",
            email=f"user_{uuid4().hex[:8]}@test.local",
            hashed_password=hash_password("TestPassword123!"),
            full_name="Standard User",
            role="user",
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        return user


@pytest.fixture
async def emerging_themes_with_updates(session_factory, admin_user):
    """Create emerging themes with bitácora updates."""
    async with session_factory() as db:
        now = datetime.now(UTC)
        themes = []

        # Create 3 themes with different impacts and timestamps
        for idx in range(3):
            impacto = ["Alto", "Medio", "Bajo"][idx]
            days_old = idx * 3

            tema = TemaEmergente(
                id=uuid4(),
                user_id=admin_user.id,
                titulo=f"Tema Emergente {idx}",
                descripcion=f"Descripción del tema {idx}",
                tipo="Seguridad",
                impacto=impacto,
                estado="Abierto",
                fuente="Sistema",
                created_at=now - timedelta(days=days_old),
                updated_at=now - timedelta(days=days_old),
            )
            db.add(tema)
            await db.flush()
            themes.append(tema)

            # Add 2 updates to each theme
            for update_idx in range(2):
                actualizacion = ActualizacionTema(
                    id=uuid4(),
                    user_id=admin_user.id,
                    tema_id=tema.id,
                    titulo=f"Actualización {update_idx}",
                    contenido=f"Contenido de la actualización {update_idx} para {tema.titulo}",
                    fuente="Sistema",
                    created_at=now - timedelta(days=days_old - update_idx),
                )
                db.add(actualizacion)

            await db.flush()

        # Refresh all themes
        for tema in themes:
            await db.refresh(tema)

        return themes


@pytest.fixture
async def auth_headers(client: AsyncClient, admin_user: User):
    """Get auth headers for a user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"username": admin_user.username, "password": "TestPassword123!"},
    )
    token = response.cookies.get("access_token")
    return {"Cookie": f"access_token={token}"} if token else {}


# ─── TESTS ───────────────────────────────────────────────────────────────────


class TestDashboard9EmergingThemes:
    """Tests for Dashboard 9: Emerging Themes."""

    @pytest.mark.asyncio
    async def test_emerging_themes_summary_200(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test emerging-themes-summary returns 200 with correct structure."""
        response = await client.get(
            "/api/v1/dashboard/emerging-themes-summary", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "total_themes" in data["data"]
        assert "high_impact_themes" in data["data"]
        assert "recent_themes" in data["data"]
        assert "themes" in data["data"]

    @pytest.mark.asyncio
    async def test_emerging_themes_summary_kpis(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test emerging-themes-summary returns correct KPI values."""
        response = await client.get(
            "/api/v1/dashboard/emerging-themes-summary", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["total_themes"] == 3
        assert data["data"]["high_impact_themes"] == 1  # One "Alto"
        assert "kpis" in data["data"]
        assert data["data"]["kpis"]["total"] == 3

    @pytest.mark.asyncio
    async def test_emerging_themes_summary_themes_list(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test emerging-themes-summary returns full themes list."""
        response = await client.get(
            "/api/v1/dashboard/emerging-themes-summary", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        themes = data["data"]["themes"]
        assert len(themes) == 3

        # Check theme structure
        for tema in themes:
            assert "id" in tema
            assert "titulo" in tema
            assert "descripcion" in tema
            assert "estado" in tema
            assert "impacto" in tema
            assert "dias_abierto" in tema
            assert "created_at" in tema
            assert "updated_at" in tema

    @pytest.mark.asyncio
    async def test_emerging_themes_summary_dias_abierto_calculation(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test dias_abierto is calculated correctly."""
        response = await client.get(
            "/api/v1/dashboard/emerging-themes-summary", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        themes = sorted(data["data"]["themes"], key=lambda x: x["created_at"])

        # First theme should be most recent (0 days old)
        assert themes[0]["dias_abierto"] == 0 or themes[0]["dias_abierto"] == 1

    @pytest.mark.asyncio
    async def test_tema_detail_200(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test tema detail returns 200 with correct structure."""
        tema_id = str(emerging_themes_with_updates[0].id)
        response = await client.get(
            f"/api/v1/dashboard/tema/{tema_id}/detail", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "tema" in data["data"]
        assert "bitacora" in data["data"]
        assert "metadata" in data["data"]

    @pytest.mark.asyncio
    async def test_tema_detail_estructura_tema(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test tema detail includes all required fields."""
        tema_id = str(emerging_themes_with_updates[0].id)
        response = await client.get(
            f"/api/v1/dashboard/tema/{tema_id}/detail", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        tema = data["data"]["tema"]

        assert "id" in tema
        assert "titulo" in tema
        assert "descripcion" in tema
        assert "tipo" in tema
        assert "impacto" in tema
        assert "estado" in tema
        assert "fuente" in tema
        assert "dias_abierto" in tema
        assert "created_at" in tema
        assert "updated_at" in tema
        assert "creado_por" in tema

    @pytest.mark.asyncio
    async def test_tema_detail_bitacora(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test tema detail includes bitácora timeline."""
        tema_id = str(emerging_themes_with_updates[0].id)
        response = await client.get(
            f"/api/v1/dashboard/tema/{tema_id}/detail", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        bitacora = data["data"]["bitacora"]

        assert len(bitacora) == 2  # Two updates per theme
        for item in bitacora:
            assert "id" in item
            assert "titulo" in item
            assert "contenido" in item
            assert "autor" in item
            assert "fecha" in item

    @pytest.mark.asyncio
    async def test_tema_detail_metadata(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates
    ):
        """Test tema detail includes metadata."""
        tema_id = str(emerging_themes_with_updates[0].id)
        response = await client.get(
            f"/api/v1/dashboard/tema/{tema_id}/detail", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        metadata = data["data"]["metadata"]

        assert "total_updates" in metadata
        assert "last_update" in metadata
        assert metadata["total_updates"] == 2

    @pytest.mark.asyncio
    async def test_tema_detail_not_found(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test tema detail returns 404 for non-existent tema."""
        fake_id = str(uuid4())
        response = await client.get(
            f"/api/v1/dashboard/tema/{fake_id}/detail", headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_emerging_themes_summary_requires_auth(self, client: AsyncClient):
        """Test emerging-themes-summary requires authentication."""
        response = await client.get("/api/v1/dashboard/emerging-themes-summary")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_tema_detail_requires_auth(self, client: AsyncClient):
        """Test tema detail requires authentication."""
        response = await client.get(f"/api/v1/dashboard/tema/{uuid4()}/detail")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_emerging_themes_summary_empty(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test emerging-themes-summary returns empty list when no themes."""
        response = await client.get(
            "/api/v1/dashboard/emerging-themes-summary", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["total_themes"] == 0
        assert data["data"]["themes"] == []

    @pytest.mark.asyncio
    async def test_tema_detail_correct_creator(
        self, client: AsyncClient, auth_headers: dict, emerging_themes_with_updates, admin_user
    ):
        """Test tema detail shows correct creator."""
        tema_id = str(emerging_themes_with_updates[0].id)
        response = await client.get(
            f"/api/v1/dashboard/tema/{tema_id}/detail", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["tema"]["creado_por"] == admin_user.email
