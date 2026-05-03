"""IA endpoints — improve-text writing assistant and related utilities."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ServiceUnavailableException
from app.core.response import success
from app.models.user import User
from app.services.ia_provider import IAProviderError, run_prompt

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────


class ImproveTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000, description="Texto a mejorar")
    tone: Literal["formal", "tecnico", "ejecutivo", "conciso"] = Field(
        default="formal",
        description="Tono deseado para el texto mejorado",
    )
    language: Literal["es", "en"] = Field(default="es", description="Idioma objetivo")
    context: str | None = Field(
        default=None,
        max_length=500,
        description="Contexto adicional (e.g. 'informe ejecutivo', 'ticket de vulnerabilidad')",
    )


class ImproveTextResponse(BaseModel):
    original: str
    improved: str
    tone: str
    language: str
    provider: str
    model: str


# ── Helpers ───────────────────────────────────────────────────────────────────

_TONE_INSTRUCTIONS: dict[str, str] = {
    "formal": "formal y profesional, adecuado para documentos corporativos",
    "tecnico": "técnico y preciso, usando terminología de seguridad informática cuando aplique",
    "ejecutivo": "ejecutivo y orientado a negocio, resaltando impacto y riesgo",
    "conciso": "conciso y directo, eliminando redundancias y manteniendo solo lo esencial",
}

_LANG_INSTRUCTIONS: dict[str, str] = {
    "es": "en español",
    "en": "in English",
}


def _build_improve_prompt(req: ImproveTextRequest) -> tuple[str, str]:
    tone_desc = _TONE_INSTRUCTIONS.get(req.tone, "formal")
    lang_desc = _LANG_INSTRUCTIONS.get(req.language, "en español")
    context_hint = f"\nContexto adicional: {req.context}" if req.context else ""

    system = (
        "Eres un asistente de redacción especializado en ciberseguridad y aplicaciones empresariales. "
        "Tu tarea es mejorar textos manteniendo el significado original pero elevando la calidad redaccional. "
        "Responde ÚNICAMENTE con el texto mejorado, sin explicaciones ni comentarios adicionales."
    )

    prompt = (
        f"Mejora el siguiente texto de forma {tone_desc}, {lang_desc}.{context_hint}\n\n"
        f"Texto original:\n{req.text}\n\n"
        "Texto mejorado:"
    )
    return system, prompt


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/improve-text", response_model=None)
async def improve_text(
    body: ImproveTextRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Mejora un texto usando el proveedor IA configurado.

    Admite diferentes tonos (formal, técnico, ejecutivo, conciso) e idiomas.
    Requiere que el proveedor IA esté activo y configurado en ajustes del sistema.
    """
    system_msg, prompt = _build_improve_prompt(body)
    full_prompt = f"{system_msg}\n\n{prompt}"

    try:
        result = await run_prompt(db, prompt=full_prompt, dry_run=False)
    except IAProviderError as exc:
        raise ServiceUnavailableException(f"Proveedor IA no disponible: {exc}") from exc

    improved = result.content.strip()

    return success(
        ImproveTextResponse(
            original=body.text,
            improved=improved,
            tone=body.tone,
            language=body.language,
            provider=result.provider,
            model=result.model,
        ).model_dump()
    )


@router.post("/improve-text/preview", response_model=None)
async def improve_text_preview(
    body: ImproveTextRequest,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    """Vista previa de mejora de texto en modo simulación (dry_run).

    No consume tokens del proveedor IA. Útil para verificar la configuración
    y la estructura de la respuesta antes de usar el endpoint real.
    """
    result = await run_prompt(db, prompt="preview", dry_run=True)

    return success(
        ImproveTextResponse(
            original=body.text,
            improved=f"[PREVIEW] {body.text}",
            tone=body.tone,
            language=body.language,
            provider=result.provider,
            model=result.model,
        ).model_dump()
    )
