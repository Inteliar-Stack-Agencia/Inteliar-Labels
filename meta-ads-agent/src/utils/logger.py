"""Audit logger for all Meta Ads write operations."""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path

LOG_DIR = Path(__file__).parent.parent.parent / "logs"
LOG_FILE = LOG_DIR / "api_actions.log"

LOG_DIR.mkdir(exist_ok=True)

_handler = logging.FileHandler(LOG_FILE)
_handler.setFormatter(logging.Formatter("%(message)s"))

_logger = logging.getLogger("meta_ads_audit")
_logger.setLevel(logging.INFO)
_logger.addHandler(_handler)
_logger.propagate = False


def log_write(action: str, params: dict, result: dict | None = None, error: str | None = None) -> None:
    """Record a write operation to the audit log."""
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "params": _redact(params),
        "result": result,
        "error": error,
        "operator": os.environ.get("USER", "unknown"),
    }
    _logger.info(json.dumps(entry))


def _redact(data: dict) -> dict:
    """Remove token and secret values from logged params."""
    sensitive = {"access_token", "META_ACCESS_TOKEN", "META_APP_SECRET", "appsecret_proof"}
    return {k: "***" if k in sensitive else v for k, v in data.items()}
