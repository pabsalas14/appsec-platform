"""Admin IA configuration endpoints (phase 17)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_role
from app.core.response import success
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.ia_config import IAConfigRead, IATestCallRead, IATestCallRequest, IAConfigUpdate
from app.services.audit_service import record as audit_record
from app.services.ia_provider import IAProviderError, read_ia_config, run_prompt

router = APIRouter()

IA_KEYS_DEFAULTS = {
    "ia.proveedor_activo": "ollama",
    "ia.modelo": "llama3.1:8b",
    "ia.temperatura": 0.3,
    "ia.max_tokens": 4096,
    "ia.timeout_segundos": 60,
    "ia.sanitizar_datos_paga": True,
}


async def _ensure_ia_seeded(db: AsyncSession) -> None:
    for key, value in IA_KEYS_DEFAULTS.items():
        stmt = (
            pg_insert(SystemSetting)
            .values(
                key=key,
                value=value,
                description="Configuración IA administrable (fase 17).",
            )
            .on_conflict_do_nothing(index_elements=[SystemSetting.key])
        )
        await db.execute(stmt)
    await db.flush()


@router.get("")
async def get_ia_config(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
):
    """Get effective IA provider configuration."""
    await _ensure_ia_seeded(db)
    current = await read_ia_config(db)
    return success(current.model_dump(mode="json"))


@router.put("")
async def put_ia_config(
    payload: IAConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    """Update IA configuration in SystemSetting keys."""
    await _ensure_ia_seeded(db)

    updates = payload.model_dump(exclude_none=True)
    key_map = {
        "proveedor_activo": "ia.proveedor_activo",
        "modelo": "ia.modelo",
        "temperatura": "ia.temperatura",
        "max_tokens": "ia.max_tokens",
        "timeout_segundos": "ia.timeout_segundos",
        "sanitizar_datos_paga": "ia.sanitizar_datos_paga",
    }

    for field, value in updates.items():
        key = key_map[field]
        row = (
            await db.execute(select(SystemSetting).where(SystemSetting.key == key))
        ).scalar_one_or_none()
        if row is None:
            row = SystemSetting(
                key=key,
                value=value,
                description="Configuración IA administrable (fase 17).",
            )
            db.add(row)
        else:
            row.value = value
    await db.flush()

    await audit_record(
        db,
        action="ia.config.update",
        entity_type="system_settings",
        entity_id=admin_user.id,
        metadata={"updated_fields": sorted(list(updates.keys()))},
    )

    current = await read_ia_config(db)
    return success(current.model_dump(mode="json"))


@router.post("/test-call")
async def ia_test_call(
    payload: IATestCallRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role("admin")),
):
    """Execute (or dry-run) a provider call with current IA configuration."""
    await _ensure_ia_seeded(db)
    try:
        result = await run_prompt(db, prompt=payload.prompt, dry_run=payload.dry_run)
    except IAProviderError as exc:
        return success(
            {
                "provider": "unknown",
                "model": "",
                "content": str(exc),
                "usage": None,
                "dry_run": payload.dry_run,
            },
            meta={"status": "provider_error"},
        )

    await audit_record(
        db,
        action="ia.config.test_call",
        entity_type="system_settings",
        entity_id=admin_user.id,
        metadata={
            "provider": result.provider,
            "model": result.model,
            "dry_run": payload.dry_run,
            "prompt_length": len(payload.prompt),
        },
    )
    body = IATestCallRead(
        provider=result.provider,  # type: ignore[arg-type]
        model=result.model,
        content=result.content,
        usage=result.usage,
        dry_run=payload.dry_run,
    )
    return success(body.model_dump(mode="json"))
