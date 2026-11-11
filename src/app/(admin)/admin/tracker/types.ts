/**
 * Types partagés entre le serveur (page + loader) et le client (tableau).
 * Ce fichier ne doit importer **aucun** module serveur : il est bundlé côté client.
 */

export interface PerUser {
  email: string
  name: string
  externalId: string | null
  emailBucket: string
  emailEvent: string | null
  /** Un email a-t-il été planifié pour ce destinataire ? */
  hasEmail: boolean
  /** Statut DB de la NotificationDelivery (PENDING/SENT/FAILED/BOUNCED). */
  emailStatus: string | null
  pushStatus: string | null
  inAppRead: boolean
  plan: string
}

export interface SignalRow {
  id: string
  title: string
  content: string
  author: string
  publishedAt: Date | string | null
  plans: string
  planBreakdown: { name: string; count: number }[]
  hasImages: boolean
  recipients: number
  inAppRead: number
  emailsSent: number
  delivered: number
  bounced: number
  complained: number
  opened: number
  pending: number
  failed: number
  unknown: number
  pushSent: number
  pushFailed: number
  /** Nombre de destinataires — les détails sont chargés à l'ouverture. */
  perUserCount: number
}

export interface UserSignalCompact {
  signalId: string
  signalTitle: string
  publishedAt: string
  plans: string
  plan: string
  emailBucket: string
  emailEvent: string | null
  pushStatus: string | null
  inAppRead: boolean
}
