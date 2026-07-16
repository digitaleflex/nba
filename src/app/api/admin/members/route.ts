import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { getCached, invalidatePrefix } from "@nba/lib/cache"
import { logAuditEvent } from "@nba/lib/services/audit"

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
              plan: { select: { id: true, name: true } },
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

        return { members, total, page, limit }
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
    const body = await request.json()
    const { userId, isActive, roleId, onboardingStatus, signalsAccessOverride, emailStatus } = body

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof isActive === "boolean") data.isActive = isActive
    if (onboardingStatus) data.onboardingStatus = onboardingStatus
    if (typeof signalsAccessOverride === "boolean") data.signalsAccessOverride = signalsAccessOverride
    if (emailStatus) data.emailStatus = emailStatus
    if (emailStatus) data.emailStatusAt = new Date()
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } })
      if (!role) {
        return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
      }
      data.roleId = roleId
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        onboardingStatus: true,
        signalsAccessOverride: true,
        role: { select: { id: true, name: true } },
      },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "UPDATE",
      resourceType: "user",
      resourceId: userId,
      details: {
        changes: Object.keys(data),
        isActive: data.isActive,
        onboardingStatus: data.onboardingStatus,
        roleId: data.roleId,
      },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("members:")
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "SUPER_ADMIN"])
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    })

    await logAuditEvent({
      userId: session.user.id,
      action: "DELETE",
      resourceType: "user",
      resourceId: userId,
      details: {
        softDelete: true,
        userName: user.name,
        userEmail: user.email,
      },
    })

    await invalidatePrefix("ops")
    await invalidatePrefix("members:")
    return NextResponse.json({ success: true, message: "Utilisateur supprimé" })
  } catch (error) {
    return handleAuthError(error)
  }
}
