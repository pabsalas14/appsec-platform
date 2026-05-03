"""Tests for semantic CSV duplicate detection."""

from __future__ import annotations

import pytest

from app.core.csv_duplicate_detector import (
    DuplicateReport,
    combined_similarity,
    deduplicate_rows,
    detect_duplicates,
    jaccard_similarity,
    sequence_similarity,
)


# ── Similarity functions ──────────────────────────────────────────────────────


def test_sequence_similarity_identical():
    assert sequence_similarity("hola mundo", "hola mundo") == pytest.approx(1.0)


def test_sequence_similarity_different():
    assert sequence_similarity("repositorio alpha", "repositorio beta") < 0.9


def test_sequence_similarity_accent_insensitive():
    score = sequence_similarity("Autenticación", "Autenticacion")
    assert score > 0.95


def test_sequence_similarity_case_insensitive():
    score = sequence_similarity("PORTAL WEB", "portal web")
    assert score == pytest.approx(1.0)


def test_jaccard_identical():
    assert jaccard_similarity("api pagos", "api pagos") == pytest.approx(1.0)


def test_jaccard_word_reorder():
    score = jaccard_similarity("api pagos", "pagos api")
    assert score == pytest.approx(1.0)


def test_jaccard_partial_overlap():
    score = jaccard_similarity("portal de pagos", "portal de cobros")
    assert 0.3 < score < 0.8


def test_combined_similarity_near_duplicates():
    score = combined_similarity("Portal-Pagos", "Portal Pagos")
    assert score > 0.9


def test_combined_similarity_empty_strings():
    assert combined_similarity("", "") == pytest.approx(1.0)


def test_combined_similarity_one_empty():
    assert combined_similarity("texto", "") == pytest.approx(0.0)


# ── detect_duplicates ─────────────────────────────────────────────────────────


def test_detect_no_duplicates():
    rows = [
        {"nombre": "Repositorio Alpha", "url": "https://github.com/org/alpha"},
        {"nombre": "Repositorio Beta", "url": "https://github.com/org/beta"},
        {"nombre": "Repositorio Gamma", "url": "https://github.com/org/gamma"},
    ]
    report = detect_duplicates(rows, key_fields=["nombre", "url"])
    assert not report.has_duplicates


def test_detect_exact_duplicate_within_batch():
    rows = [
        {"nombre": "Portal Web", "url": "https://portal.example.com"},
        {"nombre": "Portal Web", "url": "https://portal.example.com"},
    ]
    report = detect_duplicates(rows, key_fields=["nombre", "url"])
    assert report.has_duplicates
    assert report.exact_count >= 1


def test_detect_fuzzy_duplicate_within_batch():
    rows = [
        {"nombre": "Portal de Pagos", "url": "https://pagos.example.com"},
        {"nombre": "Portal Pagos", "url": "https://pagos.example.com/v2"},
    ]
    report = detect_duplicates(rows, key_fields=["nombre"], threshold=0.75)
    assert report.has_duplicates


def test_detect_duplicate_against_existing_db():
    rows = [{"nombre": "Portal Web", "url": "https://new.example.com"}]
    existing = {"nombre": ["Portal Web", "API Gateway"]}
    report = detect_duplicates(rows, key_fields=["nombre"], existing_values=existing)
    assert report.has_duplicates
    # negative matched_index indicates DB record
    assert any(h.matched_index < 0 for h in report.hits)


def test_detect_warnings_format():
    rows = [
        {"nombre": "Repositorio X", "url": "https://x.com"},
        {"nombre": "Repositorio X", "url": "https://x.com"},
    ]
    report = detect_duplicates(rows, key_fields=["nombre"])
    warnings = report.to_warnings()
    assert len(warnings) >= 1
    assert "fila" in warnings[0]


def test_detect_threshold_respected():
    rows = [
        {"nombre": "Alpha Service", "url": "https://alpha.com"},
        {"nombre": "Beta Service", "url": "https://beta.com"},
    ]
    # With very low threshold, everything is a duplicate
    report = detect_duplicates(rows, key_fields=["nombre"], threshold=0.01)
    assert report.has_duplicates

    # With threshold 1.0 (exact only), no fuzzy duplicates
    report2 = detect_duplicates(rows, key_fields=["nombre"], threshold=1.0)
    assert not report2.has_duplicates


# ── deduplicate_rows ──────────────────────────────────────────────────────────


def test_deduplicate_removes_later_duplicate():
    rows = [
        {"nombre": "Portal Web", "url": "https://portal.example.com"},
        {"nombre": "Portal Web", "url": "https://portal.example.com"},
        {"nombre": "API Gateway", "url": "https://api.example.com"},
    ]
    deduped, report = deduplicate_rows(rows, key_fields=["nombre"])
    assert len(deduped) == 2
    assert report.has_duplicates


def test_deduplicate_keeps_original():
    rows = [
        {"nombre": "Original", "url": "https://original.com"},
        {"nombre": "Original", "url": "https://original.com"},
    ]
    deduped, _ = deduplicate_rows(rows, key_fields=["nombre"])
    assert len(deduped) == 1
    assert deduped[0]["nombre"] == "Original"


def test_deduplicate_no_duplicates_unchanged():
    rows = [
        {"nombre": "Alpha", "url": "https://alpha.com"},
        {"nombre": "Beta", "url": "https://beta.com"},
    ]
    deduped, report = deduplicate_rows(rows, key_fields=["nombre"])
    assert len(deduped) == 2
    assert not report.has_duplicates
