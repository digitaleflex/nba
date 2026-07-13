import { prisma } from "@nba/lib/db"
import { logAuditEvent } from "./audit"
import { invalidatePrefix } from "@nba/lib/cache"

export interface GhostCleanupResult {
  usersAffected: number
  accessRequestsRevoked: number
  byPlan: { planId: string; planName: string; revoked: number }[]
  ghostUsers: { id: string; email: string; name: string; reason: string }[]
}

/**
 * Révoque tous les `AccessRequest` APPROVED des utilisateurs "fantômes" :
 *   - isActive = false
 *   - OU deletedAt != null
 *
 * Ces accès approuvés ne sont plus jamais utilisés (la distribution filtre
 * par deletedAt:null + isActive:true) mais ils font gonfler les compteurs
 * affichés dans l'UI admin (badges, estimate, dashboard).
 *
 * Idempotent : ne touche que les statuts APPROVED.
 * Journalise un audit event.
 * Invalide les caches concernés.
 */
export async function cleanupGhostAccess(opts: {
  triggeredBy?: string
  dryRun?: boolean
} = {}): Promise<GhostCleanupResult> {
  const ghosts = await prisma.user.findMany({
    where: {
      OR: [{ isActive: false }, { deletedAt: { not: null } }],
      accessRequests: { some: { status: "APPROVED" } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      deletedAt: true,
      accessRequests: {
        where: { status: "APPROVED" },
        select: { id: true, planId: true, plan: { select: { name: true } } },
      },
    },
  })

  const requestIds = ghosts.flatMap((u) => u.accessRequests.map((ar) => ar.id))
  const byPlanMap = new Map<string, { planId: string; planName: string; revoked: number }>()

  for (const u of ghosts) {
    for (const ar of u.accessRequests) {
      const entry = byPlanMap.get(ar.planId) ?? {
        planId: ar.planId,
        planName: ar.plan.name,
        revoked: 0,
      }
      entry.revoked++
      byPlanMap.set(ar.planId, entry)
    }
  }

  if (!opts.dryRun && requestIds.length > 0) {
    await prisma.accessRequest.updateMany({
      where: { id: { in: requestIds } },
      data: {
        status: "REVOKED",
        reviewedAt: new Date(),
        notes: "Auto-revoke: utilisateur inactif ou supprimé (cleanup fantômes)",
      },
    })

    await logAuditEvent({
      userId: opts.triggeredBy,
      action: "access.cleanup_ghosts",
      resourceType: "access_request",
      details: {
        usersAffected: ghosts.length,
        accessRequestsRevoked: requestIds.length,
        byPlan: Array.from(byPlanMap.values()),
      },
    })

    // Invalider les caches qui dépendent des comptes destinataires
    await Promise.all([
      invalidatePrefix("plans"),
      invalidatePrefix("ops"),
      invalidatePrefix("signals:"),
      invalidatePrefix("control-room"),
    ])
  }

  const result: GhostCleanupResult = {
    usersAffected: ghosts.length,
    accessRequestsRevoked: requestIds.length,
    byPlan: Array.from(byPlanMap.values()),
    ghostUsers: ghosts.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      reason: !u.isActive
        ? "inactif"
        : u.deletedAt
          ? `supprimé le ${u.deletedAt.toISOString().slice(0, 10)}`
          : "inactif",
    })),
  }

  return result
}
