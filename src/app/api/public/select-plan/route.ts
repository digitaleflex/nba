import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { selectPlanSchema, validateOrThrow, ValidationError } from "@nba/lib/validations"
import { AuthError } from "@nba/lib/auth-utils"
import { newAccessRequestAdminEmail } from "@nba/lib/email"
import { sendEmail } from "@nba/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) throw new AuthError("Non authentifié", 401)

    const body = await req.json()
    const parsed = validateOrThrow(selectPlanSchema, body)

    // Reselection logic:
    // 1. Delete any existing PENDING request (user is changing their choice)
    // 2. Keep APPROVED requests (admin already approved, reselecting shouldn't cancel)
    //    unless user is explicitly switching after approval
    const existingPending = await prisma.accessRequest.findMany({
      where: {
        userId: session.user.id,
        status: "PENDING",
      },
    })

    if (existingPending.length > 0) {
      // Cancel previous PENDING requests (user changed their mind)
      await prisma.accessRequest.deleteMany({
        where: {
          id: { in: existingPending.map((r) => r.id) },
        },
      })
    }

    // Create the new request
    const newRequest = await prisma.accessRequest.create({
      data: { userId: session.user.id, planId: parsed.planId },
    })

    // Log audit event
    const { logAuditEvent } = await import("@nba/lib/services/audit")
    await logAuditEvent({
      userId: session.user.id,
      action: "subscription.reselect",
      resourceType: "access_request",
      resourceId: newRequest.id,
      details: {
        planId: parsed.planId,
        cancelledPending: existingPending.length,
      },
    })

    // Notifier les admins de la nouvelle demande
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parsed.planId },
      select: { name: true },
    })

    if (plan) {
      const admins = await prisma.user.findMany({
        where: { role: { name: { in: ["ADMIN", "SUPER_ADMIN"] } } },
        select: { name: true, email: true },
      })

      await Promise.allSettled(
        admins.map((admin) => {
          const template = newAccessRequestAdminEmail(
            admin,
            { name: session.user.name ?? "Utilisateur", email: session.user.email },
            plan.name,
          )
          return sendEmail(admin.email, template)
        }),
      )
    }

    return NextResponse.json({
      ok: true,
      requestId: newRequest.id,
      cancelledPrevious: existingPending.length,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }
}
