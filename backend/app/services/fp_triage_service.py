"""
Phase 23: False Positive Triage Service
IA-assisted classification of SAST/DAST findings
"""

import json
import logging
from typing import Optional
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Vulnerabilidad, HistorialVulnerabilidad
from app.schemas import VulnerabilidadRead
from app.services.ia_provider import (
    AIProvider,
    ClassificationResponse,
)

logger = logging.getLogger(__name__)


class FPTriageService:
    """Service for FP triage with IA assistance"""

    VALID_CLASSIFICATIONS = [
        "Probable False Positive",
        "Requires Manual Review",
        "Confirmed Vulnerability",
    ]

    def __init__(self, db: AsyncSession, ai_provider: AIProvider):
        self.db = db
        self.ai_provider = ai_provider

    async def classify_finding(
        self,
        vulnerabilidad_id: str,
        code_snippet: Optional[str] = None,
        repo_context: Optional[str] = None,
        dry_run: bool = False,
    ) -> dict:
        """Use IA to classify finding as FP/Review/Confirmed"""

        # Fetch vulnerability
        result = await self.db.execute(
            select(Vulnerabilidad).where(Vulnerabilidad.id == vulnerabilidad_id)
        )
        vulnerability = result.scalars().first()

        if not vulnerability:
            raise ValueError(f"Vulnerability not found: {vulnerabilidad_id}")

        # Sanitize sensitive data from snippet
        if code_snippet:
            code_snippet = self._sanitize_code(code_snippet)

        # Build context for IA
        prompt = self._build_triage_prompt(
            vulnerability,
            code_snippet,
            repo_context,
        )

        system_prompt = """You are a security code reviewer. Classify SAST/DAST findings.
        Respond with JSON containing:
        - classification: One of [Probable False Positive, Requires Manual Review, Confirmed Vulnerability]
        - confidence: 0-1 confidence score
        - justificacion: Brief explanation of classification"""

        try:
            response = await self.ai_provider.generate(
                prompt=prompt,
                system=system_prompt,
                temperature=0.1,  # Low temp for consistent classification
                max_tokens=500,
            )

            # Parse response
            classification_data = self._parse_classification_response(response.content)

            if dry_run:
                logger.info(f"Dry run classification: {classification_data['classification']}")
                return classification_data

            # Store as unverified suggestion in history
            history_entry = HistorialVulnerabilidad(
                vulnerabilidad_id=vulnerabilidad_id,
                estado_anterior=vulnerability.estado,
                estado_nuevo=vulnerability.estado,
                usuario_id="system-ia",
                comentario=f"IA Suggestion: {classification_data['classification']} (confidence: {classification_data['confidence']})\n\n{classification_data['justificacion']}",
                tipo_cambio="IA_TRIAGE_SUGGESTION",
                sin_verificar=True,
            )

            self.db.add(history_entry)
            await self.db.commit()

            return classification_data

        except Exception as e:
            logger.error(f"IA triage classification failed: {e}")
            raise

    def _build_triage_prompt(
        self,
        vulnerability: Vulnerabilidad,
        code_snippet: Optional[str],
        repo_context: Optional[str],
    ) -> str:
        """Build prompt for FP triage"""

        parts = [
            f"Tool: {vulnerability.fuente}",
            f"Finding: {vulnerability.titulo}",
            f"Description: {vulnerability.descripcion}",
            f"CWE: {vulnerability.cwe_id or 'Not specified'}",
            f"OWASP: {vulnerability.owasp_category or 'Not specified'}",
        ]

        if code_snippet:
            parts.append(f"Code snippet (first 500 chars):\n{code_snippet[:500]}")

        if repo_context:
            parts.append(f"Repository context: {repo_context[:300]}")

        parts.append(
            "\nClassify this finding:\n"
            "- Probable False Positive: Known false alarm patterns\n"
            "- Requires Manual Review: Needs analyst verification\n"
            "- Confirmed Vulnerability: Likely real security issue"
        )

        return "\n".join(parts)

    def _sanitize_code(self, code: str) -> str:
        """Remove sensitive data from code snippet"""

        patterns_to_remove = [
            r"password\s*=\s*['\"].*?['\"]",
            r"api[_-]?key\s*=\s*['\"].*?['\"]",
            r"secret\s*=\s*['\"].*?['\"]",
            r"token\s*=\s*['\"].*?['\"]",
            r"authorization:\s*['\"].*?['\"]",
            r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
            r"\b\d{16}\b",  # Credit card
        ]

        import re

        sanitized = code
        for pattern in patterns_to_remove:
            sanitized = re.sub(
                pattern,
                "[REDACTED]",
                sanitized,
                flags=re.IGNORECASE,
            )

        return sanitized

    def _parse_classification_response(self, response_text: str) -> dict:
        """Parse JSON classification from IA response"""

        try:
            # Try to find JSON object in response
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}") + 1

            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON object found in response")

            json_str = response_text[start_idx:end_idx]
            data = json.loads(json_str)

            # Validate classification
            classification = data.get("classification", "").strip()
            if classification not in self.VALID_CLASSIFICATIONS:
                # Try to find closest match
                classification = self._find_closest_classification(classification)

            # Validate confidence
            confidence = float(data.get("confidence", 0.5))
            confidence = max(0, min(1, confidence))  # Clamp 0-1

            return {
                "classification": classification,
                "confidence": confidence,
                "justificacion": data.get("justificacion", ""),
            }

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logger.error(f"Failed to parse classification response: {e}")
            # Return neutral default
            return {
                "classification": "Requires Manual Review",
                "confidence": 0.5,
                "justificacion": "Failed to parse IA response, requires manual verification",
            }

    def _find_closest_classification(self, text: str) -> str:
        """Find closest valid classification from text"""

        text_lower = text.lower()

        if "false" in text_lower and "positive" in text_lower:
            return "Probable False Positive"
        elif "confirmed" in text_lower or "vulnerability" in text_lower:
            return "Confirmed Vulnerability"
        else:
            return "Requires Manual Review"

    async def approve_triage_suggestion(
        self,
        vulnerabilidad_id: str,
        final_classification: str,
        user_id: str,
    ) -> VulnerabilidadRead:
        """Analyst approves triage suggestion"""

        if final_classification == "Probable False Positive":
            # Soft delete the vulnerability
            vulnerability = await self.db.get(Vulnerabilidad, vulnerabilidad_id)
            vulnerability.deleted_at = datetime.utcnow()
            vulnerability.deleted_by = user_id

            history_entry = HistorialVulnerabilidad(
                vulnerabilidad_id=vulnerabilidad_id,
                estado_anterior=vulnerability.estado,
                estado_nuevo="Cerrada",
                usuario_id=user_id,
                comentario=f"Closed as False Positive (confirmed by analyst)",
                tipo_cambio="FP_CLOSURE",
            )

        else:
            # Keep vulnerability open, mark as verified
            vulnerability = await self.db.get(Vulnerabilidad, vulnerabilidad_id)

            history_entry = HistorialVulnerabilidad(
                vulnerabilidad_id=vulnerabilidad_id,
                estado_anterior=vulnerability.estado,
                estado_nuevo=vulnerability.estado,
                usuario_id=user_id,
                comentario=f"Confirmed as real vulnerability by analyst",
                tipo_cambio="TRIAGE_CONFIRMED",
            )

        self.db.add(history_entry)
        await self.db.commit()

        return VulnerabilidadRead.from_orm(vulnerability)

    async def batch_triage_findings(
        self,
        vulnerabilidad_ids: list[str],
        code_snippets: Optional[dict[str, str]] = None,
        repo_context: Optional[str] = None,
    ) -> list[dict]:
        """Batch classify multiple findings"""

        results = []

        for vuln_id in vulnerabilidad_ids[:100]:  # Max 100 per batch
            try:
                code_snippet = (code_snippets or {}).get(vuln_id)
                result = await self.classify_finding(
                    vuln_id,
                    code_snippet=code_snippet,
                    repo_context=repo_context,
                )
                results.append({"vulnerabilidad_id": vuln_id, **result})
            except Exception as e:
                logger.warning(f"Failed to classify {vuln_id}: {e}")
                results.append({
                    "vulnerabilidad_id": vuln_id,
                    "error": str(e),
                })

        return results
