# Business Context

> For AI agents. Concise summary of business domain.

## What NBA Does
Trading signal platform. Admins create signals, members receive them based on subscription plans.

## Core Workflows

### Member Journey
Register → Verify Email → Complete KYC → Verify Broker → Subscribe → Receive Signals

### Signal Publication
Admin creates signal (DRAFT) → Admin publishes → System queues distribution → BullMQ worker sends to applicable members via in-app, email, Telegram

### Verification
Member uploads documents → KYC_AGENT reviews → Approve or Reject → Notification sent

## Business Rules (Summary)
- Only verified members can receive signals
- Signal visibility depends on subscription plan
- KYC and broker verification required before full access
- One active subscription per member
- Audit all administrative actions
- Temporary files deleted after verification
