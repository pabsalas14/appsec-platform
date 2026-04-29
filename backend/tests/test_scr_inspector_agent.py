"""Tests for SCR Inspector Agent (Phase 2 - LLM Integration)."""

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.ia_provider import AIProviderType
from app.services.scr_inspector_agent import (
    MALICIOUS_PATTERNS,
    PATTERN_SEVERITY,
    run_inspector_real,
    run_inspector_stub,
    _build_inspector_prompt,
    _build_inspector_system_prompt,
)


class TestInspectorPromptGeneration:
    """Test prompt generation for Inspector Agent."""

    def test_system_prompt_contains_patterns(self):
        """Verify system prompt includes all malicious patterns."""
        prompt = _build_inspector_system_prompt()

        assert "EXEC_ENV_BACKDOOR" in prompt
        assert "INJECTION_VULNERABILITY" in prompt
        assert "LOGIC_BOMB" in prompt
        assert "JSON" in prompt  # Expects JSON response

    def test_user_prompt_contains_code(self):
        """Verify user prompt includes code chunks."""
        code_chunks = [
            ("test.py", "import os\nos.system('rm -rf /')"),
            ("config.py", "SECRET = 'hardcoded_secret'"),
        ]

        prompt = _build_inspector_prompt(code_chunks)

        assert "test.py" in prompt
        assert "config.py" in prompt
        assert "os.system" in prompt


class TestInspectorStub:
    """Test Inspector Stub (fallback)."""

    @pytest.mark.asyncio
    async def test_stub_returns_finding(self):
        """Verify stub returns a valid finding."""
        source = {"test.py": "import os\nos.system('rm -rf/')"}

        findings = await run_inspector_stub(rutas_fuente=source)

        assert len(findings) == 1
        finding = findings[0]
        assert finding["tipo_malicia"] == "EXEC_ENV_BACKDOOR"
        assert finding["severidad"] == "CRITICO"
        assert finding["confianza"] == 0.62
        assert finding["estado"] == "DETECTED"

    @pytest.mark.asyncio
    async def test_stub_empty_source(self):
        """Verify stub handles empty source."""
        findings = await run_inspector_stub(rutas_fuente={})

        assert len(findings) == 1  # Still returns example
        assert findings[0]["tipo_malicia"] == "EXEC_ENV_BACKDOOR"


class TestInspectorReal:
    """Test Inspector Agent with LLM."""

    @pytest.mark.asyncio
    async def test_real_inspector_with_mock_llm(self):
        """Test real inspector with mocked LLM provider."""
        source = {
            "backdoor.py": "import os\nif os.getenv('ADMIN_MODE'):\n    exec(input())"
        }

        mock_response_data = {
            "findings": [
                {
                    "archivo": "backdoor.py",
                    "linea_inicio": 1,
                    "linea_fin": 3,
                    "tipo_malicia": "EXEC_ENV_BACKDOOR",
                    "confianza": 0.95,
                    "descripcion": "Hidden execution via environment variable",
                    "codigo_snippet": "if os.getenv('ADMIN_MODE'):\n    exec(input())",
                    "impacto": "Remote code execution",
                    "explotabilidad": "High - if ADMIN_MODE is set",
                }
            ]
        }

        mock_llm = AsyncMock()
        mock_llm.generate = AsyncMock(
            return_value=MagicMock(
                content=json.dumps(mock_response_data),
                provider="anthropic",
                tokens_used=150,
            )
        )

        with patch(
            "app.services.scr_inspector_agent.get_ai_provider",
            return_value=mock_llm,
        ):
            findings = await run_inspector_real(
                rutas_fuente=source,
                provider=AIProviderType.ANTHROPIC,
            )

        assert len(findings) == 1
        finding = findings[0]
        assert finding["archivo"] == "backdoor.py"
        assert finding["tipo_malicia"] == "EXEC_ENV_BACKDOOR"
        assert finding["severidad"] == "CRITICO"
        assert finding["confianza"] == 0.95
        assert finding["estado"] == "DETECTED"

    @pytest.mark.asyncio
    async def test_real_inspector_json_parse_error_fallback(self):
        """Verify fallback to stub on JSON parse error."""
        source = {"test.py": "bad code"}

        mock_llm = AsyncMock()
        mock_llm.generate = AsyncMock(
            return_value=MagicMock(content="Invalid JSON response")
        )

        with patch(
            "app.services.scr_inspector_agent.get_ai_provider",
            return_value=mock_llm,
        ):
            findings = await run_inspector_real(
                rutas_fuente=source,
                provider=AIProviderType.ANTHROPIC,
            )

        # Should fallback to stub
        assert len(findings) == 1
        assert findings[0]["tipo_malicia"] == "EXEC_ENV_BACKDOOR"

    @pytest.mark.asyncio
    async def test_real_inspector_no_api_key_fallback(self):
        """Verify fallback to stub when API key is missing."""
        source = {"test.py": "import os"}

        with patch.dict("os.environ", {}, clear=True):
            findings = await run_inspector_real(
                rutas_fuente=source,
                provider=AIProviderType.ANTHROPIC,
            )

        # Should fallback to stub
        assert len(findings) == 1
        assert findings[0]["tipo_malicia"] == "EXEC_ENV_BACKDOOR"

    @pytest.mark.asyncio
    async def test_real_inspector_multiple_findings(self):
        """Test LLM detecting multiple malicious patterns."""
        source = {
            "suspect.py": "import os\nexec(input())\nif DEBUG:\n    print(SECRET)"
        }

        mock_response_data = {
            "findings": [
                {
                    "archivo": "suspect.py",
                    "linea_inicio": 1,
                    "linea_fin": 2,
                    "tipo_malicia": "EXEC_ENV_BACKDOOR",
                    "confianza": 0.9,
                    "descripcion": "Remote code execution",
                    "codigo_snippet": "exec(input())",
                    "impacto": "Full system compromise",
                    "explotabilidad": "Trivial",
                },
                {
                    "archivo": "suspect.py",
                    "linea_inicio": 4,
                    "linea_fin": 4,
                    "tipo_malicia": "HARDCODED_SECRETS",
                    "confianza": 0.85,
                    "descripcion": "Hardcoded secret in code",
                    "codigo_snippet": "print(SECRET)",
                    "impacto": "Information disclosure",
                    "explotabilidad": "High",
                },
            ]
        }

        mock_llm = AsyncMock()
        mock_llm.generate = AsyncMock(
            return_value=MagicMock(content=json.dumps(mock_response_data))
        )

        with patch(
            "app.services.scr_inspector_agent.get_ai_provider",
            return_value=mock_llm,
        ):
            findings = await run_inspector_real(
                rutas_fuente=source,
                provider=AIProviderType.ANTHROPIC,
            )

        assert len(findings) == 2
        assert findings[0]["tipo_malicia"] == "EXEC_ENV_BACKDOOR"
        assert findings[0]["severidad"] == "CRITICO"
        assert findings[1]["tipo_malicia"] == "HARDCODED_SECRETS"
        assert findings[1]["severidad"] == "ALTO"

    @pytest.mark.asyncio
    async def test_pattern_severity_mapping(self):
        """Verify all patterns have severity levels."""
        for pattern in MALICIOUS_PATTERNS.keys():
            assert pattern in PATTERN_SEVERITY, f"Pattern {pattern} has no severity mapping"
            assert PATTERN_SEVERITY[pattern] in [
                "BAJO",
                "MEDIO",
                "ALTO",
                "CRITICO",
            ]

    @pytest.mark.asyncio
    async def test_real_inspector_empty_findings(self):
        """Verify handling of code with no malicious patterns."""
        source = {"safe.py": "def hello():\n    return 'Hello, World!'"}

        mock_response_data = {"findings": []}

        mock_llm = AsyncMock()
        mock_llm.generate = AsyncMock(
            return_value=MagicMock(content=json.dumps(mock_response_data))
        )

        with patch(
            "app.services.scr_inspector_agent.get_ai_provider",
            return_value=mock_llm,
        ):
            findings = await run_inspector_real(
                rutas_fuente=source,
                provider=AIProviderType.ANTHROPIC,
            )

        assert len(findings) == 0

    @pytest.mark.asyncio
    async def test_real_inspector_enriches_findings(self):
        """Verify findings are enriched with severidad and estado."""
        source = {"test.py": "code"}

        mock_response_data = {
            "findings": [
                {
                    "archivo": "test.py",
                    "linea_inicio": 1,
                    "linea_fin": 1,
                    "tipo_malicia": "LOGIC_BOMB",
                    "confianza": 0.8,
                    "descripcion": "Conditional damage",
                    "codigo_snippet": "if condition: destroy()",
                    "impacto": "Data loss",
                    "explotabilidad": "Medium",
                }
            ]
        }

        mock_llm = AsyncMock()
        mock_llm.generate = AsyncMock(
            return_value=MagicMock(content=json.dumps(mock_response_data))
        )

        with patch(
            "app.services.scr_inspector_agent.get_ai_provider",
            return_value=mock_llm,
        ):
            findings = await run_inspector_real(
                rutas_fuente=source,
                provider=AIProviderType.ANTHROPIC,
            )

        finding = findings[0]
        assert finding["severidad"] == "CRITICO"  # From PATTERN_SEVERITY
        assert finding["estado"] == "DETECTED"  # Always added
        assert "remediacion_sugerida" in finding  # Default added if missing
