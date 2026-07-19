import { normalizeAction } from "./actions"
import { getResourceLabel } from "./labels"

interface RenderContext {
  action: string
  resourceType: string
  resourceLabel: string | null
  details: Record<string, unknown> | null
  user: { name: string; email: string } | null
}

export function renderDescription(ctx: RenderContext): string {
  const { resourceLabel, details, user } = ctx
  const key = normalizeAction(ctx.action)
  const resource = resourceLabel ?? getResourceLabel(ctx.resourceType)
  const actor = user?.name ?? user?.email ?? "Système"
  const d = details ?? {}

  if (key.startsWith("signal.")) return renderSignal(key, resource, d)
  if (key.startsWith("kyc_document.")) return renderKyc(key, resource, d)
  if (key.startsWith("broker_verification.")) return renderBroker(key, resource, d)
  if (key.startsWith("access_request.")) return renderAccess(key, resource, d)
  if (key.startsWith("user.")) return renderUser(key, resource, d, actor)
  if (key.startsWith("session.")) return renderSession(key, d)
  if (key.startsWith("subscription.")) return renderSubscription(key, resource, d)
  if (key.startsWith("system.")) return renderSystem(key, d)
  if (key.startsWith("webhook.")) return renderWebhook(key, d)
  if (key.startsWith("email_event.")) return renderEmailEvent(key, d)
  if (key.startsWith("resend_domain.")) return renderResendDomain(key, resource, d)
  if (key.startsWith("impersonation.")) return renderImpersonation(key, actor)
  if (key.startsWith("notification.")) return renderNotification(key, d)

  return fallback(key, resource, d)
}

function fallback(_key: string, resource: string, _details: Record<string, unknown>): string {
  return `Action sur ${resource.toLowerCase()}`
}

function renderSignal(key: string, resource: string, d: Record<string, unknown>): string {
  switch (key) {
    case "signal.created":
      return `${resource} créé`
    case "signal.published":
      return `${resource} publié${d.queueFailed ? " (échec partiel de la distribution)" : ""}`
    case "signal.updated": {
      const from = d.fromStatus ? ` (passé de ${d.fromStatus} à ${d.toStatus ?? "modifié"})` : ""
      return `${resource} mis à jour${from}`
    }
    case "signal.deleted":
      return `${resource} supprimé`
    case "signal.duplicated":
      return `${resource} dupliqué`
    case "signal.scheduled":
      return `${resource} programmé`
    case "signal.distribution":
      return `${resource} distribué à ${d.recipientCount ?? "?"} destinataire${(d.recipientCount as number) > 1 ? "s" : ""}`
    default:
      return `Action sur ${resource.toLowerCase()}`
  }
}

function renderKyc(_key: string, resource: string, d: Record<string, unknown>): string {
  if (d.notes) return `${resource} ${_key.includes("approved") ? "approuvé" : "refusé"} — motif : ${d.notes}`
  return `${resource} ${_key.includes("approved") ? "approuvé" : "refusé"}`
}

function renderBroker(_key: string, resource: string, d: Record<string, unknown>): string {
  if (d.notes) return `Vérification courtier ${_key.includes("approved") ? "approuvée" : "refusée"} — motif : ${d.notes}`
  return `Vérification courtier ${_key.includes("approved") ? "approuvée" : "refusée"}`
}

function renderAccess(key: string, resource: string, d: Record<string, unknown>): string {
  const plan = d.planName ? ` pour « ${d.planName} »` : d.planId ? ` (plan ${d.planId})` : ""
  switch (key) {
    case "access_request.approved":
      return `${resource} approuvée${plan}${d.notes ? ` — motif : ${d.notes}` : ""}`
    case "access_request.rejected":
      return `${resource} refusée${d.notes ? ` — motif : ${d.notes}` : ""}`
    case "access_request.revoked":
      return `${resource} révoquée${d.notes ? ` — motif : ${d.notes}` : ""}`
    case "access_request.suspended":
      return `${resource} suspendue${d.notes ? ` — motif : ${d.notes}` : ""}`
    default:
      return `${resource} modifiée${plan}`
  }
}

function renderUser(key: string, resource: string, d: Record<string, unknown>, actor: string): string {
  const target = d.userEmail ?? d.userName ?? resource.toLowerCase()
  switch (key) {
    case "user.suspended":
      return `${target} suspendu`
    case "user.reactivated":
      return `${target} réactivé`
    case "user.deleted":
      return d.hardDelete ? `${target} supprimé définitivement` : `${target} supprimé (compte désactivé)`
    case "user.updated": {
      const changes = d.changes
      if (Array.isArray(changes) && changes.length > 0) {
        return `${target} modifié : ${changes.join(", ")}`
      }
      return `${target} modifié`
    }
    case "user.role_changed":
      return `Rôle de ${target} modifié`
    case "user.sessions_revoked":
      return `${d.count ?? ""} session${(d.count as number) > 1 ? "s" : ""} de ${target} révoquée${(d.count as number) > 1 ? "s" : ""}`
    case "user.banned":
      return `${target} banni${d.reason ? ` — motif : ${d.reason}` : ""}${d.bannedBy ? ` (par ${d.bannedBy})` : ""}`
    case "user.unbanned":
      return `${target} réhabilité`
    case "user.email_bounced":
      return `Email rejeté pour ${target}${d.reason ? ` : ${d.reason}` : ""}`
    case "user.email_complained":
      return `Plainte spam pour ${target}`
    case "user.email_suppressed":
      return `Email supprimé pour ${target}${d.reason ? ` : ${d.reason}` : ""}`
    case "user.email_changed": {
      if (d.from && d.to) return `Statut email de ${target} : ${d.from} → ${d.to}`
      return `Statut email de ${target} modifié`
    }
    case "user.exported":
      return `Données de ${target} exportées`
    default:
      return `${target} modifié`
  }
}

function renderSession(_key: string, d: Record<string, unknown>): string {
  const email = d.email ?? "utilisateur inconnu"
  const reason = d.reason ? ` — ${d.reason}` : ""
  return `Échec de connexion pour ${email}${reason}`
}

function renderSubscription(_key: string, resource: string, d: Record<string, unknown>): string {
  return `Abonnement modifié vers le plan ${d.planId ?? "inconnu"}`
}

function renderSystem(_key: string, d: Record<string, unknown>): string {
  const targets = d.targets
  const prefixes = d.prefixes
  if (Array.isArray(targets) && targets.length > 0) {
    return `Relance des files d'attente : ${targets.join(", ")}`
  }
  if (Array.isArray(prefixes) && prefixes.length > 0) {
    return `Cache vidé : ${prefixes.join(", ")}`
  }
  if (d.count && d.threshold) {
    return `Alerte : ${d.count} emails en attente (seuil ${d.threshold})`
  }
  return `Action système effectuée`
}

function renderWebhook(_key: string, d: Record<string, unknown>): string {
  const type = d.type ?? "événement"
  if (_key.includes("replay_failed")) {
    return `Rejeu de ${type} échoué${d.error ? ` : ${d.error}` : ""}`
  }
  if (_key.includes("abandoned")) {
    return `${type} abandonné${d.reason ? ` : ${d.reason}` : ""}`
  }
  return `${type} rejoué`
}

function renderEmailEvent(_key: string, d: Record<string, unknown>): string {
  return `Événement email rejoué${d.originalType ? ` (${d.originalType})` : ""}`
}

function renderResendDomain(_key: string, resource: string, d: Record<string, unknown>): string {
  const domain = d.domain ?? ""
  if (_key.includes("created")) return `Domaine ${domain} créé`
  if (_key.includes("updated")) return `Domaine ${domain} modifié`
  if (_key.includes("deleted")) return `Domaine ${domain} supprimé`
  return `${resource} modifié`
}

function renderImpersonation(_key: string, actor: string): string {
  if (_key.includes("started")) return `Impersonation démarrée par ${actor}`
  return `Impersonation arrêtée par ${actor}`
}

function renderNotification(_key: string, _d: Record<string, unknown>): string {
  return `Notification envoyée`
}
