import { prisma } from "@nba/lib/db"
import { sendEmail, verificationEmail, welcomeEmail, resetPasswordEmail, emailOtp } from "@nba/lib/email"
import { getQueue } from "@nba/lib/queue"
import { sendPushToUser } from "./push"

type NotificationType = "SIGNAL" | "KYC" | "BROKER" | "ACCESS" | "SECURITY" | "SYSTEM" | "ONBOARDING"
type NotificationChannel = "IN_APP" | "EMAIL" | "PUSH"

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
 */
export async function notify(params: NotifyParams): Promise<{ id: string }> {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: (params.data ?? {}) as any,
    },
  })

  // Envoi push web (fire-and-forget, ne bloque pas la réponse)
  sendPushToUser(params.userId, {
    title: params.title,
    body: params.body,
    url: params.linkUrl || "/dashboard",
    tag: notification.id,
  }).catch((err) => {
    console.error("[notify] push failed:", err)
  })

  if (params.email) {
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notification.id,
        channel: "EMAIL",
        status: "PENDING",
      },
    })

    const queue = getQueue("notification-delivery")
    await queue.add(
      `email-${notification.id}`,
      {
        deliveryId: delivery.id,
        to: params.email.to,
        subject: params.email.subject,
        html: params.email.html,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
      }
    )
  }

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


