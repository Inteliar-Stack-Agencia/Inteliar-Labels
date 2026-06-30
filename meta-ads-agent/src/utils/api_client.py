"""Meta Marketing API client wrapper."""

import os
import time
import requests
from typing import Any

BASE_URL = "https://graph.facebook.com/v25.0"


def _token() -> str:
    token = os.environ.get("META_ACCESS_TOKEN", "")
    if not token:
        raise EnvironmentError("META_ACCESS_TOKEN is not set")
    return token


def get(endpoint: str, params: dict[str, Any] | None = None) -> dict:
    """GET request with automatic token injection."""
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    response = requests.get(url, params={"access_token": _token(), **(params or {})})
    _raise_for_meta_error(response)
    return response.json()


def post(endpoint: str, data: dict[str, Any]) -> dict:
    """POST request with automatic token injection."""
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    response = requests.post(url, data={"access_token": _token(), **data})
    _raise_for_meta_error(response)
    return response.json()


def post_with_retry(endpoint: str, data: dict[str, Any], max_retries: int = 3) -> dict:
    """POST with exponential backoff for rate-limit errors (codes 17, 80004, 613)."""
    rate_limit_codes = {17, 80004, 613}
    delay = 2
    for attempt in range(max_retries + 1):
        try:
            return post(endpoint, data)
        except MetaAPIError as exc:
            if exc.code in rate_limit_codes and attempt < max_retries:
                time.sleep(delay)
                delay *= 2
                continue
            raise


def _raise_for_meta_error(response: requests.Response) -> None:
    payload = response.json()
    if "error" in payload:
        err = payload["error"]
        raise MetaAPIError(
            code=err.get("code"),
            message=err.get("message", "Unknown Meta API error"),
            type=err.get("type"),
            fbtrace_id=err.get("fbtrace_id"),
        )
    response.raise_for_status()


class MetaAPIError(Exception):
    def __init__(self, code: int | None, message: str, type: str | None = None, fbtrace_id: str | None = None):
        super().__init__(f"[{code}] {message}")
        self.code = code
        self.type = type
        self.fbtrace_id = fbtrace_id
