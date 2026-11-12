// src/lib/labels.ts
// Mappage des valeurs d'enums brutes vers des libellés français lisibles.

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Administrateur",
  ADMIN: "Administrateur",
  USER: "Utilisateur",
  MEMBER: "Membre",
}

export const ONBOARDING_STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Inscrit (non onboardé)",
  PAYMENT_PENDING: "Paiement en attente",
  PAYMENT_CONFIRMED: "Paiement confirmé",
  KYC_PENDING: "KYC en attente",
  KYC_APPROVED: "KYC approuvé",
  BROKER_PENDING: "Broker en attente",
  BROKER_APPROVED: "Broker approuvé",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  PENDING_EMAIL: "E-mail en attente",
  PROFILE_INCOMPLETE: "Profil incomplet",
  REVIEW_PENDING: "En revue",
  COMPLETED: "Terminé",
  IN_PROGRESS: "En cours",
  PENDING: "En attente",
}

export const ACCESS_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  SUSPENDED: "Suspendu",
  REVOKED: "Révoqué",
}

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  EXPIRED: "Expiré",
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  ID_CARD: "Carte d'identité",
  PASSPORT: "Passeport",
  DRIVERS_LICENSE: "Permis de conduire",
}

export const SIGNAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publié",
  ARCHIVED: "Archivé",
}

export const DLQ_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  REPLAYED: "Rejoué",
  ABANDONED: "Abandonné",
}

export const EMAIL_STATUS_LABELS: Record<string, string> = {
  OK: "OK",
  BOUNCED: "Rejeté",
  COMPLAINED: "Plainte spam",
  SUPPRESSED: "Supprimé",
  INVALID: "Invalide",
}

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SENT: "Envoyé",
  FAILED: "Échoué",
  BOUNCED: "Rebondi",
  SKIPPED: "Ignoré",
}

export const NOTIFICATION_CHANNEL_LABELS: Record<string, string> = {
  IN_APP: "Dans l'app",
  EMAIL: "E-mail",
  TELEGRAM: "Telegram",
  PUSH: "Push",
  WHATSAPP: "WhatsApp",
}

export const TRADE_RESULT_LABELS: Record<string, string> = {
  WIN: "Gagné",
  LOSS: "Perdu",
  BREAKEVEN: "Neutre",
}

export const ENUM_LABELS: Record<string, string> = {
  ...ROLE_LABELS,
  ...ONBOARDING_STATUS_LABELS,
  ...ACCESS_STATUS_LABELS,
  ...VERIFICATION_STATUS_LABELS,
  ...DOCUMENT_TYPE_LABELS,
  ...SIGNAL_STATUS_LABELS,
  ...DLQ_STATUS_LABELS,
  ...EMAIL_STATUS_LABELS,
  ...DELIVERY_STATUS_LABELS,
  ...NOTIFICATION_CHANNEL_LABELS,
  ...TRADE_RESULT_LABELS,
}

export function getLabel(value: string | null | undefined): string {
  if (value == null) return "—"
  return ENUM_LABELS[value] ?? value
}

export function labelFor(value: string | null | undefined): string {
  return getLabel(value)
}

export function enumLabel(value: string | null | undefined): string {
  return getLabel(value)
}

export function humanizeEnum(value: string | null | undefined): string {
  return getLabel(value)
}

export function getEnumLabel(value: string | null | undefined): string {
  return getLabel(value)
}

export default ENUM_LABELS