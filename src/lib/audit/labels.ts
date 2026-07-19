import {
  Activity, Ban, Bell, BookOpen, CheckCircle, Clock, Copy, CreditCard,
  Database, Download, Edit, Eye, FileWarning, Globe, Key, LogIn, LogOut,
  Mail, MessageSquare, PauseCircle, PlusCircle, RefreshCw, ShieldAlert,
  SlidersHorizontal, Trash2, Upload, UserCheck, UserMinus, UserX,
  Users, Webhook, XCircle, type LucideIcon,
} from "lucide-react"
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
  webhook_dlq: "File d'attente webhook",
  email_event: "Événement email",
}

export const RESOURCE_ICONS: Record<string, LucideIcon> = {
  access_request: Key,
  signal: Activity,
  user: Users,
  kyc_document: BookOpen,
  broker_verification: ShieldAlert,
  subscription: CreditCard,
  system: Database,
  notification: Bell,
  session: LogIn,
  role: UserCheck,
  email: Mail,
  settings: SlidersHorizontal,
  resend_domain: Globe,
  webhook_dlq: Webhook,
  email_event: Mail,
}

export function getResourceLabel(resourceType: string): string {
  return RESOURCE_LABELS[resourceType] ?? resourceType
}

export function getResourceIcon(resourceType: string): LucideIcon {
  const key = normalizeAction(resourceType).split(".")[0] ?? resourceType
  return RESOURCE_ICONS[key] ?? Activity
}

export function getActionLabel(action: string): string {
  const key = normalizeAction(action)
  return ACTION_LABELS[key] ?? key
}

export function getActionIcon(action: string): LucideIcon {
  const key = normalizeAction(action)
  if (key.includes("created") || key.includes("registered")) return PlusCircle
  if (key.includes("published") || key.includes("distribution")) return Upload
  if (key.includes("updated") || key.includes("changed") || key.includes("modified")) return Edit
  if (key.includes("deleted") || key.includes("removed")) return Trash2
  if (key.includes("duplicated") || key.includes("copied")) return Copy
  if (key.includes("approved")) return CheckCircle
  if (key.includes("rejected") || key.includes("refused")) return XCircle
  if (key.includes("revoked") || key.includes("suspended")) return PauseCircle
  if (key.includes("started")) return LogIn
  if (key.includes("stopped")) return LogOut
  if (key.includes("banned") || key.includes("suspended")) return Ban
  if (key.includes("unbanned") || key.includes("reactivated")) return UserCheck
  if (key.includes("rehabilité")) return UserCheck
  if (key.includes("bounced") || key.includes("complained") || key.includes("suppressed")) return Mail
  if (key.includes("sent")) return Bell
  if (key.includes("retried") || key.includes("replayed")) return RefreshCw
  if (key.includes("purged")) return Trash2
  if (key.includes("exported")) return Download
  if (key.includes("login")) return LogIn
  if (key.includes("failed") || key.includes("error")) return XCircle
  if (key.includes("abandoned")) return FileWarning
  if (key.includes("reselect") || key.includes("reselect")) return RefreshCw
  if (key.includes("impersonation")) return Eye
  if (key.includes("queue")) return Clock
  if (key.includes("notification")) return Bell
  if (key.includes("override")) return SlidersHorizontal
  return Activity
}

const ACTION_LABELS: Record<string, string> = {
  "signal.created": "Signal créé",
  "signal.published": "Signal publié",
  "signal.updated": "Signal modifié",
  "signal.deleted": "Signal supprimé",
  "signal.duplicated": "Signal dupliqué",
  "signal.scheduled": "Signal programmé",
  "signal.distribution": "Distribution envoyée",
  "signal.override_on": "Forçage activé",
  "signal.override_off": "Forçage désactivé",
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
  "user.sessions_revoked": "Connexions révoquées",
  "user.banned": "Utilisateur banni",
  "user.unbanned": "Utilisateur réhabilité",
  "user.email_bounced": "Email rejeté",
  "user.email_complained": "Plainte spam",
  "user.email_suppressed": "Email supprimé",
  "user.email_changed": "Statut email modifié",
  "user.exported": "Données exportées",
  "user.registered": "Inscription",
  "user.messages_read": "Messages marqués lus",
  "user.realtime_reset": "Connexion réinitialisée",
  "session.login": "Connexion",
  "session.login_failed": "Échec de connexion",
  "impersonation.started": "Emprunt d'identité commencé",
  "impersonation.stopped": "Emprunt d'identité terminé",
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
