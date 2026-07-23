import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { z } from "zod"
import { handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { updateDisciplineStreak } from "@nba/lib/services/journal-discipline"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "journal-reflections" })

const reflectionCreateRateLimit = rateLimitMiddleware({ window: 60, max: 10 })

const reflectionSchema = z.object({
  date: z.string(),
  rating: z.number().int().min(1).max(10),
  mood: z.enum(["CONFIDENT","NEUTRAL","ANXIOUS","FEARFUL","GREEDY","REVENGE"]).optional(),
  note: z.string().max(1000).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const reflections = await prisma.dailyReflection.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: 90,
    })

    return NextResponse.json({ reflections })
  } catch (error) {
    return handleAuthError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const rateLimitRes = await reflectionCreateRateLimit(request, `journal:reflection:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const parsed = reflectionSchema.parse(body)
    const date = new Date(parsed.date)

    const existing = await prisma.dailyReflection.findUnique({
      where: { userId_date: { userId: session.user.id, date } },
      select: { tradeCount: true },
    })

    const hasTrades = existing ? (existing.tradeCount ?? 0) > 0 : false

    const dayTrades = hasTrades ? [] : await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        deletedAt: null,
        tradedAt: { gte: new Date(date.toDateString()), lt: new Date(new Date(date.toDateString()).getTime() + 86400000) },
      },
    })

    const createData = {
      userId: session.user.id,
      date,
      rating: parsed.rating,
      mood: parsed.mood,
      note: parsed.note,
      tradeCount: dayTrades.length,
      wins: dayTrades.filter(t => t.result === "WIN").length,
      losses: dayTrades.filter(t => t.result === "LOSS").length,
      totalPnl: dayTrades.reduce((s, t) => s + Number(t.pnl), 0),
    }

    const updateData: Record<string, unknown> = {
      rating: parsed.rating,
      mood: parsed.mood,
      note: parsed.note,
    }

    if (!hasTrades) {
      updateData.tradeCount = dayTrades.length
      updateData.wins = dayTrades.filter(t => t.result === "WIN").length
      updateData.losses = dayTrades.filter(t => t.result === "LOSS").length
      updateData.totalPnl = dayTrades.reduce((s, t) => s + Number(t.pnl), 0)
    }

    const reflection = await prisma.dailyReflection.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      create: createData,
      update: updateData,
    })

    updateDisciplineStreak(session.user.id, date).catch((err) => {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, `[journal] updateDisciplineStreak failed (userId=${session.user.id})`)
    })

    return NextResponse.json({ reflection })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
