import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/get-session", () => ({
  getServerSession: vi.fn(),
}))

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in prismaMock)) {
          prismaMock[prop] = {
            findMany: vi.fn(),
            count: vi.fn(),
            groupBy: vi.fn(),
            findUnique: vi.fn(),
          }
        }
        return prismaMock[prop]
      },
    },
  ),
}))

vi.mock("@nba/lib/auth-utils", () => ({
  handleAuthError: vi.fn((e: any) => ({ status: 500, json: async () => ({ error: String(e) }) })),
}))

import { GET } from "./route"
import { getServerSession } from "@nba/lib/get-session"

const USER_ID = "user-1"

function authSession() {
  ;(getServerSession as any).mockResolvedValue({ user: { id: USER_ID } })
}
function noSession() {
  ;(getServerSession as any).mockResolvedValue(null)
}
function mockReq(url: string) {
  return { url } as any
}

const TRADES = [
  { result: "WIN", pnl: 100, pair: "EURUSD", entryPrice: 1, exitPrice: 1, lotSize: 1, tradedAt: new Date("2026-07-18T10:00:00Z"), mood: "CONFIDENT", confidence: 4 },
  { result: "WIN", pnl: 50, pair: "EURUSD", entryPrice: 1, exitPrice: 1, lotSize: 1, tradedAt: new Date("2026-07-19T10:00:00Z"), mood: "NEUTRAL", confidence: 3 },
  { result: "LOSS", pnl: -40, pair: "BTCUSDT", entryPrice: 1, exitPrice: 1, lotSize: 1, tradedAt: new Date("2026-07-19T12:00:00Z"), mood: "FEARFUL", confidence: 2 },
  { result: "BREAKEVEN", pnl: 0, pair: "BTCUSDT", entryPrice: 1, exitPrice: 1, lotSize: 1, tradedAt: new Date("2026-07-20T12:00:00Z"), mood: null, confidence: null },
]

function seedMocks() {
  prismaMock.trade = {
    findMany: vi.fn().mockResolvedValue(TRADES),
    groupBy: vi.fn(),
    count: vi.fn(),
  }
  prismaMock.streak = { findMany: vi.fn().mockResolvedValue([]) }
}

describe("GET /api/dashboard/journal/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    seedMocks()
    prismaMock.trade.groupBy
      .mockResolvedValueOnce([
        { pair: "EURUSD", _count: { id: 2 }, _sum: { pnl: 150 } },
        { pair: "BTCUSDT", _count: { id: 2 }, _sum: { pnl: -40 } },
      ])
      .mockResolvedValueOnce([
        { mood: "CONFIDENT", _count: { id: 1 } },
        { mood: "NEUTRAL", _count: { id: 1 } },
        { mood: "FEARFUL", _count: { id: 1 } },
      ])
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    expect(res.status).toBe(401)
  })

  it("calcule le win rate et le PnL total", async () => {
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    const json = await res.json()

    expect(json.totalTrades).toBe(4)
    expect(json.wins).toBe(2)
    expect(json.losses).toBe(1)
    expect(json.breakevens).toBe(1)
    // winRate = 2 / 4 * 100 = 50
    expect(json.winRate).toBe(50)
    // totalPnl = 100 + 50 - 40 + 0 = 110
    expect(json.totalPnl).toBe(110)
  })

  it("agrège par paire avec win rate", async () => {
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    const json = await res.json()

    const eur = json.byPair.find((p: any) => p.pair === "EURUSD")
    expect(eur.count).toBe(2)
    // EURUSD: 2 WIN / 2 = 100%
    expect(eur.winRate).toBe(100)
    expect(eur.pnl).toBe(150)

    const btc = json.byPair.find((p: any) => p.pair === "BTCUSDT")
    // BTCUSDT: 0 WIN / 2 = 0%
    expect(btc.winRate).toBe(0)
    expect(btc.pnl).toBe(-40)
  })

  it("agrège par mood en excluant les valeurs nulles", async () => {
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    const json = await res.json()

    expect(json.byMood).toHaveLength(3)
    const confident = json.byMood.find((m: any) => m.mood === "CONFIDENT")
    expect(confident.count).toBe(1)
    expect(confident.winRate).toBe(100)
  })

  it("construit l'évolution et le byDay triés", async () => {
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    const json = await res.json()

    expect(Array.isArray(json.byDay)).toBe(true)
    expect(json.byDay.length).toBeGreaterThan(0)
    // byDay trié du plus récent au plus ancien
    for (let i = 1; i < json.byDay.length; i++) {
      expect(json.byDay[i - 1].date >= json.byDay[i].date).toBe(true)
    }
    expect(json.evolution.labels.length).toBe(json.byDay.length)
  })

  it("calcule le profit factor et le max drawdown", async () => {
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    const json = await res.json()

    // grossProfit = 150, grossLoss = 40 → profitFactor = 3.75
    expect(json.riskMetrics.profitFactor).toBe(3.75)
    expect(json.riskMetrics.maxDrawdown).toBeGreaterThanOrEqual(0)
  })

  it("applique le filtre de période 7d", async () => {
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats?period=7d"))
    const where = prismaMock.trade.findMany.mock.calls[0][0].where
    expect(where.tradedAt.gte).toBeInstanceOf(Date)
    expect(res.status).toBe(200)
  })
})
