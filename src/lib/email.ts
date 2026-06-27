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
  <rect x="4" y="4" width="32" height="32" rx="8" fill="#C6FF3B"/>
  <path d="M12 26V14l8 8 8-8v12" stroke="#09090B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="44" y="27" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="800" fill="#C6FF3B" letter-spacing="-0.5">Never</text>
  <text x="120" y="27" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="400" fill="#FFFFFF" letter-spacing="-0.3">BrokeAgain</text>
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
<body style="margin:0;padding:0;background-color:#09090B;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090B;min-height:100vh">
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
          <td style="background:linear-gradient(135deg,#121215 0%,#1a1a1f 100%);border-radius:16px;padding:40px 32px;border:1px solid rgba(255,255,255,0.06)">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center">
            <p style="margin:0;font-size:12px;color:#71717A;line-height:1.6">
              ${APP_NAME} &mdash; Signaux traders premium<br/>
              <a href="${APP_DOMAIN}/contact" style="color:#C6FF3B;text-decoration:none">Nous contacter</a>
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
      <td align="center" style="background:linear-gradient(135deg,#C6FF3B 0%,#a8e82e 100%);border-radius:10px;padding:0">
        <a href="${url}" class="btn" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#09090B;text-decoration:none;border-radius:10px;letter-spacing:-0.2px">${text}</a>
      </td>
    </tr>
  </table>`
}

// ── Section title ──

function sectionTitle(text: string): string {
  return `<h2 style="margin:0 0 16px 0;font-size:13px;font-weight:600;color:#C6FF3B;text-transform:uppercase;letter-spacing:1px">${text}</h2>`
}

// ── Onboarding Steps ──

function onboardingSteps(steps: { label: string; done: boolean }[]): string {
  const items = steps.map((s) => {
    const icon = s.done ? "&#10003;" : "&#10132;"
    const color = s.done ? "#22C55E" : "#71717A"
    return `<tr>
      <td style="padding:8px 0;color:${color};font-size:14px;line-height:1.5">
        <span style="display:inline-block;width:20px;font-weight:700">${icon}</span>
        ${s.label}
      </td>
    </tr>`
  }).join("")
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0">${items}</table>`
}

// ── Divider ──

function divider(): string {
  return `<div style="height:1px;background:linear-gradient(to right,transparent,rgba(198,255,59,0.15),transparent);margin:24px 0"></div>`
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
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px">
        Bienvenue, ${prenom} 👋
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#A1A1AA;line-height:1.6">
        Votre compte a été créé avec succès. Une dernière chose avant de commencer&nbsp;: confirmez votre adresse email.
      </p>

      ${ctaButton({ url, text: "Confirmer mon email" })}

      <p style="margin:0 0 4px 0;font-size:13px;color:#71717A">
        Ce lien est valable <strong style="color:#A1A1AA">24 heures</strong>. Si vous n'avez pas créé de compte, ignorez cet email.
      </p>

      ${divider()}

      ${sectionTitle("Prochaines étapes")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#A1A1AA;line-height:1.5">
        Une fois votre email confirmé, vous pourrez&nbsp;:
      </p>
      ${onboardingSteps([
        { label: "Compléter votre profil (pays, langue)", done: false },
        { label: "Soumettre vos documents KYC", done: false },
        { label: "Vérifier votre compte broker", done: false },
        { label: "Attendre la validation de notre équipe", done: false },
      ])}
      <p style="margin:12px 0 0 0;font-size:13px;color:#71717A;font-style:italic">
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
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px">
        Félicitations, ${prenom} 🎉
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#A1A1AA;line-height:1.6">
        Votre adresse email est confirmée. Vous êtes maintenant prêt à finaliser votre inscription.
      </p>

      ${divider()}

      ${sectionTitle("Votre checklist onboarding")}
      <p style="margin:0 0 4px 0;font-size:14px;color:#A1A1AA">
        Connectez-vous pour compléter ces étapes <strong style="color:#FFFFFF">dans l'ordre</strong>&nbsp;:
      </p>
      ${onboardingSteps([
        { label: "✅ Email confirmé", done: true },
        { label: "📝 Compléter votre profil", done: false },
        { label: "🪪 Envoyer vos documents KYC", done: false },
        { label: "🎥 Vérifier votre compte broker", done: false },
        { label: "👨‍💻 Validation par notre équipe", done: false },
      ])}

      ${ctaButton({ url: `${APP_DOMAIN}/onboarding`, text: "Continuer mon inscription" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#71717A;line-height:1.5">
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
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#A1A1AA;line-height:1.6">
        Vous avez demandé la réinitialisation de votre mot de passe.
      </p>

      ${ctaButton({ url, text: "Réinitialiser mon mot de passe" })}

      <p style="margin:0 0 4px 0;font-size:13px;color:#71717A">
        Ce lien expire dans <strong style="color:#A1A1AA">1 heure</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#71717A">
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
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px">
        Bravo, ${prenom} !
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#A1A1AA;line-height:1.6">
        L'étape <strong style="color:#FFFFFF">«&nbsp;${stepLabel}&nbsp;»</strong> a bien été validée.
      </p>

      ${divider()}

      ${sectionTitle(nextStepLabel ? "Prochaine étape" : "En attente de validation")}
      ${nextStepLabel
        ? `<p style="margin:0;font-size:15px;color:#A1A1AA;line-height:1.6">
            Rendez-vous maintenant sur <strong style="color:#C6FF3B">«&nbsp;${nextStepLabel}&nbsp;»</strong> pour continuer.
          </p>
          ${ctaButton({ url: `${APP_DOMAIN}/onboarding`, text: "Voir mes étapes" })}`
        : `<p style="margin:0;font-size:15px;color:#A1A1AA;line-height:1.6">
            Votre dossier est en cours de validation par notre équipe. Vous recevrez un email dès que l'accès vous sera accordé.
          </p>
          <p style="margin:12px 0 0 0;font-size:13px;color:#71717A">
            Délai estimé : <strong style="color:#A1A1AA">24 à 48 heures ouvrées</strong>.
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
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#A1A1AA;line-height:1.6">
        Voici votre code de vérification à 6 chiffres pour finaliser votre inscription.
      </p>

      <div style="background-color:#09090B;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#C6FF3B">${code}</span>
      </div>

      <p style="margin:0 0 4px 0;font-size:13px;color:#71717A">
        Ce code expire dans <strong style="color:#A1A1AA">15 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#71717A">
        Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
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
    console.error(`Failed to send email to ${to}:`, err)
  }
}
