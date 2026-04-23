from __future__ import annotations

import pytest

from app.core.validators import validate_ssrf_safe_http_url


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com",
        "http://sub.example.org/path?q=1",
    ],
)
def test_ssrf_validator_accepts_public_http_urls(url: str):
    assert validate_ssrf_safe_http_url(url) == url


@pytest.mark.parametrize(
    "url",
    [
        "ftp://example.com/file",
        "http://localhost:8080",
        "http://127.0.0.1:8000",
        "http://10.0.0.5",
        "http://192.168.1.9",
        "http://169.254.169.254/latest/meta-data",
        "https://user:pass@example.com",
    ],
)
def test_ssrf_validator_rejects_private_or_unsafe_urls(url: str):
    with pytest.raises(ValueError):
        validate_ssrf_safe_http_url(url)

