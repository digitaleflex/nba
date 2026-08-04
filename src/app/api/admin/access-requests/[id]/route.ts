import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { reviewAccessSchema, validateOrThrow } from "@nba/lib/validations"
import { logAuditEvent } from "@nba/lib/services/audit"
import { notify } from "@nba/lib/services/notifications"
import { startOrReplyAsAdmin } from "@nba/lib/services/messaging"
import { accessApprovedEmail, accessRejectedEmail, accessRevokedEmail, accountSuspendedEmail, planChangedEmail } from "@nba/lib/email"
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
            emailStatus: true,
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
        notes: parsed.notes,
        ...(parsed.planId ? { planId: parsed.planId } : {}),
        ...(parsed.status !== request.status
          ? { reviewedBy: session.user.id, reviewedAt: new Date() }
          : {}),
      },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("access:")

    if (parsed.status === "APPROVED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "ACTIVE", isActive: true },
      })
    }

    if (parsed.status === "REJECTED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "REVIEW_PENDING" },
      })
    }

    const statusChanged = parsed.status !== request.status

    await logAuditEvent({
      userId: session.user.id,
      action: `access_request.${statusChanged ? parsed.status.toLowerCase() : "plan_changed"}`,
      resourceType: "access_request",
      resourceId: id,
      details: { notes: parsed.notes, planId: parsed.planId || undefined },
    })

    // Notifier l'utilisateur du résultat (seulement si le statut a changé)
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { name: true, email: true },
    })

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: parsed.planId || request.planId },
      select: { name: true },
    })

    if (user && statusChanged) {
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

      // Envoyer un message privé via la messagerie (compte admin)
      try {
        const adminName = session.user.name ?? "Admin"
        let msgContent: string
        if (parsed.status === "APPROVED") {
          msgContent = `Bonjour ${user.name},\n\nVotre demande d'accès au groupe « ${planName} » a été **approuvée** ✅. Vous pouvez dès maintenant consulter les signaux et recevoir les notifications.\n\nBienvenue dans le groupe, et bons trades ! 📈`
        } else if (parsed.status === "REJECTED") {
          msgContent = `Bonjour ${user.name},\n\nVotre demande d'accès au groupe « ${planName} » a été **refusée** ❌.\n\nMotif : ${parsed.notes || "Non précisé"}\n\nSi vous avez des questions, n'hésitez pas à répondre à ce message.`
        } else if (parsed.status === "SUSPENDED") {
          msgContent = `Bonjour ${user.name},\n\nVotre compte a été **suspendu** ⚠️.\n\nMotif : ${parsed.notes || "Non précisé"}\n\nSi vous avez des questions, n'hésitez pas à répondre à ce message.`
        } else {
          msgContent = `Bonjour ${user.name},\n\nVotre accès au groupe « ${planName} » a été **révoqué** ❌.\n\nMotif : ${parsed.notes || "Non précisé"}\n\nSi vous avez des questions, n'hésitez pas à répondre à ce message.`
        }
        await startOrReplyAsAdmin(session.user.id, request.userId, msgContent)
      } catch (msgErr) {
        log.warn({ userId: request.userId, error: msgErr }, "Failed to send approval message to user")
      }
    }

    if (user && parsed.planId && parsed.planId !== request.planId && !statusChanged) {
      const planName = plan?.name || "Inconnu"
      const template = planChangedEmail(user, planName)
      await notify({
        userId: request.userId,
        type: "ACCESS",
        title: "Plan modifié",
        body: `L'administration a modifié votre plan d'accès vers « ${planName} ».`,
        data: { requestId: id, planName },
        linkUrl: "/dashboard/messages",
        email: { to: user.email, subject: template.subject, html: template.html },
      }).catch((err) => {
        log.warn({ userId: request.userId, err }, "Failed to send plan change notification")
      })

      try {
        const msgContent = `Bonjour ${user.name},\n\nL'administration a modifié votre plan d'accès vers **« ${planName} »**.\n\nSi vous pensez qu'il s'agit d'une erreur, répondez à ce message pour contester ce changement.`
        await startOrReplyAsAdmin(session.user.id, request.userId, msgContent)
      } catch (msgErr) {
        log.warn({ userId: request.userId, error: msgErr }, "Failed to send plan change message")
      }
    }

    if (parsed.status === "SUSPENDED" || parsed.status === "REVOKED") {
      await prisma.user.update({
        where: { id: request.userId },
        data: { onboardingStatus: "SUSPENDED", isActive: false },
      })
      await prisma.session.deleteMany({ where: { userId: request.userId } })
      try {
        const { getRedisConnection } = await import("@nba/lib/queue")
        const redis = getRedisConnection()
        if (redis) {
          await redis.publish("nba:ws:control", `reset:${request.userId}`)
        }
      } catch {
        log.warn({ userId: request.userId, errorCode: "DATABASE_CONNECTION" }, "Failed to publish WS reset on access request rejection")
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
