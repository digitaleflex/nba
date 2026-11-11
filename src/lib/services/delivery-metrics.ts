/**
 * Agrégation des métriques de délivrabilité email.
 *
 * Règles (importantes — elles étaient fausses dans le tracker) :
 * - un email **ouvert** est aussi un email **délivré** (sémantique cumulative) ;
 * - un email **PENDING** n'est **pas** un email envoyé ;
 * - un email **FAILED** n'est **pas** un email envoyé ;
 * - un email délivré, bouncé ou plaint a forcément été envoyé.
 *
 * Résultat : `openRate <= deliveryRate <= 100 %`, quel que soit l'ordre
 * d'arrivée des webhooks Resend.
 */

export type DeliveryBucket =
  | "delivered"
  | "bounced"
  | "complained"
  | "opened"
  | "pending"
  | "failed"
  | "unknown"

export interface DeliveryMetrics {
  /** Emails réellement remis à Resend (dénominateur des taux). */
  sent: number
  /** Délivrés — inclut les ouverts et les plaintes. */
  delivered: number
  opened: number
  bounced: number
  complained: number
  /** En file d'envoi, pas encore remis à Resend. */
  pending: number
  failed: number
  /** Remis à Resend mais sans événement exploitable. */
  unknown: number
}

export interface DeliverySubject {
  /** Un email a-t-il été planifié pour ce destinataire ? */
  hasEmail: boolean
  /** Statut de la `NotificationDelivery` : PENDING | SENT | FAILED | BOUNCED. */
  dbStatus: string | null
  /** Identifiant Resend — présent si Resend a accepté l'email. */
  externalId: string | null
  /** Bucket déduit des événements Resend. */
  bucket: DeliveryBucket
}

export function emptyDeliveryMetrics(): DeliveryMetrics {
  return {
    sent: 0,
    delivered: 0,
    opened: 0,
    bounced: 0,
    complained: 0,
    pending: 0,
    failed: 0,
    unknown: 0,
  }
}

/**
 * Ajoute un destinataire aux compteurs.
 * Fonction pure : ne mute que l'objet `target` passé en argument.
 */
export function addDeliveryMetrics(target: DeliveryMetrics, subject: DeliverySubject): void {
  if (!subject.hasEmail) return

  // Un échec d'envoi n'est jamais un email envoyé.
  if (subject.dbStatus === "FAILED") {
    target.failed++
    return
  }

  const acceptedByResend =
    Boolean(subject.externalId) ||
    subject.dbStatus === "SENT" ||
    subject.dbStatus === "BOUNCED"

  // PENDING sans externalId : jamais remis à Resend → pas « envoyé ».
  if (!acceptedByResend) {
    target.pending++
    return
  }

  target.sent++

  switch (subject.bucket) {
    case "delivered":
      target.delivered++
      break
    case "opened":
      // Un email ouvert a forcément été délivré.
      target.delivered++
      target.opened++
      break
    case "complained":
      // Une plainte implique une délivrance.
      target.delivered++
      target.complained++
      break
    case "bounced":
      target.bounced++
      break
    case "pending":
      target.pending++
      break
    case "failed":
      target.failed++
      break
    case "unknown":
      target.unknown++
      break
  }
}

export interface DeliveryRates {
  deliveryRate: number
  openRate: number
  bounceRate: number
  complaintRate: number
}

function percent(part: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

/**
 * Taux dérivés des compteurs. `openRate` est calculé sur les **délivrés**
 * (et non sur les envoyés) : le taux d'ouverture ne peut donc pas dépasser 100 %.
 */
export function computeDeliveryRates(
  metrics: Pick<DeliveryMetrics, "sent" | "delivered" | "opened" | "bounced" | "complained">,
): DeliveryRates {
  return {
    deliveryRate: percent(metrics.delivered, metrics.sent),
    openRate: percent(metrics.opened, metrics.delivered),
    bounceRate: percent(metrics.bounced, metrics.sent),
    complaintRate: percent(metrics.complained, metrics.sent),
  }
}
