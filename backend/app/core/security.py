import hashlib
import string
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.core.exceptions import ConflictException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-repo deny list for obviously weak / well-known passwords. Kept intentionally
# small — projects that need a bigger corpus should plug in their own list.
_WEAK_PASSWORDS: frozenset[str] = frozenset(
    {
        "password",
        "password1",
        "passw0rd",
        "qwerty",
        "qwerty123",
        "admin",
        "administrator",
        "letmein",
        "welcome",
        "welcome1",
        "iloveyou",
        "changeme",
        "changeme123",
        "12345678",
        "123456789",
        "1234567890",
        "abc12345",
    }
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str, *, username: str | None = None) -> None:
    """Enforce the framework-wide password policy (ADR-0015).

    The policy is intentionally conservative:

    - Minimum length controlled by ``AUTH_MIN_PASSWORD_LENGTH``.
    - Mixed case, digit and symbol requirements are toggleable via settings.
    - Reject a small set of notorious weak passwords and anything that matches
      (or contains) the username, to prevent trivial credential stuffing.
    """
    min_length = settings.AUTH_MIN_PASSWORD_LENGTH
    if len(password) < min_length:
        raise ConflictException(
            f"Password must be at least {min_length} characters"
        )

    if settings.AUTH_PASSWORD_REQUIRE_MIXED_CASE:
        if not (any(c.islower() for c in password) and any(c.isupper() for c in password)):
            raise ConflictException(
                "Password must contain both uppercase and lowercase letters"
            )

    if settings.AUTH_PASSWORD_REQUIRE_DIGIT and not any(c.isdigit() for c in password):
        raise ConflictException("Password must contain at least one digit")

    if settings.AUTH_PASSWORD_REQUIRE_SYMBOL and not any(
        c in string.punctuation for c in password
    ):
        raise ConflictException("Password must contain at least one symbol")

    lowered = password.lower()
    if lowered in _WEAK_PASSWORDS:
        raise ConflictException("Password is too common; choose a stronger one")

    if username:
        uname = username.strip().lower()
        if uname and (uname == lowered or (len(uname) >= 3 and uname in lowered)):
            raise ConflictException("Password must not contain the username")


def hash_refresh_token(token: str) -> str:
    """Return a SHA-256 hex digest of the refresh token for safe DB storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(user_id: UUID, role: str, session_id: UUID) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "role": role,
        "sid": str(session_id),
        "jti": str(uuid4()),
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: UUID) -> str:
    expire = datetime.now(UTC) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "jti": str(uuid4()),
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
