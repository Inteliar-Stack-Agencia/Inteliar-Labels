# Meta Ads Skill

This skill enables Claude to operate Meta (Facebook/Instagram) ad campaigns through the
Meta Marketing API v25.0 with built-in safety guardrails.

## Capabilities

- Create campaigns, ad sets, ad creatives, and ads (always in PAUSED status)
- Pull performance insights and generate reports
- Validate targeting, creative specs, and compliance requirements
- Log all write operations for audit

## Required Environment Variables

- `META_ACCESS_TOKEN` — System User token with ads_management, ads_read, business_management
- `META_APP_SECRET` — App secret for signature verification
- `META_AD_ACCOUNT_ID` — Ad account ID (act_XXXXXXXXX format)
- `META_PAGE_ID` — Facebook Page for ad creatives

## Available Commands

- `/new-campaign` — Full campaign creation wizard with safety checks
- `/performance-report` — Performance insights with recommendations

## Safety Contract

Every write operation: shows preview → waits for confirmation → executes → logs result.
No exception.
