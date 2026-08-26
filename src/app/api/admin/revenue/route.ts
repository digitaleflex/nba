import { NextResponse } from "next/server"
import { requireRole, handleAuthError } from "@nba/lib/auth-utils"
import { prisma } from "@nba/lib/db"

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."]

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"])

    const approved = await prisma.accessRequest.findMany({
      where: { status: "APPROVED" },
      select: {
        userId: true,
        reviewedAt: true,
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

    const now = Date.now()
    let expiredAccesses = 0
    const expiredUsers = new Set<string>()
    let atRiskMrr = 0

    // fenêtre glissante : 6 derniers mois complets + mois courant
    const windowStart = new Date()
    windowStart.setDate(1)
    windowStart.setMonth(windowStart.getMonth() - 5)
    windowStart.setHours(0, 0, 0, 0)

    interface MonthBucket { month: string; newSubs: number; newMrr: number }
    const buckets = new Map<string, MonthBucket>()
    for (let i = 0; i < 6; i++) {
      const d = new Date(windowStart)
      d.setMonth(d.getMonth() + i)
      buckets.set(`${d.getFullYear()}-${d.getMonth()}`, { month: MONTHS_FR[d.getMonth()], newSubs: 0, newMrr: 0 })
    }

    for (const a of approved) {
      uniqueMembers.add(a.userId)
      const key = a.plan.id
      const price = Number(a.plan.price)
      const durationMonths = Math.max(a.plan.durationDays, 1) / 30
      const mrr = price / durationMonths

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
      entry.monthlyRevenue = Number((entry.monthlyRevenue + mrr).toFixed(2))

      // expiration (accès toujours APPROVED mais durée dépassée) = revenu à risque
      if (a.reviewedAt && now > a.reviewedAt.getTime() + a.plan.durationDays * 86400000) {
        expiredAccesses++
        expiredUsers.add(a.userId)
        atRiskMrr += mrr
      }

      // timeline : basée sur la date de revue (décision d'accession)
      if (a.reviewedAt && a.reviewedAt >= windowStart) {
        const k = `${a.reviewedAt.getFullYear()}-${a.reviewedAt.getMonth()}`
        const bucket = buckets.get(k)
        if (bucket) {
          bucket.newSubs++
          bucket.newMrr = Number((bucket.newMrr + mrr).toFixed(2))
        }
      }
    }

    const breakdown = Array.from(planMap.values())
    const totalRevenue = Number(breakdown.reduce((sum, p) => sum + p.monthlyRevenue, 0).toFixed(2))
    const currency = breakdown.length > 0 ? breakdown[0].currency : "XOF"

    // MRR cumulé sur la fenêtre (base zéro au début de la fenêtre)
    let run = 0
    const timeline = Array.from(buckets.values()).map((b) => {
      run = Number((run + b.newMrr).toFixed(2))
      return { ...b, cumulatedMrr: run }
    })

    return NextResponse.json({
      currency,
      totalMembers: uniqueMembers.size,
      totalPlans: planMap.size,
      totalRevenue,
      breakdown,
      timeline,
      atRisk: {
        members: expiredUsers.size,
        expiredAccesses,
        mrr: Number(atRiskMrr.toFixed(2)),
      },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
