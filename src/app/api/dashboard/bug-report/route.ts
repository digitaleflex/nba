import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"
import { Resend } from "resend"
import { bugReportEmail } from "@nba/lib/email"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { validateOrThrow, bugReportSchema } from "@nba/lib/validations"

const bugReportRateLimit = rateLimitMiddleware({ window: 6 * 3600, max: 5 })

function getClientIp(req: NextRequest): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  )
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireActiveUser()

    const rateLimitRes = await bugReportRateLimit(req, `bug-report:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await req.json()
    const { title, description, severity, steps, context } = validateOrThrow(bugReportSchema, body)

    const clientContext = context ?? {}
    const serverContext = {
      url: clientContext.url || req.headers.get("referer") || undefined,
      userAgent: clientContext.userAgent || req.headers.get("user-agent") || undefined,
      platform: clientContext.platform,
      screen: clientContext.screen,
      language: clientContext.language,
      timezone: clientContext.timezone,
      ip: getClientIp(req) || undefined,
    }

    const data = {
      subject: title,
      message: description,
      severity: severity ?? "low",
      status: "OPEN",
      context: serverContext,
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      reportedAt: new Date().toISOString(),
    }

    // Notifier tous les admins actifs (un bug peut être pris par n'importe qui)
    const admins = await prisma.user.findMany({
      where: { isActive: true, role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } },
      select: { id: true },
    })

    const adminIds = admins.length > 0 ? admins.map((a) => a.id) : [session.user.id]

    await prisma.notification.createMany({
      data: adminIds.map((adminId) => ({
        userId: adminId,
        type: "bug_report",
        title: `Bug signalé par ${session.user.name ?? session.user.email}`,
        body: `[${severity ?? "low"}] ${title} — ${description.slice(0, 200)}`,
        data: {
          ...data,
          ...(steps ? { steps } : {}),
        },
      })),
    })

    // Email à l'équipe support (optionnel)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const template = bugReportEmail(
        { name: session.user.name ?? "Utilisateur", email: session.user.email },
        { title, description, severity, steps, context: serverContext },
      )
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@signauxx.com",
        to: process.env.SUPPORT_EMAIL || "support@signauxx.com",
        subject: template.subject,
        html: template.html,
      })
    } catch {
      // L'email est optionnel
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
