import { normalizeAction } from "./actions"

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
  const d = details ?? {}

  if (key.startsWith("signal.")) return renderSignal(key, resourceLabel, d)
  if (key.startsWith("kyc_document.")) return renderKyc(key, d)
  if (key.startsWith("broker_verification.")) return renderBroker(key, d)
  if (key.startsWith("access_request.")) return renderAccess(key, d)
  if (key.startsWith("user.")) return renderUser(key, d)
  if (key.startsWith("session.")) return renderSession(key, d)
  if (key.startsWith("subscription.")) return renderSubscription(key, d)
  if (key.startsWith("system.")) return renderSystem(key, d)
  if (key.startsWith("webhook.")) return renderWebhook(key, d)
  if (key.startsWith("email_event.")) return renderEmailEvent(key, d)
  if (key.startsWith("resend_domain.")) return renderResendDomain(key, d)
  if (key.startsWith("impersonation.")) return renderImpersonation(key, user)
  if (key.startsWith("notification.")) return renderNotification(key, d)

  return `Action sur ${(resourceLabel ?? ctx.resourceType).toLowerCase()}`
}

function renderSignal(key: string, name: string | null, d: Record<string, unknown>): string {
  const prefix = name ? `${name}` : ""
  switch (key) {
    case "signal.created":
      return prefix || "Créé"
    case "signal.published":
      return prefix ? `${prefix} publié` : "Publié"
    case "signal.updated": {
      if (d.fromStatus && d.toStatus) return `${prefix} : ${d.fromStatus} → ${d.toStatus}`
      return prefix ? `${prefix} modifié` : "Modifié"
    }
    case "signal.deleted":
      return prefix ? `${prefix} supprimé` : "Supprimé"
    case "signal.duplicated":
      return prefix ? `${prefix} dupliqué` : "Dupliqué"
    case "signal.scheduled":
      return prefix ? `${prefix} programmé` : "Programmé"
    case "signal.distribution":
      return `${d.recipientCount ?? "?"} destinataire${(d.recipientCount as number) > 1 ? "s" : ""}`
    default:
      return prefix || "Action"
  }
}

function renderKyc(_key: string, d: Record<string, unknown>): string {
  return (d.notes as string) ?? ""
}

function renderBroker(_key: string, d: Record<string, unknown>): string {
  return (d.notes as string) ?? ""
}

function renderAccess(key: string, d: Record<string, unknown>): string {
  const plan = d.planName ? `Plan « ${d.planName} »` : ""
  const notes = d.notes ? ` — ${d.notes}` : ""
  if (key.includes("approved")) return `Approuvée${plan ? ` (${plan})` : ""}${notes}`
  if (key.includes("rejected")) return `Refusée${notes}`
  if (key.includes("revoked")) return `Révoquée${notes}`
  if (key.includes("suspended")) return `Suspendue${notes}`
  return `${plan}${notes}`
}

function renderUser(key: string, d: Record<string, unknown>): string {
  const target = String(d.userEmail ?? d.userName ?? "")
  switch (key) {
    case "user.suspended":
      return target ? `${target} suspendu` : "Suspendu"
    case "user.reactivated":
      return target ? `${target} réactivé` : "Réactivé"
    case "user.deleted":
      return target ? `${target} supprimé` : (d.hardDelete ? "Supprimé définitivement" : "Supprimé (compte désactivé)")
    case "user.updated": {
      if (Array.isArray(d.changes) && d.changes.length > 0) {
        return `${target} : ${d.changes.join(", ")}`
      }
      return target ? `${target} modifié` : "Modifié"
    }
    case "user.role_changed":
      return `Rôle : ${target}`
    case "user.sessions_revoked":
      return `${d.count ?? ""} session${(d.count as number) > 1 ? "s" : ""} révoquée${(d.count as number) > 1 ? "s" : ""}`
    case "user.banned":
      return [d.reason, d.bannedBy ? `par ${d.bannedBy}` : ""].filter(Boolean).join(" — ")
    case "user.unbanned":
      return "Réhabilité"
    case "user.email_bounced":
      return (d.reason as string) ?? "Rejeté"
    case "user.email_complained":
      return "Plainte spam"
    case "user.email_suppressed":
      return (d.reason as string) ?? "Supprimé"
    case "user.email_changed":
      return d.from && d.to ? `${d.from} → ${d.to}` : "Statut email modifié"
    case "user.exported":
      return "Données exportées"
    default:
      return target || "Modifié"
  }
}

function renderSession(_key: string, d: Record<string, unknown>): string {
  const email = d.email ?? ""
  const reason = d.reason ? ` — ${d.reason}` : ""
  return email ? `${email}${reason}` : reason || "Échec de connexion"
}

function renderSubscription(_key: string, d: Record<string, unknown>): string {
  return `Plan ${d.planId ?? "inconnu"}`
}

function renderSystem(_key: string, d: Record<string, unknown>): string {
  if (Array.isArray(d.targets) && d.targets.length > 0) return `Relance : ${d.targets.join(", ")}`
  if (Array.isArray(d.prefixes) && d.prefixes.length > 0) return `Cache vidé : ${d.prefixes.join(", ")}`
  if (d.count && d.threshold) return `${d.count} emails en attente (seuil ${d.threshold})`
  return ""
}

function renderWebhook(_key: string, d: Record<string, unknown>): string {
  const type = d.type ?? "Événement"
  if (_key.includes("replay_failed")) return d.error ? `Échec : ${d.error}` : "Rejeu échoué"
  if (_key.includes("abandoned")) return d.reason ? `Abandonné : ${d.reason}` : "Abandonné"
  return `${type} rejoué`
}

function renderEmailEvent(_key: string, d: Record<string, unknown>): string {
  return d.originalType ? `Original : ${d.originalType}` : "Rejoué"
}

function renderResendDomain(_key: string, d: Record<string, unknown>): string {
  return (d.domain as string) ?? ""
}

function renderImpersonation(_key: string, user: { name: string; email: string } | null): string {
  return user?.name ?? user?.email ?? "Système"
}

function renderNotification(_key: string, _d: Record<string, unknown>): string {
  return ""
}
