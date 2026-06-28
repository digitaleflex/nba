import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getOnboardingStateForUsers } from "@nba/lib/services/onboarding"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"
import { type AccessStatus } from "@nba/generated/prisma/enums"
import { getCached } from "@nba/lib/cache"

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED", "REVOKED"] as const

export async function GET(req: Request) {
  try {
    await requirePermission("users.read")
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")))
    const skip = (page - 1) * limit

    const url = new URL(req.url)
    const statusParam = url.searchParams.get("status")

    const enriched = await getCached(
      `access:${statusParam ?? "ALL"}`,
      async () => {
        const where =
          statusParam && statusParam !== "ALL" && (VALID_STATUSES as readonly string[]).includes(statusParam)
            ? { status: statusParam as AccessStatus }
            : {}

        const requests = await prisma.accessRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                whatsapp: true,
                country: true,
                onboardingStatus: true,
                createdAt: true,
              },
            },
            plan: true,
            reviewer: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        })

        const userIds = requests.map((r) => r.userId)
        const onboardingMap = await getOnboardingStateForUsers(userIds)

        return requests.map((req) => ({
          ...req,
          onboarding: onboardingMap[req.userId] ?? null,
        }))
      },
      120,
    )

    return NextResponse.json({
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
