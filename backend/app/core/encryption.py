"""AES-GCM (Fernet) At-Rest encryption for SQLAlchemy custom types.

Enforces A5 compliance (Cifrado At-Rest para credenciales) by transparently
encrypting values going into the database and decrypting them on load.
"""

from typing import Any, Optional

from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.types import String, TypeDecorator

from app.config import settings


class _EncryptionProvider:
    """Lazy-loaded Fernet provider using the app config."""

    _fernet: Optional[Fernet] = None

    @classmethod
    def get(cls) -> Fernet:
        if cls._fernet is None:
            # We strictly require APPSEC_MASTER_KEY to be valid 32 url-safe base64 bytes
            cls._fernet = Fernet(settings.APPSEC_MASTER_KEY.encode("utf-8"))
        return cls._fernet


def encrypt_string(value: str | bytes) -> str:
    """Encrypt a string using the platform's master key."""
    if isinstance(value, str):
        value = value.encode("utf-8")
    return _EncryptionProvider.get().encrypt(value).decode("utf-8")


def decrypt_string(encrypted: str) -> str:
    """Decrypt a string using the platform's master key."""
    try:
        return _EncryptionProvider.get().decrypt(encrypted.encode("utf-8")).decode("utf-8")
    except InvalidToken as e:
        raise ValueError("Cannot decrypt value: Invalid token or master key mismatch.") from e


class EncryptedString(TypeDecorator):
    """Custom SQLAlchemy type that transparently encrypts strings on the fly.

    Usage in models:
        api_token: Mapped[str] = mapped_column(EncryptedString, nullable=False)

    The database will store the encrypted bytes as a text string (e.g. `gAAAAAB...`).
    When loaded into Python, it will be seamlessly decrypted.
    """

    impl = String
    cache_ok = True

    def process_bind_param(self, value: Optional[str], dialect: Any) -> Optional[str]:
        """Convert from Python -> DB (Encrypts the value)"""
        if value is None:
            return None
        return encrypt_string(value)

    def process_result_value(self, value: Optional[str], dialect: Any) -> Optional[str]:
        """Convert from DB -> Python (Decrypts the value)"""
        if value is None:
            return None
        return decrypt_string(value)
