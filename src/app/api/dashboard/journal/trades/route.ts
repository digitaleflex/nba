import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { z } from "zod"
import { handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { checkPsychology } from "@nba/lib/services/journal-psychology"
import { calculatePnl } from "@nba/lib/services/pnl"

const tradeCreateRateLimit = rateLimitMiddleware({ window: 60, max: 30 })

const tradeCreateSchema = z.object({
  signalId: z.string().uuid().nullable().optional(),
  pair: z.string().min(1).max(20),
  direction: z.enum(["BUY", "SELL"]),
  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]),
  entryPrice: z.number().positive(),
  exitPrice: z.number().positive(),
  stopLoss: z.number().positive().optional(),
  takeProfit: z.number().positive().optional(),
  lotSize: z.number().positive().max(100).default(0.01),
  spread: z.number().min(0).optional(),
  commission: z.number().min(0).optional(),
  swap: z.number().min(0).optional(),
  mood: z.enum(["CONFIDENT","NEUTRAL","ANXIOUS","FEARFUL","GREEDY","REVENGE"]).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  tradedAt: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
    const pair = searchParams.get("pair")
    const result = searchParams.get("result")
    const signalId = searchParams.get("signalId")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") ?? "tradedAt:desc"
    const [sortField, sortDir] = sort.split(":") as [string, "asc" | "desc"]

    const where: any = { userId: session.user.id, deletedAt: null }
    if (pair) where.pair = pair.toUpperCase()
    if (result) where.result = result
    if (signalId) where.signalId = signalId
    if (search) {
      where.OR = [
        { pair: { contains: search.toUpperCase() } },
        { note: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toUpperCase() } },
      ]
    }

    const [trades, total, activeSession, pairs] = await Promise.all([
      prisma.trade.findMany({
        where,
        include: { signal: { select: { id: true, content: true, createdAt: true } } },
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trade.count({ where }),
      prisma.journalSession.findFirst({
        where: { userId: session.user.id, isActive: true },
        include: {
          plan: { select: { name: true } },
          _count: { select: { trades: true } },
        },
      }),
      prisma.trade.groupBy({
        by: ["pair"],
        where: { userId: session.user.id, deletedAt: null },
        _count: { pair: true },
        orderBy: { pair: "asc" },
      }),
    ])

    const activeSessionSummary = activeSession ? {
      id: activeSession.id,
      planName: activeSession.plan?.name ?? "Général",
      tradeCount: activeSession._count.trades,
    } : null

    return NextResponse.json({
      trades,
      pagination: { page, totalPages: Math.ceil(total / limit), totalCount: total },
      filters: { pairs: pairs.map(p => p.pair) },
      activeSession: activeSessionSummary,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const rateLimitRes = await tradeCreateRateLimit(request, `journal:trade:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const parsed = tradeCreateSchema.parse(body)

    const pnl = calculatePnl({
      pair: parsed.pair,
      entryPrice: parsed.entryPrice,
      exitPrice: parsed.exitPrice,
      lotSize: parsed.lotSize,
      direction: parsed.direction,
      result: parsed.result,
      spread: parsed.spread,
      commission: parsed.commission,
      swap: parsed.swap,
    })

    const created = await prisma.$transaction(async (tx) => {
      const activeSession = await tx.journalSession.findFirst({
        where: { userId: session.user.id, isActive: true },
      })

      const trade = await tx.trade.create({
        data: {
          userId: session.user.id,
          signalId: parsed.signalId ?? null,
          sessionId: activeSession?.id ?? null,
          pair: parsed.pair.toUpperCase(),
          direction: parsed.direction,
          result: parsed.result,
          entryPrice: parsed.entryPrice,
          exitPrice: parsed.exitPrice,
          stopLoss: parsed.stopLoss ?? null,
          takeProfit: parsed.takeProfit ?? null,
          lotSize: parsed.lotSize,
          pnl,
          spread: parsed.spread ?? 0,
          commission: parsed.commission ?? 0,
          swap: parsed.swap ?? 0,
          mood: parsed.mood,
          confidence: parsed.confidence,
          note: parsed.note,
          tags: parsed.tags ?? [],
          tradedAt: parsed.tradedAt ? new Date(parsed.tradedAt) : new Date(),
        },
        include: { signal: { select: { id: true, content: true, createdAt: true } } },
      })

      if (parsed.result === "WIN" || parsed.result === "LOSS") {
        const streakType = parsed.result === "WIN" ? "WIN_STREAK" : "LOSS_STREAK"
        const existing = await tx.streak.findUnique({
          where: { userId_type: { userId: session.user.id, type: streakType } },
        })
        if (existing) {
          const count = existing.count + 1
          await tx.streak.update({
            where: { id: existing.id },
            data: { count, bestCount: count > existing.bestCount ? count : existing.bestCount },
          })
        } else {
          await tx.streak.create({
            data: { userId: session.user.id, type: streakType, count: 1, bestCount: 1 },
          })
        }
      }

      return trade
    })

    checkPsychology(session.user.id).catch((err) => {
      console.error(`[journal] checkPsychology failed (userId=${session.user.id}):`, err)
    })

    return NextResponse.json({ trade: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
