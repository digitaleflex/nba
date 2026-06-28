import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requirePermission, handleAuthError } from "@nba/lib/auth-utils"

export async function GET(req: NextRequest) {
  try {
    await requirePermission("signals.create")

    const { searchParams } = new URL(req.url)
    const planIdsStr = searchParams.get("planIds")
    if (!planIdsStr) {
      return NextResponse.json({ breakdown: {}, total: 0 })
    }

    const planIds = planIdsStr.split(",").filter(Boolean)
    if (planIds.length === 0) {
      return NextResponse.json({ breakdown: {}, total: 0 })
    }

    // Fetch active users who have an APPROVED access request for these plans
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        accessRequests: {
          some: {
            planId: { in: planIds },
            status: "APPROVED",
          },
        },
      },
      select: {
        id: true,
        accessRequests: {
          where: {
            status: "APPROVED",
            planId: { in: planIds },
          },
          select: {
            plan: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    // Calculate unique counts per plan
    const breakdown: Record<string, number> = {}
    
    // Initialize keys with 0 for all requested plans
    const plans = await prisma.subscriptionPlan.findMany({
      where: { id: { in: planIds } },
      select: { id: true, name: true }
    })
    
    for (const plan of plans) {
      breakdown[plan.name] = 0
    }

    for (const user of users) {
      const userPlans = new Set(user.accessRequests.map((ar: any) => ar.plan.name as string))
      for (const planName of userPlans) {
        breakdown[planName] = (breakdown[planName] || 0) + 1
      }
    }

    return NextResponse.json({
      breakdown,
      total: users.length // Unique recipient count
    })
  } catch (err) {
    return handleAuthError(err)
  }
}
