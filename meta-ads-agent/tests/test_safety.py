"""Unit tests for safety guardrails."""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from utils.safety import (
    check_budget_cap,
    check_prohibited_content,
    require_paused_status,
    summarize_operation,
)


def test_budget_under_cap_passes():
    check_budget_cap(5000)


def test_budget_over_cap_without_confirmation_raises():
    with pytest.raises(PermissionError, match="safety cap"):
        check_budget_cap(15000)


def test_budget_over_cap_with_confirmation_passes():
    check_budget_cap(15000, confirmed=True)


def test_prohibited_content_detected():
    with pytest.raises(ValueError, match="prohibited"):
        check_prohibited_content("Buy our tobacco products now!")


def test_clean_content_passes():
    check_prohibited_content("Get the best running shoes at half price.")


def test_require_paused_rejects_active():
    with pytest.raises(ValueError, match="PAUSED"):
        require_paused_status("ACTIVE", "Campaign")


def test_require_paused_accepts_paused():
    require_paused_status("PAUSED")


def test_summarize_operation_hides_token():
    summary = summarize_operation("CREATE CAMPAIGN", {
        "name": "Test",
        "access_token": "secret123",
        "status": "PAUSED",
    })
    assert "secret123" not in summary
    assert "Test" in summary
