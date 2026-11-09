import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@nba/lib/db"
import { requireActiveUser, handleAuthError } from "@nba/lib/auth-utils"

// GET /api/dashboard/signals/tracking?days=30
// Retourne la courbe simple pris / pas pris par jour.
export async function GET(req: NextRequest) {
  try {
    const session = await requireActiveUser()
    const userId = session.user.id
    const { searchParams } = new URL(req.url)
    const days = Math.min(90, Math.max(7, parseInt(searchParams.get("days") || "30")))

    const since = new Date()
    since.setHours(0, 0, 0, 0)
    since.setDate(since.getDate() - (days - 1))

    const [takens, published] = await Promise.all([
      prisma.signalTaken.findMany({
        where: { userId, tradedAt: { gte: since } },
        select: { signalId: true, tradedAt: true },
        orderBy: { tradedAt: "asc" },
      }),
      prisma.signal.findMany({
        where: { status: "PUBLISHED", deletedAt: null, publishedAt: { gte: since } },
        select: { id: true, publishedAt: true },
      }),
    ])

    // Index jours YYYY-MM-DD
    const dayKeys: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(since)
      d.setDate(d.getDate() + i)
      dayKeys.push(d.toISOString().slice(0, 10))
    }

    const takenByDay = new Map<string, number>()
    for (const t of takens) {
      const k = new Date(t.tradedAt).toISOString().slice(0, 10)
      takenByDay.set(k, (takenByDay.get(k) ?? 0) + 1)
    }

    const publishedByDay = new Map<string, number>()
    for (const s of published) {
      if (!s.publishedAt) continue
      const k = new Date(s.publishedAt).toISOString().slice(0, 10)
      publishedByDay.set(k, (publishedByDay.get(k) ?? 0) + 1)
    }

    const series = dayKeys.map((day) => {
      const pris = takenByDay.get(day) ?? 0
      const recus = publishedByDay.get(day) ?? 0
      return {
        day,
        pris,
        recus,
        manques: Math.max(0, recus - pris),
        couverture: recus > 0 ? Math.round((pris / recus) * 100) : 0,
      }
    })

    const totalPris = takens.length
    const totalRecus = published.length
    const joursAvecTrade = series.filter((s) => s.pris > 0).length

    return NextResponse.json({
      days,
      totalPris,
      totalRecus,
      joursAvecTrade,
      couvertureGlobale: totalRecus > 0 ? Math.round((totalPris / totalRecus) * 100) : 0,
      series,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
