"""Edge case tests for SCR Detective Agent (forensic timeline analysis).

Tests cover:
- Empty/null commits list
- Off-hours and weekend detection
- Rapid succession detection
- Critical file identification
- Large commit handling
- Author anomalies
- Timing edge cases
- Fallback to rule-based when LLM fails
"""

import pytest
from datetime import datetime, time, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.scr_agents.scr_detective_agent import (
    run_detective_agent,
    run_detective_real,
    _is_off_hours,
    _is_weekend,
    _matches_hidden_commit,
    _is_critical_file,
    _calculate_risk_level,
)
from app.models.code_security_event import CodeSecurityEvent


class TestOffHoursDetection:
    """Test off-hours commit detection."""

    def test_off_hours_morning_edge(self):
        """Test early morning (5:59 AM) is off-hours."""
        dt = datetime(2024, 5, 1, 5, 59, 0)  # 5:59 AM
        assert _is_off_hours(dt) is True

    def test_off_hours_late_night_edge(self):
        """Test late night (10:01 PM) is off-hours."""
        dt = datetime(2024, 5, 1, 22, 1, 0)  # 10:01 PM
        assert _is_off_hours(dt) is True

    def test_business_hours_morning(self):
        """Test morning business hours (8:00 AM) is not off-hours."""
        dt = datetime(2024, 5, 1, 8, 0, 0)
        assert _is_off_hours(dt) is False

    def test_business_hours_afternoon(self):
        """Test afternoon business hours (3:00 PM) is not off-hours."""
        dt = datetime(2024, 5, 1, 15, 0, 0)
        assert _is_off_hours(dt) is False

    def test_business_hours_boundary_6am(self):
        """Test 6:00 AM boundary (start of business hours)."""
        dt = datetime(2024, 5, 1, 6, 0, 0)
        assert _is_off_hours(dt) is False

    def test_off_hours_boundary_10pm(self):
        """Test 10:00 PM boundary (start of off-hours)."""
        dt = datetime(2024, 5, 1, 22, 0, 0)
        assert _is_off_hours(dt) is True


class TestWeekendDetection:
    """Test weekend detection."""

    def test_saturday_is_weekend(self):
        """Test Saturday (weekday 5) is detected as weekend."""
        dt = datetime(2024, 5, 4, 14, 0, 0)  # Saturday
        assert _is_weekend(dt) is True

    def test_sunday_is_weekend(self):
        """Test Sunday (weekday 6) is detected as weekend."""
        dt = datetime(2024, 5, 5, 14, 0, 0)  # Sunday
        assert _is_weekend(dt) is True

    def test_weekday_friday_not_weekend(self):
        """Test Friday (weekday 4) is not weekend."""
        dt = datetime(2024, 5, 3, 14, 0, 0)  # Friday
        assert _is_weekend(dt) is False

    def test_weekday_monday_not_weekend(self):
        """Test Monday (weekday 0) is not weekend."""
        dt = datetime(2024, 5, 6, 14, 0, 0)  # Monday
        assert _is_weekend(dt) is False


class TestHiddenCommitDetection:
    """Test detection of hidden commits with generic messages on critical files."""

    def test_generic_message_on_auth_file(self):
        """Test generic message 'fix' on auth file is suspicious."""
        assert _matches_hidden_commit("fix", "src/auth/service.py") is True

    def test_generic_message_on_crypto_file(self):
        """Test generic message 'update' on crypto file is suspicious."""
        assert _matches_hidden_commit("update", "lib/crypto/aes.py") is True

    def test_generic_message_on_payment_file(self):
        """Test generic message 'refactor' on payment file is suspicious."""
        assert _matches_hidden_commit("refactor", "payment/processor.py") is True

    def test_specific_message_on_auth_file(self):
        """Test descriptive message on auth file is not suspicious."""
        assert _matches_hidden_commit("fix: sql injection in login", "src/auth/service.py") is False

    def test_generic_message_on_normal_file(self):
        """Test generic message on non-critical file is not suspicious."""
        assert _matches_hidden_commit("fix", "src/utils/helpers.py") is False

    def test_case_insensitive_matching(self):
        """Test message matching is case-insensitive."""
        assert _matches_hidden_commit("FIX", "src/auth/service.py") is True
        assert _matches_hidden_commit("Fix", "SRC/AUTH/SERVICE.PY") is True


class TestCriticalFileDetection:
    """Test critical file identification."""

    def test_auth_file_is_critical(self):
        """Test auth files are identified as critical."""
        assert _is_critical_file("src/auth/service.py") is True

    def test_crypto_file_is_critical(self):
        """Test crypto files are identified as critical."""
        assert _is_critical_file("lib/crypto/aes.py") is True

    def test_database_file_is_critical(self):
        """Test database files are identified as critical."""
        assert _is_critical_file("db/schema.sql") is True

    def test_admin_file_is_critical(self):
        """Test admin files are identified as critical."""
        assert _is_critical_file("src/admin/panel.py") is True

    def test_regular_file_not_critical(self):
        """Test regular files are not identified as critical."""
        assert _is_critical_file("src/utils/helpers.py") is False

    def test_case_insensitive_critical_file(self):
        """Test critical file detection is case-insensitive."""
        assert _is_critical_file("SRC/AUTH/SERVICE.PY") is True
        assert _is_critical_file("src/CRYPTO/aes.py") is True


class TestRiskLevelCalculation:
    """Test overall risk level calculation from indicators."""

    def test_critical_from_timing_anomalies(self):
        """Test CRITICAL risk when timing anomalies detected."""
        indicators = ["TIMING_ANOMALIES"]
        assert _calculate_risk_level(indicators) == "CRITICAL"

    def test_critical_from_author_anomalies(self):
        """Test CRITICAL risk when author anomalies detected."""
        indicators = ["AUTHOR_ANOMALIES"]
        assert _calculate_risk_level(indicators) == "CRITICAL"

    def test_high_from_hidden_commits(self):
        """Test HIGH risk from hidden commits."""
        indicators = ["HIDDEN_COMMITS"]
        assert _calculate_risk_level(indicators) == "HIGH"

    def test_high_from_critical_files(self):
        """Test HIGH risk from critical file changes."""
        indicators = ["CRITICAL_FILES"]
        assert _calculate_risk_level(indicators) == "HIGH"

    def test_high_from_mass_changes(self):
        """Test HIGH risk from mass changes."""
        indicators = ["MASS_CHANGES"]
        assert _calculate_risk_level(indicators) == "HIGH"

    def test_medium_from_rapid_succession(self):
        """Test MEDIUM risk from rapid succession."""
        indicators = ["RAPID_SUCCESSION"]
        assert _calculate_risk_level(indicators) == "MEDIUM"

    def test_combined_indicators_escalate_risk(self):
        """Test multiple indicators escalate risk level."""
        indicators = ["HIDDEN_COMMITS", "RAPID_SUCCESSION"]
        assert _calculate_risk_level(indicators) == "HIGH"


class TestDetectiveAgentEdgeCases:
    """Edge case tests for run_detective_agent function."""

    @pytest.mark.asyncio
    async def test_empty_commits_list(self, db: AsyncSession):
        """Test handling of empty commits list."""
        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=[],
            db=db,
        )
        assert events == []

    @pytest.mark.asyncio
    async def test_single_commit_no_indicators(self, db: AsyncSession):
        """Test single commit with no risk indicators."""
        commits = [
            {
                "hash": "abc123",
                "author": "regular_developer",
                "timestamp": datetime(2024, 5, 1, 10, 0, 0),  # Business hours
                "message": "Add unit tests for user service",
                "files": ["src/user_service_test.py"],
                "lines_changed": 50,
            }
        ]

        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=commits,
            db=db,
        )
        assert len(events) == 0  # No indicators = no events

    @pytest.mark.asyncio
    async def test_large_commit_creates_event(self, db: AsyncSession):
        """Test large commits (>500 lines) create events."""
        commits = [
            {
                "hash": "abc123",
                "author": "developer",
                "timestamp": datetime(2024, 5, 1, 10, 0, 0),
                "message": "Refactor module structure",
                "files": ["src/old_module.py", "src/new_module.py"],
                "lines_changed": 1500,  # Exceeds threshold
            }
        ]

        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=commits,
            db=db,
        )
        assert len(events) > 0
        assert any(e.nivel_riesgo == "MEDIUM" for e in events)
        assert any("MASS_CHANGES" in e.indicadores for e in events)

    @pytest.mark.asyncio
    async def test_off_hours_commit_creates_event(self, db: AsyncSession):
        """Test off-hours commits create events."""
        commits = [
            {
                "hash": "abc123",
                "author": "developer",
                "timestamp": datetime(2024, 5, 1, 23, 30, 0),  # 11:30 PM
                "message": "Database schema update",
                "files": ["db/schema.sql"],
                "lines_changed": 100,
            }
        ]

        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=commits,
            db=db,
        )
        assert len(events) > 0
        assert any("TIMING_ANOMALIES" in e.indicadores for e in events)

    @pytest.mark.asyncio
    async def test_critical_file_modification_creates_event(self, db: AsyncSession):
        """Test modifications to critical files create events."""
        commits = [
            {
                "hash": "abc123",
                "author": "developer",
                "timestamp": datetime(2024, 5, 1, 10, 0, 0),
                "message": "Update auth configuration",
                "files": ["src/auth/config.py"],
                "lines_changed": 50,
            }
        ]

        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=commits,
            db=db,
        )
        assert len(events) > 0
        assert any("CRITICAL_FILES" in e.indicadores for e in events)

    @pytest.mark.asyncio
    async def test_multiple_commits_rapid_succession(self, db: AsyncSession):
        """Test rapid succession of commits by same author."""
        now = datetime(2024, 5, 1, 10, 0, 0)
        commits = [
            {
                "hash": f"commit{i}",
                "author": "suspicious_dev",
                "timestamp": now + timedelta(minutes=i*30),  # Every 30 minutes
                "message": "Fix typo",
                "files": ["src/util.py"],
                "lines_changed": 10,
            }
            for i in range(5)  # 5 commits within 2 hours
        ]

        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=commits,
            db=db,
        )
        assert len(events) > 0
        assert any("RAPID_SUCCESSION" in e.indicadores for e in events)

    @pytest.mark.asyncio
    async def test_new_author_on_critical_file(self, db: AsyncSession):
        """Test new author on critical files generates author anomaly."""
        commits = [
            {
                "hash": "abc123",
                "author": "new_contractor",  # New author
                "timestamp": datetime(2024, 5, 1, 10, 0, 0),
                "message": "Update payment processor",
                "files": ["src/payment/processor.py"],  # Critical file
                "lines_changed": 200,
            }
        ]

        events = await run_detective_agent(
            review_id="test-123",
            inspector_findings=[],
            commits=commits,
            db=db,
        )
        assert len(events) > 0
        assert any("AUTHOR_ANOMALIES" in e.indicadores for e in events)


class TestDetectiveRealFallback:
    """Test LLM fallback behavior in run_detective_real."""

    @pytest.mark.asyncio
    async def test_falls_back_to_rules_on_llm_failure(self, db: AsyncSession):
        """Test fallback to rule-based analysis when LLM fails."""
        commits = [
            {
                "hash": "abc123",
                "author": "dev",
                "timestamp": datetime(2024, 5, 1, 23, 0, 0),  # Off-hours
                "message": "fix",
                "files": ["src/auth/service.py"],  # Critical
                "lines_changed": 50,
            }
        ]

        mock_llm = AsyncMock()
        mock_llm.generate = AsyncMock(side_effect=Exception("API error"))

        with patch("app.services.scr_agents.scr_detective_agent.get_ai_provider_for_scr_runtime") as mock_provider:
            mock_provider.return_value = mock_llm

            # Should not raise, should fall back
            events = await run_detective_real(
                review_id="test-123",
                inspector_findings=[],
                commits=commits,
                db=db,
                llm=MagicMock(),
            )

            # Should still detect off-hours timing anomaly via fallback
            assert len(events) > 0

    @pytest.mark.asyncio
    async def test_falls_back_on_invalid_json(self, db: AsyncSession):
        """Test fallback when LLM returns invalid JSON."""
        commits = [
            {
                "hash": "abc123",
                "author": "dev",
                "timestamp": datetime(2024, 5, 1, 23, 0, 0),
                "message": "fix",
                "files": ["src/auth/service.py"],
                "lines_changed": 50,
            }
        ]

        mock_llm = AsyncMock()
        mock_response = MagicMock()
        mock_response.content = "Not valid JSON {["  # Invalid JSON
        mock_llm.generate = AsyncMock(return_value=mock_response)

        with patch("app.services.scr_agents.scr_detective_agent.get_ai_provider_for_scr_runtime") as mock_provider:
            mock_provider.return_value = mock_llm

            # Should not raise, should fall back
            events = await run_detective_real(
                review_id="test-123",
                inspector_findings=[],
                commits=commits,
                db=db,
                llm=MagicMock(),
            )

            assert len(events) > 0
