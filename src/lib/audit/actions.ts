export const RESOURCE_TYPES = [
  "access_request",
  "signal",
  "user",
  "kyc_document",
  "broker_verification",
  "subscription",
  "system",
  "notification",
  "session",
  "role",
  "email",
  "settings",
  "resend_domain",
  "webhook_dlq",
  "email_event",
] as const

export type ResourceType = (typeof RESOURCE_TYPES)[number]

const ACTION_PAST = [
  "created", "published", "updated", "deleted", "duplicated",
  "approved", "rejected", "revoked", "suspended",
  "started", "stopped",
  "bounced", "complained", "suppressed",
  "sent", "retried", "purged", "failed", "abandoned",
  "changed", "reselected", "replayed",
  "activated", "deactivated", "overridden",
] as const

type ActionVerb = (typeof ACTION_PAST)[number]

export type StandardAction = `${ResourceType}.${ActionVerb}` | `${ResourceType}.${ActionVerb}`

const LEGACY_ACTION_MAP: Record<string, string> = {
  "signal.publish": "signal.distribution",
  "CREATE": "signal.created",
  "APPROVE": "access_request.approved",
  "REJECT": "access_request.rejected",
  "REVOKE": "access_request.revoked",
  "SUSPEND": "user.suspended",
  "DELETE": "user.deleted",
  "UPDATE": "user.updated",
  "LOGIN": "session.login",
  "REGISTER": "user.registered",
  "LOGIN_FAILED": "session.login_failed",
  "EXPORT": "user.exported",
  "REPLAYED": "webhook.dlq_replayed",
  "PURGE": "system.purged",
  "signal.draft": "signal.created",
  "signal.update": "signal.updated",
  "signal.duplicate": "signal.duplicated",
  "signal.schedule": "signal.scheduled",
  "user.email_status_changed": "user.email_changed",
  "admin.ban": "user.banned",
  "admin.unban": "user.unbanned",
  "admin.queues.retry": "system.queue_retried",
  "admin.cache.purge": "system.cache_purged",
  "admin.member.revoke_sessions": "user.sessions_revoked",
  "admin.member.mark_messages_read": "user.messages_read",
  "admin.member.reset_realtime": "user.realtime_reset",
  "access.cleanup_ghosts": "access_request.cleaned",
  "webhook.dlq.replayed": "webhook.dlq_replayed",
  "webhook.dlq.replay_failed": "webhook.dlq_replay_failed",
  "webhook.dlq.abandoned": "webhook.dlq_abandoned",
  "webhook.event.replayed": "email_event.replayed",
  "subscription.reselect": "subscription.reselected",
  "subscription.reselect_duplicate": "subscription.reselected",
  "impersonation.start": "impersonation.started",
  "impersonation.stop": "impersonation.stopped",
  "signal.override_on": "signal.override_on",
  "signal.override_off": "signal.override_off",
  "notification.send": "notification.sent",
  "email.bounced": "user.email_bounced",
  "email.complained": "user.email_complained",
  "email.suppressed": "user.email_suppressed",
  "email.delayed_burst_alert": "system.email_burst_alert",
  "access_request.approved": "access_request.approved",
  "access_request.rejected": "access_request.rejected",
  "access_request.suspended": "access_request.suspended",
  "access_request.revoked": "access_request.revoked",
  "kyc.approved": "kyc_document.approved",
  "kyc.rejected": "kyc_document.rejected",
  "broker.approved": "broker_verification.approved",
  "broker.rejected": "broker_verification.rejected",
  "resend.domain.created": "resend_domain.created",
  "resend.domain.updated": "resend_domain.updated",
  "resend.domain.deleted": "resend_domain.deleted",
}

export function normalizeAction(action: string): string {
  return LEGACY_ACTION_MAP[action] ?? action
}
