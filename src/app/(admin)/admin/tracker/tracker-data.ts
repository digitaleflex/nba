import { prisma } from "@nba/lib/db"
import {
  getLatestEventMap,
  getResendStatusMap,
  classifyResendStatus,
  classifyByEventType,
  type ResendEmailStatus,
  type DeliveryBucket,
} from "@nba/lib/services/resend-delivery"
import type { PerUser } from "./types"

export interface SignalAudience {
  id: string
  planIds: string[]
  planNames: string[]
}

/**
 * Charge les destinataires de **plusieurs** signaux en un nombre constant de
 * requêtes (2 + les appels Resend mis en cache), au lieu de 2 par signal.
 *
 * Avant : pour 12 signaux → 24 requêtes Prisma, dont un scan JSONB par signal.
 * Après : 1 requête notifications (OR sur les ids) + 1 requête accessRequests.
 */
export async function loadRecipients(
  signals: SignalAudience[],
): Promise<Map<string, PerUser[]>> {
  const result = new Map<string, PerUser[]>()
  if (signals.length === 0) return result

  const signalIds = signals.map((s) => s.id)

  const notifications = await prisma.notification.findMany({
    where: {
      type: "SIGNAL",
      OR: signalIds.map((id) => ({ data: { path: ["signalId"], equals: id } })),
    },
    select: {
      isRead: true,
      userId: true,
      data: true,
      user: { select: { id: true, email: true, name: true } },
      deliveries: { select: { channel: true, status: true, externalId: true } },
    },
  })

  const userIds = Array.from(new Set(notifications.map((n) => n.userId)))
  const accessRequests =
    userIds.length > 0
      ? await prisma.accessRequest.findMany({
          where: { userId: { in: userIds }, status: "APPROVED" },
          select: { userId: true, planId: true, plan: { select: { name: true } } },
        })
      : []

  // userId -> (planId -> nom du plan)
  const plansByUser = new Map<string, Map<string, string>>()
  for (const ar of accessRequests) {
    const plans = plansByUser.get(ar.userId) ?? new Map<string, string>()
    plans.set(ar.planId, ar.plan.name)
    plansByUser.set(ar.userId, plans)
  }

  // Regroupe les notifications par signalId (une seule passe).
  const bySignal = new Map<string, typeof notifications>()
  for (const n of notifications) {
    const data = n.data as Record<string, unknown> | null
    const signalId = typeof data?.signalId === "string" ? data.signalId : null
    if (!signalId) continue
    const list = bySignal.get(signalId) ?? []
    list.push(n)
    bySignal.set(signalId, list)
  }

  // Un seul lot d'appels Resend pour tous les signaux de la page.
  const allExternalIds: string[] = []
  for (const n of notifications) {
    const email = n.deliveries.find((d) => d.channel === "EMAIL")
    if (email?.externalId) allExternalIds.push(email.externalId)
  }
  const [eventMap, statusMap] = await Promise.all([
    getLatestEventMap(allExternalIds),
    getResendStatusMap(allExternalIds),
  ])

  for (const signal of signals) {
    const list = bySignal.get(signal.id) ?? []
    const perUser: PerUser[] = []

    for (const n of list) {
      const emailDelivery = n.deliveries.find((d) => d.channel === "EMAIL")
      const pushDelivery = n.deliveries.find((d) => d.channel === "PUSH")
      const externalId = emailDelivery?.externalId ?? null

      let plan = ""
      const userPlans = plansByUser.get(n.userId)
      if (userPlans) {
        for (const planId of signal.planIds) {
          const name = userPlans.get(planId)
          if (name) {
            plan = name
            break
          }
        }
        if (!plan) plan = userPlans.values().next().value ?? ""
      }
      if (!plan) plan = signal.planNames.join(", ")

      let bucket: DeliveryBucket
      let event: string | null

      if (!emailDelivery) {
        bucket = "unknown"
        event = "pas d'email"
      } else if (emailDelivery.status === "FAILED") {
        bucket = "failed"
        event = "échec d'envoi"
      } else if (emailDelivery.status === "PENDING" && !externalId) {
        bucket = "pending"
        event = "en file d'envoi"
      } else if (externalId && eventMap.has(externalId)) {
        const evt = eventMap.get(externalId)
        bucket = classifyByEventType(evt)
        event = evt ?? "en attente Resend"
      } else if (externalId) {
        const status: ResendEmailStatus | null = statusMap.get(externalId) ?? null
        bucket = classifyResendStatus(status)
        event = status?.last_event ?? "en attente Resend"
      } else {
        bucket = "pending"
        event = "en attente Resend"
      }

      perUser.push({
        email: n.user?.email ?? "inconnu",
        name: n.user?.name ?? "inconnu",
        externalId,
        hasEmail: Boolean(emailDelivery),
        emailStatus: emailDelivery?.status ?? null,
        emailBucket: bucket,
        emailEvent: event,
        pushStatus: pushDelivery
          ? pushDelivery.status === "SENT"
            ? "envoyé"
            : pushDelivery.status === "FAILED"
              ? "échoué"
              : pushDelivery.status
          : null,
        inAppRead: n.isRead,
        plan: plan || "—",
      })
    }

    result.set(signal.id, perUser)
  }

  return result
}
