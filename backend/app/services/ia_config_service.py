"""
ConfiguracionIA Service for managing IA provider settings
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import ConfiguracionIA
from app.schemas import ConfiguracionIARead, ConfiguracionIAUpdate
from app.services.ia_provider import (
    AIProviderType,
    get_ai_provider,
)


class ConfiguracionIAService:
    """Service for managing IA configuration"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_current_config(self) -> Optional[ConfiguracionIARead]:
        """Get active IA configuration"""

        result = await self.db.execute(select(ConfiguracionIA).limit(1))
        config = result.scalars().first()

        return ConfiguracionIARead.from_orm(config) if config else None

    async def update_config(
        self,
        data: ConfiguracionIAUpdate,
    ) -> ConfiguracionIARead:
        """Update IA configuration"""

        # Get or create config
        result = await self.db.execute(select(ConfiguracionIA).limit(1))
        config = result.scalars().first()

        if not config:
            config = ConfiguracionIA()

        # Update fields
        for field, value in data.dict(exclude_unset=True).items():
            setattr(config, field, value)

        self.db.add(config)
        await self.db.commit()

        return ConfiguracionIARead.from_orm(config)

    async def test_connection(self) -> dict:
        """Test IA provider connectivity"""

        config = await self.get_current_config()

        if not config:
            return {
                "status": "error",
                "message": "No IA configuration found",
            }

        try:
            provider = get_ai_provider(
                AIProviderType(config.ai_provider),
                api_key=config.api_key,
                model=config.ai_model,
                timeout_seconds=config.ai_timeout_seconds,
            )

            is_healthy = await provider.health_check()

            if is_healthy:
                # Update status
                config.test_status = "healthy"
                self.db.add(config)
                await self.db.commit()

                return {
                    "status": "success",
                    "message": f"{config.ai_provider} provider is healthy",
                    "provider": config.ai_provider,
                    "model": config.ai_model,
                }
            else:
                config.test_status = "warning"
                self.db.add(config)
                await self.db.commit()

                return {
                    "status": "warning",
                    "message": f"{config.ai_provider} provider returned unhealthy status",
                    "provider": config.ai_provider,
                }

        except Exception as e:
            config.test_status = "error"
            self.db.add(config)
            await self.db.commit()

            return {
                "status": "error",
                "message": f"Failed to connect to {config.ai_provider}: {str(e)}",
                "provider": config.ai_provider,
                "error": str(e),
            }
