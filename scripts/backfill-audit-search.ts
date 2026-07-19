import { prisma } from "@nba/lib/db"

async function main() {
  const missing = await prisma.auditLog.count({ where: { searchText: null } })
  if (missing === 0) {
    console.log("✓ Tous les logs ont déjà un searchText")
    return
  }

  console.log(`→ ${missing} logs sans searchText, traitement par lots de 100...`)

  let processed = 0
  while (true) {
    const logs = await prisma.auditLog.findMany({
      where: { searchText: null },
      take: 100,
      select: { id: true, action: true, resourceType: true, details: true },
    })

    if (logs.length === 0) break

    for (const log of logs) {
      const d = log.details as Record<string, unknown> | null
      const parts = [log.action, log.resourceType]
      if (d?.resourceLabel) parts.push(String(d.resourceLabel))
      const searchText = parts.join(" ").toLowerCase()

      await prisma.auditLog.update({
        where: { id: log.id },
        data: { searchText },
      })
    }

    processed += logs.length
    console.log(`  ${processed}/${missing} traités`)
  }

  console.log("✓ Backfill terminé")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
