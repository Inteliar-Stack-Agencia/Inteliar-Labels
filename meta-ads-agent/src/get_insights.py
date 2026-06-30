"""Pull Meta Ads performance insights."""

import os
import json

from utils.api_client import get, MetaAPIError
from utils.validators import validate_ad_account_id

DEFAULT_FIELDS = [
    "impressions", "reach", "clicks", "spend",
    "cpc", "cpm", "ctr", "actions",
    "cost_per_action_type", "purchase_roas",
    "quality_ranking",
]

VALID_DATE_PRESETS = {
    "today", "yesterday", "last_3d", "last_7d", "last_14d",
    "last_28d", "last_30d", "last_90d", "this_month", "last_month",
}

VALID_LEVELS = {"account", "campaign", "adset", "ad"}


def get_insights(
    object_id: str | None = None,
    level: str = "campaign",
    date_preset: str = "last_7d",
    fields: list[str] | None = None,
    time_increment: int | None = None,
    breakdowns: list[str] | None = None,
) -> list[dict]:
    """
    Pull insights for an ad account (default) or a specific object.

    object_id: campaign/adset/ad ID, or None to use META_AD_ACCOUNT_ID
    level: account | campaign | adset | ad
    date_preset: last_7d, last_30d, etc.
    """
    if level not in VALID_LEVELS:
        raise ValueError(f"Invalid level '{level}'. Must be one of {VALID_LEVELS}.")
    if date_preset not in VALID_DATE_PRESETS:
        raise ValueError(f"Invalid date_preset '{date_preset}'. Must be one of {VALID_DATE_PRESETS}.")

    if object_id is None:
        account_id = os.environ["META_AD_ACCOUNT_ID"]
        validate_ad_account_id(account_id)
        object_id = account_id

    params: dict = {
        "level": level,
        "date_preset": date_preset,
        "fields": ",".join(fields or DEFAULT_FIELDS),
    }
    if time_increment is not None:
        params["time_increment"] = time_increment
    if breakdowns:
        params["breakdowns"] = ",".join(breakdowns)

    try:
        response = get(f"{object_id}/insights", params)
        return response.get("data", [])
    except MetaAPIError:
        raise


def print_report(rows: list[dict]) -> None:
    if not rows:
        print("No data returned for the selected period.")
        return
    for row in rows:
        name = row.get("campaign_name") or row.get("adset_name") or row.get("ad_name") or row.get("account_id", "—")
        print(f"\n{'─' * 50}")
        print(f"  {name}")
        print(f"  Spend:      ${float(row.get('spend', 0)):.2f}")
        print(f"  Impressions:{row.get('impressions', '—')}")
        print(f"  Clicks:     {row.get('clicks', '—')}")
        print(f"  CTR:        {row.get('ctr', '—')}%")
        print(f"  CPC:        ${float(row.get('cpc', 0) or 0):.2f}")
        print(f"  CPM:        ${float(row.get('cpm', 0) or 0):.2f}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Get Meta Ads insights")
    parser.add_argument("--object-id", default=None, help="Campaign/adset/ad ID (default: ad account)")
    parser.add_argument("--level", default="campaign", choices=list(VALID_LEVELS))
    parser.add_argument("--date-preset", default="last_7d", choices=list(VALID_DATE_PRESETS))
    parser.add_argument("--breakdowns", nargs="*", default=None)
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    args = parser.parse_args()

    data = get_insights(
        object_id=args.object_id,
        level=args.level,
        date_preset=args.date_preset,
        breakdowns=args.breakdowns,
    )

    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print_report(data)
