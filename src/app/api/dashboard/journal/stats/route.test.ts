import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@nba/lib/get-session", () => ({ getServerSession: vi.fn() }))

const { prismaMock } = vi.hoisted(() => ({ prismaMock: {} as any }))

vi.mock("@nba/lib/db", () => ({
  prisma: new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (!(prop in prismaMock)) {
          prismaMock[prop] = {
            findMany: vi.fn(),
            groupBy: vi.fn(),
            $queryRawUnsafe: vi.fn(),
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

function authSession() { (getServerSession as any).mockResolvedValue({ user: { id: USER_ID } }) }
function noSession() { (getServerSession as any).mockResolvedValue(null) }
function mockReq(url: string) { return { url } as any }

describe("GET /api/dashboard/journal/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authSession()
    prismaMock.trade = { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() }
    prismaMock.streak = { findMany: vi.fn() }
    prismaMock.$queryRawUnsafe = vi.fn()
  })

  it("retourne 401 si non authentifié", async () => {
    noSession()
    const res = await GET(mockReq("https://x/api/dashboard/journal/stats"))
    expect(res.status).toBe(401)
  })

  it("calcule les stats de base", async () => {
    prismaMock.trade.findMany.mockResolvedValue([
      { id: "t1", pair: "EURUSD", result: "WIN", pnl: 20 },
      { id: "t2", pair: "EURUSD", result: "LOSS", pnl: -10 },
      { id: "t3", pair: "GBPUSD", result: "WIN", pnl: 30 },
    ])
    prismaMock.trade.groupBy.mockResolvedValue([
      { pair: "EURUSD", _count: { id: 2 }, _sum: { pnl: 10 } },
      { pair: "GBPUSD", _count: { id: 1 }, _sum: { pnl: 30 } },
    ])
    prismaMock.trade.groupBy.mockResolvedValueOnce([
      { pair: "EURUSD", _count: { id: 2 }, _sum: { pnl: 10 } },
      { pair: "GBPUSD", _count: { id: 1 }, _sum: { pnl: 30 } },
    ])
    prismaMock.trade.groupBy.mockResolvedValueOnce([
      { mood: "CONFIDENT", _count: { id: 2 } },
    ])
    prismaMock.$queryRawUnsafe.mockResolvedValue([
      { date: new Date("2026-07-19"), count: 3, wins: 2, pnl: 40 },
    ])
    prismaMock.streak.findMany.mockResolvedValue([
      { type: "WIN_STREAK", count: 2, bestCount: 5 },
      { type: "LOSS_STREAK", count: 0, bestCount: 2 },
    ])

    const res = await GET(mockReq("https://x/api/dashboard/journal/stats?period=all"))
    const json = await res.json()

    expect(json.winRate).toBe(66.7)
    expect(json.totalTrades).toBe(3)
    expect(json.totalPnl).toBe(40)
    expect(json.byPair).toHaveLength(2)
  })
})
