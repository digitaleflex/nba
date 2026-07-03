import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getOnboardingStateForUsers } from "@nba/lib/services/onboarding"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function GET() {
  try {
    await requirePermission("users.read")

    const requests = await prisma.accessRequest.findMany({
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
    })

    const userIds = requests.map((r) => r.userId)
    const onboardingMap = await getOnboardingStateForUsers(userIds)

    const enriched = requests.map((req) => ({
      ...req,
      onboarding: onboardingMap[req.userId] ?? null,
    }))

    return NextResponse.json(enriched)
  } catch (error) {
    return handleAuthError(error)
  }
}
