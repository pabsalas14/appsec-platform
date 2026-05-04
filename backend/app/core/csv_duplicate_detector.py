"""Semantic duplicate detection for CSV imports.

Uses token-based similarity (SequenceMatcher + Jaccard) to flag rows that
are likely duplicates of each other or of existing records.

Intentionally uses only stdlib so there are no extra dependencies.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from difflib import SequenceMatcher


# ── Normalisation ─────────────────────────────────────────────────────────────


def _normalize(text: str) -> str:
    """Lowercase, strip accents, collapse whitespace/punctuation."""
    # NFD decomposition → strip combining marks
    nfd = unicodedata.normalize("NFD", text or "")
    ascii_only = "".join(ch for ch in nfd if unicodedata.category(ch) != "Mn")
    lowered = ascii_only.lower()
    # replace punctuation/separators with space
    cleaned = re.sub(r"[^\w\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def _tokens(text: str) -> frozenset[str]:
    return frozenset(_normalize(text).split())


# ── Similarity metrics ────────────────────────────────────────────────────────


def sequence_similarity(a: str, b: str) -> float:
    """SequenceMatcher ratio on normalised strings — good for typos/reordering."""
    na, nb = _normalize(a), _normalize(b)
    if not na and not nb:
        return 1.0
    if not na or not nb:
        return 0.0
    return SequenceMatcher(None, na, nb).ratio()


def jaccard_similarity(a: str, b: str) -> float:
    """Jaccard index on token sets — good for word reordering."""
    ta, tb = _tokens(a), _tokens(b)
    if not ta and not tb:
        return 1.0
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def combined_similarity(a: str, b: str) -> float:
    """Weighted average of sequence and Jaccard similarities."""
    return 0.6 * sequence_similarity(a, b) + 0.4 * jaccard_similarity(a, b)


# ── Public API ────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class DuplicateHit:
    """A detected duplicate pair."""

    row_index: int
    matched_index: int
    score: float
    field: str
    row_value: str
    matched_value: str

    @property
    def is_exact(self) -> bool:
        return self.score >= 0.99


@dataclass
class DuplicateReport:
    """Summary of duplicate analysis for an import batch."""

    hits: list[DuplicateHit] = field(default_factory=list)
    threshold: float = 0.85

    @property
    def has_duplicates(self) -> bool:
        return bool(self.hits)

    @property
    def exact_count(self) -> int:
        return sum(1 for h in self.hits if h.is_exact)

    @property
    def fuzzy_count(self) -> int:
        return sum(1 for h in self.hits if not h.is_exact)

    def to_warnings(self) -> list[str]:
        msgs: list[str] = []
        for h in self.hits:
            kind = "duplicado exacto" if h.is_exact else f"posible duplicado ({h.score:.0%})"
            msgs.append(
                f"fila {h.row_index + 1}: {kind} detectado en campo '{h.field}' "
                f"con fila {h.matched_index + 1} "
                f"('{h.row_value}' ≈ '{h.matched_value}')"
            )
        return msgs


def detect_duplicates(
    rows: list[dict[str, str]],
    key_fields: list[str],
    *,
    threshold: float = 0.85,
    existing_values: dict[str, list[str]] | None = None,
) -> DuplicateReport:
    """Detect semantic duplicates within *rows* and against *existing_values*.

    Args:
        rows: List of CSV row dicts (from read_csv_dict_rows).
        key_fields: Fields to use as identity keys (e.g. ['nombre', 'url']).
        threshold: Minimum similarity score to flag as duplicate (0-1).
        existing_values: Optional mapping of field → list of existing values
            already in the DB. Used to detect duplicates against DB records.

    Returns:
        DuplicateReport with all detected hits.
    """
    report = DuplicateReport(threshold=threshold)

    # ── Within-batch deduplication ─────────────────────────────────────────
    for field_name in key_fields:
        values = [r.get(field_name, "") for r in rows]
        for i in range(len(values)):
            if not values[i]:
                continue
            for j in range(i + 1, len(values)):
                if not values[j]:
                    continue
                score = combined_similarity(values[i], values[j])
                if score >= threshold:
                    report.hits.append(
                        DuplicateHit(
                            row_index=i,
                            matched_index=j,
                            score=score,
                            field=field_name,
                            row_value=values[i],
                            matched_value=values[j],
                        )
                    )

    # ── Against-DB deduplication ───────────────────────────────────────────
    if existing_values:
        for field_name in key_fields:
            db_vals = existing_values.get(field_name, [])
            if not db_vals:
                continue
            for i, row in enumerate(rows):
                row_val = row.get(field_name, "")
                if not row_val:
                    continue
                for db_idx, db_val in enumerate(db_vals):
                    score = combined_similarity(row_val, db_val)
                    if score >= threshold:
                        report.hits.append(
                            DuplicateHit(
                                row_index=i,
                                matched_index=-(db_idx + 1),  # negative → DB record
                                score=score,
                                field=field_name,
                                row_value=row_val,
                                matched_value=db_val,
                            )
                        )

    # Sort by score desc
    report.hits.sort(key=lambda h: h.score, reverse=True)
    return report


def deduplicate_rows(
    rows: list[dict[str, str]],
    key_fields: list[str],
    *,
    threshold: float = 0.85,
) -> tuple[list[dict[str, str]], DuplicateReport]:
    """Return (deduplicated_rows, report).

    Removes rows that are near-duplicates of an earlier row in the batch,
    keeping the first occurrence. Rows against DB are NOT removed (only flagged).
    """
    report = detect_duplicates(rows, key_fields, threshold=threshold)

    # Build set of row indices that duplicate an earlier row (keep first occurrence).
    # Within-batch hits use row_index=i, matched_index=j with i<j (see detect_duplicates).
    # Against-DB hits use negative matched_index — those rows are only flagged, not removed.
    duplicate_row_indices: set[int] = set()
    for hit in report.hits:
        if hit.matched_index >= 0 and hit.row_index < hit.matched_index:
            duplicate_row_indices.add(hit.matched_index)

    deduped = [r for i, r in enumerate(rows) if i not in duplicate_row_indices]
    return deduped, report
