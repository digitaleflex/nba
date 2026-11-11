import { prisma } from "@nba/lib/db"
import { logAuditEvent } from "./audit"
import { invalidatePrefix } from "@nba/lib/cache"

export interface ExpirationResult {
  checked: number
  revoked: number
  byPlan: { planId: string; planName: string; revoked: number }[]
  expired: { id: string; email: string; planName: string; expiresAt: string }[]
}

/**
 * Révoque les `AccessRequest` APPROVED dont la date d'expiration est dépassée.
 * Expiration = (reviewedAt ?? createdAt) + plan.durationDays.
 *
 * Idempotent : ne touche que les statuts APPROVED.
 * Journalise un audit event `access.expire`.
 * Invalide les caches concernés.
 */
export async function expireAccess(opts: {
  triggeredBy?: string
  dryRun?: boolean
  now?: Date
} = {}): Promise<ExpirationResult> {
  const now = opts.now ?? new Date()

  const approved = await prisma.accessRequest.findMany({
    where: { status: "APPROVED" },
    select: {
      id: true,
      createdAt: true,
      reviewedAt: true,
      planId: true,
      plan: { select: { name: true, durationDays: true } },
      user: { select: { email: true } },
    },
  })

  const expiredIds: string[] = []
  const expiredMeta: ExpirationResult["expired"] = []
  const byPlanMap = new Map<string, { planId: string; planName: string; revoked: number }>()

  for (const ar of approved) {
    const start = ar.reviewedAt ?? ar.createdAt
    const expiresAt = new Date(start.getTime() + ar.plan.durationDays * 86_400_000)
    if (expiresAt.getTime() >= now.getTime()) continue
    expiredIds.push(ar.id)
    expiredMeta.push({
      id: ar.id,
      email: ar.user.email,
      planName: ar.plan.name,
      expiresAt: expiresAt.toISOString().slice(0, 10),
    })
    const entry = byPlanMap.get(ar.planId) ?? {
      planId: ar.planId,
      planName: ar.plan.name,
      revoked: 0,
    }
    entry.revoked++
    byPlanMap.set(ar.planId, entry)
  }

  if (!opts.dryRun && expiredIds.length > 0) {
    await prisma.accessRequest.updateMany({
      where: { id: { in: expiredIds }, status: "APPROVED" },
      data: {
        status: "REVOKED",
        reviewedAt: now,
        notes: "Auto-revoke: expiration automatique (durée du plan dépassée)",
      },
    })

    await logAuditEvent({
      userId: opts.triggeredBy,
      action: "access.expire",
      resourceType: "access_request",
      details: {
        checked: approved.length,
        revoked: expiredIds.length,
        byPlan: Array.from(byPlanMap.values()),
      },
    })

    await Promise.all([
      invalidatePrefix("plans"),
      invalidatePrefix("ops"),
      invalidatePrefix("signals:"),
      invalidatePrefix("control-room"),
    ])
  }

  return {
    checked: approved.length,
    revoked: expiredIds.length,
    byPlan: Array.from(byPlanMap.values()),
    expired: expiredMeta,
  }
}
