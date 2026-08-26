import "dotenv/config"
import { prisma } from "@nba/lib/db"
import { layout, divider, sectionTitle, getFirstName, sendEmail } from "../src/lib/email"

const APP_NAME = "NeverBrokeAgain"
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://access.signauxx.com"
const DRY_RUN = process.argv.includes("--send") === false
const STAFF = ["admin@signauxx.com"]

async function main() {
  const approved = await prisma.accessRequest.findMany({
    where: { status: "APPROVED", reviewedAt: { not: null } },
    select: {
      userId: true,
      reviewedAt: true,
      plan: { select: { name: true, durationDays: true, features: true } },
      user: { select: { id: true, email: true, name: true, isActive: true, emailStatus: true } },
    },
  })

  const now = Date.now()
  // Un membre peut avoir plusieurs accès expirés → on garde le plus cher/récent par email
  const byUser = new Map<string, {
    email: string; name: string | null; planName: string;
    expiredSince: Date; checkoutUrl: string | null; emailStatus: string
  }>()
  for (const a of approved) {
    if (!a.reviewedAt) continue
    const exp = new Date(a.reviewedAt.getTime() + a.plan.durationDays * 86400000)
    if (now <= exp.getTime()) continue
    if (STAFF.some((s) => a.user.email.toLowerCase() === s)) continue
    if (!a.user.isActive) continue
    const existing = byUser.get(a.user.email)
    if (existing && existing.expiredSince >= exp) continue
    byUser.set(a.user.email, {
      email: a.user.email,
      name: a.user.name,
      planName: a.plan.name,
      expiredSince: exp,
      emailStatus: a.user.emailStatus,
    })
  }

  const recipients = [...byUser.values()]
  console.log(`Destinataires éligibles : ${recipients.length} (staff exclus, comptes actifs uniquement)`)

  function template(r: typeof recipients[number]) {
    const prenom = getFirstName(r.name)
    const date = r.expiredSince.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    return {
      subject: `⚠️ ${prenom}, votre accès ${r.planName} va être interrompu`,
      html: layout(`
        <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
          Bonjour ${prenom},
        </p>
        <p style="margin:0 0 16px 0;font-size:15px;color:#6A758B;line-height:1.6">
          Votre abonnement <strong style="color:#283B5D">« ${r.planName} »</strong> a pris fin le <strong style="color:#DC3545">${date}</strong>.
        </p>
        <div style="background-color:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;padding:14px 16px;margin:0 0 20px 0">
          <p style="margin:0;font-size:14px;color:#9A3412;line-height:1.5">
            ⚠️ <strong>Votre accès aux signaux peut être interrompu à tout moment.</strong>
            Ne laissez pas passer les prochains signaux — les meilleurs setups n'attendent pas.
          </p>
        </div>

        ${divider()}
        ${sectionTitle("Réactiver en 1 minute")}
        <p style="margin:0 0 12px 0;font-size:14px;color:#6A758B;line-height:1.5">
          Régularisez votre abonnement et reprenez la diffusion des signaux immédiatement.
        </p>
        <p style="margin:0 0 12px 0;font-size:14px;color:#6A758B;line-height:1.5">
          Ceci est un simple rappel : vous retrouverez <strong style="color:#283B5D">toutes les instructions pour régulariser votre situation</strong> dans le groupe communautaire.
        </p>
      `),
    }
  }

  if (DRY_RUN) {
    console.log("\n─── MODE DRY RUN ───────────────────────")
    const t = template(recipients[0])
    console.log(`Objet : ${t.subject}`)
    console.log(`(aperçu HTML généré pour ${recipients[0].email})`)
    console.log("\nListe des destinataires :")
    recipients.forEach((r) => console.log(`  • ${r.email} — ${r.planName} (expiré depuis le ${r.expiredSince.toLocaleDateString("fr-FR")})${r.emailStatus !== "OK" ? ` [emailStatus=${r.emailStatus}, sera skippé]` : ""}`))
    console.log("\nPour envoyer réellement : npx tsx scripts/tmp-relance-expired.ts --send")
    return
  }

  let sent = 0, skipped = 0, failed = 0
  for (const r of recipients) {
    try {
      const id = await sendEmail(r.email, template(r))
      if (id) sent++
      else skipped++
      await new Promise((res) => setTimeout(res, 300))
    } catch (e) {
      failed++
      console.error(`Échec ${r.email}:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`\nTerminé : ${sent} envoyés, ${skipped} skippés, ${failed} échecs`)
}

main().finally(() => prisma.$disconnect()).finally(() => process.exit(0))
