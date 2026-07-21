import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@nba/lib/get-session"
import { prisma } from "@nba/lib/db"
import { z } from "zod"
import { handleAuthError } from "@nba/lib/auth-utils"
import { calculatePnl } from "@nba/lib/services/pnl"
import { msg } from "@nba/lib/messages"

const tradeUpdateSchema = z.object({
  pair: z.string({ error: "La paire doit etre un texte." })
    .min(1, "La paire ne peut pas etre vide.")
    .max(20, "La paire est trop longue (max 20 caracteres).").optional(),
  direction: z.enum(["BUY", "SELL"], { error: "La direction doit etre BUY (achat) ou SELL (vente)." }).optional(),
  result: z.enum(["WIN", "LOSS", "BREAKEVEN"], { error: "Le resultat doit etre WIN, LOSS ou BREAKEVEN." }).optional(),
  entryPrice: z.number({ error: "Le prix d'entree doit etre un nombre." })
    .positive("Le prix d'entree doit etre positif.").optional(),
  exitPrice: z.number({ error: "Le prix de sortie doit etre un nombre." })
    .positive("Le prix de sortie doit etre positif.").optional(),
  stopLoss: z.number({ error: "Le stop-loss doit etre un nombre." })
    .positive("Le stop-loss doit etre positif.").optional(),
  takeProfit: z.number({ error: "Le take-profit doit etre un nombre." })
    .positive("Le take-profit doit etre positif.").optional(),
  lotSize: z.number({ error: "La taille de lot doit etre un nombre." })
    .positive("La taille de lot doit etre positive.")
    .max(100, "La taille de lot ne peut pas depasser 100.").optional(),
  spread: z.number({ error: "Le spread doit etre un nombre." })
    .min(0, "Le spread ne peut pas etre negatif.").optional(),
  commission: z.number({ error: "La commission doit etre un nombre." })
    .min(0, "La commission ne peut pas etre negative.").optional(),
  swap: z.number({ error: "Le swap doit etre un nombre." })
    .min(0, "Le swap ne peut pas etre negatif.").optional(),
  mood: z.enum(["CONFIDENT","NEUTRAL","ANXIOUS","FEARFUL","GREEDY","REVENGE"], {
    error: "L'etat emotionnel est invalide."
  }).optional(),
  confidence: z.number({ error: "La confiance doit etre un nombre entier (1 a 5)." })
    .int("La confiance doit etre un nombre entier.")
    .min(1, "La confiance minimum est 1.")
    .max(5, "La confiance maximum est 5.").optional(),
  note: z.string({ error: "La note doit etre un texte." })
    .max(500, "La note est trop longue (max 500 caracteres).").optional(),
  tags: z.array(z.string({ error: "Chaque tag doit etre un texte." })
    .max(30, "Chaque tag est limite a 30 caracteres."))
    .max(10, "Maximum 10 tags autorises.").optional(),
  tradedAt: z.string({ error: "La date doit etre au format ISO." })
    .datetime("Format de date invalide (ex: 2026-07-20T14:00:00Z).").optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })
    const { id } = await params

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.user.id) {
      return NextResponse.json({       error: msg.dashboard.TRADE_NOT_FOUND }, { status: 404 })
    }

    const body = await request.json()
    const parsed = tradeUpdateSchema.parse(body)

    const pair = parsed.pair ?? trade.pair
    const entry = parsed.entryPrice ?? Number(trade.entryPrice)
    const exit = parsed.exitPrice ?? Number(trade.exitPrice)
    const lot = parsed.lotSize ?? Number(trade.lotSize)
    const direction = parsed.direction ?? trade.direction
    const result = parsed.result ?? trade.result

    const pnl = calculatePnl({
      pair,
      entryPrice: entry,
      exitPrice: exit,
      lotSize: lot,
      direction,
      result,
      spread: parsed.spread,
      commission: parsed.commission,
      swap: parsed.swap,
    })

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        ...parsed,
        pair: pair.toUpperCase(),
        entryPrice: entry,
        exitPrice: exit,
        lotSize: lot,
        direction,
        result,
        pnl,
        spread: parsed.spread ?? undefined,
        commission: parsed.commission ?? undefined,
        swap: parsed.swap ?? undefined,
        tradedAt: parsed.tradedAt ? new Date(parsed.tradedAt) : undefined,
      },
    })

    return NextResponse.json({ trade: updated })
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

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: msg.auth.NOT_AUTHENTICATED }, { status: 401 })
    const { id } = await params

    const trade = await prisma.trade.findUnique({ where: { id } })
    if (!trade || trade.userId !== session.user.id) {
      return NextResponse.json({       error: msg.dashboard.TRADE_NOT_FOUND }, { status: 404 })
    }

    await prisma.trade.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAuthError(error)
  }
}
