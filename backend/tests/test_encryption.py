"""Tests for A5 At-Rest Encryption implementations in SQLAlchemy."""

import pytest
from sqlalchemy import Column, Integer
from sqlalchemy.orm import declarative_base

from app.core.encryption import EncryptedString, decrypt_string, encrypt_string

DummyBase = declarative_base()

# Create a temporary model to run integration tests against the database types.
class DummySecret(DummyBase):
    __tablename__ = "dummy_secrets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    secret_value = Column(EncryptedString, nullable=False)


@pytest.fixture(autouse=True)
async def setup_dummy_table(_engine):
    """Automatically create the temporary table before tests and drop after."""
    async with _engine.begin() as conn:
        await conn.run_sync(DummySecret.metadata.create_all)
    yield
    async with _engine.begin() as conn:
        await conn.run_sync(DummySecret.metadata.drop_all)


def test_functions_encrypt_decrypt():
    """Test raw encrypt and decrypt functions."""
    plain = "my-super-secret-token_!2026"
    encrypted = encrypt_string(plain)

    assert encrypted != plain
    assert "my-super-secret" not in encrypted
    assert encrypted.startswith("gAAAAA")  # Fernet strings always start with 'gAAAAA...'

    decrypted = decrypt_string(encrypted)
    assert decrypted == plain


@pytest.mark.asyncio
async def test_sqlalchemy_encrypted_string_type_transparent_io(_session_factory):
    """EncryptedString should flawlessly decrypt back to plaintext when flushed/loaded.
    We pass _session_factory which is the loop-safe fixture from conftest.py.
    """
    plain = "token_github_12345"

    async with _session_factory() as db:
        dummy = DummySecret(secret_value=plain)
        db.add(dummy)
        await db.flush()
        await db.refresh(dummy)

        # In RAM it should appear as plaintext
        assert dummy.secret_value == plain

        # Let's read from DB bypassing the TypeDecorator to see what's actually on disk
        from sqlalchemy import text
        stmt = text("SELECT secret_value FROM dummy_secrets WHERE id = :id")
        result = await db.execute(stmt, {"id": dummy.id})
        raw_db_value = result.scalar_one()

        # On disk it MUST NOT be plaintext
        assert raw_db_value != plain
        assert raw_db_value.startswith("gAAAAA")

        # And decrypting the raw value manually must yield our plaintext
        assert decrypt_string(raw_db_value) == plain
