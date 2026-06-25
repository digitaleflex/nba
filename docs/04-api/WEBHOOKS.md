# Webhooks

> **Version:** 1.0

## Resend Webhook

**Endpoint:** `POST /api/webhooks/resend`

**Authentication:** Signature validation

**Events:**
| Event | Description |
|-------|-------------|
| `email.delivered` | Email was delivered |
| `email.bounced` | Email bounced |
| `email.complained` | Recipient marked as spam |
| `email.opened` | Email was opened |

**Processing:**
- Update notification delivery status
- Mark email as bounced on permanent failures
- Log all events for audit
