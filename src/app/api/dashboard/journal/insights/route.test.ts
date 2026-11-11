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
          prismaMock[prop] = { findMany: vi.fn(), count: vi.fn() }
        }
        return prismaMock[prop]
      },
    },
  ),
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
  { result: "WIN", pnl: 100, pair: "EURUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-18T10:00:00Z"), createdAt: new Date("2026-07-18T10:00:00Z"), mood: "CONFIDENT", setupType: "breakout" },
  { result: "WIN", pnl: 50, pair: "EURUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-19T10:00:00Z"), createdAt: new Date("2026-07-19T10:00:00Z"), mood: "NEUTRAL", setupType: "breakout" },
  { result: "LOSS", pnl: -40, pair: "EURUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-19T12:00:00Z"), createdAt: new Date("2026-07-19T12:00:00Z"), mood: "FEARFUL", setupType: null },
]

function seedMocks(trades: any[] = TRADES) {
  prismaMock.trade = { findMany: vi.fn().mockResolvedValue(trades) }
}

describe("GET /api/dashboard/journal/insights", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    seedMocks()
  })

  it("401 si non authentifié", async () => {
    noSession()
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights"))
    expect(res.status).toBe(401)
  })

  it("?days=abc → 400", async () => {
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights?days=abc"))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/invalide/i)
  })

  it("?days=0 → 400 (min 7)", async () => {
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights?days=0"))
    expect(res.status).toBe(400)
  })

  it("?days=99999 → 400 (max 365)", async () => {
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights?days=99999"))
    expect(res.status).toBe(400)
  })

  it("?days=7 → 200 avec days=7", async () => {
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights?days=7"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.days).toBe(7)
  })

  it("0 trade → processScore null, pas de division par zéro", async () => {
    seedMocks([])
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(0)
    expect(body.processScore).toBeNull()
  })

  it("bestPair exige au moins MIN_RELIABLE_TRADES (3) trades", async () => {
    // EURUSD n'a que 3 trades → bestPair présent ; une paire à 2 trades est ignorée.
    const trades = [
      { result: "WIN", pnl: 100, pair: "EURUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-18T10:00:00Z"), createdAt: new Date("2026-07-18T10:00:00Z"), mood: null, setupType: null },
      { result: "WIN", pnl: 50, pair: "EURUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-19T10:00:00Z"), createdAt: new Date("2026-07-19T10:00:00Z"), mood: null, setupType: null },
      { result: "LOSS", pnl: -10, pair: "EURUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-20T10:00:00Z"), createdAt: new Date("2026-07-20T10:00:00Z"), mood: null, setupType: null },
      { result: "LOSS", pnl: -5, pair: "GBPUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-19T12:00:00Z"), createdAt: new Date("2026-07-19T12:00:00Z"), mood: null, setupType: null },
      { result: "LOSS", pnl: -5, pair: "GBPUSD", direction: "BUY", lotSize: 0.5, stopLoss: 1.08, tradedAt: new Date("2026-07-20T12:00:00Z"), createdAt: new Date("2026-07-20T12:00:00Z"), mood: null, setupType: null },
    ]
    seedMocks(trades)
    const res = await GET(mockReq("http://localhost/api/dashboard/journal/insights"))
    const body = await res.json()
    // GBPUSD a 2 trades (< 3) → ne peut pas être bestPair/worstPair
    expect(body.stats.bestPair?.pair).toBe("EURUSD")
    expect(body.stats.worstPair?.pair).toBe("EURUSD")
  })
})
