import type { PrismaClient } from "@nba/generated/prisma/client"

/**
 * Recalcule les streaks WIN_STREAK / LOSS_STREAK à partir de l'historique
 * complet des trades (hors soft-delete) d'un utilisateur.
 *
 * Sémantique d'une « streak » = série CONSÉCUTIVE de résultats identiques en
 * partant du trade le plus récent. Un BREAKEVEN (ou un résultat différent)
 * casse la série. `count` = streak courante, `bestCount` = meilleure série
 * jamais atteinte.
 *
 * Le recalcul complet depuis l'historique est O(n) mais robuste quel que soit
 * l'ordre d'insertion / la modification / la suppression d'un trade (contrairement
 * à un incrément « à la volée » qui ne gérait pas la remise à zéro).
 */
export async function recomputeResultStreaks(db: PrismaClient, userId: string): Promise<void> {
  const trades = await db.trade.findMany({
    where: { userId, deletedAt: null },
    orderBy: { tradedAt: "desc" },
    select: { result: true },
  })

  // Streak courante (à partir du trade le plus récent)
  let currentWin = 0
  let currentLoss = 0
  if (trades.length > 0) {
    const first = trades[0].result
    if (first === "WIN") {
      for (const t of trades) { if (t.result === "WIN") currentWin++; else break }
    } else if (first === "LOSS") {
      for (const t of trades) { if (t.result === "LOSS") currentLoss++; else break }
    }
  }

  // Meilleures séries sur tout l'historique
  let bestWin = 0
  let bestLoss = 0
  let runWin = 0
  let runLoss = 0
  for (const t of trades) {
    if (t.result === "WIN") {
      runWin++
      runLoss = 0
      if (runWin > bestWin) bestWin = runWin
    } else if (t.result === "LOSS") {
      runLoss++
      runWin = 0
      if (runLoss > bestLoss) bestLoss = runLoss
    } else {
      runWin = 0
      runLoss = 0
    }
  }

  await upsertStreak(db, userId, "WIN_STREAK", currentWin, bestWin)
  await upsertStreak(db, userId, "LOSS_STREAK", currentLoss, bestLoss)
}

async function upsertStreak(
  db: PrismaClient,
  userId: string,
  type: "WIN_STREAK" | "LOSS_STREAK",
  count: number,
  best: number,
) {
  const existing = await db.streak.findUnique({ where: { userId_type: { userId, type } } })
  if (existing) {
    await db.streak.update({
      where: { userId_type: { userId, type } },
      data: { count, bestCount: best > existing.bestCount ? best : existing.bestCount },
    })
  } else if (count > 0 || best > 0) {
    await db.streak.create({ data: { userId, type, count, bestCount: best } })
  }
}
