import { NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { getOnboardingState } from "@nba/lib/services/onboarding"
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

    const enriched = await Promise.all(
      requests.map(async (req: any) => ({
        ...req,
        onboarding: await getOnboardingState(req.userId),
      })),
    )

    return NextResponse.json(enriched)
  } catch (error) {
    return handleAuthError(error)
  }
}
