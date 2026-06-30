"""Create a Meta Ad creative and ad in PAUSED status."""

import os
import json

from utils.api_client import post_with_retry, MetaAPIError
from utils.validators import validate_ad_params, validate_ad_account_id
from utils.safety import require_paused_status, check_prohibited_content, summarize_operation
from utils.logger import log_write


def create_creative(creative_params: dict, confirmed: bool = False) -> dict:
    """
    Create an ad creative.

    creative_params keys:
      name, object_story_spec (page_id + link_data or video_data)
    """
    account_id = os.environ["META_AD_ACCOUNT_ID"]
    validate_ad_account_id(account_id)

    message = (
        creative_params.get("object_story_spec", {})
        .get("link_data", {})
        .get("message", "")
    )
    if message:
        check_prohibited_content(message)

    if not confirmed:
        print(summarize_operation("CREATE AD CREATIVE", creative_params))
        return {}

    endpoint = f"{account_id}/adcreatives"
    try:
        result = post_with_retry(endpoint, creative_params)
        log_write("create_creative", creative_params, result=result)
        return result
    except MetaAPIError as exc:
        log_write("create_creative", creative_params, error=str(exc))
        raise


def create_ad(ad_params: dict, confirmed: bool = False) -> dict:
    """
    Create an ad referencing an existing creative.

    ad_params keys:
      name, adset_id, creative ({"creative_id": "..."}), status (must be PAUSED)
    """
    account_id = os.environ["META_AD_ACCOUNT_ID"]
    validate_ad_account_id(account_id)

    ad_params.setdefault("status", "PAUSED")
    require_paused_status(ad_params["status"], "Ad")
    validate_ad_params(ad_params)

    if not confirmed:
        print(summarize_operation("CREATE AD", ad_params))
        return {}

    endpoint = f"{account_id}/ads"
    try:
        result = post_with_retry(endpoint, ad_params)
        log_write("create_ad", ad_params, result=result)
        return result
    except MetaAPIError as exc:
        log_write("create_ad", ad_params, error=str(exc))
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create a Meta Ad (creative + ad)")
    parser.add_argument("--creative-params", required=True, help="JSON string for creative")
    parser.add_argument("--ad-params", required=True, help="JSON string for ad")
    parser.add_argument("--confirm", action="store_true", help="Execute the writes")
    args = parser.parse_args()

    creative_result = create_creative(json.loads(args.creative_params), confirmed=args.confirm)
    if args.confirm and creative_result:
        ad_p = json.loads(args.ad_params)
        ad_p["creative"] = {"creative_id": creative_result["id"]}
        ad_result = create_ad(ad_p, confirmed=True)
        print(json.dumps({"creative": creative_result, "ad": ad_result}, indent=2))
