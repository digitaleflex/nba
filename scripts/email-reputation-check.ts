import "dotenv/config"
import { prisma } from "../src/lib/db"
import { sendEmail } from "../src/lib/email"
import { logAuditEvent } from "../src/lib/services/audit"

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

// Seuils d'alerte (standard de l'industrie email)
const BOUNCE_THRESHOLD_DANGER = 5.0 // %
const COMPLAINT_THRESHOLD_DANGER = 0.1 // %
const BOUNCE_THRESHOLD_WARN = 2.0 // %

interface WindowStats {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  failed: number
  bounceRate: number
  complaintRate: number
  openRate: number
  clickRate: number
}

async function computeWindow(since: Date): Promise<WindowStats> {
  const [sent, delivered, opened, clicked, bounced, complained, failed] = await Promise.all([
    prisma.emailEvent.count({ where: { type: "email.sent", createdAt: { gte: since } } }),
    prisma.emailEvent.count({ where: { type: "email.delivered", createdAt: { gte: since } } }),
    prisma.emailEvent.count({ where: { type: "email.opened", createdAt: { gte: since } } }),
    prisma.emailEvent.count({ where: { type: "email.clicked", createdAt: { gte: since } } }),
    prisma.emailEvent.count({ where: { type: "email.bounced", createdAt: { gte: since } } }),
    prisma.emailEvent.count({ where: { type: "email.complained", createdAt: { gte: since } } }),
    prisma.emailEvent.count({ where: { type: "email.failed", createdAt: { gte: since } } }),
  ])
  const round = (n: number) => Math.round(n * 10) / 10
  return {
    sent,
    delivered,
    opened,
    clicked,
    bounced,
    complained,
    failed,
    bounceRate: sent > 0 ? round((bounced / sent) * 100) : 0,
    complaintRate: sent > 0 ? round((complained / sent) * 100) : 0,
    openRate: sent > 0 ? round((opened / sent) * 100) : 0,
    clickRate: sent > 0 ? round((clicked / sent) * 100) : 0,
  }
}

function alertLevel(w: WindowStats): "ok" | "warn" | "danger" {
  if (w.bounceRate >= BOUNCE_THRESHOLD_DANGER || w.complaintRate >= COMPLAINT_THRESHOLD_DANGER)
    return "danger"
  if (w.bounceRate >= BOUNCE_THRESHOLD_WARN) return "warn"
  return "ok"
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  console.log(`[email-reputation-check] ${dryRun ? "DRY RUN" : "RUN"}`)

  const [w24, w7, w30] = await Promise.all([
    computeWindow(last24h),
    computeWindow(last7d),
    computeWindow(last30d),
  ])

  const level24 = alertLevel(w24)

  console.log(`[email-reputation-check] 24h: bounce=${w24.bounceRate}% complaint=${w24.complaintRate}% open=${w24.openRate}% (level=${level24})`)
  console.log(`[email-reputation-check] 7j:  bounce=${w7.bounceRate}% complaint=${w7.complaintRate}%`)
  console.log(`[email-reputation-check] 30j: bounce=${w30.bounceRate}% complaint=${w30.complaintRate}%`)

  // Persist l'historique (3 lignes par date : 24h, 7d, 30d)
  if (!dryRun) {
    for (const [window, w] of [["24h", w24], ["7d", w7], ["30d", w30]] as const) {
      const level = window === "24h" ? level24 : alertLevel(w)
      const existing = await prisma.emailReputationHistory.findFirst({
        where: { date: today, window },
      })
      if (existing) {
        await prisma.emailReputationHistory.update({
          where: { id: existing.id },
          data: { ...w, alertLevel: level },
        })
      } else {
        await prisma.emailReputationHistory.create({
          data: { date: today, window, ...w, alertLevel: level },
        })
      }
    }
  }

  // Detection de tendance (bounce en hausse sur 3 jours consecutifs)
  let trendDanger = false
  if (!dryRun) {
    const last3 = await prisma.emailReputationHistory.findMany({
      where: { window: "24h" },
      orderBy: { date: "desc" },
      take: 3,
      select: { date: true, bounceRate: true },
    })
    if (last3.length === 3) {
      const sorted = last3.sort((a, b) => a.date.getTime() - b.date.getTime())
      if (
        sorted[0].bounceRate > 0 &&
        sorted[1].bounceRate > sorted[0].bounceRate &&
        sorted[2].bounceRate > sorted[1].bounceRate
      ) {
        trendDanger = true
      }
    }
  }

  // Alerte admin
  if (level24 !== "ok" || trendDanger) {
    const reason = trendDanger
      ? "Tendance bounce en hausse sur 3 jours consecutifs"
      : level24 === "danger"
        ? `Bounce rate 24h = ${w24.bounceRate}% (seuil danger: ${BOUNCE_THRESHOLD_DANGER}%) ou complaint rate = ${w24.complaintRate}% (seuil: ${COMPLAINT_THRESHOLD_DANGER}%)`
        : `Bounce rate 24h = ${w24.bounceRate}% (seuil warning: ${BOUNCE_THRESHOLD_WARN}%)`

    const subject = `🚨 [${level24.toUpperCase()}] Reputation email degradee - ${reason}`

    const html = `<h1 style="color:#dc2626">🚨 Reputation email degradee</h1>
<p><strong>${reason}</strong></p>

<h2>24h</h2>
<table border="1" cellpadding="6" style="border-collapse:collapse">
<tr><th>Sent</th><th>Delivered</th><th>Bounced</th><th>Complained</th><th>Failed</th></tr>
<tr>
  <td>${w24.sent}</td>
  <td>${w24.delivered}</td>
  <td style="color:${w24.bounceRate >= BOUNCE_THRESHOLD_DANGER ? "#dc2626" : w24.bounceRate >= BOUNCE_THRESHOLD_WARN ? "#d97706" : "inherit"}"><strong>${w24.bounced} (${w24.bounceRate}%)</strong></td>
  <td style="color:${w24.complaintRate >= COMPLAINT_THRESHOLD_DANGER ? "#dc2626" : "inherit"}"><strong>${w24.complained} (${w24.complaintRate}%)</strong></td>
  <td>${w24.failed}</td>
</tr>
</table>

<h2>Comparaison</h2>
<table border="1" cellpadding="6" style="border-collapse:collapse">
<tr><th>Periode</th><th>Bounce</th><th>Complaint</th><th>Open</th><th>Click</th></tr>
<tr><td>24h</td><td><strong>${w24.bounceRate}%</strong></td><td>${w24.complaintRate}%</td><td>${w24.openRate}%</td><td>${w24.clickRate}%</td></tr>
<tr><td>7j</td><td>${w7.bounceRate}%</td><td>${w7.complaintRate}%</td><td>${w7.openRate}%</td><td>${w7.clickRate}%</td></tr>
<tr><td>30j</td><td>${w30.bounceRate}%</td><td>${w30.complaintRate}%</td><td>${w30.openRate}%</td><td>${w30.clickRate}%</td></tr>
</table>

<p><a href="https://access.signauxx.com/admin/control-room">Centre de controle</a></p>
<p>Si la reputation continue a degrader, Resend peut blacklister le domaine expediteur.</p>`

    if (!dryRun) {
      await sendEmail(ADMIN_EMAIL, { subject, html })
      console.log(`[email-reputation-check] Alerte envoyee (${level24}, trend=${trendDanger})`)
    } else {
      console.log(`[email-reputation-check] Alerte aurait ete envoyee (${level24}, trend=${trendDanger})`)
    }
  } else {
    console.log(`[email-reputation-check] Aucune alerte (reputation OK).`)
  }

  if (!dryRun) {
    await logAuditEvent({
      action: "email.reputation_check",
      resourceType: "system",
      details: {
        w24,
        w7,
        w30,
        level24,
        trendDanger,
        alerted: level24 !== "ok" || trendDanger,
      },
    })
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("[email-reputation-check] ERREUR:", err)
  process.exit(1)
})
