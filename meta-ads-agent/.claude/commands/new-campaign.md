# New Campaign

Create a complete Meta Ads campaign (Campaign → Ad Set → Ad Creative → Ad) in PAUSED status.

## Steps

1. Ask user for: business goal, target audience, budget (daily/lifetime), creative assets, destination URL, timeline.
2. Ask if the product/service relates to credit, employment, housing, politics, or financial services (Special Ad Categories).
3. Validate creative dimensions and copy length against specs.
4. Show full plan summary and wait for explicit confirmation.
5. Execute in order using `src/create_campaign.py`, `src/create_adset.py`, `src/create_ad.py`.
6. Log all write operations to `logs/api_actions.log`.
7. Report created IDs and remind user that activation requires an explicit separate request.

## Usage

```
/new-campaign
```

Or with context:

```
/new-campaign objetivo: OUTCOME_TRAFFIC, presupuesto: $30/día, audiencia: Argentina 25-45
```
