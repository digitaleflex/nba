import "dotenv/config"
import { prisma } from "../src/lib/db"
import { sendEmail } from "../src/lib/email"
import { logAuditEvent } from "../src/lib/services/audit"

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@signauxx.com"
const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_URL || "https://signauxx.com").replace(/\/+$/, "")

interface IncompleteUser {
  id: string
  name: string
  email: string
  profileComplete: boolean
  kycStatus: string | null
  brokerStatus: string | null
  kycSubmitted: boolean
  brokerSubmitted: boolean
}

async function getIncompleteUsers(): Promise<IncompleteUser[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      signalsAccessOverride: false,
      role: { name: { notIn: ["ADMIN", "SUPER_ADMIN"] } },
    },
    select: {
      id: true,
      name: true,
      email: true,
      country: true,
      phone: true,
      whatsapp: true,
      kycDocuments: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: { status: true },
      },
      brokerVerifications: {
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  })

  return users
    .map((u) => {
      const profileComplete =
        !!(u.country?.trim() && u.phone?.trim() && u.whatsapp?.trim())
      const kycStatus = u.kycDocuments[0]?.status ?? null
      const brokerStatus = u.brokerVerifications[0]?.status ?? null
      const kycSubmitted = u.kycDocuments.length > 0
      const brokerSubmitted = u.brokerVerifications.length > 0

      const hasAccess =
        profileComplete &&
        kycStatus === "APPROVED" &&
        brokerStatus === "APPROVED"

      if (hasAccess) return null

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        profileComplete,
        kycStatus,
        brokerStatus,
        kycSubmitted,
        brokerSubmitted,
      }
    })
    .filter((u): u is IncompleteUser => u !== null)
}

function buildTemplate(user: IncompleteUser): { subject: string; html: string } {
  const prenom = user.name?.split(" ")[0] ?? "Utilisateur"
  const steps: { label: string; done: boolean }[] = [
    { label: "Profil utilisateur à 100%", done: user.profileComplete },
    { label: "Vérification d'identité (KYC)", done: user.kycStatus === "APPROVED" },
    { label: "Vérification de votre compte Broker", done: user.brokerStatus === "APPROVED" },
  ]
  const incompleteSteps = steps.filter((s) => !s.done).length

  let statusText = ""
  if (incompleteSteps === 3) {
    statusText = "Vous n'avez encore complété aucune des étapes nécessaires pour accéder aux signaux."
  } else if (incompleteSteps === 2) {
    statusText = "Il vous reste 2 étapes sur 3 à compléter pour accéder aux signaux."
  } else if (incompleteSteps === 1) {
    statusText = "Il ne vous reste qu'une seule étape à finaliser pour accéder aux signaux."
  }

  return {
    subject: `Rappel : complétez votre vérification — ${APP_DOMAIN.replace("https://", "")}`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    @media only screen and (max-width:600px){
      body,table,td,p,a,li,blockquote{-webkit-text-size-adjust:100% !important;-ms-text-size-adjust:100% !important}
      .container{width:100% !important;padding:0 12px !important}
      .card{padding:24px 20px !important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F2F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F4F6">
    <tr><td align="center" style="padding:32px 16px">
      <table class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <tr>
          <td style="text-align:center;padding-bottom:20px">
            <p style="margin:0;font-size:18px;font-weight:800;color:#1A1D23">
              <span style="color:#283B5D">Never</span>BrokeAgain
            </p>
          </td>
        </tr>
        <tr>
          <td class="card" style="background:#FFFFFF;border-radius:16px;padding:32px">
            <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024">
              Bonjour ${prenom} 👋
            </p>
            <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
              Nous vous rappelons que pour accéder aux signaux de trading en temps réel, vous devez d'abord compléter les étapes de vérification ci-dessous.
            </p>
            <p style="margin:0 0 16px 0;font-size:15px;color:#6A758B;line-height:1.6">
              ${statusText}
            </p>

            <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%">
              ${steps
                .map(
                  (s) => `
              <tr>
                <td style="padding:8px 0;color:${s.done ? "#10AF6E" : "#6A758B"};font-size:14px;line-height:1.5;font-weight:${s.done ? "600" : "400"}">
                  <span style="display:inline-block;width:20px;font-weight:700">${s.done ? "&#10003;" : "&#8226;"}</span>
                  ${s.label}
                  ${!s.done ? `<span style="display:block;font-size:12px;color:#9CA3AF;padding-left:24px">${
                    s.label.includes("KYC")
                      ? user.kycStatus === "PENDING" ? "En attente de validation" : user.kycStatus === "REJECTED" ? "Refusé — veuillez resoumettre" : "Non soumis"
                      : s.label.includes("Broker")
                        ? user.brokerStatus === "PENDING" ? "En attente de validation" : user.brokerStatus === "REJECTED" ? "Refusé — veuillez resoumettre" : "Non soumis"
                        : "Non complété"
                  }</span>` : ""}
                </td>
              </tr>`
                )
                .join("")}
            </table>

            <table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0" width="100%">
              <tr>
                <td align="center" bgcolor="#283B5D" style="background-color:#283B5D;border-radius:12px;padding:0" width="100%">
                  <a href="${APP_DOMAIN}/onboarding" target="_blank" style="display:block;padding:16px 32px;font-size:16px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:12px;text-align:center;background-color:#283B5D">Compléter ma vérification</a>
                </td>
              </tr>
            </table>

            <div style="height:1px;background-color:#E4E7EC;margin:24px 0"></div>

            <p style="margin:0;font-size:13px;color:#6A758B;line-height:1.5">
              Cet email est envoyé automatiquement chaque semaine. Si vous avez déjà complété toutes les étapes, ignorez ce message.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-top:20px;text-align:center">
            <p style="margin:0;font-size:12px;color:#6B7280;line-height:1.6">
              NeverBrokeAgain &mdash; Signaux traders premium<br/>
              <a href="${APP_DOMAIN}/contact" style="color:#283B5D;text-decoration:none;font-weight:500;font-size:12px">Nous contacter</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  console.log(`[email-verification-reminder] ${dryRun ? "DRY RUN" : "RUN"}`)

  const users = await getIncompleteUsers()

  console.log(`[email-verification-reminder] ${users.length} utilisateur(s) sans accès信号`)

  let sent = 0
  let failed = 0

  for (const user of users) {
    const template = buildTemplate(user)

    if (dryRun) {
      console.log(`[email-verification-reminder] [DRY] Envoyé à ${user.email} — ${user.name}`)
      sent++
      continue
    }

    try {
      const result = await sendEmail(user.email, template)
      if (result) {
        sent++
        console.log(`[email-verification-reminder] OK ${user.email}`)
      } else {
        failed++
        console.log(`[email-verification-reminder] BLOQUÉ ${user.email} (emailStatus non OK)`)
      }
    } catch (err) {
      failed++
      console.error(`[email-verification-reminder] ERREUR ${user.email}:`, err)
    }
  }

  console.log(`[email-verification-reminder] Terminé : ${sent} envoyés, ${failed} échoués`)

  if (!dryRun) {
    await logAuditEvent({
      action: "email.verification_reminder",
      resourceType: "system",
      details: {
        total: users.length,
        sent,
        failed,
      },
    })
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("[email-verification-reminder] ERREUR:", err)
  process.exit(1)
})
