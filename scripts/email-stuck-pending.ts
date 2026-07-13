import "dotenv/config"
import { prisma } from "../src/lib/db"
import { logAuditEvent } from "../src/lib/services/audit"
import { sendEmail } from "../src/lib/email"

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "admin@signauxx.com"

// Delai avant qu'une livraison PENDING soit consideree comme bloquee
const STUCK_THRESHOLD_MS = 60 * 60 * 1000 // 1h

// Seuil d'alerte admin (au-dessus = probleme systemique probable)
const ALERT_THRESHOLD = 5

interface StuckDelivery {
  id: string
  notificationId: string
  externalId: string | null
  createdAt: Date
  notification: {
    userId: string
    user: { email: string; name: string }
    type: string
  } | null
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")
  const thresholdHoursArg = process.argv
    .find((a) => a.startsWith("--threshold-hours="))
    ?.split("=")[1]
  const thresholdMs = thresholdHoursArg
    ? Number(thresholdHoursArg) * 60 * 60 * 1000
    : STUCK_THRESHOLD_MS

  const cutoff = new Date(Date.now() - thresholdMs)

  console.log(
    `[email-stuck-pending] ${dryRun ? "DRY RUN" : "RUN"} - seuil=${thresholdMs / 3600000}h, cutoff=${cutoff.toISOString()}`,
  )

  // 1. Lister les livraisons bloquees
  const stuck: StuckDelivery[] = await prisma.notificationDelivery.findMany({
    where: {
      channel: "EMAIL",
      status: "PENDING",
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      notificationId: true,
      externalId: true,
      createdAt: true,
      notification: {
        select: {
          userId: true,
          type: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  })

  console.log(`[email-stuck-pending] Livraisons EMAIL PENDING > seuil: ${stuck.length}`)
  if (stuck.length > 0 && stuck.length <= 20) {
    for (const d of stuck) {
      console.log(
        `  - ${d.id} | ${d.notification?.user?.email ?? "?"} | ${d.notification?.type ?? "?"} | depuis ${d.createdAt.toISOString()}`,
      )
    }
  } else if (stuck.length > 20) {
    console.log(`  (${stuck.length} entrees, affichage limite a 20)`)
  }

  if (stuck.length === 0 || dryRun) {
    console.log(`[email-stuck-pending] Termine (${dryRun ? "dry-run" : "rien a faire"}).`)
    process.exit(0)
  }

  // 2. Marquer FAILED
  const result = await prisma.notificationDelivery.updateMany({
    where: { id: { in: stuck.map((d) => d.id) } },
    data: {
      status: "FAILED",
      errorMessage: `Auto-failed: stuck PENDING > ${thresholdMs / 3600000}h (cron)`,
    },
  })

  console.log(`[email-stuck-pending] Marquees FAILED: ${result.count}`)

  // 3. Audit log
  await logAuditEvent({
    action: "email.stuck_pending_cleanup",
    resourceType: "notification_delivery",
    details: {
      markedFailed: result.count,
      thresholdMs,
      cutoff: cutoff.toISOString(),
      sampleIds: stuck.slice(0, 10).map((d) => d.id),
    },
  })

  // 4. Alerte admin si > seuil (probleme systemique)
  if (stuck.length > ALERT_THRESHOLD) {
    const subject = `[ALERTE] ${stuck.length} livraisons email bloquees > ${thresholdMs / 3600000}h`
    const html = `<p><b>${stuck.length}</b> livraisons email sont restees en statut PENDING
      depuis plus de ${thresholdMs / 3600000}h. Elles ont ete marquees FAILED par le cron.</p>
      <p>Causes probables :</p>
      <ul>
        <li>Worker email BullMQ down ou bloque</li>
        <li>Rate limit Resend depasse</li>
        <li>Cle API Resend invalide</li>
        <li>Bug applicatif empechant l'envoi</li>
      </ul>
      <p>Verifier le Centre de controle et les logs BullMQ.</p>
      <p><b>Premiers IDs :</b></p>
      <ul>${stuck.slice(0, 5).map((d) => `<li><code>${d.id}</code> - ${d.notification?.user?.email ?? "?"}</li>`).join("")}</ul>`

    await sendEmail(ADMIN_EMAIL, { subject, html })
    console.log(`[email-stuck-pending] Alerte admin envoyee (${stuck.length} > ${ALERT_THRESHOLD})`)
  }

  console.log(`[email-stuck-pending] Termine.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("[email-stuck-pending] ERREUR:", err)
  process.exit(1)
})
