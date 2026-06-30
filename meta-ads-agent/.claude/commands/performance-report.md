# Performance Report

Generate a structured performance report for Meta Ads campaigns.

## Steps

1. Ask for time range (default: `last_7d`) and level (`campaign` / `adset` / `ad`).
2. Pull insights via `src/get_insights.py` with fields: impressions, reach, clicks, spend, cpc, cpm, ctr, actions, cost_per_action_type, purchase_roas.
3. Present results in a structured table.
4. Highlight top performers and underperformers.
5. Provide 3 actionable optimization recommendations.

## Usage

```
/performance-report
```

Or with context:

```
/performance-report periodo: last_30d, nivel: adset
```
