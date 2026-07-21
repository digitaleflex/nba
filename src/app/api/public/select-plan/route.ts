import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma, withRetryTransaction } from "@nba/lib/db"
import { selectPlanSchema, validateOrThrow, ValidationError } from "@nba/lib/validations"
import { AuthError, handleAuthError } from "@nba/lib/auth-utils"
import { newAccessRequestAdminEmail } from "@nba/lib/email"
import { sendEmail } from "@nba/lib/email"
import { msg } from "@nba/lib/messages"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) throw new AuthError(msg.auth.NOT_AUTHENTICATED, 401)

    const rl = await rateLimitOrDeny("SELECT_PLAN", session.user.id)
    if (rl) return rl

    const body = await req.json()
    const parsed = validateOrThrow(selectPlanSchema, body)

    // Transaction pour éviter les doublons race condition
    const result = await withRetryTransaction(async (tx) => {
      // Supprimer les demandes PENDING existantes
      await tx.accessRequest.deleteMany({
        where: { userId: session.user.id, status: "PENDING" },
      })

      // Ne pas recréer si l'utilisateur a déjà un accès APPROVED pour ce plan
      const existingApproved = await tx.accessRequest.findFirst({
        where: { userId: session.user.id, planId: parsed.planId, status: "APPROVED" },
      })
      if (existingApproved) return { created: false, requestId: existingApproved.id }

      const newRequest = await tx.accessRequest.create({
        data: { userId: session.user.id, planId: parsed.planId, status: "APPROVED" },
      })
      return { created: true, requestId: newRequest.id }
    })

    // Log audit
    const { logAuditEvent } = await import("@nba/lib/services/audit")
    await logAuditEvent({
      userId: session.user.id,
      action: result.created ? "subscription.reselect" : "subscription.reselect_duplicate",
      resourceType: "access_request",
      resourceId: result.requestId,
      details: { planId: parsed.planId },
    })

    // Notifier les admins UNIQUEMENT pour une première demande
    if (result.created) {
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
    }

    return NextResponse.json({
      ok: true,
      requestId: result.requestId,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.httpStatus })
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
