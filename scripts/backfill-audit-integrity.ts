import { prisma } from "@nba/lib/db"
import { computeHash } from "@nba/lib/audit/integrity"

async function main() {
  const missing = await prisma.auditLog.count({ where: { hash: null } })
  if (missing === 0) {
    console.log("✓ Tous les logs ont déjà un hash")
    return
  }

  console.log(`→ ${missing} logs sans hash, traitement par lots de 100...`)

  let processed = 0
  let previousHash: string | null = null

  while (true) {
    const logs = await prisma.auditLog.findMany({
      where: { hash: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 100,
    })

    if (logs.length === 0) break

    for (const log of logs) {
      const hash = computeHash({
        previousHash,
        id: log.id,
        userId: log.userId,
        action: log.action,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        details: log.details as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      })

      await prisma.auditLog.update({
        where: { id: log.id },
        data: { hash, previousHash },
      })

      previousHash = hash
    }

    processed += logs.length
    console.log(`  ${processed}/${missing} traités`)
  }

  console.log("✓ Backfill d'intégrité terminé")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
