import { Resend } from "resend"
import { prisma } from "./db"

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

// ── Logo ──

const LOGO_IMG = `<img
  src="${process.env.NEXT_PUBLIC_APP_URL ?? "https://signauxx.com"}/logo.png"
  alt="NeverBrokeAgain"
  width="120"
  height="120"
  style="display:block;margin:0 auto;border-radius:12px"
/>`

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
          <td style="padding-bottom:8px;text-align:center">
            ${LOGO_IMG}
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:24px;text-align:center">
            <p style="margin:0;font-size:18px;font-weight:800;color:#1E2024;letter-spacing:-0.5px">
              <span style="color:#283B5D">Never</span>BrokeAgain
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#6A758B;letter-spacing:1px;text-transform:uppercase">Signaux traders premium</p>
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
  imageDataUri?: string | null
): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  // imageDataUri est soit un data URI complet (data:image/png;base64,...)
  // soit une URL /api/files/... (fallback, ne fonctionnera pas depuis un client mail
  // car /api/files requiert l'authentification)
  const imageSrc = imageDataUri?.startsWith("data:") || imageDataUri?.startsWith("http")
    ? imageDataUri
    : null
  const imageHtml = imageSrc
    ? `<div style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid #E4E7EC">
         <img src="${imageSrc}" alt="Graphique du signal" style="max-width:100%;height:auto;display:block;width:100%"/>
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
//  KYC TEMPLATES
// ══════════════════════════════════════

export function kycApprovedEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `✅ Documents KYC approuvés — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Félicitations, ${prenom} 🎉
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Vos documents d'identité ont été vérifiés et <strong style="color:#10AF6E">approuvés</strong> par notre équipe.
      </p>

      ${divider()}

      ${sectionTitle("Prochaine étape")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Si ce n'est pas déjà fait, connectez votre compte Broker pour finaliser votre inscription.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/verification`, text: "Vérifier mon Broker" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#6A758B;line-height:1.5">
        Une fois votre Broker validé, vous aurez accès à tous les signaux premium.
      </p>
    `),
  }
}

export function kycRejectedEmail(user: TemplateUser, reason: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `❌ Documents KYC rejetés — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Vos documents d'identité ont été examinés mais <strong style="color:#DC3545">rejetés</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Motif du rejet")}
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#991B1B;line-height:1.5">${reason}</p>
      </div>

      ${sectionTitle("Que faire ?")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Vous pouvez soumettre de nouveaux documents depuis votre tableau de bord.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/verification`, text: "Ressoumettre mes documents" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#6A758B;line-height:1.5">
        Assurez-vous que vos documents sont lisibles et non expirés.
      </p>
    `),
  }
}

// ══════════════════════════════════════
//  BROKER TEMPLATES
// ══════════════════════════════════════

export function brokerApprovedEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `✅ Compte Broker vérifié — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Tout est prêt, ${prenom} 🚀
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre compte Broker a été vérifié et <strong style="color:#10AF6E">approuvé</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Vous avez accès aux signaux")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Tous les prérequis sont remplis. Vous pouvez maintenant recevoir les signaux premium.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/signals`, text: "Voir mes signaux" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#6A758B;line-height:1.5;font-style:italic">
        ⚠️ Le trading comporte des risques. Gérez votre capital de manière responsable.
      </p>
    `),
  }
}

export function brokerRejectedEmail(user: TemplateUser, reason: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `❌ Vérification Broker rejetée — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre vérification de compte Broker a été examinée mais <strong style="color:#DC3545">rejetée</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Motif du rejet")}
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#991B1B;line-height:1.5">${reason}</p>
      </div>

      ${sectionTitle("Que faire ?")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Vous pouvez soumettre une nouvelle vérification depuis votre tableau de bord.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/verification`, text: "Ressoumettre ma vérification" })}
    `),
  }
}

// ══════════════════════════════════════
//  ACCESS REQUEST TEMPLATES
// ══════════════════════════════════════

export function accessApprovedEmail(user: TemplateUser, planName: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `🎉 Accès au groupe "${planName}" accordé — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bienvenue, ${prenom} 🎉
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre demande d'accès au groupe <strong style="color:#283B5D">« ${planName} »</strong> a été <strong style="color:#10AF6E">approuvée</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Votre accès")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Vous recevrez désormais tous les signaux publiés pour ce groupe.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/signals`, text: "Accéder à mes signaux" })}

      <p style="margin:16px 0 0 0;font-size:13px;color:#6A758B;line-height:1.5">
        Consultez régulièrement votre tableau de bord pour ne manquer aucun signal.
      </p>
    `),
  }
}

export function accessRejectedEmail(user: TemplateUser, planName: string, reason: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `❌ Demande d'accès refusée — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre demande d'accès au groupe <strong style="color:#283B5D">« ${planName} »</strong> a été <strong style="color:#DC3545">refusée</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Motif du refus")}
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#991B1B;line-height:1.5">${reason}</p>
      </div>

      ${sectionTitle("Que faire ?")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Vous pouvez contacter notre équipe pour plus d'informations ou soumettre une nouvelle demande.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/subscription`, text: "Voir mes abonnements" })}
    `),
  }
}

// ══════════════════════════════════════
//  SECURITY TEMPLATES
// ══════════════════════════════════════

export function passwordChangedEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `🔒 Mot de passe modifié — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre mot de passe a été modifié avec succès.
      </p>

      ${divider()}

      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/profile`, text: "Gérer mon compte" })}
    `),
  }
}

export function emailChangedEmail(user: TemplateUser, newEmail: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `📧 Adresse email modifiée — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre adresse email a été modifiée. La nouvelle adresse est&nbsp;:
      </p>

      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
        <span style="font-size:16px;font-weight:600;color:#283B5D">${newEmail}</span>
      </div>

      ${divider()}

      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Si vous n'êtes pas à l'origine de cette modification, contactez immédiatement notre support.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/dashboard/profile`, text: "Gérer mon compte" })}
    `),
  }
}

// ══════════════════════════════════════
//  SUBMISSION CONFIRMATION TEMPLATES
// ══════════════════════════════════════

export function kycSubmittedEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `📄 Documents KYC reçus — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Merci, ${prenom} ✓
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Nous avons bien reçu vos documents d'identité.
      </p>

      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:12px;padding:24px;margin:24px 0">
        <p style="margin:0;font-size:14px;color:#6A758B;line-height:1.6">
          Notre équipe vérifie vos documents. Vous recevrez une notification dès que la vérification sera terminée.
        </p>
        <p style="margin:12px 0 0 0;font-size:13px;color:#6A758B">
          Délai estimé : <strong style="color:#1E2024">24 à 48 heures ouvrées</strong>.
        </p>
      </div>

      ${divider()}

      ${sectionTitle("Prochaine étape")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Pendant ce temps, vous pouvez préparer votre vérification Broker.
      </p>
    `),
  }
}

export function brokerSubmittedEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `🎥 Vérification Broker reçue — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bien joué, ${prenom} !
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Nous avons bien reçu votre vidéo de vérification Broker.
      </p>

      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:12px;padding:24px;margin:24px 0">
        <p style="margin:0;font-size:14px;color:#6A758B;line-height:1.6">
          Notre équipe examine votre vérification. Vous serez notifié dès que tout sera validé.
        </p>
        <p style="margin:12px 0 0 0;font-size:13px;color:#6A758B">
          Délai estimé : <strong style="color:#1E2024">24 à 48 heures ouvrées</strong>.
        </p>
      </div>

      ${divider()}

      ${sectionTitle("Plus qu'une étape")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Une fois votre Broker vérifié, vous aurez accès à tous les signaux premium.
      </p>
    `),
  }
}

// ══════════════════════════════════════
//  ACCESS REVOKED & SUSPENSION TEMPLATES
// ══════════════════════════════════════

export function accessRevokedEmail(user: TemplateUser, planName: string, reason: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `⚠️ Accès au groupe révoqué — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre accès au groupe <strong style="color:#283B5D">« ${planName} »</strong> a été <strong style="color:#DC3545">révoqué</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Motif")}
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#991B1B;line-height:1.5">${reason}</p>
      </div>

      ${sectionTitle("Que faire ?")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Contactez notre équipe support pour plus d'informations.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/contact`, text: "Contacter le support" })}
    `),
  }
}

export function accountSuspendedEmail(user: TemplateUser, reason: string): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `🔒 Compte suspendu — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Votre compte a été <strong style="color:#DC3545">suspendu</strong>.
      </p>

      ${divider()}

      ${sectionTitle("Motif")}
      <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#991B1B;line-height:1.5">${reason}</p>
      </div>

      ${sectionTitle("Contester cette décision")}
      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Si vous pensez qu'il s'agit d'une erreur, contactez notre équipe support.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}/contact`, text: "Contacter le support" })}
    `),
  }
}

// ══════════════════════════════════════
//  ACCOUNT DELETION
// ══════════════════════════════════════

export function accountDeletionConfirmationEmail(user: TemplateUser): { subject: string; html: string } {
  const prenom = getFirstName(user.name)
  return {
    subject: `👋 Compte supprimé — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Au revoir, ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Conformément à votre demande, votre compte a été supprimé.
      </p>

      ${divider()}

      <p style="margin:0 0 8px 0;font-size:14px;color:#6A758B;line-height:1.5">
        Vos données personnelles ont été anonymisées conformément à notre politique de confidentialité.
      </p>
      <p style="margin:0;font-size:14px;color:#6A758B;line-height:1.5">
        Si vous souhaitez revenir, vous pouvez créer un nouveau compte à tout moment.
      </p>

      ${ctaButton({ url: `${APP_DOMAIN}`, text: "Retour à l'accueil" })}
    `),
  }
}

// ══════════════════════════════════════
//  ADMIN NOTIFICATION
// ══════════════════════════════════════

interface TemplateAdmin {
  name: string
}

export function newAccessRequestAdminEmail(
  admin: TemplateAdmin,
  requester: { name: string; email: string },
  planName: string,
): { subject: string; html: string } {
  return {
    subject: `📋 Nouvelle demande d'accès — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${getFirstName(admin.name)}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Un utilisateur a soumis une nouvelle demande d'accès.
      </p>

      ${divider()}

      ${sectionTitle("Détails de la demande")}
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6A758B;width:100px">Utilisateur</td>
          <td style="padding:8px 0;font-size:14px;color:#1E2024;font-weight:600">${requester.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6A758B">Email</td>
          <td style="padding:8px 0;font-size:14px;color:#1E2024">${requester.email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6A758B">Groupe</td>
          <td style="padding:8px 0;font-size:14px;color:#1E2024;font-weight:600">${planName}</td>
        </tr>
      </table>

      ${ctaButton({ url: `${APP_DOMAIN}/admin/access-requests`, text: "Voir la demande" })}
    `),
  }
}

// ══════════════════════════════════════
//  DEVICE VERIFICATION
// ══════════════════════════════════════

export function deviceVerificationEmail(name: string, code: string): { subject: string; html: string } {
  const prenom = getFirstName(name)
  return {
    subject: `🔐 Code de vérification appareil — ${APP_NAME}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Bonjour ${prenom}
      </p>
      <p style="margin:0 0 24px 0;font-size:15px;color:#6A758B;line-height:1.6">
        Un nouvel appareil a été détecté sur votre compte. Utilisez le code ci-dessous pour le vérifier.
      </p>

      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
        <span style="font-family:monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#283B5D">${code}</span>
      </div>

      <p style="margin:0 0 4px 0;font-size:13px;color:#6A758B">
        Ce code expire dans <strong style="color:#1E2024">10 minutes</strong>.
      </p>
      <p style="margin:0;font-size:13px;color:#6A758B">
        Si vous n'êtes pas à l'origine de cette connexion, ignorez cet email et sécurisez votre compte.
      </p>
    `),
  }
}

// ══════════════════════════════════════
//  SUPPORT TICKET (email to support team)
// ══════════════════════════════════════

export function supportTicketEmail(
  user: { name: string; email: string },
  subject: string,
  message: string
): { subject: string; html: string } {
  return {
    subject: `[Support NBA] ${subject}`,
    html: layout(`
      <p style="margin:0 0 4px 0;font-size:24px;font-weight:700;color:#1E2024;letter-spacing:-0.5px">
        Nouveau ticket support
      </p>

      ${divider()}

      ${sectionTitle("Expéditeur")}
      <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6A758B;width:100px">Nom</td>
          <td style="padding:8px 0;font-size:14px;color:#1E2024;font-weight:600">${user.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6A758B">Email</td>
          <td style="padding:8px 0;font-size:14px;color:#1E2024">${user.email}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#6A758B">Sujet</td>
          <td style="padding:8px 0;font-size:14px;color:#1E2024;font-weight:600">${subject}</td>
        </tr>
      </table>

      ${divider()}

      ${sectionTitle("Message")}
      <div style="background-color:#F4F5F7;border:1px solid #E4E7EC;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:0;font-size:14px;color:#1E2024;line-height:1.6;white-space:pre-wrap">${message}</p>
      </div>

      ${ctaButton({ url: `${APP_DOMAIN}/admin/support`, text: "Voir dans le dashboard" })}
    `),
  }
}

// ══════════════════════════════════════
//  SENDER
// ══════════════════════════════════════

export async function sendEmail(
  to: string,
  template: { subject: string; html: string },
): Promise<string | null> {
  // Sprint 1 (#59) : blocage si le destinataire a un emailStatus != OK
  // (BOUNCED, COMPLAINED, SUPPRESSED, INVALID). Les emails non-lies a un user
  // (ex: alerte admin) passent normalement.
  try {
    const blocked = await prisma.user.findFirst({
      where: { email: to.toLowerCase() },
      select: { id: true, emailStatus: true },
    })
    if (blocked && blocked.emailStatus !== "OK") {
      console.warn(
        `[EMAIL] Skip ${to} — emailStatus=${blocked.emailStatus} (Sprint 1 #59)`,
      )
      return null
    }
  } catch {
    // Si la DB est down, on ne bloque pas (fail-open)
  }

  try {
    const resend = getResend()
    const { data, error } = await resend.emails.send({
      from: FROM,
      to,
      subject: template.subject,
      html: template.html,
    })

    if (error) {
      throw new Error(typeof error === "string" ? error : error.message)
    }

    return data?.id ?? null
  } catch (err) {
    if (err instanceof Error && err.message.includes("RESEND_API_KEY")) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[EMAIL] Dev mode — simulated send to ${to}:`, template.subject)
        return `dev-${Date.now()}`
      }
    }
    console.error(`[EMAIL] Failed to send to ${to}:`, err)
    throw err
  }
}
