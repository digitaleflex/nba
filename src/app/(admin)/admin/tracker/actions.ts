"use server"

import { requireRole } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"
import { loadRecipients } from "./tracker-data"
import type { PerUser } from "./types"

/**
 * Charge à la demande les destinataires d'un signal (au dépliage d'une ligne).
 * Évite d'envoyer des milliers de lignes à chaque rafraîchissement (10 s).
 */
export async function loadSignalRecipients(signalId: string): Promise<PerUser[]> {
  await requireRole(["ADMIN", "SUPER_ADMIN"])

  const signal = await prisma.signal.findUnique({
    where: { id: signalId },
    select: {
      id: true,
      audience: { select: { plan: { select: { id: true, name: true } } } },
    },
  })

  if (!signal) return []

  const map = await loadRecipients([
    {
      id: signal.id,
      planIds: signal.audience.map((a) => a.plan.id),
      planNames: signal.audience.map((a) => a.plan.name),
    },
  ])

  return map.get(signal.id) ?? []
}
