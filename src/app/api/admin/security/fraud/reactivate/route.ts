import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { logAuditEvent } from "@nba/lib/services/audit"
import { accountReactivatedEmail } from "@nba/lib/email"
import { sendEmailSync } from "@nba/lib/services/notifications"

const rl = rateLimitMiddleware({ window: 60, max: 20 })

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rlRes = await rl(req, "fraud:reactivate")
    if (rlRes) return rlRes
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true, suspendedAt: null },
    })

    await logAuditEvent({
      userId: admin.user.id,
      action: "REACTIVATE",
      resourceType: "user",
      resourceId: userId,
      details: { targetEmail: user.email, targetName: user.name },
    })

    const template = accountReactivatedEmail({ name: user.name, email: user.email })
    await sendEmailSync(user.email, template.subject, template.html, { userId, templateName: "accountReactivatedEmail" })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
