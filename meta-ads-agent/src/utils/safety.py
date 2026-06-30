"""Safety guardrails for Meta Ads operations."""

DAILY_BUDGET_HARD_CAP_CENTS = 10_000  # $100.00
BUDGET_INCREASE_MAX_PCT = 20

PROHIBITED_KEYWORDS = [
    "tobacco", "cigarette", "drug", "illegal", "weapon", "firearm",
    "explosive", "pornograph", "adult content",
]


def check_budget_cap(daily_budget_cents: int, confirmed: bool = False) -> None:
    """Raise if budget exceeds the hard cap without explicit confirmation."""
    if daily_budget_cents > DAILY_BUDGET_HARD_CAP_CENTS and not confirmed:
        usd = daily_budget_cents / 100
        raise PermissionError(
            f"Daily budget ${usd:.2f} exceeds the $100.00 safety cap. "
            "Provide explicit confirmation with the exact amount to proceed."
        )


def check_prohibited_content(text: str) -> None:
    """Raise if ad copy contains prohibited keywords."""
    lower = text.lower()
    hits = [kw for kw in PROHIBITED_KEYWORDS if kw in lower]
    if hits:
        raise ValueError(f"Ad copy contains prohibited content: {hits}")


def require_paused_status(status: str, entity: str = "entity") -> None:
    """Enforce PAUSED status on creation."""
    if status != "PAUSED":
        raise ValueError(f"{entity} must be created with status PAUSED, got '{status}'.")


def summarize_operation(action: str, params: dict) -> str:
    """Return a human-readable summary for user confirmation."""
    lines = [f"Action: {action}"]
    for k, v in params.items():
        if k not in ("access_token", "appsecret_proof"):
            lines.append(f"  {k}: {v}")
    lines.append("\nConfirm? (yes/no)")
    return "\n".join(lines)
