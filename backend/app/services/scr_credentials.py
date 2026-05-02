"""Resolución de credenciales SCR desde BD (prioridad) o variables de entorno."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.models.code_security_review import CodeSecurityReview
from app.models.agente_config import AgenteConfig
from app.models.scr_github_token import ScrGitHubToken
from app.models.scr_llm_configuration import ScrLlmConfiguration
from app.services.ia_provider import AIProviderType
from app.services.scr_llm_runtime import ScrLlmRuntime

if TYPE_CHECKING:
    pass


def _can_use_github_row(row: ScrGitHubToken, review_user_id: uuid.UUID) -> bool:
    if row.user_id is None:
        return True
    return row.user_id == review_user_id


async def resolve_github_token_plain(db: AsyncSession, review: CodeSecurityReview) -> str | None:
    """Token PAT para API GitHub + clone autenticado. None → solo público / sin API."""
    base = (
        select(ScrGitHubToken)
        .where(ScrGitHubToken.deleted_at.is_(None))
        .order_by(ScrGitHubToken.created_at.desc())
    )
    cfg = review.scr_config or {}
    raw_id = cfg.get("github_token_id")
    if raw_id:
        try:
            tid = uuid.UUID(str(raw_id))
        except (ValueError, TypeError):
            tid = None
        if tid:
            res = await db.execute(base.where(ScrGitHubToken.id == tid))
            row = res.scalar_one_or_none()
            if row and _can_use_github_row(row, review.user_id):
                return row.token_secret
            logger.warning(
                "scr.creds.github_token_id_invalid",
                extra={"event": "scr.creds.github_token_id_invalid", "review_id": str(review.id)},
            )

    res = await db.execute(base.where(ScrGitHubToken.user_id.is_(None)))
    platform = res.scalars().first()
    if platform and platform.token_secret:
        return platform.token_secret

    res2 = await db.execute(base.where(ScrGitHubToken.user_id == review.user_id))
    user_row = res2.scalars().first()
    if user_row and user_row.token_secret:
        return user_row.token_secret

    return None


def _can_use_llm_row(row: ScrLlmConfiguration, review_user_id: uuid.UUID) -> bool:
    if row.user_id is None:
        return True
    return row.user_id == review_user_id


async def resolve_scr_llm_runtime(db: AsyncSession, review: CodeSecurityReview) -> ScrLlmRuntime | None:
    """Config LLM persistida aplicable a esta revisión."""
    cfg = review.scr_config or {}
    raw_id = cfg.get("llm_config_id")
    base_q = select(ScrLlmConfiguration).where(ScrLlmConfiguration.deleted_at.is_(None))

    if raw_id:
        try:
            lid = uuid.UUID(str(raw_id))
        except (ValueError, TypeError):
            lid = None
        if lid:
            res = await db.execute(base_q.where(ScrLlmConfiguration.id == lid))
            row = res.scalar_one_or_none()
            if row and _can_use_llm_row(row, review.user_id):
                try:
                    prov = AIProviderType(row.provider.strip().lower())
                except ValueError:
                    prov = AIProviderType.OLLAMA
                return ScrLlmRuntime(
                    provider=prov,
                    model=row.model,
                    api_key=row.api_key_secret or "",
                    temperature=float(row.temperature),
                    max_tokens=int(row.max_tokens),
                    timeout_seconds=int(row.timeout_seconds),
                    base_url=row.base_url,
                )

    res = await db.execute(
        base_q.where(ScrLlmConfiguration.user_id.is_(None), ScrLlmConfiguration.is_default.is_(True))
    )
    default_plat = res.scalars().first()
    if default_plat:
        try:
            prov = AIProviderType(default_plat.provider.strip().lower())
        except ValueError:
            prov = AIProviderType.OLLAMA
        return ScrLlmRuntime(
            provider=prov,
            model=default_plat.model,
            api_key=default_plat.api_key_secret or "",
            temperature=float(default_plat.temperature),
            max_tokens=int(default_plat.max_tokens),
            timeout_seconds=int(default_plat.timeout_seconds),
            base_url=default_plat.base_url,
        )

    res2 = await db.execute(
        base_q.where(ScrLlmConfiguration.user_id.is_(None)).order_by(ScrLlmConfiguration.created_at.desc())
    )
    any_plat = res2.scalars().first()
    if any_plat:
        try:
            prov = AIProviderType(any_plat.provider.strip().lower())
        except ValueError:
            prov = AIProviderType.OLLAMA
        return ScrLlmRuntime(
            provider=prov,
            model=any_plat.model,
            api_key=any_plat.api_key_secret or "",
            temperature=float(any_plat.temperature),
            max_tokens=int(any_plat.max_tokens),
            timeout_seconds=int(any_plat.timeout_seconds),
            base_url=any_plat.base_url,
        )

    res3 = await db.execute(
        base_q.where(ScrLlmConfiguration.user_id == review.user_id).order_by(
            ScrLlmConfiguration.created_at.desc()
        )
    )
    user_row = res3.scalars().first()
    if user_row:
        try:
            prov = AIProviderType(user_row.provider.strip().lower())
        except ValueError:
            prov = AIProviderType.OLLAMA
        return ScrLlmRuntime(
            provider=prov,
            model=user_row.model,
            api_key=user_row.api_key_secret or "",
            temperature=float(user_row.temperature),
            max_tokens=int(user_row.max_tokens),
            timeout_seconds=int(user_row.timeout_seconds),
            base_url=user_row.base_url,
        )

    return None


async def resolve_agent_llm_runtime(db: AsyncSession, review: CodeSecurityReview, agent: str) -> ScrLlmRuntime | None:
    """Resuelve LLM por agente; si no existe, cae al LLM de la revisión/default."""
    res = await db.execute(
        select(AgenteConfig)
        .where(
            AgenteConfig.agente_tipo == agent,
            AgenteConfig.usuario_id.is_(None),
            AgenteConfig.revision_id.is_(None),
            AgenteConfig.activo.is_(True),
        )
        .order_by(AgenteConfig.actualizado_en.desc())
    )
    cfg = res.scalars().first()
    raw_id = (cfg.parametros_llm or {}).get("llm_config_id") if cfg else None
    if raw_id:
        review_cfg = dict(review.scr_config or {})
        review_cfg["llm_config_id"] = raw_id
        proxy_review = CodeSecurityReview(
            id=review.id,
            user_id=review.user_id,
            titulo=review.titulo,
            estado=review.estado,
            progreso=review.progreso,
            rama_analizar=review.rama_analizar,
            url_repositorio=review.url_repositorio,
            scan_mode=review.scan_mode,
            scr_config=review_cfg,
        )
        return await resolve_scr_llm_runtime(db, proxy_review)
    return await resolve_scr_llm_runtime(db, review)
