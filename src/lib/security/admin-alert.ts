import { prisma } from "../db"

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
