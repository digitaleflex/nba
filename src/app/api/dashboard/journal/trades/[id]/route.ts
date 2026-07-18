import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { z } from "zod"
import { handleAuthError } from "@nba/lib/auth-utils"

const tradeUpdateSchema = z.object({
  pair: z.string().min(1).max(20).optional(),
  direction: z.enum(["BUY", "SELL"]).optional(),
  result: z.enum(["WIN", "LOSS", "BREAKEVEN"]).optional(),
  entryPrice: z.number().positive().optional(),
  exitPrice: z.number().positive().optional(),
  lotSize: z.number().positive().max(100).optional(),
  mood: z.enum(["CONFIDENT","NEUTRAL","ANXIOUS","FEARFUL","GREEDY","REVENGE"]).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  note: z.string().max(500).optional(),
  tradedAt: z.string().datetime().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const { id } = await params

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.user.id) {
      return NextResponse.json({ error: "Trade introuvable" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = tradeUpdateSchema.parse(body)

    const entry = parsed.entryPrice ?? Number(trade.entryPrice)
    const exit = parsed.exitPrice ?? Number(trade.exitPrice)
    const lot = parsed.lotSize ?? Number(trade.lotSize)
    const dir = (parsed.direction ?? trade.direction) === "BUY" ? 1 : -1
    const res = parsed.result ?? trade.result
    const pnl = res === "BREAKEVEN" ? 0 : (exit - entry) * lot * dir

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        ...parsed,
        entryPrice: entry,
        exitPrice: exit,
        lotSize: lot,
        pnl,
        tradedAt: parsed.tradedAt ? new Date(parsed.tradedAt) : undefined,
      },
    })

    return NextResponse.json({ trade: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 })
    }
    return handleAuthError(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const { id } = await params

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.user.id) {
      return NextResponse.json({ error: "Trade introuvable" }, { status: 404 })
    }

    await prisma.trade.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
