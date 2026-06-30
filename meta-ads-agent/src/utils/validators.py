"""Parameter validation before Meta API calls."""

import re
from datetime import datetime


def validate_ad_account_id(account_id: str) -> None:
    if not re.match(r"^act_\d+$", account_id):
        raise ValueError(f"Invalid ad account ID '{account_id}'. Must start with 'act_' followed by digits.")


def validate_budget_cents(budget: int, label: str = "budget") -> None:
    if not isinstance(budget, int) or budget <= 0:
        raise ValueError(f"'{label}' must be a positive integer in cents. Got: {budget!r}")


def validate_iso8601(date_str: str, label: str = "date") -> None:
    try:
        datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        raise ValueError(f"'{label}' must be a valid ISO 8601 date string. Got: {date_str!r}")


def validate_campaign_params(params: dict) -> None:
    required = {"name", "objective", "status", "special_ad_categories"}
    missing = required - params.keys()
    if missing:
        raise ValueError(f"Missing required campaign fields: {missing}")
    if params["status"] != "PAUSED":
        raise ValueError("Campaigns must be created with status 'PAUSED'.")
    validate_ad_account_id(params.get("account_id", ""))


def validate_adset_params(params: dict) -> None:
    required = {"name", "campaign_id", "billing_event", "optimization_goal", "targeting", "start_time", "status"}
    missing = required - params.keys()
    if missing:
        raise ValueError(f"Missing required ad set fields: {missing}")
    if params["status"] != "PAUSED":
        raise ValueError("Ad sets must be created with status 'PAUSED'.")
    if "daily_budget" not in params and "lifetime_budget" not in params:
        raise ValueError("Ad set requires either 'daily_budget' or 'lifetime_budget'.")
    if "daily_budget" in params:
        validate_budget_cents(params["daily_budget"], "daily_budget")
    if "lifetime_budget" in params:
        validate_budget_cents(params["lifetime_budget"], "lifetime_budget")
    validate_iso8601(params["start_time"], "start_time")
    targeting = params.get("targeting", {})
    if "geo_locations" not in targeting:
        raise ValueError("Targeting must include 'geo_locations'.")


def validate_ad_params(params: dict) -> None:
    required = {"name", "adset_id", "creative", "status"}
    missing = required - params.keys()
    if missing:
        raise ValueError(f"Missing required ad fields: {missing}")
    if params["status"] != "PAUSED":
        raise ValueError("Ads must be created with status 'PAUSED'.")
    if "creative_id" not in params.get("creative", {}):
        raise ValueError("'creative' must contain 'creative_id'.")
