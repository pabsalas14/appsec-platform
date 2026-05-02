"""Admin Endpoints for SCR Configuration — LLM Providers, GitHub Tokens, Agent Prompts."""

import os
import time
from datetime import UTC, datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_backoffice, require_permission
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.permissions import P
from app.core.response import success, error
from app.models.agente_config import AgenteConfig
from app.models.code_security_event import CodeSecurityEvent
from app.models.code_security_finding import CodeSecurityFinding
from app.models.code_security_report import CodeSecurityReport
from app.models.code_security_review import CodeSecurityReview
from app.models.scr_github_token import ScrGitHubToken
from app.models.scr_analysis_metric import ScrAnalysisMetric
from app.models.scr_llm_configuration import ScrLlmConfiguration
from app.models.user import User
from app.services.ia_provider import AIProviderType, get_ai_provider
from app.services.scr_github_client import validate_github_personal_access_token
from app.services.scr_github_context import scr_github_bearer_token
from app.services.scr_gitlab_client import list_gitlab_projects, validate_gitlab_personal_access_token
from app.services.scr_llm_catalog import (
    ANTHROPIC_DEFAULT_MODEL,
    LLM_PROVIDER_CATALOG,
    default_base_url,
    fetch_provider_models,
    normalize_provider,
    normalize_model,
    provider_catalog_payload,
)

router = APIRouter(prefix="/admin/scr", tags=["SCR Admin"], dependencies=[Depends(require_backoffice)])


def _scr_secret_hint(secret: str) -> str:
    s = (secret or "").strip()
    if len(s) <= 4:
        return "****"
    return f"…{s[-4:]}"


# ─────────────────────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────────────────────

class LLMProviderConfigSchema(BaseModel):
    provider: str
    api_key: str = ""
    model: str
    temperature: float = Field(ge=0.0, le=1.0, default=0.3)
    max_tokens: int = Field(ge=100, le=32768, default=4096)
    timeout_seconds: int = Field(ge=10, le=600, default=300)
    base_url: Optional[str] = None
    is_default: bool = False

    model_config = {
        "examples": [
            {
                "provider": "anthropic",
                "api_key": "sk-ant-...",
                "model": ANTHROPIC_DEFAULT_MODEL,
                "temperature": 0.3,
                "max_tokens": 2048,
                "timeout_seconds": 300
            }
        ]
    }


class GitHubTokenSchema(BaseModel):
    platform: str  # github|gitlab
    token: str
    token_type: str = "personal"  # personal|app|oauth
    organization: Optional[str] = None
    permissions: Optional[list[str]] = None
    label: str = Field(default="SCR GitHub", max_length=255)


class AgentPromptConfigSchema(BaseModel):
    agent: str  # inspector|detective|fiscal
    system_prompt: str
    analysis_context: Optional[str] = None
    output_format: Optional[str] = None
    llm_config_id: Optional[UUID] = None


class PromptTestSchema(BaseModel):
    agent: str  # inspector|detective|fiscal
    code_snippet: str = Field(max_length=10000)
    context: Optional[dict] = None


_LEGACY_AGENT_DEFAULTS = {
    "inspector": {
        "system_prompt": (
            "Eres un experto en detección de código malicioso. Identifica backdoors, exfiltración, "
            "logic bombs, ejecución remota y abuso de secretos. Responde solo JSON válido."
        ),
        "analysis_context": "Analiza archivos fuente y prioriza evidencia concreta con archivo, líneas y snippet.",
        "output_format": "JSON con findings[{tipo_malicia,severidad,confianza,archivo,linea_inicio,linea_fin,descripcion,remediacion_sugerida}]",
    },
    "detective": {
        "system_prompt": (
            "Eres un investigador forense de Git. Correlaciona hallazgos con commits, autores, horarios "
            "y cambios sospechosos. Responde solo JSON válido."
        ),
        "analysis_context": "Explica por qué un commit o patrón temporal incrementa el riesgo del hallazgo.",
        "output_format": "JSON con events[{commit_hash,autor,archivo,accion,nivel_riesgo,indicadores,descripcion}]",
    },
    "fiscal": {
        "system_prompt": (
            "Eres un fiscal técnico de seguridad. Consolida hallazgos y eventos en un reporte ejecutivo "
            "accionable con riesgo, impacto y plan de remediación."
        ),
        "analysis_context": "Genera narrativa clara, severidad global y recomendaciones priorizadas.",
        "output_format": "JSON con resumen_ejecutivo,puntuacion_riesgo_global,pasos_remediacion,conclusion",
    },
}


_AGENT_DEFAULTS = {
    "inspector": {
        "system_prompt": (
            "Actúa como Inspector SCR senior especializado en detección de código malicioso dentro de "
            "repositorios corporativos. Tu misión es encontrar evidencia técnica de comportamiento "
            "malicioso o abuso deliberado, no vulnerabilidades genéricas. Prioriza backdoors, ejecución "
            "remota encubierta, exfiltración, robo o exposición de secretos, logic bombs, sabotaje, "
            "persistencia, evasión, dependencias sospechosas y cambios que degraden controles de seguridad. "
            "Debes basar cada hallazgo en evidencia observable del código recibido. No inventes archivos, "
            "líneas, autores ni impacto. Si la evidencia es débil, baja la confianza o no reportes el hallazgo. "
            "Responde exclusivamente JSON válido, sin markdown ni texto adicional."
        ),
        "analysis_context": (
            "Analiza el fragmento como parte de un escaneo SCR. Revisa intención, flujo de datos, llamadas "
            "a red, manejo de archivos, ejecución de comandos, uso de credenciales, dependencias, hooks, "
            "scripts de build/deploy y cualquier patrón diseñado para ocultarse. Diferencia código legítimo "
            "de administración/observabilidad frente a comportamiento malicioso. Cada hallazgo debe incluir "
            "archivo, rango de líneas cuando exista, snippet mínimo, explicación de por qué es sospechoso, "
            "impacto probable, confianza entre 0 y 1 y remediación accionable."
        ),
        "output_format": (
            "JSON estricto: {\"findings\":[{\"tipo_malicia\":\"backdoor|exfiltracion|secreto|rce|logic_bomb|"
            "sabotaje|persistencia|evasion|dependencia_sospechosa|otro\",\"severidad\":\"critical|high|medium|"
            "low\",\"confianza\":0.0,\"archivo\":\"string\",\"linea_inicio\":0,\"linea_fin\":0,\"snippet\":\"string\","
            "\"descripcion\":\"string\",\"evidencia\":[\"string\"],\"impacto\":\"string\",\"remediacion_sugerida\":"
            "\"string\",\"razonamiento\":\"string\"}]}. Si no hay evidencia suficiente: {\"findings\":[]}."
        ),
    },
    "detective": {
        "system_prompt": (
            "Actúa como Detective SCR, investigador forense de Git y trazabilidad de cambios. Tu trabajo es "
            "correlacionar hallazgos técnicos con commits, autores, archivos, tiempos, ramas y patrones de "
            "modificación para explicar cómo pudo introducirse el riesgo. Busca señales como cambios pequeños "
            "en zonas críticas, commits fuera de horario, mensajes evasivos, autores nuevos, modificaciones "
            "a CI/CD, dependencias, scripts, permisos, autenticación o controles de auditoría. No acuses a una "
            "persona sin evidencia: reporta hechos verificables e indicadores. Responde exclusivamente JSON "
            "válido, sin markdown ni texto adicional."
        ),
        "analysis_context": (
            "Usa los hallazgos del Inspector y la metadata Git disponible para construir una línea de tiempo "
            "forense. Evalúa si el cambio parece accidental, negligente o deliberadamente sospechoso según "
            "evidencia concreta. Agrupa eventos relacionados, identifica archivos críticos, commits pivote, "
            "autoría, señales de ocultamiento y dependencias entre cambios. Si falta metadata, declara la "
            "limitación en el campo descripcion y reduce la confianza."
        ),
        "output_format": (
            "JSON estricto: {\"events\":[{\"commit_hash\":\"string|null\",\"autor\":\"string|null\","
            "\"fecha\":\"string|null\",\"archivo\":\"string\",\"accion\":\"added|modified|deleted|renamed|unknown\","
            "\"nivel_riesgo\":\"critical|high|medium|low\",\"confianza\":0.0,\"indicadores\":[\"string\"],"
            "\"hallazgos_relacionados\":[\"string\"],\"descripcion\":\"string\",\"hipotesis\":\"string\","
            "\"siguiente_paso\":\"string\"}],\"timeline_summary\":\"string\"}. Si no hay evidencia suficiente: "
            "{\"events\":[],\"timeline_summary\":\"Sin eventos forenses concluyentes con la evidencia disponible.\"}."
        ),
    },
    "fiscal": {
        "system_prompt": (
            "Actúa como Fiscal SCR, responsable de convertir evidencia técnica y forense en un dictamen "
            "ejecutivo claro, defendible y accionable. Debes consolidar hallazgos del Inspector y eventos "
            "del Detective, estimar riesgo global, separar hechos de hipótesis, priorizar remediación y "
            "explicar impacto para seguridad, negocio y operación. No exageres severidad ni inventes datos. "
            "Si la evidencia no sostiene una conclusión, decláralo explícitamente. Responde exclusivamente "
            "JSON válido, sin markdown ni texto adicional."
        ),
        "analysis_context": (
            "Genera un reporte final para responsables técnicos y gerenciales. Resume el alcance analizado, "
            "principales riesgos, evidencia clave, confianza, impacto, recomendaciones priorizadas y pasos "
            "de contención/remediación. Incluye una conclusión proporcional a la evidencia y marca supuestos "
            "o limitaciones cuando existan. La puntuación global debe considerar severidad, confianza, "
            "explotabilidad, alcance del repositorio y correlación forense."
        ),
        "output_format": (
            "JSON estricto: {\"resumen_ejecutivo\":\"string\",\"puntuacion_riesgo_global\":0,"
            "\"severidad_global\":\"critical|high|medium|low|informational\",\"confianza_global\":0.0,"
            "\"evidencia_clave\":[\"string\"],\"impacto\":\"string\",\"pasos_remediacion\":[\"string\"],"
            "\"acciones_inmediatas\":[\"string\"],\"supuestos_limitaciones\":[\"string\"],\"conclusion\":\"string\"}."
        ),
    },
}


def _validate_agent(agent: str) -> str:
    normalized = (agent or "").strip().lower()
    if normalized not in _AGENT_DEFAULTS:
        raise BadRequestException(f"Agente no soportado: {agent}")
    return normalized


def _agent_uses_legacy_defaults(row: AgenteConfig, agent: str) -> bool:
    legacy = _LEGACY_AGENT_DEFAULTS[agent]
    params = row.parametros_llm or {}
    return (
        (row.prompt_sistema_personalizado or "").strip() == legacy["system_prompt"]
        and (params.get("analysis_context") or "") == legacy["analysis_context"]
        and (params.get("output_format") or "") == legacy["output_format"]
    )


async def _get_or_create_agent_config(db: AsyncSession, agent: str) -> AgenteConfig:
    normalized = _validate_agent(agent)
    res = await db.execute(
        select(AgenteConfig).where(
            AgenteConfig.agente_tipo == normalized,
            AgenteConfig.usuario_id.is_(None),
            AgenteConfig.revision_id.is_(None),
            AgenteConfig.activo.is_(True),
        )
    )
    row = res.scalar_one_or_none()
    if row is not None:
        if _agent_uses_legacy_defaults(row, normalized):
            defaults = _AGENT_DEFAULTS[normalized]
            params = row.parametros_llm or {}
            row.prompt_sistema_personalizado = defaults["system_prompt"]
            row.parametros_llm = {
                **params,
                "analysis_context": defaults["analysis_context"],
                "output_format": defaults["output_format"],
            }
            await db.flush()
        return row

    defaults = _AGENT_DEFAULTS[normalized]
    row = AgenteConfig(
        agente_tipo=normalized,
        prompt_sistema_personalizado=defaults["system_prompt"],
        parametros_llm={
            "analysis_context": defaults["analysis_context"],
            "output_format": defaults["output_format"],
            "llm_config_id": None,
        },
        activo=True,
    )
    db.add(row)
    await db.flush()
    return row


async def _get_platform_scm_token(db: AsyncSession, token_id: UUID) -> ScrGitHubToken:
    res = await db.execute(
        select(ScrGitHubToken).where(
            ScrGitHubToken.id == token_id,
            ScrGitHubToken.deleted_at.is_(None),
            ScrGitHubToken.user_id.is_(None),
        )
    )
    row = res.scalar_one_or_none()
    if row is None:
        raise NotFoundException("Token SCM no encontrado")
    return row


# ─────────────────────────────────────────────────────────────────────────────
# LLM Provider Configuration Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/llm-providers")
async def list_llm_providers(
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Catálogo único de proveedores LLM soportados por SCR."""
    return success({"providers": provider_catalog_payload()})


@router.post("/llm-config/models")
async def list_llm_models(
    config: LLMProviderConfigSchema,
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    provider = normalize_provider(config.provider)
    models = await fetch_provider_models(provider, api_key=config.api_key, base_url=config.base_url)
    return success({"provider": provider, "models": models})


@router.get("/llm-config")
async def get_llm_config(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna configuración actual de proveedores LLM (sin secretos)."""
    q = (
        select(ScrLlmConfiguration)
        .where(ScrLlmConfiguration.deleted_at.is_(None))
        .order_by(ScrLlmConfiguration.is_default.desc(), ScrLlmConfiguration.created_at.desc())
    )
    res = await db.execute(q)
    rows = res.scalars().all()

    providers = []
    active_provider = None
    for row in rows:
        if row.user_id is not None:
            continue
        entry = {
            "id": str(row.id),
            "provider": row.provider,
            "model": row.model,
            "base_url": row.base_url,
            "temperature": row.temperature,
            "max_tokens": row.max_tokens,
            "timeout_seconds": row.timeout_seconds,
            "is_default": row.is_default,
            "api_key_hint": row.api_key_hint,
            "configured_at": row.created_at.isoformat() if row.created_at else None,
        }
        providers.append(entry)
        if row.is_default and active_provider is None:
            active_provider = row.provider

    if active_provider is None and providers:
        active_provider = providers[0]["provider"]

    return success(
        {
            "active_provider": active_provider,
            "providers": providers,
        }
    )


@router.get("/runtime-check")
async def scr_runtime_check(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Checklist operativo para saber si SCR puede ejecutar un flujo end-to-end."""
    llm_count = await db.scalar(
        select(func.count(ScrLlmConfiguration.id)).where(ScrLlmConfiguration.deleted_at.is_(None))
    ) or 0
    token_count = await db.scalar(
        select(func.count(ScrGitHubToken.id)).where(ScrGitHubToken.deleted_at.is_(None))
    ) or 0
    agents_ready = {}
    for agent in ("inspector", "detective", "fiscal"):
        cfg = await _get_or_create_agent_config(db, agent)
        agents_ready[agent] = bool(cfg.prompt_sistema_personalizado)
    return success(
        {
            "ready": bool(llm_count and token_count and all(agents_ready.values())),
            "llm_configurations": int(llm_count),
            "scm_tokens": int(token_count),
            "agents_ready": agents_ready,
            "next_steps": [
                "Configura al menos un LLM válido",
                "Configura un token GitHub/GitLab",
                "Asigna LLM a Inspector, Detective y Fiscal",
                "Ejecuta un escaneo nuevo para poblar telemetría",
            ],
        }
    )


@router.post("/llm-config")
async def set_llm_config(
    config: LLMProviderConfigSchema,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Configura proveedor LLM y guarda en BD (alcance plataforma SCR, ``user_id`` NULL)."""
    try:
        raw = normalize_provider(config.provider)
        catalog = LLM_PROVIDER_CATALOG[raw]
        if catalog.get("requires_api_key") and not config.api_key.strip():
            raise BadRequestException(f"{catalog['label']} requiere API key")
        try:
            prov_enum = AIProviderType(raw)
        except ValueError as e:
            raise BadRequestException(f"Proveedor no soportado: {config.provider}") from e

        hint = _scr_secret_hint(config.api_key)
        model = normalize_model(raw, config.model)
        row = ScrLlmConfiguration(
            user_id=None,
            provider=prov_enum.value,
            model=model,
            api_key_secret=config.api_key.strip(),
            api_key_hint=hint,
            base_url=(config.base_url or default_base_url(raw) or "").strip() or None,
            temperature=config.temperature,
            max_tokens=config.max_tokens,
            timeout_seconds=config.timeout_seconds,
            is_default=config.is_default,
        )
        db.add(row)
        await db.flush()

        if config.is_default:
            await db.execute(
                update(ScrLlmConfiguration)
                .where(
                    ScrLlmConfiguration.id != row.id,
                    ScrLlmConfiguration.user_id.is_(None),
                    ScrLlmConfiguration.deleted_at.is_(None),
                )
                .values(is_default=False)
            )

        return success(
            {
                "message": f"Proveedor LLM {raw} guardado",
                "id": str(row.id),
                "provider": row.provider,
                "model": row.model,
                "base_url": row.base_url,
                "configured_at": datetime.now(UTC).isoformat(),
                "is_default": row.is_default,
            }
        )
    except BadRequestException:
        raise
    except Exception as e:
        return error({"message": str(e)})


@router.post("/llm-config/test-connection")
async def test_llm_connection(
    config: LLMProviderConfigSchema,
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Prueba conectividad al proveedor LLM con ``health_check``."""
    if not (config.provider and config.model):
        raise BadRequestException("Faltan campos obligatorios: provider, model")

    try:
        raw = normalize_provider(config.provider)
        catalog = LLM_PROVIDER_CATALOG[raw]
        if catalog.get("requires_api_key") and not config.api_key.strip():
            raise BadRequestException(f"{catalog['label']} requiere API key")
        prov_enum = AIProviderType(raw)
    except ValueError as e:
        raise BadRequestException(f"Proveedor no soportado: {config.provider}") from e

    model = normalize_model(raw, config.model)
    kwargs: dict = {"model": model, "timeout_seconds": config.timeout_seconds}
    base = (config.base_url or default_base_url(raw) or "").strip()
    if base:
        kwargs["base_url"] = base
    if config.api_key.strip():
        kwargs["api_key"] = config.api_key.strip()

    t0 = time.perf_counter()
    provider_obj = get_ai_provider(prov_enum, **kwargs)
    healthy = await provider_obj.health_check()
    models = await fetch_provider_models(raw, api_key=config.api_key.strip(), base_url=base or None)
    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    if not healthy:
        return success(
            {
                "valid": False,
                "provider": config.provider,
                "model": model,
                "models": models,
                "response_time_ms": elapsed_ms,
                "message": getattr(
                    provider_obj,
                    "last_health_error",
                    None,
                )
                or "El proveedor rechazó la prueba de conexión. Revisa API key, modelo y Base URL.",
            }
        )

    return success(
        {
            "valid": True,
            "provider": raw,
            "model": model,
            "models": models,
            "response_time_ms": elapsed_ms,
            "message": f"Conexión correcta con {config.provider}",
        }
    )


# ─────────────────────────────────────────────────────────────────────────────
# GitHub Token Configuration Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/github-tokens")
async def list_github_tokens(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista tokens GitHub/GitLab configurados (sin el secreto)."""
    q = (
        select(ScrGitHubToken)
        .where(ScrGitHubToken.deleted_at.is_(None))
        .order_by(ScrGitHubToken.created_at.desc())
    )
    res = await db.execute(q)
    rows = res.scalars().all()
    tokens = []
    for row in rows:
        if row.user_id is not None:
            continue
        tokens.append(
            {
                "id": str(row.id),
                "label": row.label,
                "platform": row.platform,
                "token_hint": row.token_hint,
                "user": row.user_github,
                "organizations": row.organizations_list or [],
                "repos_count": row.repo_count,
                "last_validated": row.last_validated.isoformat() if row.last_validated else None,
                "expiration_date": row.expiration_date.isoformat() if row.expiration_date else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            }
        )
    return success({"tokens": tokens})


@router.post("/github-tokens")
async def add_github_token(
    schema: GitHubTokenSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Agrega token SCM para SCR."""
    platform = schema.platform.lower()
    if platform == "github":
        vr = await validate_github_personal_access_token(schema.token)
    elif platform == "gitlab":
        vr = await validate_gitlab_personal_access_token(schema.token)
    else:
        raise BadRequestException("Solo se admite platform=github o platform=gitlab.")
    if not vr["valid"]:
        raise BadRequestException(vr.get("message") or "Token SCM inválido")

    hint = _scr_secret_hint(schema.token)
    row = ScrGitHubToken(
        user_id=None,
        label=schema.label.strip() or f"SCR {platform.title()}",
        platform=platform,
        token_secret=schema.token.strip(),
        token_hint=hint,
        user_github=vr.get("user"),
        org_count=len(vr.get("organizations") or []),
        repo_count=int(vr.get("repos_count") or 0),
        organizations_list=list(vr.get("organizations") or []),
        expiration_date=None,
        last_validated=datetime.now(UTC),
    )
    db.add(row)
    await db.flush()

    return success(
        {
            "message": "Token GitHub guardado",
            "id": str(row.id),
            "platform": schema.platform,
            "token_type": schema.token_type,
            "created_at": row.created_at.isoformat() if row.created_at else datetime.now(UTC).isoformat(),
        }
    )


@router.post("/github-tokens/validate")
async def validate_github_token(
    schema: GitHubTokenSchema,
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Valida un PAT contra la API de GitHub o GitLab."""
    platform = schema.platform.lower()
    if platform == "github":
        vr = await validate_github_personal_access_token(schema.token)
    elif platform == "gitlab":
        vr = await validate_gitlab_personal_access_token(schema.token)
    else:
        vr = {"valid": False, "message": "Solo GitHub/GitLab están soportados", "user": None, "organizations": [], "repos_count": 0}
    return success(vr)


@router.patch("/github-tokens/{token_id}")
async def update_github_token(
    token_id: UUID,
    schema: GitHubTokenSchema,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Actualiza token GitHub (re-valida si cambia el secreto)."""
    res = await db.execute(
        select(ScrGitHubToken).where(
            ScrGitHubToken.id == token_id,
            ScrGitHubToken.deleted_at.is_(None),
            ScrGitHubToken.user_id.is_(None),
        )
    )
    row = res.scalar_one_or_none()
    if row is None:
        raise NotFoundException("Token no encontrado")

    platform = schema.platform.lower()
    if platform == "github":
        vr = await validate_github_personal_access_token(schema.token)
    elif platform == "gitlab":
        vr = await validate_gitlab_personal_access_token(schema.token)
    else:
        raise BadRequestException("Solo se admite platform=github o platform=gitlab.")
    if not vr["valid"]:
        raise BadRequestException(vr.get("message") or "Token GitHub inválido")

    row.token_secret = schema.token.strip()
    row.token_hint = _scr_secret_hint(schema.token)
    row.label = schema.label.strip() or row.label
    row.platform = platform
    row.user_github = vr.get("user")
    row.org_count = len(vr.get("organizations") or [])
    row.repo_count = int(vr.get("repos_count") or 0)
    row.organizations_list = list(vr.get("organizations") or [])
    row.last_validated = datetime.now(UTC)

    await db.flush()

    return success(
        {
            "message": "Token GitHub actualizado",
            "token_id": str(token_id),
            "updated_at": datetime.now(UTC).isoformat(),
        }
    )


@router.delete("/github-tokens/{token_id}")
async def delete_github_token(
    token_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.DELETE)),
):
    """Elimina (soft-delete) un token GitHub."""
    res = await db.execute(
        select(ScrGitHubToken).where(
            ScrGitHubToken.id == token_id,
            ScrGitHubToken.deleted_at.is_(None),
            ScrGitHubToken.user_id.is_(None),
        )
    )
    row = res.scalar_one_or_none()
    if row is None:
        raise NotFoundException("Token no encontrado")

    row.deleted_at = datetime.now(UTC)
    row.deleted_by = current_user.id
    await db.flush()

    return success({"message": "Token GitHub eliminado", "token_id": str(token_id)})


@router.get("/github-tokens/{token_id}/repos")
async def list_repos_for_github_token(
    token_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista repositorios accesibles por el token configurado."""
    from app.services.scr_github_client import list_accessible_repos

    token = await _get_platform_scm_token(db, token_id)
    if token.platform == "gitlab":
        repos = await list_gitlab_projects(token.token_secret, limit=100)
        return success({"token_id": str(token_id), "repos": repos})
    with scr_github_bearer_token(token.token_secret):
        repos = await list_accessible_repos(limit=100)
    return success({"token_id": str(token_id), "repos": repos})


@router.get("/github-tokens/{token_id}/orgs")
async def list_orgs_for_github_token(
    token_id: UUID,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista organizaciones visibles por el token configurado."""
    from app.services.scr_github_client import list_orgs

    token = await _get_platform_scm_token(db, token_id)
    if token.platform == "gitlab":
        return success({"token_id": str(token_id), "orgs": token.organizations_list or []})
    with scr_github_bearer_token(token.token_secret):
        orgs = await list_orgs()
    return success({"token_id": str(token_id), "orgs": orgs})


@router.get("/github-tokens/{token_id}/orgs/{org_slug}/repos")
async def list_org_repos_for_github_token(
    token_id: UUID,
    org_slug: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista repositorios de una organización usando el token configurado."""
    from app.services.scr_github_client import list_org_repos

    token = await _get_platform_scm_token(db, token_id)
    if token.platform == "gitlab":
        repos = [repo for repo in await list_gitlab_projects(token.token_secret, limit=100) if org_slug in str(repo.get("full_name"))]
        return success({"token_id": str(token_id), "org_slug": org_slug, "repos": repos})
    with scr_github_bearer_token(token.token_secret):
        repos = await list_org_repos(org_slug, limit=100)
    return success({"token_id": str(token_id), "org_slug": org_slug, "repos": repos})


@router.get("/github-tokens/{token_id}/branches")
async def list_branches_for_github_token(
    token_id: UUID,
    repo_url: str = Query(..., description="GitHub repository URL"),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista ramas de un repositorio usando el token configurado."""
    from app.services.scr_github_client import list_repository_branches

    token = await _get_platform_scm_token(db, token_id)
    if token.platform == "gitlab":
        return success({"token_id": str(token_id), "repo_url": repo_url, "branches": [{"name": "main", "is_default": True}]})
    with scr_github_bearer_token(token.token_secret):
        branches = await list_repository_branches(repo_url)
    return success({"token_id": str(token_id), "repo_url": repo_url, "branches": branches})


# ─────────────────────────────────────────────────────────────────────────────
# Agent Configuration Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/agents/{agent}/prompts")
async def get_agent_prompt(
    agent: str,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna prompt configurado para un agente."""
    row = await _get_or_create_agent_config(db, agent)
    params = row.parametros_llm or {}
    return success(
        {
            "agent": row.agente_tipo,
            "system_prompt": row.prompt_sistema_personalizado or _AGENT_DEFAULTS[row.agente_tipo]["system_prompt"],
            "analysis_context": params.get("analysis_context") or _AGENT_DEFAULTS[row.agente_tipo]["analysis_context"],
            "output_format": params.get("output_format") or _AGENT_DEFAULTS[row.agente_tipo]["output_format"],
            "llm_config_id": params.get("llm_config_id"),
            "provider": row.proveedor_preferido,
            "last_updated": row.actualizado_en.isoformat() if row.actualizado_en else None,
        }
    )


@router.patch("/agents/{agent}/prompts")
async def update_agent_prompt(
    agent: str,
    config: AgentPromptConfigSchema,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Actualiza prompt configurado para un agente."""
    normalized = _validate_agent(agent)
    row = await _get_or_create_agent_config(db, normalized)
    row.prompt_sistema_personalizado = config.system_prompt.strip()
    row.parametros_llm = {
        **(row.parametros_llm or {}),
        "analysis_context": config.analysis_context or "",
        "output_format": config.output_format or "",
        "llm_config_id": str(config.llm_config_id) if config.llm_config_id else None,
    }
    if config.llm_config_id:
        res = await db.execute(
            select(ScrLlmConfiguration).where(
                ScrLlmConfiguration.id == config.llm_config_id,
                ScrLlmConfiguration.deleted_at.is_(None),
            )
        )
        llm_row = res.scalar_one_or_none()
        if llm_row is None:
            raise NotFoundException("Configuración LLM no encontrada")
        row.proveedor_preferido = llm_row.provider
    row.actualizado_en = datetime.now(UTC)
    await db.flush()
    return success(
        {
            "message": f"Prompt actualizado para agente {normalized}",
            "agent": normalized,
            "updated_at": row.actualizado_en.isoformat(),
        }
    )


@router.post("/agents/{agent}/test-prompt")
async def test_agent_prompt(
    agent: str,
    test_data: PromptTestSchema,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Prueba un prompt contra código de muestra."""
    try:
        normalized = _validate_agent(agent)
        row = await _get_or_create_agent_config(db, normalized)
        from app.services.scr_credentials import resolve_scr_llm_runtime
        from app.services.scr_llm_runtime import get_ai_provider_for_scr_runtime

        llm = None
        res = await db.execute(
            select(ScrLlmConfiguration)
            .where(ScrLlmConfiguration.deleted_at.is_(None), ScrLlmConfiguration.user_id.is_(None))
            .order_by(ScrLlmConfiguration.is_default.desc(), ScrLlmConfiguration.created_at.desc())
        )
        cfg = res.scalars().first()
        if cfg is not None:
            from app.models.code_security_review import CodeSecurityReview

            dummy_review = CodeSecurityReview(
                id=UUID(int=0),
                user_id=UUID(int=0),
                titulo="prompt-test",
                rama_analizar="main",
                scan_mode="PUBLIC_URL",
                scr_config={"llm_config_id": str(cfg.id)},
            )
            llm = await resolve_scr_llm_runtime(db, dummy_review)
        provider_obj = get_ai_provider_for_scr_runtime(llm)
        params = row.parametros_llm or {}
        t0 = time.perf_counter()
        generated = await provider_obj.generate(
            prompt=f"{params.get('analysis_context', '')}\n\nCódigo de prueba:\n{test_data.code_snippet}",
            system=row.prompt_sistema_personalizado,
            temperature=0.1,
            max_tokens=800,
        )
        elapsed_ms = int((time.perf_counter() - t0) * 1000)
        return success(
            {
                "agent": normalized,
                "code_snippet_length": len(test_data.code_snippet),
                "test_result": "success",
                "processing_time_ms": elapsed_ms,
                "output_sample": generated.content[:2000],
                "tokens_used": generated.tokens_used,
                "message": f"Prueba completada para agente {normalized}",
            }
        )
    except Exception as e:
        return success(
            {
                "agent": normalized,
                "code_snippet_length": len(test_data.code_snippet),
                "test_result": "failed",
                "output_sample": "",
                "tokens_used": None,
                "message": f"No se pudo probar el agente: {str(e)[:300]}",
            }
        )


@router.get("/agents/{agent}/stats")
async def get_agent_stats(
    agent: str,
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Retorna estadísticas de uso de un agente."""
    normalized = _validate_agent(agent)
    start_date = datetime.now(UTC) - timedelta(days=days)
    metrics_stmt = select(
        func.count(ScrAnalysisMetric.id),
        func.coalesce(func.sum(ScrAnalysisMetric.tokens_used), 0),
        func.coalesce(func.avg(ScrAnalysisMetric.duration_ms), 0),
        func.coalesce(func.sum(ScrAnalysisMetric.estimated_cost_usd), 0),
    ).where(
        ScrAnalysisMetric.user_id == current_user.id,
        ScrAnalysisMetric.agent == normalized,
        ScrAnalysisMetric.created_at >= start_date,
    )
    metric_count, tokens_consumed, avg_duration_ms, estimated_cost_usd = (await db.execute(metrics_stmt)).one()
    analyses_count = int(metric_count or 0)
    findings_count = await db.scalar(
        select(func.count(CodeSecurityFinding.id)).where(
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.created_at >= start_date,
        )
    ) or 0
    false_positive_count = await db.scalar(
        select(func.count(CodeSecurityFinding.id)).where(
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.estado == "FALSE_POSITIVE",
            CodeSecurityFinding.updated_at >= start_date,
        )
    ) or 0
    confirmed_count = await db.scalar(
        select(func.count(CodeSecurityFinding.id)).where(
            CodeSecurityFinding.user_id == current_user.id,
            CodeSecurityFinding.deleted_at.is_(None),
            CodeSecurityFinding.estado.in_(["VERIFIED", "CORRECTED", "CLOSED", "IN_CORRECTION"]),
            CodeSecurityFinding.updated_at >= start_date,
        )
    ) or 0
    events_count = await db.scalar(
        select(func.count(CodeSecurityEvent.id))
        .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityEvent.review_id)
        .where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityEvent.created_at >= start_date,
        )
    ) or 0
    reports_count = await db.scalar(
        select(func.count(CodeSecurityReport.id))
        .join(CodeSecurityReview, CodeSecurityReview.id == CodeSecurityReport.review_id)
        .where(
            CodeSecurityReview.user_id == current_user.id,
            CodeSecurityReview.deleted_at.is_(None),
            CodeSecurityReport.deleted_at.is_(None),
            CodeSecurityReport.created_at >= start_date,
        )
    ) or 0
    validated_total = int(confirmed_count or 0) + int(false_positive_count or 0)
    precision_rate = round((int(confirmed_count or 0) / validated_total) * 100, 2) if validated_total else None

    stats = {
        "inspector": {
            "analyses_count": analyses_count,
            "findings_detected": findings_count,
            "confirmed_findings": int(confirmed_count or 0),
            "false_positives": int(false_positive_count or 0),
            "precision_rate": precision_rate,
        },
        "detective": {"analyses_count": analyses_count, "forensic_events_detected": events_count},
        "fiscal": {"reports_generated": reports_count, "analyses_count": analyses_count},
    }

    return success({
        "agent": normalized,
        "period_days": days,
        "tokens_consumed": int(tokens_consumed or 0),
        "avg_processing_time_seconds": round(float(avg_duration_ms or 0) / 1000, 2),
        "estimated_cost_usd": round(float(estimated_cost_usd or 0), 6),
        **stats[normalized]
    })


# ─────────────────────────────────────────────────────────────────────────────
# Pattern Library Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/patterns")
async def list_detection_patterns(
    agent: str = Query(None),
    category: str = Query(None),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.VIEW)),
):
    """Lista patrones de detección disponibles."""
    from app.services.scr_inspector_agent import DEFAULT_MALICIOUS_PATTERNS
    config = await _get_or_create_agent_config(db, "inspector")
    disabled_patterns = set((config.parametros_llm or {}).get("disabled_patterns") or [])

    counts_result = await db.execute(
        select(CodeSecurityFinding.tipo_malicia, func.count(CodeSecurityFinding.id))
        .group_by(CodeSecurityFinding.tipo_malicia)
    )
    counts = {row[0]: int(row[1] or 0) for row in counts_result}
    patterns = [
        {
            "id": key,
            "agent": "inspector",
            "category": key.lower(),
            "name": key,
            "description": description,
            "enabled": key not in disabled_patterns,
            "detections_count": counts.get(key, 0),
            "created_at": None,
        }
        for key, description in DEFAULT_MALICIOUS_PATTERNS.items()
    ]

    if agent:
        patterns = [p for p in patterns if p["agent"] == agent]
    if category:
        patterns = [p for p in patterns if p["category"] == category]

    return success({"patterns": patterns, "total": len(patterns)})


@router.patch("/patterns/{pattern_id}")
async def update_pattern(
    pattern_id: str,
    enabled: bool = Body(...),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.EDIT)),
):
    """Habilita o deshabilita un patrón de detección."""
    row = await _get_or_create_agent_config(db, "inspector")
    params = dict(row.parametros_llm or {})
    disabled = set(params.get("disabled_patterns") or [])
    if enabled:
        disabled.discard(pattern_id)
    else:
        disabled.add(pattern_id)
    params["disabled_patterns"] = sorted(disabled)
    row.parametros_llm = params
    row.actualizado_en = datetime.now(UTC)
    await db.flush()
    return success({
        "message": "Patrón actualizado",
        "pattern_id": pattern_id,
        "enabled": enabled,
        "updated_at": datetime.now(UTC).isoformat(),
    })


@router.post("/patterns")
async def create_custom_pattern(
    pattern_data: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_permission(P.CODE_SECURITY.CREATE)),
):
    """Crea un patrón de detección personalizado."""
    agent = _validate_agent(str(pattern_data.get("agent") or "inspector"))
    name = str(pattern_data.get("name") or "").strip()
    description = str(pattern_data.get("description") or "").strip()
    if not name or not description:
        raise BadRequestException("Campos requeridos: name, description")
    row = await _get_or_create_agent_config(db, agent)
    row.patrones_personalizados = {**(row.patrones_personalizados or {}), name: description}
    row.actualizado_en = datetime.now(UTC)
    await db.flush()
    return success({
        "message": "Patrón personalizado creado",
        "pattern_id": name,
        "created_at": row.actualizado_en.isoformat(),
    })
