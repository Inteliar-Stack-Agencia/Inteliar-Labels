"""Unit tests for parameter validators."""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from utils.validators import (
    validate_ad_account_id,
    validate_budget_cents,
    validate_iso8601,
    validate_campaign_params,
    validate_adset_params,
    validate_ad_params,
)


def test_valid_account_id():
    validate_ad_account_id("act_123456789")


def test_invalid_account_id_no_prefix():
    with pytest.raises(ValueError, match="act_"):
        validate_ad_account_id("123456789")


def test_invalid_account_id_letters():
    with pytest.raises(ValueError):
        validate_ad_account_id("act_abc")


def test_valid_budget():
    validate_budget_cents(5000)


def test_zero_budget_rejected():
    with pytest.raises(ValueError):
        validate_budget_cents(0)


def test_negative_budget_rejected():
    with pytest.raises(ValueError):
        validate_budget_cents(-100)


def test_valid_iso8601():
    validate_iso8601("2025-01-15T10:00:00Z")
    validate_iso8601("2025-01-15T10:00:00+00:00")


def test_invalid_iso8601():
    with pytest.raises(ValueError):
        validate_iso8601("15-01-2025")


def test_campaign_params_valid():
    validate_campaign_params({
        "name": "Test Campaign",
        "objective": "OUTCOME_TRAFFIC",
        "status": "PAUSED",
        "special_ad_categories": [],
        "account_id": "act_123456789",
    })


def test_campaign_params_active_rejected():
    with pytest.raises(ValueError, match="PAUSED"):
        validate_campaign_params({
            "name": "Test",
            "objective": "OUTCOME_TRAFFIC",
            "status": "ACTIVE",
            "special_ad_categories": [],
            "account_id": "act_123",
        })


def test_adset_requires_geo():
    with pytest.raises(ValueError, match="geo_locations"):
        validate_adset_params({
            "name": "Test Adset",
            "campaign_id": "123",
            "daily_budget": 3000,
            "billing_event": "IMPRESSIONS",
            "optimization_goal": "LINK_CLICKS",
            "targeting": {},
            "start_time": "2025-01-15T00:00:00Z",
            "status": "PAUSED",
        })


def test_ad_params_missing_creative_id():
    with pytest.raises(ValueError, match="creative_id"):
        validate_ad_params({
            "name": "Test Ad",
            "adset_id": "123",
            "creative": {},
            "status": "PAUSED",
        })
