import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getOnboardingState } from "@nba/lib/services/onboarding"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    await requirePermission("users.read")
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50")))
    const skip = (page - 1) * limit

    const [requests, total] = await Promise.all([
      prisma.accessRequest.findMany({
        where: { status: "PENDING" },
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
        },
        orderBy: { createdAt: "asc" },
        take: limit,
        skip,
      }),
      prisma.accessRequest.count({ where: { status: "PENDING" } }),
    ])

    const enriched = await Promise.all(
      requests.map(async (req: any) => ({
        ...req,
        onboarding: await getOnboardingState(req.userId),
      })),
    )

    return NextResponse.json({
      data: enriched,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
