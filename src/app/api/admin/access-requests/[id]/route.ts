import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewAccessSchema, validateOrThrow } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"
import { notify } from "@nba/lib/services/notifications"
import { accessApprovedEmail, accessRejectedEmail, accessRevokedEmail, accountSuspendedEmail } from "@nba/lib/email"
import { invalidatePrefix } from "@nba/lib/cache"
import { msg } from "@nba/lib/messages"

const log = logger.child({ module: "admin-access-requests" })

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("users.read")
    const { id } = await params

    const request = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsapp: true,
            country: true,
            language: true,
            image: true,
            onboardingStatus: true,
            createdAt: true,
            kycDocuments: { orderBy: { submittedAt: "desc" } },
            brokerVerifications: { orderBy: { submittedAt: "desc" } },
            devices: { orderBy: { lastSeenAt: "desc" }, take: 5 },
          },
        },
        plan: true,
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })

    if (!request) {
      return NextResponse.json({ error: msg.member.REQUEST_NOT_FOUND }, { status: 404 })
    }

    return NextResponse.json(request)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("subscriptions.manage")
    const { id } = await params
    const body = await req.json()
    const parsed = validateOrThrow(reviewAccessSchema, body)

    const request = await prisma.accessRequest.findUniqueOrThrow({ where: { id } })

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: {
        status: parsed.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        notes: parsed.notes,
      },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("access:")

    if (parsed.status === "APPROVED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "ACTIVE" },
      })
    }

    if (parsed.status === "REJECTED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "REVIEW_PENDING" },
      })
    }

    if (parsed.status === "SUSPENDED" || parsed.status === "REVOKED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "SUSPENDED", isActive: false },
      })
      // Révoquer les sessions + déconnecter le WebSocket
      await prisma.session.deleteMany({ where: { userId: request.userId } })
      try {
        const { getRedisConnection } = await import("@nba/lib/queue")
        const redis = getRedisConnection()
        if (redis) {
          await redis.publish("nba:ws:control", `reset:${request.userId}`)
        }
      } catch {
        log.warn({ userId: request.userId }, "Failed to publish WS reset on access request rejection")
      }
    }

    await logAuditEvent({
      userId: session.user.id,
      action: `access_request.${parsed.status.toLowerCase()}`,
      resourceType: "access_request",
      resourceId: id,
      details: { notes: parsed.notes },
    })

    // Notifier l'utilisateur du résultat
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { name: true, email: true },
    })

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: request.planId },
      select: { name: true },
    })

    if (user) {
      const planName = plan?.name || "Inconnu"
      let template: { subject: string; html: string }
      let title: string
      let body: string

      if (parsed.status === "APPROVED") {
        template = accessApprovedEmail(user, planName)
        title = "Accès au groupe accordé"
        body = `Votre accès au groupe « ${planName} » a été approuvé.`
      } else if (parsed.status === "REVOKED") {
        template = accessRevokedEmail(user, planName, parsed.notes || "Aucun motif précisé")
        title = "Accès au groupe révoqué"
        body = `Votre accès au groupe « ${planName} » a été révoqué. Motif : ${parsed.notes || "Non précisé"}`
      } else if (parsed.status === "SUSPENDED") {
        template = accountSuspendedEmail(user, parsed.notes || "Aucun motif précisé")
        title = "Compte suspendu"
        body = `Votre compte a été suspendu. Motif : ${parsed.notes || "Non précisé"}`
      } else {
        template = accessRejectedEmail(user, planName, parsed.notes || "Aucun motif précisé")
        title = "Demande d'accès refusée"
        body = `Votre demande d'accès au groupe « ${planName} » a été refusée. Motif : ${parsed.notes || "Non précisé"}`
      }

      await notify({
        userId: request.userId,
        type: "ACCESS",
        title,
        body,
        data: { requestId: id, planName, status: parsed.status },
        linkUrl: parsed.status === "APPROVED" ? "/dashboard/signals" : "/dashboard/subscription",
        email: {
          to: user.email,
          subject: template.subject,
          html: template.html,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
