import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") ?? ""
    const status = searchParams.get("status") ?? ""
    const onboarding = searchParams.get("onboarding") ?? ""
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
          createdAt: true,
          role: { select: { name: true } },
          _count: {
            select: {
              accessRequests: true,
              kycDocuments: true,
              notifications: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ members, total, page, limit })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])
    const body = await request.json()
    const { userId, isActive, roleId } = body

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 })
    }

    const data: Record<string, any> = {}
    if (typeof isActive === "boolean") data.isActive = isActive
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
        role: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
