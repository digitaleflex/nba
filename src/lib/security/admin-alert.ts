import { prisma } from "../db"

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@signauxx.com"

export async function getAdminAlertEmails(): Promise<string[]> {
  const envEmail = process.env.ADMIN_ALERT_EMAIL
  if (envEmail) return envEmail.split(",").map(s => s.trim()).filter(Boolean)

  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } },
        isActive: true,
        emailStatus: "OK",
      },
      select: { email: true },
    })
    return admins.map(a => a.email).filter(Boolean)
  } catch {
    return []
  }
}

export async function sendAdminAlert(subject: string, html: string): Promise<void> {
  const { sendEmailSync } = await import("../services/notifications")
  const emails = await getAdminAlertEmails()
  for (const email of emails) {
    try {
      await sendEmailSync(email, subject, html)
    } catch {
      // continue with next admin
    }
  }
}

export async function sendAdminPanic(subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  const emails = await getAdminAlertEmails()
  if (emails.length === 0) return

  await Promise.all(emails.map(async (email) => {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: FROM, to: email, subject, html }),
        signal: AbortSignal.timeout(10_000),
      })
    } catch {
      // panic email failed — nothing we can do
    }
  }))
}
