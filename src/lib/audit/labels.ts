import { normalizeAction } from "./actions"

const RESOURCE_LABELS: Record<string, string> = {
  access_request: "Demande d'accès",
  signal: "Signal",
  user: "Utilisateur",
  kyc_document: "Document KYC",
  broker_verification: "Vérification courtier",
  subscription: "Abonnement",
  system: "Système",
  notification: "Notification",
  session: "Session",
  role: "Rôle",
  email: "Email",
  settings: "Paramètres",
  resend_domain: "Domaine Resend",
  webhook_dlq: "File DLQ",
  email_event: "Événement email",
}

export function getResourceLabel(resourceType: string): string {
  return RESOURCE_LABELS[resourceType] ?? resourceType
}

export function getActionLabel(action: string): string {
  const key = normalizeAction(action)
  return ACTION_LABELS[key] ?? key
}

const ACTION_LABELS: Record<string, string> = {
  "signal.created": "Signal créé",
  "signal.published": "Signal publié",
  "signal.updated": "Signal modifié",
  "signal.deleted": "Signal supprimé",
  "signal.duplicated": "Signal dupliqué",
  "signal.scheduled": "Signal programmé",
  "signal.distribution": "Distribution envoyée",
  "signal.override_on": "Override activé",
  "signal.override_off": "Override désactivé",
  "kyc_document.approved": "KYC approuvé",
  "kyc_document.rejected": "KYC refusé",
  "broker_verification.approved": "Broker approuvé",
  "broker_verification.rejected": "Broker refusé",
  "access_request.approved": "Demande approuvée",
  "access_request.rejected": "Demande refusée",
  "access_request.revoked": "Demande révoquée",
  "access_request.suspended": "Demande suspendue",
  "access_request.cleaned": "Demandes orphelines nettoyées",
  "user.suspended": "Utilisateur suspendu",
  "user.reactivated": "Utilisateur réactivé",
  "user.deleted": "Utilisateur supprimé",
  "user.updated": "Utilisateur modifié",
  "user.role_changed": "Rôle modifié",
  "user.sessions_revoked": "Sessions révoquées",
  "user.banned": "Utilisateur banni",
  "user.unbanned": "Utilisateur réhabilité",
  "user.email_bounced": "Email rejeté",
  "user.email_complained": "Plainte spam",
  "user.email_suppressed": "Email supprimé",
  "user.email_changed": "Statut email modifié",
  "user.exported": "Données exportées",
  "user.registered": "Inscription",
  "user.messages_read": "Messages marqués lus",
  "user.realtime_reset": "Connexion temps réel réinitialisée",
  "session.login": "Connexion",
  "session.login_failed": "Échec de connexion",
  "impersonation.started": "Début impersonation",
  "impersonation.stopped": "Fin impersonation",
  "notification.sent": "Notification envoyée",
  "subscription.reselected": "Abonnement modifié",
  "system.queue_retried": "Relance files d'attente",
  "system.cache_purged": "Cache vidé",
  "system.purged": "Nettoyage",
  "system.email_burst_alert": "Alerte volume emails",
  "webhook.dlq_replayed": "Événement rejoué",
  "webhook.dlq_replay_failed": "Rejeu échoué",
  "webhook.dlq_abandoned": "Événement abandonné",
  "email_event.replayed": "Événement email rejoué",
  "resend_domain.created": "Domaine Resend créé",
  "resend_domain.updated": "Domaine Resend modifié",
  "resend_domain.deleted": "Domaine Resend supprimé",
}

export function getActionColor(action: string): "emerald" | "rose" | "blue" | "amber" | "muted" {
  const key = normalizeAction(action)

  if (key.includes("approved") || key.includes("reactivated") || key.includes("started") || key.includes("unbanned") || key.includes("override_on") || key.includes("replayed") || key.includes("created")) {
    return "emerald"
  }
  if (key.includes("rejected") || key.includes("deleted") || key.includes("suspended") || key.includes("revoked") || key.includes("stopped") || key.includes("banned") || key.includes("failed") || key.includes("abandoned") || key.includes("bounced") || key.includes("complained") || key.includes("suppressed") || key.includes("override_off")) {
    return "rose"
  }
  if (key.includes("published") || key.includes("distribution") || key.includes("sent") || key.includes("login") || key.includes("purged") || key.includes("exported")) {
    return "blue"
  }
  if (key.includes("updated") || key.includes("scheduled") || key.includes("duplicated") || key.includes("changed") || key.includes("reselected") || key.includes("retried") || key.includes("cleaned")) {
    return "amber"
  }
  return "muted"
}
