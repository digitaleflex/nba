import { NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { getCached } from "@nba/lib/cache"
import { serverError } from "@nba/lib/api-error"
import { msg } from "@nba/lib/messages"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: { select: { name: true } } },
    })

    if (!userDb?.role || (userDb.role.name !== "ADMIN" && userDb.role.name !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: msg.auth.UNAUTHORIZED }, { status: 403 })
    }

    const data = await getCached("revenue", async () => {
      const [plans, accessByPlan] = await Promise.all([
        prisma.subscriptionPlan.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true, price: true, currency: true, durationDays: true },
        }),
        prisma.accessRequest.groupBy({
          by: ["planId"],
          where: { status: "APPROVED" },
          _count: { _all: true },
        }),
      ])

      const planCount = new Map(accessByPlan.map((a) => [a.planId, a._count._all]))

      let totalRevenue = 0

      const breakdown = plans.map((plan) => {
        const members = planCount.get(plan.id) ?? 0
        const price = Number(plan.price)
        const monthlyValue = price / Math.max(1, plan.durationDays) * 30
        const planRevenue = monthlyValue * members
        totalRevenue += planRevenue
        return {
          planId: plan.id,
          planName: plan.name,
          price,
          currency: plan.currency,
          durationDays: plan.durationDays,
          members,
          monthlyRevenue: Math.round(planRevenue * 100) / 100,
        }
      })

      const totalMembers = accessByPlan.reduce((sum, a) => sum + a._count._all, 0)

      return {
        currency: plans[0]?.currency ?? "EUR",
        totalMembers,
        totalPlans: plans.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        breakdown,
      }
    }, 120)

    return NextResponse.json(data)
  } catch (error: unknown) {
    return serverError(error, "GET /api/admin/revenue")
  }
}
