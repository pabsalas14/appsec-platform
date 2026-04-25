"""
Phase 22: Threat Modeling Service with IA integration
Generates STRIDE threats with DREAD scoring
"""

import json
import logging
from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import SesionThreatModeling, Amenaza, ControlMitigacion
from app.schemas import AmenazaCreate, AmenazaRead
from app.services.ia_provider import (
    AIProvider,
    AmenazaResponse,
    AIProviderType,
    get_ai_provider,
)

logger = logging.getLogger(__name__)


class ThreatModelingService:
    """Service for threat modeling with IA assistance"""

    STRIDE_CATEGORIES = [
        "Spoofing",
        "Tampering",
        "Repudiation",
        "Information Disclosure",
        "Denial of Service",
        "Elevation of Privilege",
    ]

    DREAD_MIN = 1
    DREAD_MAX = 10

    def __init__(self, db: AsyncSession, ai_provider: AIProvider):
        self.db = db
        self.ai_provider = ai_provider

    async def generate_threats_from_ai(
        self,
        sesion_id: str,
        technology_stack: str,
        dry_run: bool = False,
    ) -> list[AmenazaRead]:
        """Generate threat modeling suggestions from IA"""

        system_prompt = """You are a threat modeling expert specializing in STRIDE and DREAD analysis.
        For the given technology stack, identify potential security threats.
        Return a JSON array with threats, each containing:
        - stride: STRIDE category (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
        - threat: Description of the threat
        - dread_damage: Potential damage (1-10)
        - dread_reproducibility: How easily reproducible (1-10)
        - dread_exploitability: How easily exploitable (1-10)
        - dread_affected_users: Number of affected users (1-10)
        - dread_discoverability: How easily discoverable (1-10)
        - mitigations: List of suggested controls"""

        user_prompt = f"""Analyze the following technology stack for STRIDE threats:

Technology Stack: {technology_stack}

Identify 3-5 critical threats. Return ONLY valid JSON array with threat objects."""

        try:
            response = await self.ai_provider.generate(
                prompt=user_prompt,
                system=system_prompt,
                temperature=0.3,
                max_tokens=2000,
            )

            # Parse JSON response
            threats = self._parse_threats_from_response(response.content)

            if dry_run:
                logger.info(f"Dry run: Would create {len(threats)} threats")
                return []

            # Persist threats to database
            created_threats = []
            for threat_data in threats:
                threat = await self._create_threat(sesion_id, threat_data)
                created_threats.append(threat)

            return created_threats

        except Exception as e:
            logger.error(f"IA threat generation failed: {e}")
            raise

    async def _create_threat(
        self,
        sesion_id: str,
        threat_data: AmenazaResponse,
    ) -> AmenazaRead:
        """Create threat entity from IA response"""

        # Validate STRIDE category
        if threat_data.stride not in self.STRIDE_CATEGORIES:
            raise ValueError(f"Invalid STRIDE category: {threat_data.stride}")

        # Validate DREAD scores
        for score in [
            threat_data.dread_damage,
            threat_data.dread_reproducibility,
            threat_data.dread_exploitability,
            threat_data.dread_affected_users,
            threat_data.dread_discoverability,
        ]:
            if not (self.DREAD_MIN <= score <= self.DREAD_MAX):
                raise ValueError(f"DREAD score out of range (1-10): {score}")

        # Calculate total DREAD score
        dread_total = (
            threat_data.dread_damage * 2
            + threat_data.dread_reproducibility
            + threat_data.dread_exploitability
            + threat_data.dread_affected_users
            + threat_data.dread_discoverability
        )

        amenaza = Amenaza(
            sesion_id=sesion_id,
            titulo=threat_data.threat[:255],
            descripcion=threat_data.threat,
            categoria_stride=threat_data.stride,
            dread_damage=threat_data.dread_damage,
            dread_reproducibility=threat_data.dread_reproducibility,
            dread_exploitability=threat_data.dread_exploitability,
            dread_affected_users=threat_data.dread_affected_users,
            dread_discoverability=threat_data.dread_discoverability,
            dread_total=dread_total,
            generado_por_ia=True,
            aprobado=False,
        )

        self.db.add(amenaza)
        await self.db.flush()

        # Add suggested mitigations as controls
        if threat_data.mitigations:
            for mitigation_text in threat_data.mitigations[:5]:  # Max 5 per threat
                control = ControlMitigacion(
                    amenaza_id=amenaza.id,
                    titulo=mitigation_text[:100],
                    descripcion=mitigation_text,
                    estado="Sugerido",
                )
                self.db.add(control)

        await self.db.commit()
        return AmenazaRead.from_orm(amenaza)

    def _parse_threats_from_response(self, response_text: str) -> list[AmenazaResponse]:
        """Parse JSON threats from IA response"""

        # Extract JSON from response
        try:
            # Try to find JSON array in response
            start_idx = response_text.find("[")
            end_idx = response_text.rfind("]") + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON array found in response")

            json_str = response_text[start_idx:end_idx]
            threats_data = json.loads(json_str)

            # Validate and convert to AmenazaResponse
            threats = []
            for threat_obj in threats_data:
                try:
                    threat = AmenazaResponse(**threat_obj)
                    threats.append(threat)
                except Exception as e:
                    logger.warning(f"Failed to parse threat: {e}")
                    continue

            return threats

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            raise ValueError(f"Invalid JSON in IA response: {e}")

    async def approve_threat(
        self,
        amenaza_id: str,
        dread_damage: Optional[int] = None,
        dread_reproducibility: Optional[int] = None,
        dread_exploitability: Optional[int] = None,
        dread_affected_users: Optional[int] = None,
        dread_discoverability: Optional[int] = None,
    ) -> AmenazaRead:
        """Analyst approves/modifies threat after IA generation"""

        # Fetch threat
        result = await self.db.execute(
            select(Amenaza).where(Amenaza.id == amenaza_id)
        )
        threat = result.scalars().first()

        if not threat:
            raise ValueError(f"Threat not found: {amenaza_id}")

        # Update DREAD scores if provided
        if dread_damage is not None:
            threat.dread_damage = self._validate_dread_score(dread_damage)
        if dread_reproducibility is not None:
            threat.dread_reproducibility = self._validate_dread_score(dread_reproducibility)
        if dread_exploitability is not None:
            threat.dread_exploitability = self._validate_dread_score(dread_exploitability)
        if dread_affected_users is not None:
            threat.dread_affected_users = self._validate_dread_score(dread_affected_users)
        if dread_discoverability is not None:
            threat.dread_discoverability = self._validate_dread_score(dread_discoverability)

        # Recalculate total DREAD score
        threat.dread_total = (
            threat.dread_damage * 2
            + threat.dread_reproducibility
            + threat.dread_exploitability
            + threat.dread_affected_users
            + threat.dread_discoverability
        )

        # Mark as approved
        threat.aprobado = True
        threat.fecha_aprobacion = datetime.utcnow()

        await self.db.commit()
        return AmenazaRead.from_orm(threat)

    def _validate_dread_score(self, score: int) -> int:
        """Validate DREAD score is in range"""

        if not (self.DREAD_MIN <= score <= self.DREAD_MAX):
            raise ValueError(f"DREAD score must be between {self.DREAD_MIN} and {self.DREAD_MAX}")
        return score

    async def get_threats(
        self,
        sesion_id: str,
        filter_approved: Optional[bool] = None,
    ) -> list[AmenazaRead]:
        """Get threats for session with optional filtering"""

        query = select(Amenaza).where(Amenaza.sesion_id == sesion_id)

        if filter_approved is not None:
            query = query.where(Amenaza.aprobado == filter_approved)

        result = await self.db.execute(query)
        threats = result.scalars().all()

        return [AmenazaRead.from_orm(t) for t in threats]
