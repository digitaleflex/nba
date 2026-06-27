import { Resend } from "resend"

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error("RESEND_API_KEY non configurée — les emails ne peuvent pas être envoyés")
  }
  return new Resend(key)
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@signauxx.com"
const APP_NAME = "NeverBrokeAgain"
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://signauxx.com"

// ── Logo SVG ──

const LOGO_SVG = `
<svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="32" height="32" rx="8" fill="#283B5D"/>
  <path d="M12 26V14l8 8 8-8v12" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="44" y="27" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="800" fill="#283B5D" letter-spacing="-0.5">Never</text>
  <text x="120" y="27" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="400" fill="#1E2024" letter-spacing="-0.3">BrokeAgain</text>
</svg>`

// ── Helpers ──

function getFirstName(name: string): string {
  return name?.split(" ")[0] ?? "Utilisateur"
}

// ── Layout ──

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;padding:24px 16px !important}
      .btn{width:100% !important;display:block !important;text-align:center !important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#FAFBFC;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAFBFC;min-height:100vh">
    <tr><td align="center" style="padding:40px 16px">
      <table class="container" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
        <!-- Header -->
        <tr>
          <td style="padding-bottom:32px;text-align:center">
            ${LOGO_SVG}
          </td>
        </tr>
        <!-- Card -->
        <tr>
          <td style="background-color:#FFFFFF;border-radius:16px;padding:40px 32px;border:1px solid rgba(0,0,0,0.06);box-shadow:0 4px 12px rgba(0,0,0,0.03)">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center">
            <p style="margin:0;font-size:12px;color:#6A758B;line-height:1.6">
              ${APP_NAME} &mdash; Signaux traders premium<br/>
              <a href="${APP_DOMAIN}/contact" style="color:#283B5D;text-decoration:none;font-weight:500">Nous contacter</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── CTA Button ──

interface ButtonOptions {
  url: string
  text: string
  color?: string
}

function ctaButton({ url, text }: ButtonOptions): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0">
    <tr>
      <td align="center" style="background-color:#283B5D;border-radius:8px;padding:0">
        <a href="${url}" class="btn" style="display:inline-block;padding:12px 32px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;letter-spacing:-0.2px">${text}</a>
      </td>
    </tr>
  </table>`
}

// ── Section title ──

function sectionTitle(text: string): string {
  return `<h2 style="margin:0 0 16px 0;font-size:12px;font-weight:600;color:#6A758B;text-transform:uppercase;letter-spacing:1px">${text}</h2>`
}

// ── Onboarding Steps ──

function onboardingSteps(steps: { label: string; done: boolean }[]): string {
  const items = steps.map((s) => {
    const icon = s.done ? "&#10003;" : "&#8226;"
    const color = s.done ? "#10AF6E" : "#6A758B"
    const fontWeight = s.done ? "600" : "400"
    return `<tr>
      <td style="padding:8px 0;color:${color};font-size:14px;line-height:1.5;font-weight:${fontWeight}">
        <span style="display:inline-block;width:20px;font-weight:700">${icon}</span>
        ${s.label}
      </td>
    </tr>`
  }).join("")
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0">${items}</table>`
}

// ── Divider ──

function divider(): string {
  return `<div style="height:1px;background-color:#E4E7EC;margin:24px 0"></div>`
}

// ══════════════════════════════════════
//  TEMPLATES
// ══════════════════════════════════════

interface TemplateUser {
  name: string
  email: string
}

export function verificationEmail(user: TemplateUser, url: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `Confirmez votre email — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bienvenue, ${prenom} 👋
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre compte a été créé avec succès. Une dernière chose avant de commencer&nbsp;: confirmez votre adresse email.
      </p>

      ${ctaButton({ url, text: "Confirmer mon email" })}

      <p style="margin:0 0 4px 0;font-size:13px;color:#6A758B">
        Ce lien est valable <strong style="color:#1E2024">24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
      </p>

      ${divider()}

      ${sectionTitle("Prochaines étapes")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Une fois votre email confirmé, vous pourrez&nbsp;:
      </p>
      ${onboardingSteps([
        { label: "Soumettre vos documents KYC", done: false },
        { label: "Connecter votre compte Broker", done: false },
        { label: "Attendre la validation de notre équipe", done: false },
      ])}
      <p style="margin:12px 0 0 0;font-size:13px;color:#6A758B;font-style:italic">
        ⚠️ Toutes les étapes sont obligatoires pour accéder aux signaux.
      </p>
    `),
  }
}

export function welcomeEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `Email confirmé ! Préparez votre accès — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Félicitations, ${prenom} 🎉
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre adresse email est confirmée. Vous êtes maintenant prêt à finaliser votre inscription.
      </p>

      ${divider()}

      ${sectionTitle("Votre checklist onboarding")}
      <p style="margin:0 0 4px 0;font-size:14px;color:#6A758B">
        Connectez-vous pour compléter ces étapes <strong style="color:#1E2024">dans l'ordre</strong>&nbsp;:
      </p>
      ${onboardingSteps([
        { label: "Email confirmé", done: true },
        { label: "Envoyer vos documents KYC", done: false },
        { label: "Connecter votre compte Broker", done: false },
        { label: "Validation par notre équipe", done: false },
      ])}

      ${ctaButton({ url: `${APP_DOMAIN}/onboarding`, text: "Continuer mon inscription" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#6A758B;line-height:1.5">
        ⏳ Chaque étape est nécessaire avant de recevoir vos premiers signaux. Notre équipe valide manuellement chaque dossier sous 24-48h.
      </p>
    `),
  }
}

export function resetPasswordEmail(user: TemplateUser, url: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `Réinitialisation de votre mot de passe — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Vous avez demandé la réinitialisation de votre mot de passe.
      </p>

      ${ctaButton({ url, text: "Réinitialiser mon mot de passe" })}

      <p style="margin:0 0 4px 0;font-size:13px;color:#6A758B">
        Ce lien expire dans <strong style="color:#1E2024">1 heure</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#6A758B">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email. Votre mot de passe reste inchangé.
      </p>
    `),
  }
}

export function onboardingStepEmail(user: TemplateUser, stepLabel: string, nextStepLabel: string | null): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `Étape complétée : ${stepLabel} — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bravo, ${prenom} !
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        L'étape <strong style="color:#1E2024">«&nbsp;${stepLabel}&nbsp;»</strong> a bien été validée.
      </p>

      ${divider()}

      ${sectionTitle(nextStepLabel ? "Prochaine étape" : "En attente de validation")}
      ${nextStepLabel
        ? `<p style="margin:0;font-size:15px;color:#6A758B;line-height:1.6">
            Rendez-vous maintenant sur <strong style="color:#283B5D">«&nbsp;${nextStepLabel}&nbsp;»</strong> pour continuer.
          </p>
          ${ctaButton({ url: `${APP_DOMAIN}/onboarding`, text: "Voir mes étapes" })}`
        : `<p style="margin:0;font-size:15px;color:#6A758B;line-height:1.6">
            Votre dossier est en cours de validation par notre équipe. Vous recevrez un email dès que l'accès vous sera accordé.
          </p>
          <p style="margin:12px 0 0 0;font-size:13px;color:#6A758B">
            Délai estimé : <strong style="color:#1E2024">24 à 48 heures ouvrées</strong>.
          </p>`
      }
    `),
  }
}

export function emailOtp(name: string, code: string): { subject: string; html: string } {
  const prenom = getFirstName(name)
  return {
    subject: `Votre code de vérification — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Voici votre code de vérification à 6 chiffres pour finaliser votre inscription.
      </p>

      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#283B5D">${code}</span>
      </div>

      <p style="margin:0 0 4px 0;font-size:13px;color:#6A758B">
        Ce code expire dans <strong style="color:#1E2024">15 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#6A758B">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
      </p>
    `),
  }
}

export function parseSimpleMarkdown(text: string): string {
  if (!text) return ""
  
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>")

  html = html.split("\n").map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith("- ")) {
      return `<div style="margin:4px 0 4px 16px;color:#1E2024">&bull; ${trimmed.substring(2)}</div>`
    }
    if (trimmed.startsWith("* ")) {
      return `<div style="margin:4px 0 4px 16px;color:#1E2024">&bull; ${trimmed.substring(2)}</div>`
    }
    return line
  }).join("\n")

  html = html.replace(/\n/g, "<br/>")

  return html
}

export function tradingSignalEmail(
  user: TemplateUser,
  content: string,
  imageUrl?: string | null
): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  const imageHtml = imageUrl
    ? `<div style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #E4E7EC">
         <img src="${APP_DOMAIN}/api/files/${imageUrl}" alt="Graphique du signal" style="max-width:100%;height:auto;display:block"/>
       </div>`
    : ""

  const formattedContent = parseSimpleMarkdown(content)

  return {
    subject: `📈 Nouveau signal disponible — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Nouveau signal de trading 📈
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Bonjour ${prenom}, un nouveau signal vient d'être publié.
      </p>

      ${divider()}

      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:12px;padding:24px;margin:24px 0;font-family:system-ui,-apple-system,sans-serif;font-size:15px;color:#1E2024;line-height:1.6">
        ${formattedContent}
      </div>

      ${imageHtml}

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/signals`, text: "Voir sur mon tableau de bord" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#6A758B;line-height:1.5;font-style:italic">
        ⚠️ Attention : Le trading comporte des risques majeurs de perte de capital. Gérez votre risque de manière responsable.
      </p>
    `),
  }
}

// ══════════════════════════════════════
//  SENDER
// ══════════════════════════════════════

export async function sendEmail(
  to: string,
  template: { subject: string; html: string },
): Promise<void> {
  try {
    const resend = getResend()
    await resend.emails.send({
      from: FROM,
      to,
      subject: template.subject,
      html: template.html,
    })
  } catch (err) {
    if (err instanceof Error && err.message.includes("RESEND_API_KEY")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[EMAIL] Dev mode — simulated send to ${to}:`, template.subject)
        return
      }
    }
    console.error(`[EMAIL] Failed to send to ${to}:`, err)
    throw err
  }
}
