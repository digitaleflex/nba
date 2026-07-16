import { prisma } from "@nba/lib/db"
import { sendEmail, verificationEmail, welcomeEmail, resetPasswordEmail, emailOtp } from "@nba/lib/email"
import { getQueue } from "@nba/lib/queue"
import { sendPushToUser } from "./push"
import { publishNotification } from "@nba/lib/redis-pubsub"
import { sendTelegramMessage } from "./telegram"
import { sendWhatsAppSignal } from "./whatsapp"

type NotificationType = "SIGNAL" | "KYC" | "BROKER" | "ACCESS" | "SECURITY" | "SYSTEM" | "ONBOARDING" | "MESSAGE"
type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH" | "TELEGRAM"

const TYPE_TO_PREF_KEY: Record<NotificationType, string> = {
  SIGNAL: "signal",
  KYC: "kyc",
  BROKER: "broker",
  ACCESS: "access",
  SECURITY: "security",
  SYSTEM: "system",
  ONBOARDING: "system",
  MESSAGE: "message",
}

async function getUserPrefs(userId: string): Promise<Record<string, boolean>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  })
  const meta = (user?.metadata || {}) as Record<string, any>
  return meta.notificationPrefs || {}
}

export { getUserPrefs }

function isInQuietHours(prefs: Record<string, any>): boolean {
  const qh = prefs.quietHours
  if (!qh || !qh.start || !qh.end) return false
  const now = new Date()
  const current = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = qh.start.split(":").map(Number)
  const [eh, em] = qh.end.split(":").map(Number)
  const start = sh * 60 + sm
  const end = eh * 60 + em
  if (start <= end) return current >= start && current < end
  return current >= start || current < end
}

async function telegramSend(notificationId: string, userId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { metadata: true },
  })
  const meta = (user?.metadata || {}) as Record<string, any>
  if (!meta.telegram_chat_id || meta.telegram_active === false) return

  const delivery = await prisma.notificationDelivery.create({
    data: { notificationId, channel: "TELEGRAM", status: "PENDING" },
  }).catch(() => null)

  const result = await sendTelegramMessage(
    meta.telegram_chat_id,
    `<b>${title}</b>\n\n${body}`,
    { parseMode: "HTML" },
  )

  if (delivery) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: result.ok ? "SENT" : "FAILED", errorMessage: result.error || null },
    }).catch(() => {})
  }
}

async function whatsappSend(notificationId: string, userId: string, title: string, body: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { whatsapp: true, metadata: true },
  })
  const meta = (user?.metadata || {}) as Record<string, any>
  const phone = user?.whatsapp
  if (!phone || meta.whatsapp_active === false) return

  const delivery = await prisma.notificationDelivery.create({
    data: { notificationId, channel: "WHATSAPP", status: "PENDING" },
  }).catch(() => null)

  const result = await sendWhatsAppSignal(phone, title, body)

  if (delivery) {
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { status: result.ok ? "SENT" : "FAILED", errorMessage: result.error || null },
    }).catch(() => {})
  }
}

interface NotifyParams {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
  linkUrl?: string
  email?: {
    to: string
    subject: string
    html: string
  }
}

/**
 * Crée une notification in-app, envoie un push (web), et planifie un email via BullMQ.
 * Publie aussi sur Redis Pub/Sub pour notifier en temps réel via WebSocket.
 */
export async function notify(params: NotifyParams): Promise<{ id: string }> {
  // Ne pas créer de notification pour un utilisateur suspendu
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { isActive: true },
  })
  if (!user?.isActive) {
    // Créer la notification in-app quand même (pour audit trail) mais ne pas la distribuer
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: (params.data ?? {}) as any,
      },
    })
    return { id: notification.id }
  }

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: (params.data ?? {}) as any,
    },
  })

  // Vérifier les préférences de notification
  const prefs = await getUserPrefs(params.userId).catch(() => ({}))
  const prefKey = TYPE_TO_PREF_KEY[params.type]
  const typeEnabled = (prefs as Record<string, boolean | undefined>)[prefKey] !== false

  if (typeEnabled) {
    // Vérifier les heures silencieuses
    if (isInQuietHours(prefs)) return { id: notification.id }
    // Envoi push web (fire-and-forget, ne bloque pas la réponse)
    const pushDelivery = await prisma.notificationDelivery
      .create({
        data: {
          notificationId: notification.id,
          channel: "PUSH",
          status: "PENDING",
        },
      })
      .catch(() => null)

    sendPushToUser(params.userId, {
      title: params.title,
      body: params.body,
      url: params.linkUrl || "/dashboard",
      tag: notification.id,
    })
      .then(async (res) => {
        if (!pushDelivery) return
        const failed = !!(res as { failed?: number })?.failed
        await prisma.notificationDelivery
          .update({
            where: { id: pushDelivery.id },
            data: { status: failed ? "FAILED" : "SENT" },
          })
          .catch(() => {})
      })
      .catch(async (err) => {
        console.error("[notify] push failed:", err)
        if (pushDelivery) {
          await prisma.notificationDelivery
            .update({
              where: { id: pushDelivery.id },
              data: { status: "FAILED" },
            })
            .catch(() => {})
        }
      })

    if (params.email) {
      const queue = getQueue("notification-delivery")
      const { to, subject, html } = params.email

      await prisma.$transaction(async (tx) => {
        const delivery = await tx.notificationDelivery.create({
          data: {
            notificationId: notification.id,
            channel: "EMAIL",
            status: "PENDING",
          },
        })

        await queue.add(
          `email-${notification.id}`,
          {
            deliveryId: delivery.id,
            to,
            subject,
            html,
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          }
        )
      })
    }

    // Telegram
    telegramSend(notification.id, params.userId, params.title, params.body).catch(() => {})
    // WhatsApp
    whatsappSend(notification.id, params.userId, params.title, params.body).catch(() => {})
  }

  // WebSocket temps réel via Redis Pub/Sub
  publishNotification(params.userId, {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    linkUrl: params.linkUrl,
    createdAt: notification.createdAt,
  }).catch((err) => {
    console.error("[notify] pubsub failed:", err)
  })

  return { id: notification.id }
}

/**
 * Envoie un email immédiatement (synchrone) sans notification in-app.
 * Utilisé pour les emails critiques (reset password, OTP).
 */
export async function sendEmailSync(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await sendEmail(to, { subject, html })
}

export async function sendVerificationEmail(user: { id: string; name: string; email: string }, url: string) {
  const template = verificationEmail(user, url)
  await sendEmailSync(user.email, template.subject, template.html)
}

export async function sendWelcomeEmail(user: { id: string; name: string; email: string }) {
  const template = welcomeEmail(user)
  await sendEmailSync(user.email, template.subject, template.html)
}

export async function sendResetPasswordEmail(user: { id: string; name: string; email: string }, url: string) {
  const template = resetPasswordEmail(user, url)
  await sendEmailSync(user.email, template.subject, template.html)
}

export async function sendOtpEmail(name: string, email: string, code: string) {
  const template = emailOtp(name, code)
  await sendEmailSync(email, template.subject, template.html)
}

export async function sendDeviceVerificationEmail(name: string, email: string, code: string) {
  const { deviceVerificationEmail } = await import("@nba/lib/email")
  const template = deviceVerificationEmail(name, code)
  await sendEmailSync(email, template.subject, template.html)
}

export async function sendAccountDeletionEmail(user: { name: string; email: string }) {
  const { accountDeletionConfirmationEmail } = await import("@nba/lib/email")
  const template = accountDeletionConfirmationEmail(user)
  await sendEmailSync(user.email, template.subject, template.html)
}

export async function sendOnboardingStepEmail(
  user: { name: string; email: string },
  stepLabel: string,
  nextStepLabel: string | null,
) {
  const { onboardingStepEmail } = await import("@nba/lib/email")
  const template = onboardingStepEmail(user, stepLabel, nextStepLabel)
  await sendEmailSync(user.email, template.subject, template.html)
}

export async function sendKycSubmittedEmail(user: { name: string; email: string }) {
  const { kycSubmittedEmail } = await import("@nba/lib/email")
  const template = kycSubmittedEmail(user)
  await sendEmailSync(user.email, template.subject, template.html)
}

export async function sendBrokerSubmittedEmail(user: { name: string; email: string }) {
  const { brokerSubmittedEmail } = await import("@nba/lib/email")
  const template = brokerSubmittedEmail(user)
  await sendEmailSync(user.email, template.subject, template.html)
}


