import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma, withRetryTransaction } from "@nba/lib/db"
import { z } from "zod"
import { handleAuthError } from "@nba/lib/auth-utils"
import { rateLimitMiddleware } from "@nba/lib/rate-limit"
import { checkPsychology } from "@nba/lib/services/journal-psychology"
import { calculatePnl, calculateRR } from "@nba/lib/services/pnl"
import { updateDisciplineStreak } from "@nba/lib/services/journal-discipline"
import { msg } from "@nba/lib/messages"
import { logger } from "@nba/lib/logger"

const log = logger.child({ module: "journal-trades" })

const tradeCreateRateLimit = rateLimitMiddleware({ window: 60, max: 30 })

const tradeCreateSchema = z.object({
  signalId:      z.string().uuid("ID du signal invalide").nullable().optional(),
  pair:          z.string({ error: "La paire est requise (ex: EURUSD, BTCUSDT)." })
                   .min(1, "La paire est requise (ex: EURUSD, BTCUSDT).")
                   .max(20, "La paire est trop longue (max 20 caracteres)."),
  direction:     z.enum(["BUY", "SELL"], { error: "La direction doit etre BUY (achat) ou SELL (vente)." }),
  result:        z.enum(["WIN", "LOSS", "BREAKEVEN"], { error: "Le resultat doit etre WIN (gagnant), LOSS (perdant) ou BREAKEVEN (equilibre)." }),
  entryPrice:    z.number({ error: "Le prix d'entree est requis." })
                   .positive("Le prix d'entree doit etre un nombre positif."),
  exitPrice:     z.number({ error: "Le prix de sortie est requis." })
                   .positive("Le prix de sortie doit etre un nombre positif."),
  stopLoss:      z.number({ error: "Le stop-loss doit etre un nombre." })
                   .positive("Le stop-loss doit etre positif.").optional(),
  takeProfit:    z.number({ error: "Le take-profit doit etre un nombre." })
                   .positive("Le take-profit doit etre positif.").optional(),
  strategy:      z.enum(["SCALPING", "DAY_TRADING", "SWING", "POSITION"], {
                   error: "La strategie doit etre SCALPING, DAY_TRADING, SWING ou POSITION."
                 }).optional(),
  setupType:     z.enum(["BREAKOUT", "PULLBACK", "REVERSAL", "RANGE", "TREND", "OTHER"], {
                   error: "Le type de setup est invalide (BREAKOUT, PULLBACK, REVERSAL, RANGE, TREND, OTHER)."
                 }).optional(),
  lotSize:       z.number({ error: "La taille de lot doit etre un nombre." })
                   .positive("La taille de lot doit etre positive.")
                   .max(100, "La taille de lot ne peut pas depasser 100.").default(0.01),
  spread:        z.number({ error: "Le spread doit etre un nombre." })
                   .min(0, "Le spread ne peut pas etre negatif.").optional(),
  commission:    z.number({ error: "La commission doit etre un nombre." })
                   .min(0, "La commission ne peut pas etre negative.").optional(),
  swap:          z.number({ error: "Le swap doit etre un nombre." })
                   .min(0, "Le swap ne peut pas etre negatif.").optional(),
  mood:          z.enum(["CONFIDENT","NEUTRAL","ANXIOUS","FEARFUL","GREEDY","REVENGE"], {
                   error: "L'etat emotionnel est invalide (CONFIDENT, NEUTRAL, ANXIOUS, FEARFUL, GREEDY, REVENGE)."
                 }).optional(),
  confidence:    z.number({ error: "La confiance doit etre un nombre entier." })
                   .int("La confiance doit etre un nombre entier (1 a 5).")
                   .min(1, "La confiance doit etre entre 1 et 5.")
                   .max(5, "La confiance doit etre entre 1 et 5.").optional(),
  note:          z.string({ error: "La note doit etre un texte." })
                   .max(500, "La note est trop longue (max 500 caracteres).").optional(),
  tags:          z.array(z.string({ error: "Chaque tag doit etre un texte." })
                   .max(30, "Chaque tag est limite a 30 caracteres."))
                   .max(10, "Maximum 10 tags autorises.").optional(),
  tradedAt:      z.string({ error: "La date doit etre au format ISO (ex: 2026-07-20T14:00:00Z)." })
                   .datetime("Format de date invalide. Utilisez le format ISO (ex: 2026-07-20T14:00:00Z).").optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })

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

    const tradesWithRR = trades.map(trade => ({
      ...trade,
      rrRatio: calculateRR({
        entryPrice: Number(trade.entryPrice),
        stopLoss: trade.stopLoss ? Number(trade.stopLoss) : null,
        takeProfit: trade.takeProfit ? Number(trade.takeProfit) : null,
        direction: trade.direction as "BUY" | "SELL",
      }),
    }))

    return NextResponse.json({
      trades: tradesWithRR,
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
    if (!session) return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })

    const rateLimitRes = await tradeCreateRateLimit(request, `journal:trade:${session.user.id}`)
    if (rateLimitRes) return rateLimitRes

    const body = await request.json()
    const parsed = tradeCreateSchema.parse(body)

    if (parsed.result !== "BREAKEVEN") {
      if (parsed.stopLoss !== undefined) {
        if (parsed.direction === "BUY" && parsed.stopLoss >= parsed.entryPrice) {
          return NextResponse.json({ error: msg.dashboard.SL_BUY }, { status: 400 })
        }
        if (parsed.direction === "SELL" && parsed.stopLoss <= parsed.entryPrice) {
          return NextResponse.json({ error: msg.dashboard.SL_SELL }, { status: 400 })
        }
      }
      if (parsed.takeProfit !== undefined) {
        if (parsed.direction === "BUY" && parsed.takeProfit <= parsed.entryPrice) {
          return NextResponse.json({ error: msg.dashboard.TP_BUY }, { status: 400 })
        }
        if (parsed.direction === "SELL" && parsed.takeProfit >= parsed.entryPrice) {
          return NextResponse.json({ error: msg.dashboard.TP_SELL }, { status: 400 })
        }
      }
      if (parsed.stopLoss !== undefined && parsed.takeProfit !== undefined) {
        if (parsed.direction === "BUY" && parsed.stopLoss >= parsed.takeProfit) {
          return NextResponse.json({ error: msg.dashboard.SL_LT_TP_BUY }, { status: 400 })
        }
        if (parsed.direction === "SELL" && parsed.stopLoss <= parsed.takeProfit) {
          return NextResponse.json({ error: msg.dashboard.SL_GT_TP_SELL }, { status: 400 })
        }
      }
    }

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

    const created = await withRetryTransaction(async (tx) => {
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
          strategy: parsed.strategy ?? null,
          setupType: parsed.setupType ?? null,
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
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, `[journal] checkPsychology failed (userId=${session.user.id})`)
    })

    updateDisciplineStreak(session.user.id, created.tradedAt).catch((err) => {
      log.error({ err, errorCode: "INTEGRATION_ERROR" }, `[journal] updateDisciplineStreak failed (userId=${session.user.id})`)
    })

    return NextResponse.json({ trade: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: msg.dashboard.INVALID_DATA,
        details: error.issues.map(i => ({ champ: i.path.join("."), message: i.message })),
      }, { status: 400 })
    }
    return handleAuthError(error)
  }
}
