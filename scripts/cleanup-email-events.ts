import "dotenv/config"
import { prisma } from "../src/lib/db"
import { logAuditEvent } from "../src/lib/services/audit"

const RETENTION_MONTHS = 6

interface MonthBucket {
  year: number
  month: number
  totalEvents: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  deliveryDelayed: number
  suppressed: number
}

/**
 * Cron de retention email_events (RGPD + perf) :
 *  - Agrege les events > 6 mois dans email_stats_monthly (par mois)
 *  - Supprime les email_events aggregees
 *  - Idempotent : ne re-agrege pas un mois deja traite
 *
 * Usage:
 *   npx tsx scripts/cleanup-email-events.ts            # run
 *   npx tsx scripts/cleanup-email-events.ts --dry-run  # preview sans delete
 *   npx tsx scripts/cleanup-email-events.ts --retention-months=12
 *
 * Cron suggere (hebdo, dimanche 4h):
 *   0 4 * * 0 cd /home/audest/nba && npx tsx scripts/cleanup-email-events.ts >> /var/log/nba-email-gdpr.log 2>&1
 */
async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const retentionArg = process.argv
    .find((a) => a.startsWith("--retention-months="))
    ?.split("=")[1]
  const retentionMonths = retentionArg ? Number(retentionArg) : RETENTION_MONTHS

  console.log(
    `[cleanup-email-events] ${dryRun ? "DRY RUN" : "RUN"} - retention=${retentionMonths} mois`,
  )

  // Cutoff = il y a N mois (1er du mois)
  const now = new Date()
  const cutoff = new Date(now.getFullYear(), now.getMonth() - retentionMonths, 1)
  console.log(`[cleanup-email-events] Cutoff: < ${cutoff.toISOString()}`)

  // Lister les mois concernes
  const oldest = await prisma.emailEvent.findFirst({
    where: { createdAt: { lt: cutoff } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  })
  if (!oldest) {
    console.log("[cleanup-email-events] Rien a nettoyer (tous < retention).")
    process.exit(0)
  }
  console.log(`[cleanup-email-events] Plus ancien event: ${oldest.createdAt.toISOString()}`)

  // Pour chaque mois complet < cutoff : agreger + supprimer
  let totalDeleted = 0
  let monthsProcessed = 0

  const cursor = new Date(oldest.createdAt.getFullYear(), oldest.createdAt.getMonth(), 1)
  while (cursor < cutoff) {
    const monthStart = new Date(cursor)
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    const label = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`

    // Verifier si deja agrege
    const existing = await prisma.emailStatsMonthly.findUnique({
      where: {
        year_month: { year: cursor.getFullYear(), month: cursor.getMonth() + 1 },
      },
    })

    if (existing) {
      // Deja fait -> juste supprimer les events de ce mois
      if (!dryRun) {
        const del = await prisma.emailEvent.deleteMany({
          where: { createdAt: { gte: monthStart, lt: monthEnd } },
        })
        totalDeleted += del.count
        console.log(`  ${label}: deja agrege -> ${del.count} event(s) supprime(s)`)
      } else {
        const c = await prisma.emailEvent.count({
          where: { createdAt: { gte: monthStart, lt: monthEnd } },
        })
        console.log(`  ${label}: deja agrege, ${c} event(s) a supprimer (dry-run)`)
      }
    } else {
      // Pas encore agrege -> calculer + inserer + supprimer
      const events = await prisma.emailEvent.findMany({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
        select: { type: true },
      })

      if (events.length > 0) {
        const bucket = aggregateMonth(events)
        bucket.year = cursor.getFullYear()
        bucket.month = cursor.getMonth() + 1

        if (!dryRun) {
          await prisma.emailStatsMonthly.create({ data: bucket })
          const del = await prisma.emailEvent.deleteMany({
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
          })
          totalDeleted += del.count
          monthsProcessed++
          console.log(
            `  ${label}: agrege (${events.length} events, delivered=${bucket.delivered} opened=${bucket.opened} clicked=${bucket.clicked} bounced=${bucket.bounced}) + supprime`,
          )
        } else {
          console.log(
            `  ${label}: a agreger (${events.length} events, delivered=${bucket.delivered} opened=${bucket.opened} clicked=${bucket.clicked} bounced=${bucket.bounced}) (dry-run)`,
          )
          monthsProcessed++
        }
      } else {
        console.log(`  ${label}: 0 event, skip`)
      }
    }

    cursor.setMonth(cursor.getMonth() + 1)
  }

  console.log(
    `[cleanup-email-events] Termine. ${monthsProcessed} mois traite(s), ${totalDeleted} event(s) supprime(s).`,
  )

  if (!dryRun && (monthsProcessed > 0 || totalDeleted > 0)) {
    await logAuditEvent({
      action: "email.events_cleanup_gdpr",
      resourceType: "email_event",
      details: {
        retentionMonths,
        cutoff: cutoff.toISOString(),
        monthsProcessed,
        eventsDeleted: totalDeleted,
      },
    })
  }

  process.exit(0)
}

function aggregateMonth(events: { type: string }[]): MonthBucket {
  const b: MonthBucket = {
    year: 0,
    month: 0,
    totalEvents: events.length,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    complained: 0,
    failed: 0,
    deliveryDelayed: 0,
    suppressed: 0,
  }
  for (const e of events) {
    switch (e.type) {
      case "email.delivered": b.delivered++; break
      case "email.opened": b.opened++; break
      case "email.clicked": b.clicked++; break
      case "email.bounced": b.bounced++; break
      case "email.complained": b.complained++; break
      case "email.failed": b.failed++; break
      case "email.delivery_delayed": b.deliveryDelayed++; break
      case "email.suppressed": b.suppressed++; break
    }
  }
  b.openRate = b.delivered > 0 ? Math.round((b.opened / b.delivered) * 1000) / 10 : 0
  b.clickRate = b.delivered > 0 ? Math.round((b.clicked / b.delivered) * 1000) / 10 : 0
  b.bounceRate = b.delivered > 0 ? Math.round((b.bounced / b.delivered) * 1000) / 10 : 0
  return b
}

main().catch((err) => {
  console.error("[cleanup-email-events] ERREUR:", err)
  process.exit(1)
})
