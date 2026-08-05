import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { logger } from "@nba/lib/logger"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getCached, invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"
import { hardDeleteUser } from "@nba/lib/services/user-deletion"
import { validateOrThrow, memberUpdateSchema, memberQuerySchema } from "@nba/lib/validations"
import { getRedisConnection } from "@nba/lib/queue"
import { msg } from "@nba/lib/messages"
import { rateLimitOrDeny } from "@nba/lib/rate-limit"
import { notify } from "@nba/lib/services/notifications"
import { accountReactivatedEmail } from "@nba/lib/email"

const log = logger.child({ module: "admin-members" })

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") ?? ""
    const status = searchParams.get("status") ?? ""
    const onboarding = searchParams.get("onboarding") ?? ""
    const planId = searchParams.get("planId") ?? ""
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const skip = (page - 1) * limit

    const where: any = { deletedAt: null }

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ]
    }

    if (status === "active") where.isActive = true
    if (status === "inactive") where.isActive = false

    if (onboarding) {
      where.onboardingStatus = onboarding
    }

    if (planId) {
      where.accessRequests = {
        some: {
          planId,
          status: "APPROVED",
        },
      }
    }

    const result = await getCached(
      `members:${query}:${status}:${onboarding}:${planId}:${page}:${limit}`,
      async () => {
    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          country: true,
          onboardingStatus: true,
          isActive: true,
          signalsAccessOverride: true,
          emailStatus: true,
          emailStatusAt: true,
          createdAt: true,
          role: { select: { name: true } },
          accessRequests: {
            where: { status: "APPROVED" },
            select: {
              updatedAt: true,
              plan: { select: { id: true, name: true, durationDays: true } },
            },
          },
          kycDocuments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              documentType: true,
              status: true,
              createdAt: true,
              frontFilePath: true,
              backFilePath: true,
            },
          },
          brokerVerifications: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              id: true,
              brokerName: true,
              accountId: true,
              status: true,
              createdAt: true,
              videoFilePath: true,
            },
          },
          _count: {
            select: {
              accessRequests: true,
              kycDocuments: true,
              notifications: true,
              pushSubscriptions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const enrichedMembers = members.map((m: any) => {
      const subscriptions = (m.accessRequests ?? []).map((ar: any) => {
        const start = ar.updatedAt ?? new Date()
        const days = ar.plan?.durationDays ?? 30
        const expiresAt = new Date(start.getTime() + days * 24 * 60 * 60 * 1000)
        return {
          plan: { id: ar.plan?.id, name: ar.plan?.name },
          startAt: start,
          expiresAt,
          remainingDays: Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))),
        }
      })
      return { ...m, subscriptions }
    })

        return { members: enrichedMembers, total, page, limit }
      },
      15,
    )

    return NextResponse.json(result)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rl = await rateLimitOrDeny("ADMIN_MEMBER_MUTATION", session.user.id)
    if (rl) return rl
    const body = validateOrThrow(memberUpdateSchema, await request.json())
    const { userId, userIds, isActive, roleId, onboardingStatus, signalsAccessOverride, emailStatus } = body

    const ids = userIds ?? (userId ? [userId] : [])
    if (ids.length === 0) {
      return NextResponse.json({ error: "userId ou userIds requis" }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof isActive === "boolean") {
      data.isActive = isActive
      if (!isActive && !onboardingStatus) {
        data.onboardingStatus = "SUSPENDED"
      }
      data.suspendedAt = !isActive ? new Date() : null
    }
    if (onboardingStatus) data.onboardingStatus = onboardingStatus
    if (typeof signalsAccessOverride === "boolean") data.signalsAccessOverride = signalsAccessOverride
    if (emailStatus) data.emailStatus = emailStatus
    if (emailStatus) data.emailStatusAt = new Date()
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } })
      if (!role) {
        return NextResponse.json({ error: msg.member.ROLE_INVALID }, { status: 400 })
      }
      data.roleId = roleId
    }

    const updated = await prisma.user.updateMany({
      where: { id: { in: ids } },
      data,
    })

    // Révoquer sessions en masse si suspension
    if (typeof isActive === "boolean" && !isActive) {
      await prisma.session.deleteMany({ where: { userId: { in: ids } } })
      try {
        const redis = getRedisConnection()
        if (redis) {
          await Promise.all(ids.map((id) => redis.publish("nba:ws:control", `reset:${id}`)))
        }
      } catch {
        log.warn({ count: ids.length, errorCode: "DATABASE_CONNECTION" }, "Failed to publish WS reset on batch suspension")
      }
    }

    await logAuditEvent({
      userId: session.user.id,
      action: "BATCH_UPDATE",
      resourceType: "user",
      resourceId: ids.join(","),
      details: { changes: Object.keys(data), count: updated.count, ids },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("members:")

    if (typeof isActive === "boolean" && isActive) {
      const reactivatedUsers = await prisma.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true },
      })
      for (const user of reactivatedUsers) {
        const template = accountReactivatedEmail(user)
        await notify({
          userId: user.id,
          type: "ACCESS",
          title: "Compte réactivé",
          body: "Votre compte a été réactivé par l'administration. Vous pouvez de nouveau vous connecter.",
          data: {},
          linkUrl: "/login",
          email: { to: user.email, subject: template.subject, html: template.html },
        }).catch((err) => {
          log.warn({ userId: user.id, err }, "Failed to send reactivation notification")
        })
      }
    }

    return NextResponse.json({ count: updated.count })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const rl = await rateLimitOrDeny("ADMIN_MEMBER_MUTATION", session.user.id)
    if (rl) return rl
    const { searchParams } = new URL(request.url)
    const { userId } = validateOrThrow(memberQuerySchema, { userId: searchParams.get("userId") })

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: msg.member.NOT_FOUND }, { status: 404 })
    }

    await hardDeleteUser(prisma, userId)

    await logAuditEvent({
      userId: session.user.id,
      action: "DELETE",
      resourceType: "user",
      resourceId: userId,
      details: {
        hardDelete: true,
        userName: user.name,
        userEmail: user.email,
      },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("members:")
    return NextResponse.json({ success: true, message: msg.member.DELETED })
  } catch (error) {
    return handleAuthError(error)
  }
}
