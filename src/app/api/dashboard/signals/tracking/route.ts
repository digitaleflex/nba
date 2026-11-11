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

    const now = new Date()
    const since = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0),
    )

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isActive: true,
        role: { select: { name: true } },
        signalsAccessOverride: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json({
        days,
        totalPris: 0,
        totalRecus: 0,
        joursAvecTrade: 0,
        couvertureGlobale: 0,
        series: [],
        takenSignals: [],
      })
    }

    const isAdmin = user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN"

    let activePlanIds: string[] = []
    if (!isAdmin && !user.signalsAccessOverride) {
      const approved = await prisma.accessRequest.findMany({
        where: { userId, status: "APPROVED" },
        select: { planId: true },
      })
      activePlanIds = approved.map((r) => r.planId)
      if (activePlanIds.length === 0) {
        return NextResponse.json({
          days,
          totalPris: 0,
          totalRecus: 0,
          joursAvecTrade: 0,
          couvertureGlobale: 0,
          series: [],
          takenSignals: [],
        })
      }
    }

    // Signaux effectivement reçus par l'utilisateur (notification existante).
    const notifications = await prisma.notification.findMany({
      where: { userId, type: "SIGNAL", createdAt: { gte: since } },
      select: { data: true },
    })
    const receivedSignalIds = new Set<string>()
    for (const n of notifications) {
      const sid = (n.data as Record<string, unknown> | null)?.signalId
      if (typeof sid === "string") receivedSignalIds.add(sid)
    }

    const publishedWhere: Record<string, unknown> = {
      status: "PUBLISHED",
      deletedAt: null,
      publishedAt: { gte: since },
    }
    if (!isAdmin && !user.signalsAccessOverride) {
      publishedWhere.audience = { some: { planId: { in: activePlanIds } } }
    }
    if (receivedSignalIds.size > 0) {
      publishedWhere.id = { in: Array.from(receivedSignalIds) }
    } else {
      publishedWhere.id = { in: [] }
    }

    const [takens, published, trades] = await Promise.all([
      prisma.signalTaken.findMany({
        where: { userId, tradedAt: { gte: since } },
        select: { signalId: true, tradedAt: true },
        orderBy: { tradedAt: "asc" },
      }),
      prisma.signal.findMany({
        where: publishedWhere,
        select: { id: true, publishedAt: true },
      }),
      prisma.trade.findMany({
        where: { userId, signalId: { not: null } },
        select: { signalId: true, result: true, pnl: true },
      }),
    ])

    // Index jours YYYY-MM-DD (UTC)
    const dayKeys: string[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
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

    const tradesBySignal = new Map<string, { result: string; pnl: number }>()
    for (const tr of trades) {
      if (!tr.signalId) continue
      if (!tradesBySignal.has(tr.signalId)) {
        tradesBySignal.set(tr.signalId, { result: tr.result, pnl: Number(tr.pnl) })
      }
    }

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
      takenSignals: takens.map((t) => ({
        signalId: t.signalId,
        tradedAt: t.tradedAt.toISOString(),
        trade: tradesBySignal.get(t.signalId) ?? null,
      })),
    })
  } catch (error) {
    return handleAuthError(error)
  }
}