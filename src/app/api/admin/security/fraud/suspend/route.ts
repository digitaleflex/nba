import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { logAuditEvent } from "@nba/lib/services/audit"
import { accountSuspendedEmail } from "@nba/lib/email"
import { sendEmailSync } from "@nba/lib/services/notifications"

const suspendRateLimit = rateLimitMiddleware({ window: 60, max: 10 })

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rl = await suspendRateLimit(req, "fraud:suspend")
    if (rl) return rl
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    await prisma.session.deleteMany({ where: { userId } })
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, suspendedAt: new Date() },
    })

    await logAuditEvent({
      userId: admin.user.id,
      action: "SUSPEND",
      resourceType: "user",
      resourceId: userId,
      details: { targetEmail: user.email, targetName: user.name },
    })

    const template = accountSuspendedEmail(user, "Votre compte a ete suspendu par l'administration.")
    await sendEmailSync(user.email, template.subject, template.html)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
