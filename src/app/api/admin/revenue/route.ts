import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const approved = await prisma.accessRequest.findMany({
      where: { status: "APPROVED" },
      select: {
        userId: true,
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            durationDays: true,
          },
        },
      },
    })

    const uniqueMembers = new Set<string>()
    const planMap = new Map<string, {
      planId: string
      planName: string
      price: number
      currency: string
      durationDays: number
      members: number
      monthlyRevenue: number
    }>()

    for (const a of approved) {
      uniqueMembers.add(a.userId)
      const key = a.plan.id
      const price = Number(a.plan.price)
      const durationMonths = Math.max(a.plan.durationDays, 1) / 30

      if (!planMap.has(key)) {
        planMap.set(key, {
          planId: a.plan.id,
          planName: a.plan.name,
          price,
          currency: a.plan.currency,
          durationDays: a.plan.durationDays,
          members: 0,
          monthlyRevenue: 0,
        })
      }

      const entry = planMap.get(key)!
      entry.members++
      entry.monthlyRevenue = Number((entry.monthlyRevenue + price / durationMonths).toFixed(2))
    }

    const breakdown = Array.from(planMap.values())
    const totalRevenue = Number(breakdown.reduce((sum, p) => sum + p.monthlyRevenue, 0).toFixed(2))
    const currency = breakdown.length > 0 ? breakdown[0].currency : "XOF"

    return NextResponse.json({
      currency,
      totalMembers: uniqueMembers.size,
      totalPlans: planMap.size,
      totalRevenue,
      breakdown,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
