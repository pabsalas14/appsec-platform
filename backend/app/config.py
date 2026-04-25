from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ─── Environment ───
    ENV: Literal["dev", "staging", "prod"] = Field(
        default="dev",
        description="Runtime environment — controls cookie `secure` flag and other gates.",
    )

    # ─── Required secrets (no defaults — must be set via env / .env) ───
    DATABASE_URL: str = Field(..., description="Async DB URL, e.g. postgresql+asyncpg://user:pass@host/db")
    SECRET_KEY: str = Field(..., min_length=32, description="JWT signing key (min 32 chars)")
    APPSEC_MASTER_KEY: str = Field(..., description="Encryption key for storing credentials at-rest (A5)")
    ADMIN_EMAIL: str = Field(..., description="Initial admin email")
    ADMIN_PASSWORD: str = Field(..., min_length=10, description="Initial admin password")

    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    AUTH_MIN_PASSWORD_LENGTH: int = 10
    AUTH_LOGIN_RATE_LIMIT_PER_MIN: int = 10
    AUTH_REGISTER_RATE_LIMIT_PER_MIN: int = 5
    AUTH_REFRESH_RATE_LIMIT_PER_MIN: int = 30
    AUTH_LOCKOUT_THRESHOLD: int = 5
    AUTH_LOCKOUT_MINUTES: int = 15
    AUTH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    AUTH_PASSWORD_REQUIRE_MIXED_CASE: bool = True
    AUTH_PASSWORD_REQUIRE_DIGIT: bool = True
    AUTH_PASSWORD_REQUIRE_SYMBOL: bool = False
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost"

    # ─── Webhook SLA ───
    WEBHOOK_URL: str = ""
    WEBHOOK_TYPE: str = "slack"  # slack | gchat | generic
    SLA_ALERT_DAYS: int = 5  # alert N days before expiry
    SCHEDULER_SLA_INTERVAL_HOURS: int = 1  # SLA cron job frequency

    # ─── SSE (Server-Sent Events) ───
    SSE_ENABLED: bool = True  # Set to False to disable real-time event streaming
    SSE_KEEPALIVE_INTERVAL: float = 30.0  # Seconds between keepalive pings

    # ─── OpenAPI docs ───
    ALLOW_OPENAPI_IN_PROD: bool = False
    ENABLE_OPENAPI_DOCS: bool = True  # Fail-closed in prod unless explicitly overridden below.

    # ─── Upload limits ───
    MAX_UPLOAD_SIZE_MB: int = 10

    # ─── Logging / observability ───
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"
    LOG_SAMPLE_HEALTH: float = 0.0  # 0.0 → skip /api/health logs, 1.0 → log all
    LOG_SERVICE_NAME: str = "framework-api"
    LOG_VERSION: str = "1.0.0"
    SENTRY_DSN: str = ""
    CLIENT_LOGS_RATE_LIMIT_PER_MIN: int = 120  # per user
    CLIENT_LOGS_MAX_BATCH: int = 50
    AUDIT_LOG_ENABLED: bool = True

    # ─── Security headers (OWASP API8) ───
    SECURITY_HEADERS_ENABLED: bool = True
    SECURITY_HSTS_MAX_AGE_SECONDS: int = 31536000  # 1 year
    SECURITY_CSP: str = (
        "default-src 'self'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'; "
        "object-src 'none'; "
        "img-src 'self' data:; "
        "style-src 'self' 'unsafe-inline'; "
        "script-src 'self'; "
        "connect-src 'self'"
    )

    # ─── Seed control ───
    RUN_SEED: bool = False  # Only run seed when explicitly enabled

    # ───  MCP integration ───
    ARGUS_URL: str = "http://localhost:8899"
    ARGUS_API_KEY: str = ""
    ARGUS_CONNECTION_TYPE: str = "http"  # "http" or "sse"
    ARGUS_MAX_CONCURRENT_SCANS: int = 3
    ARGUS_TIMEOUT_DEFAULT: int = 300  # seconds per tool

    # ─── AI Provider ───
    AI_DEFAULT_PROVIDER: str = "openai"  # openai | anthropic | openrouter | ollama
    AI_DEFAULT_MODEL: str = "gpt-4o"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OLLAMA_URL: str = "http://localhost:11434"

    # ─── G2: evaluación diaria (nocturna) de reglas hacia in-app notifications ───
    SCHEDULE_NOTIFICATION_RULES: bool = False
    NOTIFICATION_CRON_HOUR_UTC: int = 2
    NOTIFICATION_CRON_MINUTE_UTC: int = 0

    @field_validator("LOG_FORMAT")
    @classmethod
    def log_format_safe_in_prod(cls, v: str, info) -> str:
        env = info.data.get("ENV", "dev")
        if v == "text" and env != "dev":
            raise ValueError(
                "LOG_FORMAT='text' is only allowed when ENV='dev'. Use LOG_FORMAT='json' for staging/prod."
            )
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_not_default(cls, v: str) -> str:
        insecure = {
            "dev_secret_key_change_in_production_min32chars!!",
            "changeme",
            "secret",
        }
        if v.lower() in insecure:
            raise ValueError("SECRET_KEY must not use a well-known default value")
        return v

    @field_validator("AUTH_COOKIE_SAMESITE")
    @classmethod
    def samesite_none_requires_prod(cls, v: str, info) -> str:
        # ``SameSite=None`` is only accepted by browsers together with ``Secure``,
        # and ``Secure`` is only enabled when ENV=prod. Reject the combination
        # early to avoid silently broken cross-site sessions in dev/staging.
        env = info.data.get("ENV", "dev")
        if v == "none" and env != "prod":
            raise ValueError(
                "AUTH_COOKIE_SAMESITE='none' requires ENV='prod' so cookies "
                "are also Secure; use 'lax' or 'strict' outside production."
            )
        return v

    @field_validator("ENABLE_OPENAPI_DOCS")
    @classmethod
    def docs_disabled_by_default_in_prod(cls, v: bool, info) -> bool:
        env = info.data.get("ENV", "dev")
        allow = info.data.get("ALLOW_OPENAPI_IN_PROD", False)
        if env == "prod" and v and not allow:
            raise ValueError(
                "ENABLE_OPENAPI_DOCS=true is forbidden when ENV='prod' unless "
                "ALLOW_OPENAPI_IN_PROD=true is set explicitly."
            )
        return v

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
