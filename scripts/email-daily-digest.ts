import "dotenv/config"
import { prisma } from "../src/lib/db"
import { sendEmail } from "../src/lib/email"
import { logAuditEvent } from "../src/lib/services/audit"

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

// Toggle via env var
const ENABLED = process.env.DIGEST_ENABLED !== "false"

interface DigestData {
  period: { from: string; to: string }
  email: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    failed: number
    delayed: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
  push: { sent: number; failed: number }
  signals: { id: string; content: string; publishedAt: string; recipientCount: number }[]
  topMembers: { email: string; name: string; notifications: number }[]
  alerts: { level: "warn" | "danger"; message: string }[]
  bounceRate: number
  openRate: number
}

async function buildDigest(): Promise<DigestData> {
  const now = new Date()
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Email KPIs (24h) via agrégation email_events
  const [sent, delivered, opened, clicked, bounced, complained, failed, delayed] =
    await Promise.all([
      prisma.emailEvent.count({ where: { type: "email.sent", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({ where: { type: "email.delivered", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({ where: { type: "email.opened", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({ where: { type: "email.clicked", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({ where: { type: "email.bounced", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({ where: { type: "email.complained", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({ where: { type: "email.failed", createdAt: { gte: last24h } } }),
      prisma.emailEvent.count({
        where: { type: "email.delivery_delayed", createdAt: { gte: last24h } },
      }),
    ])

  // Push KPIs (24h)
  const [pushSent, pushFailed] = await Promise.all([
    prisma.notificationDelivery.count({
      where: { channel: "PUSH", status: "SENT", createdAt: { gte: last24h } },
    }),
    prisma.notificationDelivery.count({
      where: { channel: "PUSH", status: "FAILED", createdAt: { gte: last24h } },
    }),
  ])

  // Top 3 signaux (publies 24h) avec nb destinataires
  const recentSignalsRaw = await prisma.signal.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: last24h } },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: { id: true, content: true, publishedAt: true },
  })
  // Compter les notifications par signal (signalId est dans data JSONB)
  const notifCountBySignal = new Map<string, number>()
  if (recentSignalsRaw.length > 0) {
    const signalIds = recentSignalsRaw.map((s) => s.id)
    const rows = await prisma.$queryRaw<{ signal_id: string; cnt: bigint }[]>`
      SELECT data->>'signalId' as signal_id, COUNT(*) as cnt
      FROM "notifications"
      WHERE type = 'SIGNAL'
        AND data->>'signalId' = ANY(${signalIds}::text[])
      GROUP BY data->>'signalId'
    `
    for (const r of rows) {
      notifCountBySignal.set(r.signal_id, Number(r.cnt))
    }
  }

  // Top 3 membres actifs (plus de notifications SIGNAL recues 24h)
  const topMembersAgg = await prisma.notification.groupBy({
    by: ["userId"],
    where: { type: "SIGNAL", createdAt: { gte: last24h } },
    _count: true,
    orderBy: { _count: { userId: "desc" } },
    take: 3,
  })
  const topUserIds = topMembersAgg.map((m) => m.userId)
  const topUsers = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, email: true, name: true },
  })
  const topMembers = topMembersAgg.map((m) => {
    const u = topUsers.find((x) => x.id === m.userId)
    return { email: u?.email ?? "?", name: u?.name ?? "?", notifications: m._count }
  })

  // Alertes
  const alerts: { level: "warn" | "danger"; message: string }[] = []
  if (bounced > 0) alerts.push({ level: "danger", message: `${bounced} bounce(s) email sur 24h` })
  if (complained > 0)
    alerts.push({ level: "danger", message: `${complained} plainte(s) email sur 24h` })
  if (failed > 0) alerts.push({ level: "warn", message: `${failed} echec(s) d'envoi sur 24h` })
  if (delayed > 10)
    alerts.push({ level: "warn", message: `${delayed} emails en retard de livraison` })

  const openRate = sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0
  const clickRate = sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0
  const bounceRate = sent > 0 ? Math.round((bounced / sent) * 1000) / 10 : 0

  return {
    period: { from: last24h.toISOString(), to: now.toISOString() },
    email: {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      delayed,
      openRate,
      clickRate,
      bounceRate,
    },
    push: { sent: pushSent, failed: pushFailed },
    signals: recentSignalsRaw.map((s) => ({
      id: s.id,
      content: s.content,
      publishedAt: s.publishedAt?.toISOString() ?? "",
      recipientCount: notifCountBySignal.get(s.id) ?? 0,
    })),
    topMembers,
    alerts,
    bounceRate,
    openRate,
  }
}

function htmlEscape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderHtml(d: DigestData): string {
  const alertColor = (level: "warn" | "danger") =>
    level === "danger" ? "#dc2626" : "#d97706"
  const alertsHtml = d.alerts.length
    ? `<div style="margin:20px 0">${d.alerts
        .map(
          (a) =>
            `<div style="background:${a.level === "danger" ? "#fef2f2" : "#fffbeb"};border-left:4px solid ${alertColor(
              a.level,
            )};padding:10px 14px;margin:6px 0;border-radius:6px;font-size:13px">
              <strong style="color:${alertColor(a.level)}">${
                a.level === "danger" ? "ALERTE" : "WARN"
              }</strong> — ${htmlEscape(a.message)}
            </div>`,
        )
        .join("")}</div>`
    : `<p style="color:#059669;font-size:13px;margin:20px 0">Aucune alerte.</p>`

  const signalsHtml = d.signals.length
    ? d.signals
        .map(
          (s) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${new Date(s.publishedAt).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px">${htmlEscape(s.content.slice(0, 60))}${s.content.length > 60 ? "…" : ""}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right"><strong>${s.recipientCount}</strong> dest.</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#9ca3af;font-size:12px">Aucun signal publie.</td></tr>`

  const membersHtml = d.topMembers.length
    ? d.topMembers
        .map(
          (m) =>
            `<tr>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px">${htmlEscape(m.email)}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280">${htmlEscape(m.name)}</td>
              <td style="padding:8px;border-bottom:1px solid #e5e7eb;font-size:13px;text-align:right"><strong>${m.notifications}</strong></td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#9ca3af;font-size:12px">Aucun destinataire actif.</td></tr>`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;padding:20px;background:#fafafa;color:#111">

<div style="background:#fff;border-radius:10px;padding:24px;border:1px solid #e5e7eb">

  <h1 style="margin:0 0 4px;font-size:20px">📊 Digest quotidien NBA</h1>
  <p style="margin:0 0 20px;color:#6b7280;font-size:12px">
    Periode : ${new Date(d.period.from).toLocaleString("fr-FR")} → ${new Date(d.period.to).toLocaleString("fr-FR")}
  </p>

  <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin:24px 0 8px">Email (24h)</h2>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
    ${kpiCard("Envoyés", d.email.sent)}
    ${kpiCard("Délivrés", d.email.delivered, `${d.email.openRate}% ouvert`)}
    ${kpiCard("Ouverts", d.email.opened, `${d.email.clickRate}% clic`)}
    ${kpiCard("Bounces", d.email.bounced, `${d.bounceRate}%`, d.email.bounced > 0 ? "#dc2626" : null)}
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:8px">
    ${kpiCard("Cliqués", d.email.clicked)}
    ${kpiCard("Plaintes", d.email.complained, undefined, d.email.complained > 0 ? "#dc2626" : null)}
    ${kpiCard("Échecs envoi", d.email.failed, undefined, d.email.failed > 0 ? "#d97706" : null)}
    ${kpiCard("En retard", d.email.delayed, undefined, d.email.delayed > 10 ? "#d97706" : null)}
  </div>

  <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin:24px 0 8px">Push web (24h)</h2>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
    ${kpiCard("Envoyés", d.push.sent)}
    ${kpiCard("Échoués", d.push.failed, undefined, d.push.failed > 0 ? "#d97706" : null)}
  </div>

  <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin:24px 0 8px">Top 3 signaux (24h)</h2>
  <table style="width:100%;border-collapse:collapse">${signalsHtml}</table>

  <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin:24px 0 8px">Top 3 destinataires (24h)</h2>
  <table style="width:100%;border-collapse:collapse">${membersHtml}</table>

  <h2 style="font-size:13px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin:24px 0 8px">Alertes</h2>
  ${alertsHtml}

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:11px;color:#9ca3af;text-align:center">
    Digest automatique — pour desactiver : DIGEST_ENABLED=false<br>
    <a href="https://access.signauxx.com/admin/control-room" style="color:#2563eb">Centre de controle</a>
  </p>

</div>

</body>
</html>`
}

function kpiCard(label: string, value: number, sub?: string, color?: string | null) {
  return `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">
    <p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;font-weight:bold">${label}</p>
    <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:${color ?? "#111"}">${value}</p>
    ${sub ? `<p style="margin:2px 0 0;font-size:10px;color:#9ca3af">${sub}</p>` : ""}
  </div>`
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const forceOff = process.argv.includes("--force")

  if (!ENABLED && !forceOff) {
    console.log(`[email-daily-digest] DIGEST_ENABLED=false, skip. (use --force pour forcer)`)
    process.exit(0)
  }

  console.log(`[email-daily-digest] ${dryRun ? "DRY RUN" : "RUN"} - generation du digest`)

  const digest = await buildDigest()
  const html = renderHtml(digest)

  const subject = `📊 Digest NBA 24h — ${digest.email.sent} envois, ${digest.email.bounced} bounce(s), ${digest.email.openedRate ?? digest.openRate}% ouverture`

  if (dryRun) {
    console.log(`[email-daily-digest] Subject: ${subject}`)
    console.log(`[email-daily-digest] HTML length: ${html.length} chars`)
    console.log(`[email-daily-digest] Email: ${JSON.stringify(digest.email)}`)
    console.log(`[email-daily-digest] Push: ${JSON.stringify(digest.push)}`)
    console.log(`[email-daily-digest] Signals: ${digest.signals.length} (top 3)`)
    console.log(`[email-daily-digest] TopMembers: ${digest.topMembers.length}`)
    console.log(`[email-daily-digest] Alerts: ${digest.alerts.length}`)
    process.exit(0)
  }

  await sendEmail(ADMIN_EMAIL, { subject, html })
  console.log(`[email-daily-digest] Envoye a ${ADMIN_EMAIL} (${html.length} chars)`)

  await logAuditEvent({
    action: "email.daily_digest_sent",
    resourceType: "system",
    details: {
      email: digest.email,
      push: digest.push,
      signalsCount: digest.signals.length,
      topMembersCount: digest.topMembers.length,
      alertsCount: digest.alerts.length,
    },
  })

  process.exit(0)
}

main().catch((err) => {
  console.error("[email-daily-digest] ERREUR:", err)
  process.exit(1)
})
