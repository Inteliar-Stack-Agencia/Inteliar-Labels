"""Create a Meta Ads campaign in PAUSED status."""

import os
import sys
import json

from utils.api_client import post_with_retry, MetaAPIError
from utils.validators import validate_campaign_params, validate_ad_account_id
from utils.safety import check_budget_cap, require_paused_status, summarize_operation
from utils.logger import log_write


def create_campaign(params: dict, confirmed: bool = False) -> dict:
    """
    Create a campaign under META_AD_ACCOUNT_ID.

    params keys:
      name, objective, status (must be PAUSED), special_ad_categories,
      daily_budget (optional, cents), spend_cap (optional, cents)
    """
    account_id = os.environ["META_AD_ACCOUNT_ID"]
    validate_ad_account_id(account_id)

    params.setdefault("status", "PAUSED")
    params.setdefault("special_ad_categories", [])
    require_paused_status(params["status"], "Campaign")
    validate_campaign_params({**params, "account_id": account_id})

    if "daily_budget" in params:
        check_budget_cap(params["daily_budget"], confirmed=confirmed)

    if not confirmed:
        print(summarize_operation("CREATE CAMPAIGN", params))
        return {}

    endpoint = f"{account_id}/campaigns"
    try:
        result = post_with_retry(endpoint, params)
        log_write("create_campaign", params, result=result)
        return result
    except MetaAPIError as exc:
        log_write("create_campaign", params, error=str(exc))
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create a Meta Ads campaign")
    parser.add_argument("--params", required=True, help="JSON string of campaign params")
    parser.add_argument("--confirm", action="store_true", help="Execute the write")
    args = parser.parse_args()

    campaign_params = json.loads(args.params)
    result = create_campaign(campaign_params, confirmed=args.confirm)
    print(json.dumps(result, indent=2))
