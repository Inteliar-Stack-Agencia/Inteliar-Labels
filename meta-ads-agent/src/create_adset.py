"""Create a Meta Ads ad set in PAUSED status."""

import os
import sys
import json

from utils.api_client import post_with_retry, MetaAPIError
from utils.validators import validate_adset_params, validate_ad_account_id
from utils.safety import check_budget_cap, require_paused_status, summarize_operation
from utils.logger import log_write


def create_adset(params: dict, confirmed: bool = False) -> dict:
    """
    Create an ad set under META_AD_ACCOUNT_ID.

    params keys:
      name, campaign_id, daily_budget OR lifetime_budget (cents),
      billing_event, optimization_goal, targeting, start_time,
      status (must be PAUSED), bid_strategy (optional), end_time (optional)
    """
    account_id = os.environ["META_AD_ACCOUNT_ID"]
    validate_ad_account_id(account_id)

    params.setdefault("status", "PAUSED")
    require_paused_status(params["status"], "Ad Set")
    validate_adset_params(params)

    if "daily_budget" in params:
        check_budget_cap(params["daily_budget"], confirmed=confirmed)

    if not confirmed:
        print(summarize_operation("CREATE AD SET", params))
        return {}

    endpoint = f"{account_id}/adsets"
    try:
        result = post_with_retry(endpoint, params)
        log_write("create_adset", params, result=result)
        return result
    except MetaAPIError as exc:
        log_write("create_adset", params, error=str(exc))
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create a Meta Ads ad set")
    parser.add_argument("--params", required=True, help="JSON string of ad set params")
    parser.add_argument("--confirm", action="store_true", help="Execute the write")
    args = parser.parse_args()

    adset_params = json.loads(args.params)
    result = create_adset(adset_params, confirmed=args.confirm)
    print(json.dumps(result, indent=2))
