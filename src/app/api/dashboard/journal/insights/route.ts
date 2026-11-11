import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@nba/lib/db"
import { getServerSession } from "@nba/lib/get-session"

// Seuil minimum de trades pour qu'une agrégation (paire, setup, humeur) soit
// considérée comme fiable. Partagé par tous les insights (cf. TECH-16).
const MIN_RELIABLE_TRADES = 3

const querySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
})

// GET /api/dashboard/journal/insights?days=30
// Coach règle-basé (forme prête pour un LLM plus tard : summary,
// strengths, warnings, action). N'invente rien : que du calculé.
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({ days: searchParams.get("days") ?? undefined })
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètre 'days' invalide (entier entre 7 et 365)." },
        { status: 400 },
      )
    }
    const days = parsed.data.days
    const since = new Date()
    since.setDate(since.getDate() - days)

    const trades = await prisma.trade.findMany({
      where: { userId, deletedAt: null, tradedAt: { gte: since } },
      select: {
        pair: true, direction: true, result: true, pnl: true,
        lotSize: true, stopLoss: true, tradedAt: true, createdAt: true,
        mood: true, setupType: true, signalId: true,
      },
      orderBy: { tradedAt: "asc" },
    })

    if (trades.length === 0) {
      return NextResponse.json({
        days, count: 0, summary: "Pas encore de trades sur la période — journalise tes premiers trades pour activer le coach.",
        strengths: [], warnings: [], action: "Enregistre ton prochain trade avec SL, émotion et note.",
        processScore: null, stats: null,
      })
    }

    const n = trades.length
    const wins = trades.filter((t) => t.result === "WIN").length
    const losses = trades.filter((t) => t.result === "LOSS").length
    const winRate = Math.round((wins / n) * 100)
    const totalPnl = trades.reduce((s, t) => s + Number(t.pnl), 0)

    const noSl = trades.filter((t) => t.stopLoss == null && t.result !== "BREAKEVEN").length
    const noSlRate = Math.round((noSl / n) * 100)
    const bigLots = trades.filter((t) => Number(t.lotSize) > 1).length

    // Émotion la plus coûteuse
    const pnlByMood = new Map<string, { count: number; pnl: number }>()
    for (const t of trades) {
      if (!t.mood || t.result === "BREAKEVEN") continue
      const e = pnlByMood.get(t.mood) ?? { count: 0, pnl: 0 }
      e.count += 1
      e.pnl += Number(t.pnl)
      pnlByMood.set(t.mood, e)
    }
    let worstMood: { mood: string; count: number; pnl: number } | null = null
    for (const [mood, v] of pnlByMood) {
      if (v.count >= MIN_RELIABLE_TRADES && (!worstMood || v.pnl < worstMood.pnl)) worstMood = { mood, ...v }
    }

    // Paire la plus / moins rentable (min MIN_RELIABLE_TRADES trades)
    const byPair = new Map<string, { count: number; pnl: number; wins: number }>()
    for (const t of trades) {
      const e = byPair.get(t.pair) ?? { count: 0, pnl: 0, wins: 0 }
      e.count += 1
      e.pnl += Number(t.pnl)
      if (t.result === "WIN") e.wins += 1
      byPair.set(t.pair, e)
    }
    let bestPair: { pair: string; pnl: number; count: number } | null = null
    let worstPair: { pair: string; pnl: number; count: number } | null = null
    for (const [pair, v] of byPair) {
      if (v.count < MIN_RELIABLE_TRADES) continue
      if (!bestPair || v.pnl > bestPair.pnl) bestPair = { pair, pnl: v.pnl, count: v.count }
      if (!worstPair || v.pnl < worstPair.pnl) worstPair = { pair, pnl: v.pnl, count: v.count }
    }

    // Setup le plus rentable
    const bySetup = new Map<string, { count: number; pnl: number }>()
    for (const t of trades) {
      if (!t.setupType) continue
      const e = bySetup.get(t.setupType) ?? { count: 0, pnl: 0 }
      e.count += 1
      e.pnl += Number(t.pnl)
      bySetup.set(t.setupType, e)
    }
    let bestSetup: string | null = null
    let bestSetupPnl = -Infinity
    for (const [s, v] of bySetup) {
      if (v.count >= MIN_RELIABLE_TRADES && v.pnl > bestSetupPnl) { bestSetup = s; bestSetupPnl = v.pnl }
    }

    // Série de pertes en cours
    let lossStreak = 0
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].result === "LOSS") lossStreak++
      else break
    }

    // Journalisation rapide : créé < 24h après le trade
    const fastLogged = trades.filter((t) => {
      const dt = new Date(t.createdAt).getTime() - new Date(t.tradedAt).getTime()
      return dt >= 0 && dt < 24 * 3600 * 1000
    }).length

    // Process score 0-100 : SL défini, lot raisonnable, journalisé vite
    const slScore = ((n - noSl) / n) * 40
    const lotScore = ((n - bigLots) / n) * 30
    const logScore = (fastLogged / n) * 30
    const processScore = Math.round(slScore + lotScore + logScore)

    const strengths: string[] = []
    const warnings: string[] = []
    if (winRate >= 55) strengths.push(`Win rate solide : ${winRate}% sur ${n} trades.`)
    if (noSlRate <= 10) strengths.push(`Discipline SL : ${100 - noSlRate}% des trades protégés.`)
    if (bestPair && bestPair.pnl > 0) strengths.push(`Edge détecté sur ${bestPair.pair} : +${bestPair.pnl.toFixed(2)}€ (${bestPair.count} trades).`)
    if (bestSetup) strengths.push(`Ton meilleur setup : ${bestSetup} (+${bestSetupPnl.toFixed(2)}€).`)

    if (noSlRate > 30) warnings.push(`${noSlRate}% de trades sans stop loss — c'est là que partent les grosses pertes.`)
    else if (noSlRate > 10) warnings.push(`${noSlRate}% de trades sans stop loss. Objectif : sous 10%.`)
    if (lossStreak >= 3) warnings.push(`${lossStreak} pertes d'affilée — fais une pause, pas de revenge trade.`)
    if (bigLots > 0) warnings.push(`${bigLots} trade(s) à plus d'1 lot — vérifie ton risque par trade.`)
    if (worstMood && worstMood.pnl < 0) warnings.push(`Sous ${worstMood.mood}, tu perds ${worstMood.pnl.toFixed(2)}€ en ${worstMood.count} trades — repère ce déclencheur.`)
    if (worstPair && worstPair.pnl < 0 && worstPair.count >= MIN_RELIABLE_TRADES) warnings.push(`${worstPair.pair} te coûte ${worstPair.pnl.toFixed(2)}€ (${worstPair.count} trades) — réduis ou mets en pause cette paire.`)

    // Une action concrète : le pire levier d'abord
    let action: string
    if (noSlRate > 30) action = "Pendant 7 jours : aucun trade sans stop loss. C'est ta seule règle."
    else if (lossStreak >= 3) action = "Pause 24h, puis 1 seul trade avec 0.01 lot pour casser la spirale."
    else if (worstPair && worstPair.pnl < 0 && worstPair.count >= MIN_RELIABLE_TRADES) action = `Pause ${worstPair.pair} cette semaine, concentre-toi sur ${bestPair?.pair ?? "tes setups gagnants"}.`
    else if (worstMood && worstMood.pnl < 0) action = "Quand tu ressens cet état, note-le et divise ton lot par 2."
    else action = "Continue : garde le même process, il est rentable. Revois dans 7 jours."

    const summary = `${n} trades · ${winRate}% win rate · ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}€ · score process ${processScore}/100.`

    return NextResponse.json({
      days, count: n, summary, strengths, warnings, action, processScore,
      stats: {
        winRate, totalPnl: Math.round(totalPnl * 100) / 100,
        noSlRate, lossStreak, bestPair, worstPair, bestSetup,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
