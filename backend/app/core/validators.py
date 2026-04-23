from __future__ import annotations

import ipaddress
from typing import Annotated
from urllib.parse import urlsplit

from pydantic import AfterValidator


def _is_bad_ip(ip: ipaddress._BaseAddress) -> bool:
    return any(
        [
            ip.is_private,
            ip.is_loopback,
            ip.is_link_local,
            ip.is_reserved,
            ip.is_multicast,
            ip.is_unspecified,
        ]
    )


def validate_ssrf_safe_http_url(value: str) -> str:
    """Validate a stored URL to reduce SSRF risk (OWASP API7).

    Notes:
    - This validates *shape* and blocks obvious dangerous hosts (localhost,
      literal private IPs, link-local metadata IPs, etc.).
    - It does not perform DNS resolution; treat stored URLs as data and never
      fetch them server-side.
    """
    if not isinstance(value, str) or not value.strip():
        raise ValueError("URL is required")

    raw = value.strip()
    parts = urlsplit(raw)

    if parts.scheme not in {"http", "https"}:
        raise ValueError("Only http/https URLs are allowed")
    if not parts.netloc:
        raise ValueError("URL must include a host")
    if "@" in parts.netloc:
        raise ValueError("Userinfo in URL is not allowed")

    host = parts.hostname
    if not host:
        raise ValueError("URL host is invalid")

    lowered = host.lower().strip(".")
    if lowered in {"localhost"} or lowered.endswith(".localhost") or lowered.endswith(".local"):
        raise ValueError("Localhost URLs are not allowed")

    # Block literal IPs in private/loopback/link-local ranges, including cloud metadata.
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None

    if ip is not None and _is_bad_ip(ip):
        raise ValueError("Private or local IPs are not allowed")

    # Explicitly block AWS/GCP/Azure metadata IP (defence-in-depth).
    if host == "169.254.169.254":
        raise ValueError("Metadata IP is not allowed")

    return raw


SSRFHttpUrl = Annotated[str, AfterValidator(validate_ssrf_safe_http_url)]

